import numpy as np
import requests
import dimod
from dwave.system import DWaveSampler, EmbeddingComposite

def fetch_live_venue_data(token_pair=("USDC", "ETH")):
    """
    Placeholder for WormholeScan or aggregator API data fetch.
    Returns a list of venue dicts with required parameters.
    """
    try:
        # Example placeholder API (replace with actual endpoint and parameters)
        url = "https://api.wormholescan.io/defi/venues"
        response = requests.get(url, params={"from_token": token_pair[0], "to_token": token_pair[1]})
        response.raise_for_status()
        raw_data = response.json()
    except Exception as e:
        print(f"⚠️ Failed to fetch live data: {e}")
        return None  # fall back to static config

    venues = []
    for item in raw_data:
        venues.append({
            "name": item.get("name", "UnknownDEX"),
            "fee": item.get("fee", 0.002),
            "slippage": item.get("slippage", 0.003),
            "latency": item.get("latency_risk", 0.001),
            "liquidity": item.get("liquidity", 0.7),
            "max_volume": item.get("max_volume_capacity", 100_000)
        })

    return venues

def select_optimal_venue(order_volume=100_000, time_remaining=5, use_live_data=False, token_pair=("USDC", "ETH")):
    """
    Selects the best trading venue using a QUBO and D-Wave sampler.

    Parameters:
        order_volume (int): Number of shares/tokens to route.
        time_remaining (int): Time left in minutes (0 = urgent).
        use_live_data (bool): Whether to use live venue data from WormholeScan.
        token_pair (tuple): Token pair to trade (from_token, to_token).

    Returns:
        dict: Details of the selected venue and cost breakdown.
    """
    if use_live_data:
        live_venues = fetch_live_venue_data(token_pair)
        if not live_venues:
            print("⚠️ Falling back to static venue data.")
            use_live_data = False

    if not use_live_data:
        live_venues = [
            {"name": "NYSE", "fee": 0.002, "slippage": 0.003, "latency": 0.001, "liquidity": 0.9, "max_volume": 150_000},
            {"name": "NASDAQ", "fee": 0.0015, "slippage": 0.0025, "latency": 0.002, "liquidity": 0.85, "max_volume": 200_000},
            {"name": "ARCA", "fee": 0.0025, "slippage": 0.004, "latency": 0.0015, "liquidity": 0.6, "max_volume": 80_000},
            {"name": "DARKPOOL1", "fee": 0.001, "slippage": 0.0015, "latency": 0.0005, "liquidity": 0.7, "max_volume": 100_000},
            {"name": "DARKPOOL2", "fee": 0.0012, "slippage": 0.0018, "latency": 0.0007, "liquidity": 0.5, "max_volume": 60_000}
        ]

    decay_factor = 1.0 + (1.0 - time_remaining / 10)
    venues = [v["name"] for v in live_venues]
    Q = {}
    penalty = 3.0

    for i, vi in enumerate(live_venues):
        name_i = vi["name"]
        for j, vj in enumerate(live_venues):
            name_j = vj["name"]
            if i == j:
                base_cost = (
                        vi["fee"]
                        + vi["slippage"] * decay_factor
                        + vi["latency"] * decay_factor
                        - vi["liquidity"] * 0.005
                )
                if order_volume > vi["max_volume"]:
                    base_cost += 0.01  # Penalty for exceeding volume
                Q[(name_i, name_j)] = base_cost
            else:
                Q[(name_i, name_j)] = penalty  # Enforce one-hot

    bqm = dimod.BinaryQuadraticModel.from_qubo(Q)

    sampler = EmbeddingComposite(DWaveSampler())
    sampleset = sampler.sample(bqm, num_reads=100)
    best = sampleset.first.sample

    selected_venue = [v for v in venues if best.get(v) == 1]
    if not selected_venue:
        return {"error": "No venue selected"}

    vname = selected_venue[0]
    vdata = next(v for v in live_venues if v["name"] == vname)

    return {
        "selected_venue": vname,
        "fee": round(vdata["fee"], 5),
        "slippage_adjusted": round(vdata["slippage"] * decay_factor, 5),
        "latency_adjusted": round(vdata["latency"] * decay_factor, 5),
        "liquidity_bonus": round(vdata["liquidity"] * 0.005, 5),
        "volume_ok": order_volume <= vdata["max_volume"]
    }


# Example usage
if __name__ == "__main__":
    result = select_optimal_venue(order_volume=120_000, time_remaining=2, use_live_data=False)

    if "error" not in result:
        print(f"\n📈 Selected Venue: {result['selected_venue']}")
        print(f"  - Fee: {result['fee']}")
        print(f"  - Slippage (adjusted): {result['slippage_adjusted']}")
        print(f"  - Latency risk (adjusted): {result['latency_adjusted']}")
        print(f"  - Liquidity bonus: -{result['liquidity_bonus']}")
        print(f"  - Volume OK: {'Yes' if result['volume_ok'] else 'No'}")
    else:
        print("❌ No venue could be selected.")
