from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from dotenv import load_dotenv
import os

from demo_tools.demo import twap_slicing
from demo_tools.demo import vwap_slicing
from demo_tools.demo import quantum_order_routing
from demo_tools.demo import quantum_latency_costs



app = Flask(__name__)
CORS(app)
# === Routes ===

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


@app.route("/brian/chat", methods=["POST"])
def brian_chat():
    data = request.json
    prompt = data.get("prompt")

    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400

    headers = {
        "Content-Type": "application/json",
        "x-brian-api-key": os.getenv("BRIAN_API_KEY")
    }

    payload = {
        "prompt": prompt,
        "kb": "default"
    }

    try:
        response = requests.post(
            "https://api.brianknows.org/api/v0/agent/knowledge",
            headers=headers,
            json=payload
        )
        response.raise_for_status()
        result = response.json()
        answer = result.get("result", {}).get("answer", "No answer found.")

        return jsonify({"reply": answer})

    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=3003, debug=True)
