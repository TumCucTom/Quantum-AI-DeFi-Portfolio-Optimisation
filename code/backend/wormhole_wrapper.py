"""
Wormhole SDK Wrapper Service

This module provides a wrapper around the Wormhole TypeScript SDK,
exposing venue data for quantum order routing optimization.
"""

import os
import json
import requests
import subprocess
import time
from typing import List, Dict, Any

# Default venue data in case the SDK service is unavailable
DEFAULT_VENUES = [
    {"name": "Uniswap V3", "max": 600, "fee": 0.003, "slippage": 0.0015},
    {"name": "SushiSwap", "max": 800, "fee": 0.0025, "slippage": 0.002},
    {"name": "Balancer", "max": 500, "fee": 0.002, "slippage": 0.001},
    {"name": "Curve", "max": 900, "fee": 0.0004, "slippage": 0.001}
]

class WormholeSDKWrapper:
    """Interface to the Wormhole SDK TypeScript service"""
    
    def __init__(self, sdk_service_url: str = "http://localhost:3004"):
        """Initialize the Wormhole SDK wrapper"""
        self.sdk_service_url = sdk_service_url
    
    def get_venues(self) -> List[Dict[str, Any]]:
        """
        Fetch available venues and their parameters from the Wormhole SDK service
        
        Returns:
            List of venue data dictionaries including name, max order size, fees, and slippage
        """
        try:
            response = requests.get(f"{self.sdk_service_url}/venues", timeout=5)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Warning: Failed to fetch venues from Wormhole SDK service. Status: {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"Warning: Error connecting to Wormhole SDK service: {e}")
        
        # Return default venues if service is unavailable
        print("Using default venue data")
        return DEFAULT_VENUES
    
    def estimate_swap_cost(self, venue_name: str, amount: float) -> Dict[str, Any]:
        """
        Estimate the cost of a swap on a specific venue
        
        Args:
            venue_name: Name of the venue (e.g., "Uniswap V3")
            amount: Amount to swap
            
        Returns:
            Dictionary with estimated fee and slippage
        """
        try:
            response = requests.post(
                f"{self.sdk_service_url}/estimate-swap",
                json={"venue": venue_name, "amount": amount},
                timeout=5
            )
            if response.status_code == 200:
                return response.json()
        except requests.exceptions.RequestException:
            pass
        
        # Return default values if service is unavailable
        for venue in DEFAULT_VENUES:
            if venue["name"] == venue_name:
                return {
                    "fee": venue["fee"] * amount,
                    "slippage": venue["slippage"] * amount
                }
        
        return {"fee": 0.003 * amount, "slippage": 0.002 * amount}  # Fallback defaults


# Singleton instance
wormhole_client = WormholeSDKWrapper()