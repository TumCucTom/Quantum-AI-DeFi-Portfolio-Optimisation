# === Helper functions ===

def twap_slicing(total_volume, duration_minutes, slices):
    slice_volume = total_volume // slices
    return [slice_volume] * slices

def vwap_slicing(total_volume, volume_profile):
    total_profile = sum(volume_profile)
    return [int((v / total_profile) * total_volume) for v in volume_profile]

def quantum_order_routing(order_volume, time_remaining):
    # Simplified version for demo purposes
    venues = ['NYSE', 'NASDAQ', 'ARCA', 'DARKPOOL1', 'DARKPOOL2']
    selected = venues[order_volume % len(venues)]
    return selected

def quantum_latency_costs(order_volume, time_remaining):
    # Fake diagnostic payload (replace with QUBO logic from earlier script)
    return {
        "NYSE": {"cost": 0.0052, "ok": True},
        "NASDAQ": {"cost": 0.0061, "ok": True},
        "ARCA": {"cost": 0.0079, "ok": order_volume <= 80000},
        "DARKPOOL1": {"cost": 0.0041, "ok": True},
        "DARKPOOL2": {"cost": 0.0046, "ok": order_volume <= 60000},
    }
