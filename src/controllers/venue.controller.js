const venueService = require('../services/venue.service');

async function listVenues(req, res, next) {
  try {
    const venues = await venueService.listVenues();
    res.json(venues);
  } catch (err) {
    next(err);
  }
}

module.exports = { listVenues };
