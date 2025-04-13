from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
import numpy as np

from classical_tools.order_slicer import run_twap, run_vwap
from quantum_tools.order_routing import route_order_optimally
from quantum_tools.order_slicer import solve_order_slicing_live
from quantum_tools.latency_aware_costs import select_optimal_venue

from endpoints.quantum_TDA import quantum_tda_endpoint
from endpoints.monte_carlo import quantum_monte_carlo_endpoint

app = Flask(__name__)
CORS(app)

def sanitize_for_json(obj):
    """Recursively replace inf, -inf, nan in a structure with safe JSON values."""
    if isinstance(obj, float):
        if np.isnan(obj):
            return 0
        if np.isinf(obj):
            return 10000
        return obj
    elif isinstance(obj, list):
        return [sanitize_for_json(item) for item in obj]
    elif isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    else:
        return obj


# === Routes ===
@app.route("/api/quantum_tda", methods=["POST"])
def quantum_tda_api():
    try:
        input_data = request.get_json(silent=True) or {}

        data_identifier = input_data.get("data_identifier", None)
        use_pauli = input_data.get("use_pauli", False)

        result = quantum_tda_endpoint(data_identifier=data_identifier, use_pauli=use_pauli)

        # Sanitize result for safe JSON output
        clean_result = sanitize_for_json(result)

        return jsonify(clean_result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/quantum_mc", methods=["GET", "POST"])
def simulate():
    try:
        if request.method == "POST":
            json_data = request.get_json() or {}
            # Extract optional parameters
            input_data = json_data.get("input_data", None)
            normalize = json_data.get("normalize", True)
            sim_qubits = json_data.get("sim_qubits", 4)
            max_eval_qubits = json_data.get("max_eval_qubits", 6)
        else:
            input_data = None
            normalize = True
            sim_qubits = 4
            max_eval_qubits = 6

        result = quantum_monte_carlo_endpoint(
            input_data=input_data,
            normalize=normalize,
            sim_qubits=sim_qubits,
            max_eval_qubits=max_eval_qubits
        )
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/quantum/order-slicing", methods=["POST"])
def quantum_order_slicing():
    data = request.json
    total_shares = data.get("total_shares", 1000)
    result = solve_order_slicing_live(total_shares)
    return jsonify(result)

@app.route("/quantum/order-routing", methods=["POST"])
def quantum_order_routing_endpoint():
    data = request.json
    total_shares = data.get("total_shares", 1000)
    result = route_order_optimally(total_shares)
    return jsonify(result)

@app.route("/quantum/latency-costs", methods=["POST"])
def quantum_latency_costs_endpoint():
    data = request.json
    order_volume = data.get("order_volume", 100000)
    time_remaining = data.get("time_remaining", 5)
    diagnostics = select_optimal_venue(order_volume, time_remaining)
    return jsonify(diagnostics)

@app.route("/classical/order-slicing/twap", methods=["POST"])
def classical_twap():
    data = request.json
    volume = data.get("order_volume", 100000)
    duration = data.get("duration_minutes", 10)
    slices = data.get("slices", duration)
    result = run_twap(volume, duration, slices)
    return jsonify({"slices": result})

@app.route("/classical/order-slicing/vwap", methods=["POST"])
def classical_vwap():
    data = request.json
    volume = data.get("order_volume", 100000)
    profile = data.get("volume_profile", [10, 20, 30, 25, 15])  # example market volume pattern
    result = run_vwap(volume, profile)
    return jsonify({"slices": result})


@app.route("/brian/auto", methods=["POST"])
def brian_auto_route():
    data = request.get_json()
    prompt = data.get("prompt")

    if not prompt:
        return jsonify({"error": "Prompt is required."}), 400

    headers = {
        "Content-Type": "application/json",
        "x-brian-api-key": os.getenv("BRIAN_API_KEY")
    }

    # Step 1: Use Brian's /parameters-extraction to understand intent and extract parameters
    try:
        extraction_res = requests.post(
            "https://api.brianknows.org/api/v0/agent/parameters-extraction",
            headers=headers,
            json={"prompt": prompt}
        )
        extraction_res.raise_for_status()
        extraction_data = extraction_res.json()
        intent = extraction_data.get("intent", "info")  # fallback to info

        # Extract parameters needed for quantum optimization
        parameters = extraction_data.get("parameters", {})

        # Get swap amount if present
        swap_amount = None
        if intent == "swap" and "amount" in parameters:
            try:
                swap_amount = float(parameters["amount"])
            except (ValueError, TypeError):
                # If amount can't be converted to float, leave it as None
                pass

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Intent extraction failed: {str(e)}"}), 500

    # Step 2: Map intent to the right endpoint
    intent_to_endpoint = {
        "swap": "transaction",
        "transfer": "transaction",
        "info": "knowledge",
        "deploy_contract": "smart-contract",
        "chat": "agent",
        "network_info": "networks",
        "action_help": "actions",
        "parameter_request": "parameters-extraction",
    }

    endpoint = intent_to_endpoint.get(intent, "knowledge")  # default fallback

    # Step 3: Send prompt to the selected endpoint
    try:
        response = requests.post(
            f"https://api.brianknows.org/api/v0/agent/{endpoint}",
            headers=headers,
            json={"prompt": prompt}
        )
        response.raise_for_status()
        result = response.json()

        reply = result.get("result", {}).get("answer") or result.get("result")

        # Prepare the response object
        response_data = {
            "reply": reply,
            "used_endpoint": endpoint,
            "detected_intent": intent,
            "extracted_parameters": parameters,
        }

        # Step 4: For swap intents with an amount, run quantum order routing
        if intent == "swap" and swap_amount is not None:
            # Convert the amount to shares/units for the optimizer
            total_shares = int(swap_amount * 100)  # Scale for better precision
            if total_shares > 0:
                # Run the quantum optimizer
                routing_result = optimize_order_routing(total_shares)

                # Add the routing result to the response
                response_data["quantum_routing"] = routing_result

                # Enhance the text reply with quantum routing info
                venues_text = ", ".join([
                    f"{alloc['venue']} ({alloc['amount']/100:.2f} units)"
                    for alloc in routing_result["venue_allocation"]
                ])

                routing_summary = (
                    f"\n\n🧠 Quantum Routing Optimization:\n"
                    f"For your swap of {swap_amount} units, I've used quantum computing to optimize the routing:\n"
                    f"• Optimal routing: {venues_text}\n"
                    f"• Estimated total cost: ${routing_result['total_cost']:.6f}"
                )

                response_data["reply"] += routing_summary

        return jsonify(response_data)

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Brian request failed: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5002, debug=True)
