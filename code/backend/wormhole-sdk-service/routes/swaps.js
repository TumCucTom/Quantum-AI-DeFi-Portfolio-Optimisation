/**
 * Swaps Routes
 * 
 * Provides endpoints for estimating swap costs and executing swaps.
 */

const express = require('express');
const router = express.Router();
const { estimateSwapCost } = require('../services/swapService');

/**
 * POST /estimate-swap
 * Estimates the cost of swapping tokens on a specific venue.
 * 
 * Request body:
 * {
 *   "venue": "Uniswap V3",
 *   "amount": 10.5,
 *   "sourceToken": "ETH",  // Optional
 *   "targetToken": "USDC"  // Optional
 * }
 */
router.post('/', async (req, res) => {
  const { venue, amount, sourceToken, targetToken } = req.body;
  
  if (!venue || !amount) {
    return res.status(400).json({ 
      error: 'Missing required parameters', 
      required: ['venue', 'amount'] 
    });
  }
  
  try {
    const result = await estimateSwapCost(venue, amount, sourceToken, targetToken);
    res.json(result);
  } catch (error) {
    console.error('Error estimating swap:', error);
    res.status(500).json({ error: 'Failed to estimate swap' });
  }
});

module.exports = router;