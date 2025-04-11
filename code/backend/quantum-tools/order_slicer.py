import numpy as np
import dimod
from dwave.system import EmbeddingComposite, DWaveSampler

def generate_order_slicing_qubo(total_quantity, time_slots, lot_sizes, volume_profile):
    """Builds a QUBO for order slicing with volume targeting."""
    n_slots = len(time_slots)
    n_lots = len(lot_sizes)
    N = n_slots * n_lots

    # Binary variables: x_ti means slot t gets lot i
    def var_index(t, i):
        return t * n_lots + i

    Q = dimod.BinaryQuadraticModel({}, {}, 0.0, dimod.BINARY)

    # --- 1. Objective: match target volume profile
    for t in range(n_slots):
        target = volume_profile[t] * total_quantity
        for i, lot in enumerate(lot_sizes):
            xi = var_index(t, i)
            coeff = (lot - target) ** 2
            Q.add_variable(xi, coeff)

    # --- 2. Constraint: only one lot size per slot (1-hot)
    penalty = 1e4
    for t in range(n_slots):
        for i in range(n_lots):
            xi = var_index(t, i)
            Q.add_interaction(xi, xi, penalty)  # linear term
            for j in range(i + 1, n_lots):
                xj = var_index(t, j)
                Q.add_interaction(xi, xj, 2 * penalty)

    # --- 3. Constraint: total quantity = desired quantity
    # Soft penalty for deviation from total_quantity
    lambda_total = 1000
    for i in range(N):
        for j in range(N):
            slot_i, lot_i = divmod(i, n_lots)
            slot_j, lot_j = divmod(j, n_lots)
            lot_val_i = lot_sizes[lot_i]
            lot_val_j = lot_sizes[lot_j]
            Q.add_interaction(i, j, lambda_total * lot_val_i * lot_val_j)

        Q.add_variable(i, Q.get_linear(i) - 2 * lambda_total * total_quantity * lot_sizes[i % n_lots])

    Q.offset += lambda_total * total_quantity ** 2
    return Q


# === Example Usage ===
if __name__ == "__main__":
    total_quantity = 10000
    time_slots = ["09:30", "09:35", "09:40", "09:45", "09:50"]
    lot_sizes = [0, 1000, 2000, 3000]

    # Volume profile target (e.g., higher volume in middle)
    volume_profile = np.array([1, 3, 4, 3, 1])
    volume_profile = volume_profile / volume_profile.sum()

    bqm = generate_order_slicing_qubo(total_quantity, time_slots, lot_sizes, volume_profile)

    # Solve using simulated annealing (replace with quantum backend for real run)
    sampler = dimod.SimulatedAnnealingSampler()
    # sampler = EmbeddingComposite(DWaveSampler())
    sampleset = sampler.sample(bqm, num_reads=100)

    best_sample = sampleset.first.sample

    # Decode the result
    n_lots = len(lot_sizes)
    for t, slot in enumerate(time_slots):
        for i, lot in enumerate(lot_sizes):
            if best_sample[t * n_lots + i] == 1:
                print(f"Slot {slot}: {lot} shares")
