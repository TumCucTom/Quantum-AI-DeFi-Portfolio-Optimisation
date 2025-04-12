/**
 * Venue Service
 * 
 * Service for retrieving DeFi venue information using the Wormhole SDK.
 */

const { getWormholeSDK } = require('./wormholeSDK');

// Default venues with realistic trading data
const DEFAULT_VENUES = [
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
  },
  {
    id: 'pancakeswap',
    name: 'PancakeSwap',
    max: 500000,
    fee: 0.0025,
    slippage: 0.0025,
    chain: 'bsc',
    protocol: 'PancakeSwap',
    tvl: 700000000,
    supportedTokens: ['BNB', 'WBNB', 'BUSD', 'USDT', 'CAKE']
  },
  {
    id: 'traderjoe',
    name: 'TraderJoe',
    max: 300000,
    fee: 0.003,
    slippage: 0.002,
    chain: 'avalanche',
    protocol: 'TraderJoe',
    tvl: 200000000,
    supportedTokens: ['AVAX', 'WAVAX', 'USDC', 'USDT']
  },
  {
    id: 'raydium',
    name: 'Raydium',
    max: 400000,
    fee: 0.003,
    slippage: 0.0025,
    chain: 'solana',
    protocol: 'Raydium',
    tvl: 300000000,
    supportedTokens: ['SOL', 'WSOL', 'USDC', 'USDT']
  }
];

/**
 * Get a list of all available venues with their parameters
 */
async function getVenues() {
  try {
    const sdk = await getWormholeSDK();
    
    if (!sdk) {
      console.error('Wormhole SDK initialization failed');
      return DEFAULT_VENUES;
    }
    
    // Get all supported chains
    const chains = sdk.getSupportedChains();
    let venues = [];
    
    // For each chain, fetch venues and their data
    for (const chain of chains) {
      try {
        // Get the token bridge for the chain
        const tokenBridge = sdk.getTokenBridge(chain);
        
        // Get available liquidity venues on the chain
        const chainVenues = await tokenBridge.getSupportedVenues();
        
        // For each venue, fetch detailed information
        for (const venue of chainVenues) {
          try {
            // Get venue details including fees, liquidity, etc.
            const venueInfo = await tokenBridge.getVenueInfo(venue.id);
            
            // Get max transaction size based on available liquidity
            const maxLiquidity = venue.liquidity || venueInfo.liquidity || 1000000;
            const maxSize = Math.min(maxLiquidity * 0.1, 1000000); // 10% of liquidity or $1M max
            
            venues.push({
              id: venue.id,
              name: venue.name,
              chain,
              max: maxSize,
              fee: venueInfo.fee || venue.fee || _getDefaultFee(venue.name),
              slippage: _estimateSlippage(venue.name, maxSize),
              protocol: venue.protocol || venueInfo.protocol,
              tvl: venueInfo.tvl || venue.tvl,
              supportedTokens: venueInfo.supportedTokens || []
            });
          } catch (error) {
            console.error(`Error fetching venue info for ${venue.name} on ${chain}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error fetching venues for chain ${chain}:`, error);
      }
    }
    
    // Use default venues if we couldn't get any real data
    if (venues.length === 0) {
      console.log('No venues found via SDK, using default venues');
      venues = DEFAULT_VENUES;
    }
    
    return venues;
  } catch (error) {
    console.error('Error in getVenues:', error);
    return DEFAULT_VENUES;
  }
}

/**
 * Get a specific venue by ID
 */
async function getVenueById(venueId) {
  const venues = await getVenues();
  return venues.find(venue => venue.id === venueId);
}

/**
 * Get venue details by name (case-insensitive)
 */
async function getVenueByName(venueName) {
  const venues = await getVenues();
  return venues.find(venue => 
    venue.name.toLowerCase() === venueName.toLowerCase() ||
    venue.id.toLowerCase() === venueName.toLowerCase().replace(/\s+/g, '-')
  );
}

// Helper functions

/**
 * Estimate slippage based on venue type and size
 */
function _estimateSlippage(venueName, size) {
  // Base slippage for different venues
  const baseSlippage = {
    'Uniswap V3': 0.0015,
    'SushiSwap': 0.002,
    'Balancer': 0.001,
    'Curve': 0.001,
    'PancakeSwap': 0.0025,
    'TraderJoe': 0.002,
    'Raydium': 0.0025
  };
  
  // Default slippage rate
  let slippage = 0.002;
  
  // Get specific slippage for known venues
  for (const [venue, rate] of Object.entries(baseSlippage)) {
    if (venueName.includes(venue)) {
      slippage = rate;
      break;
    }
  }
  
  // Adjust slippage based on size (larger trades have more slippage)
  if (size > 500000) {
    slippage *= 1.5; // 50% more slippage for large trades
  } else if (size > 100000) {
    slippage *= 1.2; // 20% more slippage for medium trades
  }
  
  return slippage;
}

/**
 * Get default fee for a venue
 */
function _getDefaultFee(venueName) {
  // Default fees for different venues
  const defaultFees = {
    'Uniswap': 0.003,
    'SushiSwap': 0.0025,
    'Balancer': 0.002,
    'Curve': 0.0004,
    'PancakeSwap': 0.0025,
    'TraderJoe': 0.003,
    'Raydium': 0.003
  };
  
  // Default fee rate
  let fee = 0.003;
  
  // Get specific fee for known venues
  for (const [venue, rate] of Object.entries(defaultFees)) {
    if (venueName.includes(venue)) {
      fee = rate;
      break;
    }
  }
  
  return fee;
}

module.exports = {
  getVenues,
  getVenueById,
  getVenueByName
};