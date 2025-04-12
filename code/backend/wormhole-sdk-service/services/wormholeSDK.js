/**
 * Wormhole SDK Service
 * 
 * Initializes and provides access to the Wormhole SDK.
 */

const { Wormhole } = require('@wormhole-foundation/sdk');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Keep a cached instance of the SDK
let sdkInstance = null;

/**
 * Initialize the Wormhole SDK with proper configuration
 */
async function initializeSDK() {
  try {
    // Configuration for different networks
    const networkConfig = {
      ethereum: {
        rpc: process.env.ETH_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo',
        privateKey: process.env.ETH_PRIVATE_KEY, // Optional for read-only operations
      },
      solana: {
        rpc: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      },
      bsc: {
        rpc: process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org',
      },
      avalanche: {
        rpc: process.env.AVAX_RPC_URL || 'https://api.avax.network/ext/bc/C/rpc',
      },
      polygon: {
        rpc: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
      },
    };

    // SDK initialization options
    const options = {
      networks: networkConfig,
      timeout: 30000, // 30 seconds timeout for RPC calls
      logLevel: process.env.NODE_ENV === 'production' ? 'error' : 'info',
    };

    // Create the Wormhole SDK instance
    const sdk = await Wormhole.create(options);
    
    console.log('Wormhole SDK initialized successfully');
    return sdk;
  } catch (error) {
    console.error('Failed to initialize Wormhole SDK:', error);
    return null;
  }
}

/**
 * Get a Wormhole SDK instance (cached for performance)
 */
async function getWormholeSDK() {
  // Use cached instance if available
  if (sdkInstance) {
    return sdkInstance;
  }

  // Initialize SDK and cache the instance
  sdkInstance = await initializeSDK();
  return sdkInstance;
}

/**
 * Reset the SDK instance (useful for testing or if you need to reinitialize)
 */
function resetSDK() {
  sdkInstance = null;
}

module.exports = {
  getWormholeSDK,
  resetSDK
};