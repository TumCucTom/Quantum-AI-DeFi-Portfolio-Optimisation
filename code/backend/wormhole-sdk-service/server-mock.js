/**
 * Wormhole SDK Service - MOCK VERSION
 * 
 * This is a simplified mock version that doesn't require the actual Wormhole SDK.
 * Use this for testing the Python backend's integration with venue data.
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3004;

// Middleware
app.use(cors());
app.use(express.json());

// Mock venue data
const VENUES = [
  {
    id: 'uniswap-v3',
    name: 'Uniswap V3',
    max: 600000,
    fee: 0.003,
    slippage: 0.0015,
    chain: 'ethereum',
    protocol: 'UniswapV3',
    tvl: 1500000000,
    supportedTokens: ['ETH', 'WETH', 'USDC', 'USDT', 'DAI', 'WBTC']
  },
  {
    id: 'sushiswap',
    name: 'SushiSwap',
    max: 800000,
    fee: 0.0025,
    slippage: 0.002,
    chain: 'ethereum',
    protocol: 'SushiSwap',
    tvl: 500000000,
    supportedTokens: ['ETH', 'WETH', 'USDC', 'USDT', 'DAI', 'WBTC']
  },
  {
    id: 'balancer',
    name: 'Balancer',
    max: 500000,
    fee: 0.002,
    slippage: 0.001,
    chain: 'ethereum',
    protocol: 'Balancer',
    tvl: 300000000,
    supportedTokens: ['ETH', 'WETH', 'USDC', 'DAI', 'BAL']
  },
  {
    id: 'curve',
    name: 'Curve',
    max: 900000,
    fee: 0.0004,
    slippage: 0.001,
    chain: 'ethereum',
    protocol: 'Curve',
    tvl: 2000000000,
    supportedTokens: ['ETH', 'WETH', 'USDC', 'USDT', 'DAI']
  }
];

// Mock token exchange rates
const TOKEN_RATES = {
  'ETH/USDC': 3500,
  'ETH/DAI': 3500,
  'ETH/USDT': 3490,
  'WBTC/ETH': 16.5,
  'WBTC/USDC': 57500
};

// Routes

// GET /venues - Returns all venues
app.get('/venues', (req, res) => {
  res.json(VENUES);
});

// GET /venues/:id - Returns a specific venue by ID
app.get('/venues/:id', (req, res) => {
  const venue = VENUES.find(v => v.id === req.params.id);
  if (!venue) {
    return res.status(404).json({ error: 'Venue not found' });
  }
  res.json(venue);
});

// POST /estimate-swap - Estimates swap costs
app.post('/estimate-swap', (req, res) => {
  const { venue: venueName, amount, sourceToken = 'ETH', targetToken = 'USDC' } = req.body;
  
  if (!venueName || !amount) {
    return res.status(400).json({ 
      error: 'Missing required parameters', 
      required: ['venue', 'amount'] 
    });
  }
  
  // Find the venue
  const venue = VENUES.find(v => 
    v.name.toLowerCase() === venueName.toLowerCase() || 
    v.id.toLowerCase() === venueName.toLowerCase().replace(/\s+/g, '-')
  );
  
  if (!venue) {
    return res.status(404).json({ error: `Venue "${venueName}" not found` });
  }
  
  // Calculate swap costs
  const fee = venue.fee * amount;
  const slippage = venue.slippage * amount;
  const gasCost = calculateGasCost(amount, venue.chain);
  
  // Get token exchange rate
  const pair = `${sourceToken}/${targetToken}`;
  const rate = TOKEN_RATES[pair] || 1;
  
  // Calculate output
  const estimatedOutput = amount * rate * (1 - venue.fee - venue.slippage);
  
  res.json({
    fee,
    slippage,
    gasCost,
    estimatedOutput,
    totalCost: fee + slippage + gasCost,
    route: [venue.name],
    executionPrice: rate * (1 - venue.fee - venue.slippage)
  });
});

// Helper function to calculate gas costs
function calculateGasCost(amount, chain) {
  const gasPrices = {
    'ethereum': 50, // gwei
    'bsc': 5,
    'avalanche': 25,
    'solana': 0.00001
  };
  
  const chainPrice = gasPrices[chain] || gasPrices['ethereum'];
  return amount * 0.005 * (chainPrice / 10); // Simplified calculation
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'wormhole-sdk-service-mock' });
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 Mock Wormhole SDK Service running on port ${port}`);
});