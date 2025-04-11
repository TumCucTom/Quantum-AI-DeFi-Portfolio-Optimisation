import dimod
from dwave.system import DWaveSampler, EmbeddingComposite

# === Trade parameters ===
order_volume = 100_000  # shares
time_remaining = 5  # minutes left in trading window (0 = urgent)

# === Venue metadata ===
venues = ['NYSE', 'NASDAQ', 'ARCA', 'DARKPOOL1', 'DARKPOOL2']

fees = {
    'NYSE': 0.002,
    'NASDAQ': 0.0015,
    'ARCA': 0.0025,
    'DARKPOOL1': 0.001,
    'DARKPOOL2': 0.0012
}

slippage = {
    'NYSE': 0.003,
    'NASDAQ': 0.0025,
    'ARCA': 0.004,
    'DARKPOOL1': 0.0015,
    'DARKPOOL2': 0.0018
}

latency_risk = {
    'NYSE': 0.001,
    'NASDAQ': 0.002,
    'ARCA': 0.0015,
    'DARKPOOL1': 0.0005,
    'DARKPOOL2': 0.0007
}

liquidity = {
    'NYSE': 0.9,
    'NASDAQ': 0.85,
    'ARCA': 0.6,
    'DARKPOOL1': 0.7,
    'DARKPOOL2': 0.5
}

max_volume_capacity = {
    'NYSE': 150_000,
    'NASDAQ': 200_000,
    'ARCA': 80_000,
    'DARKPOOL1': 100_000,
    'DARKPOOL2': 60_000
}

# === Time-based decay factor ===
decay_factor = 1.0 + (1.0 - time_remaining / 10)  # increases if time is short

# === QUBO Construction ===
Q = {}
penalty = 3.0  # Penalty for breaking one-hot constraint

for i, vi in enumerate(venues):
    for j, vj in enumerate(venues):
        if i == j:
            base_cost = (
                    fees[vi]
                    + slippage[vi] * decay_factor
                    + latency_risk[vi] * decay_factor
                    - liquidity[vi] * 0.005  # Prefer higher liquidity
            )
            if order_volume > max_volume_capacity[vi]:
                base_cost += 0.01  # Penalty for over-volume
            Q[(vi, vj)] = base_cost
        else:
            Q[(vi, vj)] = penalty  # One-hot constraint

# === Convert to BQM ===
bqm = dimod.BinaryQuadraticModel.from_qubo(Q)

# === Solve on D-Wave ===
sampler = EmbeddingComposite(DWaveSampler())  # requires config file or token
sampleset = sampler.sample(bqm, num_reads=100)
best = sampleset.first.sample

# === Result Interpretation ===
selected_venue = [v for v in venues if best[v] == 1]
print("Selected Venue:", selected_venue[0] if selected_venue else "None")

# === Optional: Print diagnostics ===
if selected_venue:
    v = selected_venue[0]
    print(f"""
    Cost Breakdown for {v}:
    - Fee: {fees[v]:.5f}
    - Slippage (adjusted): {slippage[v] * decay_factor:.5f}
    - Latency risk (adjusted): {latency_risk[v] * decay_factor:.5f}
    - Liquidity bonus: -{liquidity[v] * 0.005:.5f}
    - Volume OK: {"Yes" if order_volume <= max_volume_capacity[v] else "No"}
    """)
