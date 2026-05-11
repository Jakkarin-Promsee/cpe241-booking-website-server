const venueService = require('../services/venue.service');

async function listVenues(req, res, next) {
  try {
    const venues = await venueService.listVenues();
    res.json(venues);
  } catch (err) {
    next(err);
  }
}

async function createVenue(req, res, next) {
  try {
    const venue = await venueService.createVenue(req.body);
    res.status(201).json(venue);
  } catch (err) {
    next(err);
  }
}

async function updateVenue(req, res, next) {
  try {
    const venue = await venueService.updateVenue(req.params.id, req.body);
    res.json(venue);
  } catch (err) {
    next(err);
  }
}

async function deleteVenue(req, res, next) {
  try {
    await venueService.deleteVenue(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

async function listVenueSeats(req, res, next) {
  try {
    const seats = await venueService.listVenueSeats(req.params.id);
    res.json(seats);
  } catch (err) {
    next(err);
  }
}

async function assignVenueSeats(req, res, next) {
  try {
    const seats = await venueService.assignVenueSeats(req.params.id, req.body);
    res.json(seats);
  } catch (err) {
    next(err);
  }
}

async function unassignVenueSeat(req, res, next) {
  try {
    await venueService.unassignVenueSeat(req.params.id, req.params.seatId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listVenues,
  createVenue,
  updateVenue,
  deleteVenue,
  listVenueSeats,
  assignVenueSeats,
  unassignVenueSeat,
};
