import numpy as np
import requests
import dimod
from dwave.system import EmbeddingComposite, DWaveSampler

def fetch_live_volume_profile(time_slots, token_pair=("USDC", "ETH")):
    """
    Fetches a live volume distribution profile from DeFi aggregator (mocked).
    Returns a normalized volume profile (numpy array).
    """
    try:
        # Replace with actual DeFi data source (e.g. DefiLlama, 0x, Li.Fi)
        url = "https://api.wormholescan.io/defi/volume_profile"
        response = requests.get(url, params={"from_token": token_pair[0], "to_token": token_pair[1]})
        response.raise_for_status()
        profile_data = response.json()
        profile = [profile_data.get(slot, 1) for slot in time_slots]
        profile = np.array(profile)
        return profile / profile.sum()
    except Exception as e:
        print(f"⚠️ Using default volume profile. Error: {e}")
        default = np.array([1, 3, 4, 3, 1])
        return default / default.sum()

def generate_order_slicing_qubo(total_quantity, time_slots, lot_sizes, volume_profile):
    n_slots = len(time_slots)
    n_lots = len(lot_sizes)
    N = n_slots * n_lots

    def var_index(t, i):
        return t * n_lots + i

    Q = dimod.BinaryQuadraticModel({}, {}, 0.0, dimod.BINARY)

    for t in range(n_slots):
        target = volume_profile[t] * total_quantity
        for i, lot in enumerate(lot_sizes):
            xi = var_index(t, i)
            coeff = (lot - target) ** 2
            Q.add_variable(xi, coeff)

    penalty = 1e4
    for t in range(n_slots):
        for i in range(n_lots):
            xi = var_index(t, i)
            Q.add_interaction(xi, xi, penalty)
            for j in range(i + 1, n_lots):
                xj = var_index(t, j)
                Q.add_interaction(xi, xj, 2 * penalty)

    lambda_total = 1000
    for i in range(N):
        for j in range(N):
            lot_val_i = lot_sizes[i % n_lots]
            lot_val_j = lot_sizes[j % n_lots]
            Q.add_interaction(i, j, lambda_total * lot_val_i * lot_val_j)
        Q.add_variable(i, Q.get_linear(i) - 2 * lambda_total * total_quantity * lot_sizes[i % n_lots])

    Q.offset += lambda_total * total_quantity ** 2
    return Q

def solve_order_slicing_live(total_quantity, time_slots, token_pair=("USDC", "ETH"), use_quantum=False):
    """
    Solves order slicing using live volume data from a DeFi API.

    Args:
        total_quantity (int): Total quantity to slice.
        time_slots (list): List of time slots.
        token_pair (tuple): Token pair like ("USDC", "ETH").
        use_quantum (bool): Whether to use a D-Wave quantum backend.

    Returns:
        dict: Slot → Assigned lot size
    """
    volume_profile = fetch_live_volume_profile(time_slots, token_pair)
    lot_sizes = [0, 1000, 2000, 3000]  # could also be dynamic from data

    bqm = generate_order_slicing_qubo(total_quantity, time_slots, lot_sizes, volume_profile)

    sampler = EmbeddingComposite(DWaveSampler()) if use_quantum else dimod.SimulatedAnnealingSampler()
    sampleset = sampler.sample(bqm, num_reads=100)
    best_sample = sampleset.first.sample

    result = {}
    n_lots = len(lot_sizes)
    for t, slot in enumerate(time_slots):
        for i, lot in enumerate(lot_sizes):
            if best_sample[t * n_lots + i] == 1:
                result[slot] = lot
    return result

# === Example usage ===
if __name__ == "__main__":
    total_quantity = 10000
    time_slots = ["09:30", "09:35", "09:40", "09:45", "09:50"]

    result = solve_order_slicing_live(
        total_quantity=total_quantity,
        time_slots=time_slots,
        token_pair=("USDC", "ETH"),
        use_quantum=False  # change to True to run on D-Wave
    )

    print("\n📊 Optimal Order Slicing Plan (Live Data):")
    for slot, shares in result.items():
        print(f"  {slot}: {shares} shares")
