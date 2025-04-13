/**
 * Venues Routes
 * 
 * Provides endpoints for retrieving venue data for DeFi protocols.
 */

const express = require('express');
const router = express.Router();
const { getVenues, getVenueById } = require('../services/venueService');

/**
 * GET /venues
 * Returns a list of all available trading venues with their parameters.
 */
router.get('/', async (req, res) => {
  try {
    const venues = await getVenues();
    res.json(venues);
  } catch (error) {
    console.error('Error fetching venues:', error);
    res.status(500).json({ error: 'Failed to fetch venues' });
  }
});

/**
 * GET /venues/:id
 * Returns details for a specific venue by ID.
 */
router.get('/:id', async (req, res) => {
  try {
    const venue = await getVenueById(req.params.id);
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }
    res.json(venue);
  } catch (error) {
    console.error(`Error fetching venue ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch venue' });
  }
});

module.exports = router;