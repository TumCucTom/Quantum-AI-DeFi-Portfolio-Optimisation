"""
Quantum Order Routing Optimizer

This module provides quantum annealing optimization for order routing
across different venues with varying fees and slippage characteristics.
"""

import numpy as np
import json
import os
from typing import Dict, List, Any, Tuple, Optional

from dimod import ConstrainedQuadraticModel, Binary
from dwave.system import LeapHybridCQMSampler

from wormhole_wrapper import wormhole_client

def optimize_order_routing(total_shares: int) -> Dict[str, Any]:
    """
    Optimize order routing across available venues using quantum annealing
    
    Args:
        total_shares: Total number of shares/tokens to trade
        
    Returns:
        Dictionary with optimization results
    """
    # Fetch venues from Wormhole SDK
    venues = wormhole_client.get_venues()
    
    # Create model
    cqm = ConstrainedQuadraticModel()
    x = {}  # Binary variables indexed by venue and quantity
    
    # Define binary variables for each venue and unit of shares (in chunks)
    chunk_size = max(1, total_shares // 100)  # Adaptive chunk size
    if chunk_size < 1:
        chunk_size = 1  # Ensure minimum chunk size of 1
        
    for i, venue in enumerate(venues):
        max_shares = min(venue["max"], total_shares)  # Can't route more than total
        for q in range(0, max_shares + 1, chunk_size):
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
        max_shares = min(venue["max"], total_shares)
        cqm.add_constraint(
            sum(x[(i, q)] for q in range(0, max_shares + 1, chunk_size)) <= 1,
            label=f"one_choice_venue_{i}"
        )
    
    # Check if we need to use the DWave solver or a classical solver
    try:
        # Use D-Wave hybrid solver if API key is available
        dwave_api_key = os.getenv("DWAVE_API_KEY")
        if dwave_api_key:
            sampler = LeapHybridCQMSampler()
            result = sampler.sample_cqm(cqm, label="Order Routing QUBO")
            solution = result.first.sample
        else:
            # Fallback to classical approximation if no API key
            print("No DWave API key found, using classical approximation")
            solution = _classical_approximation(venues, total_shares)
    except Exception as e:
        print(f"Error using quantum solver: {e}")
        solution = _classical_approximation(venues, total_shares)
    
    # Extract and format results
    venue_allocation = []
    for (i, q), var in x.items():
        var_name = var.name if hasattr(var, 'name') else f"x_{i}_{q}"
        if var_name in solution and solution[var_name] == 1:
            venue_name = venues[i]["name"]
            venue_allocation.append({
                "venue": venue_name,
                "amount": q,
                "fee": venues[i]["fee"] * q,
                "slippage": venues[i]["slippage"] * q
            })
    
    # Calculate total cost
    total_cost = sum(
        alloc["fee"] + alloc["slippage"]
        for alloc in venue_allocation
    )
    
    return {
        "total_shares": total_shares,
        "venue_allocation": venue_allocation,
        "total_cost": total_cost
    }

def _classical_approximation(venues: List[Dict[str, Any]], total_shares: int) -> Dict[str, int]:
    """
    Simple classical approximation for order routing when quantum solver is unavailable
    
    Args:
        venues: List of venue data
        total_shares: Total number of shares to allocate
        
    Returns:
        Dictionary mapping variable names to values
    """
    # Sort venues by total cost (fee + slippage)
    sorted_venues = sorted(venues, key=lambda v: v["fee"] + v["slippage"])
    
    solution = {}
    remaining_shares = total_shares
    
    # Allocate to cheapest venues first
    for i, venue in enumerate(sorted_venues):
        max_shares = min(venue["max"], remaining_shares)
        if max_shares > 0:
            solution[f"x_{i}_{max_shares}"] = 1
            remaining_shares -= max_shares
        
        if remaining_shares <= 0:
            break
    
    return solution