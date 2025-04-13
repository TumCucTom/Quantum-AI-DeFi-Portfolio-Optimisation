/**
 * Wormhole SDK Service
 * 
 * This service provides HTTP endpoints to interact with the Wormhole SDK,
 * exposing venue data for quantum order routing optimization.
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

// Import routes
const venueRoutes = require('./routes/venues');
const swapRoutes = require('./routes/swaps');

// Register routes
app.use('/venues', venueRoutes);
app.use('/estimate-swap', swapRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'wormhole-sdk-service' });
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 Wormhole SDK Service running on port ${port}`);
});