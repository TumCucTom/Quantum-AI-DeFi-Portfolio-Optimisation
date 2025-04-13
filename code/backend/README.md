# Quantum-AI DeFi Portfolio Optimization Backend

This backend system integrates blockchain data, quantum optimization, and AI execution for optimal token swapping in DeFi protocols.

## Overview

The system consists of the following main components:

1. **Blockchain Venues Server** - A Node.js server that fetches real venue data from the blockchain
2. **Quantum Order Routing** - A Python module that uses quantum computing to optimize order routing
3. **Brian AI Integration** - Integration with Brian AI for executing the optimized swaps
4. **Flask API Server** - RESTful API server that exposes the functionality to clients

## System Architecture

```
┌─────────────────┐    ┌───────────────────┐    ┌─────────────────┐
│                 │    │                   │    │                 │
│  Blockchain     │───▶│  Quantum Order    │───▶│  Brian AI       │
│  Venues Server  │    │  Routing          │    │  Integration    │
│  (Node.js)      │    │  (Python)         │    │  (Python)       │
│                 │    │                   │    │                 │
└─────────────────┘    └───────────────────┘    └─────────────────┘
         ▲                      ▲                        ▲
         │                      │                        │
         └──────────────────────┼────────────────────────┘
                                │
                      ┌─────────────────┐
                      │                 │
                      │   Flask API     │
                      │   Server        │
                      │                 │
                      └─────────────────┘
                                ▲
                                │
                      ┌─────────────────┐
                      │                 │
                      │   Frontend      │
                      │   Application   │
                      │                 │
                      └─────────────────┘
```

## Key Components

### Blockchain Venues Server (`blockchain-venues-server.js`)

- Fetches real-time venue data from Ethereum blockchain
- Supports Uniswap V3 and SushiSwap protocols
- Provides venue-specific information like fees, slippage, and maximum order sizes
- Includes fallback data when blockchain connections fail
- Exposes a `/venues` endpoint on port 3005

### Wormhole SDK Wrapper (`wormhole_wrapper.py`)

- Python interface to the blockchain venues server
- Simplifies interaction with blockchain data for the Python components

### Quantum Order Routing (`quantum_order_routing.py`)

- Implements the quantum optimization algorithm using D-Wave's quantum annealing
- Formulates the problem as a Constrained Quadratic Model (CQM)
- Includes fallback to classical optimization when quantum resources are unavailable
- Optimizes order allocation across venues to minimize costs

### Brian AI Integration (`routing_for_brian.py`)

- Formats quantum-optimized routing for Brian AI
- Generates prompts for executing swaps via Brian
- Handles communication with Brian's API

### Flask API Server (`server.py`)

- Exposes RESTful endpoints for the frontend
- Integrates all components together
- Provides endpoints for order routing, slicing, and Brian integration

## API Endpoints

### Quantum-specific Endpoints

- **POST /quantum/order-routing**: Perform quantum order routing optimization
- **POST /quantum/order-slicing**: Slice orders using quantum optimization
- **POST /quantum/latency-costs**: Calculate latency costs using quantum optimization
- **POST /quantum/routing-for-brian**: Get quantum-optimized routing formatted for Brian AI

### Classical Endpoints

- **POST /classical/order-slicing/twap**: Time-weighted average price order slicing
- **POST /classical/order-slicing/vwap**: Volume-weighted average price order slicing

### Brian AI Endpoints

- **POST /brian/auto**: Auto-detect intent and execute operations with Brian AI

## Usage Example

### Quantum Routing for Brian

```python
import requests
import json

# Request optimal routing for a swap
response = requests.post(
    "http://localhost:3003/quantum/routing-for-brian",
    json={
        "amount": 5.0,
        "source_token": "ETH",
        "target_token": "USDC",
        "execute": True  # If you want to send to Brian for execution
    }
)

# Print the response
result = response.json()
print(json.dumps(result, indent=2))
```

### Using Brian Auto Endpoint

```python
import requests

# Send a natural language prompt to Brian
response = requests.post(
    "http://localhost:3003/brian/auto",
    json={
        "prompt": "Swap 3 ETH for USDC on the best available venues"
    }
)

# Print the response
result = response.json()
print(result["reply"])
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.8+
- D-Wave Ocean SDK (for quantum optimization)

### Environment Variables

Create a `.env` file with the following variables:

```
# D-Wave Leap credentials for quantum optimization
DWAVE_API_TOKEN=your_dwave_api_token

# Brian AI API key
BRIAN_API_KEY=your_brian_api_key

# Ethereum RPC URLs
ETH_MAINNET_RPC_URL=https://mainnet.infura.io/v3/your_key
ETH_GOERLI_RPC_URL=https://goerli.infura.io/v3/your_key
```

### Installation

1. Install Node.js dependencies for the blockchain venues server:

```bash
cd wormhole-sdk-service
npm install
```

2. Install Python dependencies:

```bash
pip install -r requirements.txt
```

### Running the System

1. Start the blockchain venues server:

```bash
node wormhole-sdk-service/blockchain-venues-server.js
```

2. Start the Flask API server:

```bash
python server.py
```

### Testing

To test the integrated routing system:

```bash
python test_integrated_routing.py
```

## Fallback Mechanisms

The system includes fallback mechanisms at every level:

1. The blockchain venues server provides fallback data when blockchain connections fail
2. The quantum optimizer falls back to classical optimization when D-Wave's services are unavailable
3. The Brian integration has error handling and retry mechanisms

## Future Work

- Add support for more DeFi protocols and chains
- Implement more sophisticated quantum algorithms for routing
- Enhance the direct integration with Brian
- Add monitoring and logging for production deployment