/**
 * Blockchain Venues Server
 * 
 * A lightweight server that fetches real venue data from the blockchain
 * for quantum order routing optimization.
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { ethers } = require('ethers');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3005; // Use a different port

// Middleware
app.use(cors());
app.use(express.json());

// Token addresses for common tokens
const MAINNET_TOKEN_ADDRESSES = {
  ETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'
};

// Sepolia token addresses (verified for testing)
const SEPOLIA_TOKEN_ADDRESSES = {
  ETH: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9', // WETH on Sepolia
  USDC: '0x8267cF9254734C6Eb452a7bb9AAF97B392258b21', // Sepolia USDC
  USDT: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06', // Sepolia USDT
  DAI: '0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6',  // Sepolia DAI
  WBTC: '0xf864F8aea99899F4BAB42Cc279b22a910f5217aF'  // Sepolia WBTC
};

// Dynamic token addresses based on network
let TOKEN_ADDRESSES = MAINNET_TOKEN_ADDRESSES;

// Uniswap V3 Factory address and ABI
const UNISWAP_V3_FACTORY = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
const UNISWAP_V3_FACTORY_ABI = [
  'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)'
];

// Uniswap V3 Pool ABI
const UNISWAP_V3_POOL_ABI = [
  'function liquidity() external view returns (uint128)',
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function fee() external view returns (uint24)'
];

// Reliable fallback venues if blockchain connection fails
const FALLBACK_VENUES = [
  {
    id: 'uniswap-v3-500',
    name: 'Uniswap V3 (0.05%)',
    max: 600000,
    fee: 0.0005,
    slippage: 0.0008,
    chain: 'ethereum',
    protocol: 'UniswapV3',
    tvl: 1350000000,
    supportedTokens: ['ETH', 'WETH', 'USDC', 'USDT', 'DAI', 'WBTC']
  },
  {
    id: 'uniswap-v3-3000',
    name: 'Uniswap V3 (0.3%)',
    max: 900000,
    fee: 0.003,
    slippage: 0.0012,
    chain: 'ethereum',
    protocol: 'UniswapV3',
    tvl: 2100000000,
    supportedTokens: ['ETH', 'WETH', 'USDC', 'USDT', 'DAI', 'WBTC']
  },
  {
    id: 'uniswap-v3-10000',
    name: 'Uniswap V3 (1%)',
    max: 1200000,
    fee: 0.01,
    slippage: 0.0008,
    chain: 'ethereum',
    protocol: 'UniswapV3',
    tvl: 500000000,
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
  }
];

// Cache venue data for 5 minutes to reduce blockchain calls
let venueCache = {
  data: [],
  timestamp: 0
};

/**
 * GET /venues - Returns all venues with live blockchain data
 */
app.get('/venues', async (req, res) => {
  try {
    // Use force_fallback query parameter to test fallback data if needed
    if (req.query.force_fallback === 'true') {
      console.log('Forcing fallback venues data');
      return res.json(FALLBACK_VENUES);
    }
    
    // Check cache freshness (5 minute TTL)
    const now = Date.now();
    const cacheTTL = 5 * 60 * 1000; // 5 minutes
    
    if (venueCache.data.length > 0 && now - venueCache.timestamp < cacheTTL) {
      console.log('Returning cached venue data');
      return res.json(venueCache.data);
    }
    
    console.log('Fetching fresh blockchain venue data...');
    
    // Connect to Ethereum (prefer Sepolia if available)
    let provider;
    try {
      // Try Sepolia first, then fall back to mainnet
      const rpc_url = process.env.ETH_SEPOLIA_RPC_URL || process.env.ETH_RPC_URL;
      provider = new ethers.providers.JsonRpcProvider(rpc_url);
      const network = await provider.getNetwork();
      console.log(`Connected to ${network.name} (chainId: ${network.chainId})`);
    } catch (connError) {
      console.error('Error connecting to Ethereum:', connError.message);
      return res.json(FALLBACK_VENUES);
    }
    
    // Get Uniswap V3 pool data
    const venues = await getUniswapV3Venues(provider);
    
    // If we got venues, update cache
    if (venues.length > 0) {
      venueCache.data = venues;
      venueCache.timestamp = now;
    } else {
      return res.json(FALLBACK_VENUES);
    }
    
    res.json(venues);
  } catch (error) {
    console.error('Error fetching venues:', error);
    res.json(FALLBACK_VENUES);
  }
});

/**
 * GET /venues/:id - Returns a specific venue by ID
 */
app.get('/venues/:id', async (req, res) => {
  try {
    const venueId = req.params.id;
    
    // Use fallback venues if requested
    if (req.query.force_fallback === 'true') {
      const fallbackVenue = FALLBACK_VENUES.find(v => v.id === venueId);
      if (fallbackVenue) {
        return res.json(fallbackVenue);
      }
      return res.status(404).json({ error: 'Venue not found in fallback data' });
    }
    
    // Check cache first
    if (venueCache.data.length > 0) {
      const cachedVenue = venueCache.data.find(v => v.id === venueId);
      if (cachedVenue) {
        return res.json(cachedVenue);
      }
    }
    
    // Get fresh venue data from blockchain
    const venues = await getVenues();
    const venue = venues.find(v => v.id === venueId);
    
    if (venue) {
      return res.json(venue);
    }
    
    // Try fallback as last resort
    const fallbackVenue = FALLBACK_VENUES.find(v => v.id === venueId);
    if (fallbackVenue) {
      return res.json(fallbackVenue);
    }
    
    return res.status(404).json({ error: 'Venue not found' });
  } catch (error) {
    console.error('Error fetching venue:', error);
    
    // Try fallback
    const fallbackVenue = FALLBACK_VENUES.find(v => v.id === req.params.id);
    if (fallbackVenue) {
      return res.json(fallbackVenue);
    }
    
    res.status(500).json({ error: 'Failed to fetch venue' });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'blockchain-venues-server',
    cacheAge: venueCache.data.length > 0 ? (Date.now() - venueCache.timestamp) / 1000 : null
  });
});

/**
 * Get Uniswap V3 venues with real blockchain data
 */
async function getUniswapV3Venues(provider) {
  try {
    console.log('Fetching Uniswap V3 venues...');
    
    // Connect to Uniswap V3 Factory
    const factoryContract = new ethers.Contract(
      UNISWAP_V3_FACTORY,
      UNISWAP_V3_FACTORY_ABI,
      provider
    );
    
    // Define fee tiers to check
    const feeTiers = [500, 3000, 10000]; // 0.05%, 0.3%, 1%
    
    // Define token pairs to check
    const tokenPairs = [
      { name: 'ETH-USDC', tokenA: TOKEN_ADDRESSES.ETH, tokenB: TOKEN_ADDRESSES.USDC },
      { name: 'ETH-USDT', tokenA: TOKEN_ADDRESSES.ETH, tokenB: TOKEN_ADDRESSES.USDT },
      { name: 'ETH-DAI', tokenA: TOKEN_ADDRESSES.ETH, tokenB: TOKEN_ADDRESSES.DAI },
      { name: 'WBTC-ETH', tokenA: TOKEN_ADDRESSES.WBTC, tokenB: TOKEN_ADDRESSES.ETH }
    ];
    
    // Venues to return
    const venues = [];
    
    // For each fee tier, create a venue
    for (const fee of feeTiers) {
      console.log(`Checking Uniswap V3 fee tier: ${fee}`);
      
      // Get relevant pools for this fee tier
      const pools = [];
      let totalLiquidity = ethers.BigNumber.from(0);
      
      for (const pair of tokenPairs) {
        try {
          // Get pool address
          console.log(`Checking Uniswap pool: ${pair.name} with fee ${fee}`);
          const poolAddress = await factoryContract.getPool(
            pair.tokenA,
            pair.tokenB,
            fee
          );
          
          // Skip if pool doesn't exist
          if (poolAddress === ethers.constants.AddressZero) {
            console.log(`No Uniswap V3 pool exists for ${pair.name} with fee ${fee}`);
            continue;
          }
          
          console.log(`Found Uniswap V3 pool at ${poolAddress}`);
          
          // Connect to pool
          const poolContract = new ethers.Contract(
            poolAddress,
            UNISWAP_V3_POOL_ABI,
            provider
          );
          
          // Get liquidity and other pool data
          const liquidity = await poolContract.liquidity();
          const slot0 = await poolContract.slot0();
          
          // Add to pools
          pools.push({
            pair: pair.name,
            address: poolAddress,
            liquidity: liquidity.toString(),
            sqrtPrice: slot0.sqrtPriceX96.toString(),
            tick: slot0.tick,
          });
          
          // Add to total liquidity
          totalLiquidity = totalLiquidity.add(liquidity);
          
          console.log(`Added Uniswap V3 pool ${pair.name} with liquidity ${liquidity.toString()}`);
        } catch (error) {
          console.error(`Error getting Uniswap V3 pool for ${pair.name} with fee ${fee}:`, error.message);
        }
      }
      
      // Only add venue if it has at least one pool
      if (pools.length > 0) {
        const feePct = fee / 10000; // Convert to percentage
        const feeRate = feePct / 100; // Convert to decimal
        
        // Calculate normalized liquidity value for max transaction size
        // This is a simplified estimate based on liquidity
        const formattedLiquidity = parseFloat(ethers.utils.formatEther(totalLiquidity));
        const maxSize = Math.floor(formattedLiquidity > 0 ? Math.min(formattedLiquidity * 5, 1000000) : 500000);
        const totalValueLocked = Math.floor(formattedLiquidity > 0 ? formattedLiquidity * 100 : 1000000);
        
        venues.push({
          id: `uniswap-v3-${fee}`,
          name: `Uniswap V3 (${feePct}%)`,
          max: maxSize,
          fee: feeRate,
          slippage: 0.001 + (feeRate / 2), // Base slippage + fee-based component
          chain: 'ethereum',
          protocol: 'UniswapV3',
          tvl: totalValueLocked,
          supportedTokens: ['ETH', 'WETH', 'USDC', 'USDT', 'DAI', 'WBTC']
        });
        
        console.log(`Added Uniswap V3 (${feePct}%) venue with ${pools.length} pools`);
      }
    }
    
    return venues;
  } catch (error) {
    console.error('Error fetching Uniswap V3 venues:', error);
    return [];
  }
}

/**
 * Get all venues (currently just Uniswap V3)
 */
async function getVenues() {
  try {
    // Check cache freshness (5 minute TTL)
    const now = Date.now();
    const cacheTTL = 5 * 60 * 1000; // 5 minutes
    
    if (venueCache.data.length > 0 && now - venueCache.timestamp < cacheTTL) {
      console.log('Using cached venue data');
      return venueCache.data;
    }
    
    console.log('Fetching venues from blockchain...');
    
    // Connect to Ethereum (prefer Sepolia if available)
    let provider;
    try {
      // Try Sepolia first, then fall back to mainnet
      const rpc_url = process.env.ETH_SEPOLIA_RPC_URL || process.env.ETH_RPC_URL;
      provider = new ethers.providers.JsonRpcProvider(rpc_url);
      await provider.getNetwork(); // Test connection
    } catch (connError) {
      console.error('Error connecting to Ethereum:', connError.message);
      return FALLBACK_VENUES;
    }
    
    // Get Uniswap V3 venues
    const venues = await getUniswapV3Venues(provider);
    
    // If venues found, update cache
    if (venues.length > 0) {
      venueCache.data = venues;
      venueCache.timestamp = now;
      return venues;
    }
    
    return FALLBACK_VENUES;
  } catch (error) {
    console.error('Error getting venues:', error);
    return FALLBACK_VENUES;
  }
}

// Start the server
app.listen(port, () => {
  console.log(`🚀 Blockchain Venues Server running on port ${port}`);
  console.log(`Use http://localhost:${port}/venues to get venue data`);
});