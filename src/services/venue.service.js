const venueModel = require('../models/venue.model');

async function listVenues() {
  return venueModel.findAll();
}

module.exports = { listVenues };
