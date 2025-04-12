from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os

from demo_tools.demo import twap_slicing
from demo_tools.demo import vwap_slicing
from demo_tools.demo import quantum_order_routing
from demo_tools.demo import quantum_latency_costs

from endpoints.quantum_TDA import quantum_tda_endpoint
from endpoints.monte_carlo import quantum_monte_carlo_endpoint

app = Flask(__name__)
CORS(app)

# === Routes ===
@app.route("/api/quantum_tda", methods=["POST"])
def quantum_tda_api():
    try:
        # Try to get JSON from the request; if none, input_data remains None
        input_data = request.get_json(silent=True)
        result = quantum_tda_endpoint(input_data)
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/quantum_mc", methods=["GET", "POST"])
def simulate():
    try:
        if request.method == "POST":
            input_data = request.get_json()
        else:
            input_data = None  # Use defaults

        result = quantum_monte_carlo_endpoint(input_data)
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/quantum/order-slicing", methods=["POST"])
def quantum_order_slicing():
    data = request.json
    return jsonify({
        "message": "Quantum order slicing logic to be implemented.",
        "input": data
    })

@app.route("/quantum/order-routing", methods=["POST"])
def quantum_order_routing_endpoint():
    data = request.json
    order_volume = data.get("order_volume", 100000)
    time_remaining = data.get("time_remaining", 5)
    venue = quantum_order_routing(order_volume, time_remaining)
    return jsonify({"selected_venue": venue})

@app.route("/quantum/latency-costs", methods=["POST"])
def quantum_latency_costs_endpoint():
    data = request.json
    order_volume = data.get("order_volume", 100000)
    time_remaining = data.get("time_remaining", 5)
    diagnostics = quantum_latency_costs(order_volume, time_remaining)
    return jsonify(diagnostics)

@app.route("/classical/order-slicing/twap", methods=["POST"])
def classical_twap():
    data = request.json
    volume = data.get("order_volume", 100000)
    duration = data.get("duration_minutes", 10)
    slices = data.get("slices", duration)
    result = twap_slicing(volume, duration, slices)
    return jsonify({"slices": result})

@app.route("/classical/order-slicing/vwap", methods=["POST"])
def classical_vwap():
    data = request.json
    volume = data.get("order_volume", 100000)
    profile = data.get("volume_profile", [10, 20, 30, 25, 15])  # example market volume pattern
    result = vwap_slicing(volume, profile)
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

    # Step 1: Use Brian's /parameters-extraction to understand intent
    try:
        extraction_res = requests.post(
            "https://api.brianknows.org/api/v0/agent/parameters-extraction",
            headers=headers,
            json={"prompt": prompt}
        )
        extraction_res.raise_for_status()
        extraction_data = extraction_res.json()
        intent = extraction_data.get("intent", "info")  # fallback to info

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

        return jsonify({
            "reply": reply,
            "used_endpoint": endpoint,
            "detected_intent": intent,
            "raw_response": result
        })

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Brian request failed: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5002, debug=True)
