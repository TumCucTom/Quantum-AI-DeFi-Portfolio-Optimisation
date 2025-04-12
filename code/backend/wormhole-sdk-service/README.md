# Wormhole SDK Service

A Node.js HTTP service that exposes the Wormhole TypeScript SDK functionality via REST APIs. This service is used by the quantum order routing optimizer to fetch venue data and estimate swap costs.

## Overview

This service provides a bridge between the Python backend and the Wormhole SDK, which is written in TypeScript. It offers endpoints for:

- Retrieving venue information (fees, slippage, max transaction sizes)
- Estimating swap costs across different venues
- Executing swaps (when provided with proper credentials)

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Configure environment variables:
   ```
   cp .env.example .env
   ```
   Then edit the `.env` file with your Alchemy, Infura, or other RPC provider keys.

3. Start the service:
   ```
   npm start
   ```
   
   For development with auto-reload:
   ```
   npm run dev
   ```

## API Endpoints

### GET /venues
Returns a list of all available trading venues with their parameters.

Response:
```json
[
  {
    "id": "uniswap-v3",
    "name": "Uniswap V3",
    "max": 600000,
    "fee": 0.003,
    "slippage": 0.0015,
    "chain": "ethereum",
    "protocol": "UniswapV3",
    "tvl": 1500000000,
    "supportedTokens": ["ETH", "WETH", "USDC", "USDT", "DAI", "WBTC"]
  },
  ...
]
```

### GET /venues/:id
Returns details for a specific venue by ID.

### POST /estimate-swap
Estimates the cost of swapping tokens on a specific venue.

Request:
```json
{
  "venue": "Uniswap V3",
  "amount": 10.5,
  "sourceToken": "ETH",
  "targetToken": "USDC"
}
```

Response:
```json
{
  "fee": 0.0315,
  "slippage": 0.01575,
  "gasCost": 0.04725,
  "estimatedOutput": 36662.5,
  "totalCost": 0.0945,
  "route": ["Uniswap V3"],
  "executionPrice": 3491.67
}
```

## Integration with Python Backend

The Python backend connects to this service at http://localhost:3004 by default. The service provides the necessary venue data that the quantum optimizer uses to route orders optimally across different venues.

## Error Handling

If the Wormhole SDK is unavailable or encounters errors, the service falls back to using default venue data. This ensures that the quantum optimizer always has data to work with, even if the live SDK connection fails.