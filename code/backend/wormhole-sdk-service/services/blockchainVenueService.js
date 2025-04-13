/**
 * Blockchain Venue Service
 * 
 * Fetches real-time venue data directly from Ethereum blockchain
 * with reliable fallback values if blockchain fetching fails.
 */

const { ethers } = require('ethers');

// Token addresses for common tokens
const TOKEN_ADDRESSES = {
  ETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'
};

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

// SushiSwap Factory address and ABI
const SUSHISWAP_FACTORY = '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac';
const SUSHISWAP_FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) external view returns (address pair)'
];

// SushiSwap Pair ABI
const SUSHISWAP_PAIR_ABI = [
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)'
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

// Cache venue data for 5 minutes to reduce blockchain calls
let venueCache = {
  data: [],
  timestamp: 0
};

/**
 * Get all venues with live data from the blockchain
 */
async function getVenues() {
  try {
    console.log('Fetching venue data from blockchain...');
    
    // Check cache freshness (5 minute TTL)
    const now = Date.now();
    const cacheTTL = 5 * 60 * 1000; // 5 minutes
    
    if (venueCache.data.length > 0 && now - venueCache.timestamp < cacheTTL) {
      console.log('Returning cached venue data');
      return venueCache.data;
    }
    
    // Connect to Ethereum
    const provider = new ethers.providers.JsonRpcProvider(process.env.ETH_RPC_URL);
    
    // Test provider connection
    try {
      const network = await provider.getNetwork();
      console.log(`Connected to network: ${network.name} (chainId: ${network.chainId})`);
      const blockNumber = await provider.getBlockNumber();
      console.log(`Current block number: ${blockNumber}`);
    } catch (connError) {
      console.error('Error connecting to Ethereum:', connError.message);
      console.log('Using fallback venue data');
      return FALLBACK_VENUES;
    }
    
    // Get venues from multiple DEXes in parallel
    const [uniswapVenues, sushiswapVenues] = await Promise.all([
      getUniswapV3Venues(provider).catch(error => {
        console.error('Uniswap venue fetch failed:', error.message);
        return FALLBACK_VENUES.filter(v => v.protocol === 'UniswapV3');
      }),
      getSushiSwapVenues(provider).catch(error => {
        console.error('SushiSwap venue fetch failed:', error.message);
        return FALLBACK_VENUES.filter(v => v.protocol === 'SushiSwap');
      })
    ]);
    
    // Combine all venues
    const allVenues = [...uniswapVenues, ...sushiswapVenues];
    
    // If something went wrong and we don't have venues, use fallbacks
    if (allVenues.length === 0) {
      console.log('No venues found, using fallback venue data');
      return FALLBACK_VENUES;
    }
    
    // Update cache
    venueCache.data = allVenues;
    venueCache.timestamp = now;
    
    console.log(`Retrieved ${allVenues.length} venues from blockchain`);
    return allVenues;
  } catch (error) {
    console.error('Error in getVenues:', error);
    console.log('Using fallback venue data due to error');
    return FALLBACK_VENUES;
  }
}

/**
 * Get venue by ID
 */
async function getVenueById(venueId) {
  try {
    // First check if we have it in cache
    if (venueCache.data.length > 0) {
      const cachedVenue = venueCache.data.find(v => v.id === venueId);
      if (cachedVenue) {
        return cachedVenue;
      }
    }
    
    // If not in cache, get all venues
    const venues = await getVenues();
    return venues.find(v => v.id === venueId);
  } catch (error) {
    console.error(`Error getting venue ${venueId}:`, error);
    
    // Return fallback venue if available
    const fallbackVenue = FALLBACK_VENUES.find(v => v.id === venueId);
    if (fallbackVenue) {
      return fallbackVenue;
    }
    
    throw error;
  }
}

/**
 * Get Uniswap V3 venues with live blockchain data
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
            tick: slot0.tick
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
    throw new Error(`Failed to fetch Uniswap V3 venues: ${error.message}`);
  }
}

/**
 * Get SushiSwap venues with live blockchain data
 */
async function getSushiSwapVenues(provider) {
  try {
    console.log('Fetching SushiSwap venues...');
    
    // Connect to SushiSwap Factory
    const factoryContract = new ethers.Contract(
      SUSHISWAP_FACTORY,
      SUSHISWAP_FACTORY_ABI,
      provider
    );
    
    // Define token pairs to check
    const tokenPairs = [
      { name: 'ETH-USDC', tokenA: TOKEN_ADDRESSES.ETH, tokenB: TOKEN_ADDRESSES.USDC },
      { name: 'ETH-USDT', tokenA: TOKEN_ADDRESSES.ETH, tokenB: TOKEN_ADDRESSES.USDT },
      { name: 'ETH-DAI', tokenA: TOKEN_ADDRESSES.ETH, tokenB: TOKEN_ADDRESSES.DAI },
      { name: 'WBTC-ETH', tokenA: TOKEN_ADDRESSES.WBTC, tokenB: TOKEN_ADDRESSES.ETH }
    ];
    
    // Get all pairs from SushiSwap
    const pools = [];
    let totalLiquidity = ethers.BigNumber.from(0);
    
    for (const pair of tokenPairs) {
      try {
        // Get pair address
        console.log(`Checking SushiSwap pair: ${pair.name}`);
        const pairAddress = await factoryContract.getPair(
          pair.tokenA,
          pair.tokenB
        );
        
        // Skip if pair doesn't exist
        if (pairAddress === ethers.constants.AddressZero) {
          console.log(`No SushiSwap pair exists for ${pair.name}`);
          continue;
        }
        
        console.log(`Found SushiSwap pair at ${pairAddress}`);
        
        // Connect to pair
        const pairContract = new ethers.Contract(
          pairAddress,
          SUSHISWAP_PAIR_ABI,
          provider
        );
        
        // Get reserves
        const reserves = await pairContract.getReserves();
        
        // Get token order
        const token0 = await pairContract.token0();
        const token1 = await pairContract.token1();
        
        // Determine which reserve belongs to which token
        let ethReserve, otherReserve;
        if (token0.toLowerCase() === TOKEN_ADDRESSES.ETH.toLowerCase()) {
          ethReserve = reserves.reserve0;
          otherReserve = reserves.reserve1;
        } else {
          ethReserve = reserves.reserve1;
          otherReserve = reserves.reserve0;
        }
        
        // Calculate liquidity value (simplified)
        // For a real implementation, we would need to convert to a common denominator
        const liquidity = ethReserve.mul(2); // Simple approximation
        
        // Add to pools
        pools.push({
          pair: pair.name,
          address: pairAddress,
          reserves: [reserves.reserve0.toString(), reserves.reserve1.toString()],
          token0,
          token1
        });
        
        // Add to total liquidity
        totalLiquidity = totalLiquidity.add(liquidity);
        
        console.log(`Added SushiSwap pool ${pair.name} with reserves ${reserves.reserve0.toString()}, ${reserves.reserve1.toString()}`);
      } catch (error) {
        console.error(`Error getting SushiSwap pair for ${pair.name}:`, error.message);
      }
    }
    
    // Only add SushiSwap venue if we found at least one pool
    if (pools.length > 0) {
      // Calculate normalized liquidity value for max transaction size
      const formattedLiquidity = parseFloat(ethers.utils.formatEther(totalLiquidity));
      const maxSize = Math.floor(formattedLiquidity > 0 ? Math.min(formattedLiquidity * 5, 1000000) : 500000);
      const totalValueLocked = Math.floor(formattedLiquidity > 0 ? formattedLiquidity * 100 : 500000);
      
      return [{
        id: 'sushiswap',
        name: 'SushiSwap',
        max: maxSize,
        fee: 0.0025, // 0.25% swap fee on SushiSwap
        slippage: 0.002, // Estimate based on typical SushiSwap slippage
        chain: 'ethereum',
        protocol: 'SushiSwap',
        tvl: totalValueLocked,
        supportedTokens: ['ETH', 'WETH', 'USDC', 'USDT', 'DAI', 'WBTC']
      }];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching SushiSwap venues:', error);
    return FALLBACK_VENUES.filter(v => v.protocol === 'SushiSwap');
  }
}

module.exports = {
  getVenues,
  getVenueById,
  FALLBACK_VENUES  // Export fallbacks in case they're needed elsewhere
};