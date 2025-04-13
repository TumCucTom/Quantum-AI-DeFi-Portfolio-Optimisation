import requests
from dwave.system import LeapHybridCQMSampler
from dimod import ConstrainedQuadraticModel, Binary

def fetch_venue_data_wormhole(token_pair=("USDC", "ETH"), chunk_size=100):
    """
    Fetch trading venue data via WormholeScan (placeholder).

    Returns:
        list of venue dictionaries with: name, max, fee, slippage
    """
    # Replace with real API endpoint if available
    api_url = "https://api.wormholescan.io/defi/venues"
    params = {
        "from_token": token_pair[0],
        "to_token": token_pair[1],
    }

    try:
        response = requests.get(api_url, params=params)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        print(f"⚠️ Failed to fetch live data: {e}")
        # Fallback to mock data
        data = [
            {"name": "Uniswap", "fee": 0.003, "slippage": 0.002, "max_liquidity": 3000},
            {"name": "PancakeSwap", "fee": 0.0025, "slippage": 0.0025, "max_liquidity": 2000},
            {"name": "Raydium", "fee": 0.002, "slippage": 0.0015, "max_liquidity": 1000},
        ]

    venues = []
    for dex in data:
        venues.append({
            "name": dex["name"],
            "max": int(dex.get("max_liquidity", 0)),  # as share equivalent
            "fee": float(dex.get("fee", 0.003)),
            "slippage": float(dex.get("slippage", 0.002))
        })
    return venues


def route_order_optimally(total_shares=1000, chunk_size=100):
    """
    Optimize routing of a token swap using live Wormhole-connected venues.
    """
    venues = fetch_venue_data_wormhole()

    cqm = ConstrainedQuadraticModel()
    x = {}

    for i, venue in enumerate(venues):
        for q in range(0, venue["max"] + 1, chunk_size):
            var = Binary(f"x_{i}_{q}")
            x[(i, q)] = var
            cost = (venue["fee"] + venue["slippage"]) * q
            cqm.set_objective(cqm.objective + cost * var)

    cqm.add_constraint(
        sum(q * x[(i, q)] for (i, q) in x) == total_shares,
        label="total_shares"
    )

    for i, venue in enumerate(venues):
        cqm.add_constraint(
            sum(x[(i, q)] for q in range(0, venue["max"] + 1, chunk_size)) <= 1,
            label=f"one_choice_venue_{i}"
        )

    sampler = LeapHybridCQMSampler()
    result = sampler.sample_cqm(cqm, label="DeFi Quantum Routing")

    solution = result.first.sample
    routing_plan = []
    total_cost = 0.0

    for (i, q), var in x.items():
        if solution[var.name] == 1:
            venue = venues[i]
            routing_plan.append({
                "venue": venue["name"],
                "shares": q,
                "cost": (venue["fee"] + venue["slippage"]) * q
            })
            total_cost += (venue["fee"] + venue["slippage"]) * q

    return {
        "routing_plan": routing_plan,
        "total_cost": round(total_cost, 4)
    }


# Example usage
if __name__ == "__main__":
    result = route_order_optimally(total_shares=2000)
    print("\n🧠 Optimal Routing Plan (Live Data):")
    for entry in result["routing_plan"]:
        print(f"  → {entry['venue']}: {entry['shares']} units")

    print("\n✅ Total Cost Estimate:")
    print(f"  ${result['total_cost']:.2f}")
