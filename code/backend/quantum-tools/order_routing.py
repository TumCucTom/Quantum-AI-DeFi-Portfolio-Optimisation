import numpy as np
from dwave.system import LeapHybridCQMSampler
from dimod import ConstrainedQuadraticModel, Binary

# Example trade: buy 1000 shares
total_shares = 1000

# Venue data: name, max_shares, fee_per_share, slippage_per_share
venues = [
    {"name": "NYSE",   "max": 600, "fee": 0.001, "slippage": 0.002},
    {"name": "NASDAQ", "max": 800, "fee": 0.0008, "slippage": 0.0025},
    {"name": "DarkPool", "max": 500, "fee": 0.0005, "slippage": 0.001}
]

# Create model
cqm = ConstrainedQuadraticModel()
x = {}  # Binary variables indexed by venue and quantity

# Define binary variables for each venue and unit of shares (in chunks)
chunk_size = 100
for i, venue in enumerate(venues):
    for q in range(0, venue["max"] + 1, chunk_size):
        var = Binary(f"x_{i}_{q}")
        x[(i, q)] = var

        # Cost = (fee + slippage) * quantity
        cost = (venue["fee"] + venue["slippage"]) * q
        cqm.set_objective(cqm.objective + cost * var)

# Constraint: total number of shares must equal total_shares
cqm.add_constraint(
    sum(q * x[(i, q)] for (i, q) in x) == total_shares,
    label="total_shares"
)

# Constraint: one quantity per venue
for i, venue in enumerate(venues):
    cqm.add_constraint(
        sum(x[(i, q)] for q in range(0, venue["max"] + 1, chunk_size)) <= 1,
        label=f"one_choice_venue_{i}"
    )

# Solve using hybrid solver
sampler = LeapHybridCQMSampler()
result = sampler.sample_cqm(cqm, label="Order Routing QUBO")

# Get best result
solution = result.first.sample
print("\n🧠 Optimal Routing Plan:")
for (i, q), var in x.items():
    if solution[var.name] == 1:
        venue_name = venues[i]["name"]
        print(f"  → {venue_name}: {q} shares")

print("\n✅ Total Cost Estimate:")
total_cost = sum(
    (venues[i]["fee"] + venues[i]["slippage"]) * q
    for (i, q), var in x.items()
    if solution[var.name] == 1
)
print(f"  ${total_cost:.2f}")
