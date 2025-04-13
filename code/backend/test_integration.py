"""
Integration test script for the Quantum DeFi portfolio optimization system.
This script will test the Python side integration with the mock Wormhole SDK service.
"""

import requests
import json
import time
import subprocess
import signal
import sys
from typing import Dict, Any

# Configuration
WORMHOLE_SERVICE_URL = "http://localhost:3004"
BACKEND_URL = "http://localhost:3003"

def print_separator(text: str):
    """Print a separator with text"""
    print("\n" + "=" * 80)
    print(f" {text} ".center(80, "="))
    print("=" * 80 + "\n")

def call_api(url: str, method: str = "GET", data: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Make an API call and return the JSON response
    
    Args:
        url: The URL to call
        method: HTTP method (GET or POST)
        data: Optional data for POST requests
        
    Returns:
        JSON response as a dictionary
    """
    print(f"Calling {method} {url}")
    if data:
        print(f"Request data: {json.dumps(data, indent=2)}")
        
    try:
        if method == "GET":
            response = requests.get(url, timeout=10)
        else:  # POST
            response = requests.post(url, json=data, timeout=10)
            
        response.raise_for_status()  # Raise exception for non-200 status codes
        result = response.json()
        print(f"Response status: {response.status_code}")
        print(f"Response data: {json.dumps(result, indent=2)}")
        return result
    
    except requests.exceptions.RequestException as e:
        print(f"Error: {str(e)}")
        return {}

def test_wormhole_service():
    """Test the Wormhole SDK mock service"""
    print_separator("TESTING WORMHOLE SDK MOCK SERVICE")
    
    # 1. Test venues endpoint
    print("Testing venues endpoint...")
    venues = call_api(f"{WORMHOLE_SERVICE_URL}/venues")
    
    # 2. Test swap estimation endpoint
    print("\nTesting swap estimation endpoint...")
    swap_data = {
        "venue": "Uniswap V3",
        "amount": 5,
        "sourceToken": "ETH",
        "targetToken": "USDC"
    }
    swap_result = call_api(f"{WORMHOLE_SERVICE_URL}/estimate-swap", method="POST", data=swap_data)
    
    return len(venues) > 0 and "estimatedOutput" in swap_result

def test_quantum_routing():
    """Test the quantum routing endpoint"""
    print_separator("TESTING QUANTUM ROUTING")
    
    routing_data = {"total_shares": 1000}
    routing_result = call_api(f"{BACKEND_URL}/quantum/order-routing", method="POST", data=routing_data)
    
    return "venue_allocation" in routing_result and "total_cost" in routing_result

def test_brian_ai_integration():
    """Test the Brian AI integration with quantum routing"""
    print_separator("TESTING BRIAN AI WITH QUANTUM ROUTING")
    
    prompt_data = {"prompt": "I want to swap 5 ETH for USDC"}
    brian_result = call_api(f"{BACKEND_URL}/brian/auto", method="POST", data=prompt_data)
    
    return "quantum_routing" in brian_result and "reply" in brian_result

def main():
    """Main test function"""
    print("Starting integration tests...")
    
    # Test Wormhole SDK service
    wormhole_success = test_wormhole_service()
    print(f"\nWormhole SDK service test {'PASSED' if wormhole_success else 'FAILED'}")
    
    if not wormhole_success:
        print("Cannot continue with other tests if Wormhole service is not functioning.")
        return
    
    # Test quantum routing
    routing_success = test_quantum_routing()
    print(f"\nQuantum routing test {'PASSED' if routing_success else 'FAILED'}")
    
    # Test Brian AI integration
    brian_success = test_brian_ai_integration()
    print(f"\nBrian AI integration test {'PASSED' if brian_success else 'FAILED'}")
    
    # Summary
    print_separator("TEST SUMMARY")
    print(f"Wormhole SDK service:  {'✅ PASSED' if wormhole_success else '❌ FAILED'}")
    print(f"Quantum routing:       {'✅ PASSED' if routing_success else '❌ FAILED'}")
    print(f"Brian AI integration:  {'✅ PASSED' if brian_success else '❌ FAILED'}")

if __name__ == "__main__":
    main()