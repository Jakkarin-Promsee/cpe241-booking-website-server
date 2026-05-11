const venueModel = require('../models/venue.model');

async function listVenues() {
  return venueModel.findAll();
}

function assertVenuePayload(data) {
  const name = String(data.name || '').trim();
  const address = String(data.address || '').trim();
  if (!name) {
    const err = new Error('name is required');
    err.statusCode = 400;
    throw err;
  }
  if (!address) {
    const err = new Error('address is required');
    err.statusCode = 400;
    throw err;
  }
  return { name, address };
}

function parseVenueId(venueId) {
  const id = Number(venueId);
  if (!Number.isInteger(id) || id <= 0) {
    const err = new Error('venueId must be a positive integer');
    err.statusCode = 400;
    throw err;
  }
  return id;
}

function parseSeatId(seatId) {
  const id = Number(seatId);
  if (!Number.isInteger(id) || id <= 0) {
    const err = new Error('seatId must be a positive integer');
    err.statusCode = 400;
    throw err;
  }
  return id;
}

async function createVenue(data) {
  const payload = assertVenuePayload(data);
  const venueId = await venueModel.create(payload);
  return venueModel.findById(venueId);
}

async function updateVenue(venueId, data) {
  const id = parseVenueId(venueId);
  const payload = assertVenuePayload(data);
  const existing = await venueModel.findById(id);
  if (!existing) {
    const err = new Error('Venue not found');
    err.statusCode = 404;
    throw err;
  }
  await venueModel.update(id, payload);
  return venueModel.findById(id);
}

async function deleteVenue(venueId) {
  const id = parseVenueId(venueId);
  const existing = await venueModel.findById(id);
  if (!existing) {
    const err = new Error('Venue not found');
    err.statusCode = 404;
    throw err;
  }
  if (await venueModel.hasShowings(id)) {
    const err = new Error('Cannot delete venue that has showings');
    err.statusCode = 409;
    throw err;
  }
  const seats = await venueModel.listSeats(id);
  for (const seat of seats) {
    await venueModel.unassignSeatFromVenue(id, seat.seat_id);
  }
  await venueModel.remove(id);
}

async function listVenueSeats(venueId) {
  const id = parseVenueId(venueId);
  const venue = await venueModel.findById(id);
  if (!venue) {
    const err = new Error('Venue not found');
    err.statusCode = 404;
    throw err;
  }
  return venueModel.listSeats(id);
}

async function assignVenueSeats(venueId, { seatNumbers } = {}) {
  const id = parseVenueId(venueId);
  const venue = await venueModel.findById(id);
  if (!venue) {
    const err = new Error('Venue not found');
    err.statusCode = 404;
    throw err;
  }

  const raw = Array.isArray(seatNumbers) ? seatNumbers : [];
  const normalized = [...new Set(
    raw
      .map((x) => String(x || '').trim().toUpperCase())
      .filter(Boolean)
  )];
  if (normalized.length === 0) {
    const err = new Error('seatNumbers must be a non-empty array');
    err.statusCode = 400;
    throw err;
  }

  for (const seatNumber of normalized) {
    const existingSeat = await venueModel.findSeatByNumber(seatNumber);
    const seatId = existingSeat?.seat_id ?? await venueModel.createSeat(seatNumber);
    await venueModel.assignSeatToVenue(id, seatId);
  }

  return venueModel.listSeats(id);
}

async function unassignVenueSeat(venueId, seatId) {
  const vId = parseVenueId(venueId);
  const sId = parseSeatId(seatId);
  const venue = await venueModel.findById(vId);
  if (!venue) {
    const err = new Error('Venue not found');
    err.statusCode = 404;
    throw err;
  }

  if (await venueModel.seatUsedInVenueShowings(vId, sId)) {
    const err = new Error('Cannot remove seat already used in venue showings');
    err.statusCode = 409;
    throw err;
  }

  const affected = await venueModel.unassignSeatFromVenue(vId, sId);
  if (affected === 0) {
    const err = new Error('Seat not assigned to this venue');
    err.statusCode = 404;
    throw err;
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
