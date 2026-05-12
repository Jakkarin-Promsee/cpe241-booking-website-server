const customerService = require('../services/customer.service');

function parsePositiveInt(value, label) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    const e = new Error(`${label} must be a positive integer`);
    e.statusCode = 400;
    throw e;
  }
  return n;
}

async function listSeats(req, res, next) {
  try {
    const showingId = parsePositiveInt(req.params.showingId, 'showingId');
    const rows = await customerService.getShowingSeats(showingId);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function createBooking(req, res, next) {
  try {
    const userId = Number(req.user.userId);
    const showingId = parsePositiveInt(req.body.showingId, 'showingId');
    const seatIds = req.body.seatIds;
    const detail = await customerService.createCustomerBooking(userId, {
      showingId,
      seatIds,
    });
    res.status(201).json(detail);
  } catch (err) {
    next(err);
  }
}

async function latest(req, res, next) {
  try {
    const userId = Number(req.user.userId);
    const detail = await customerService.getLatestBookingDetail(userId);
    res.json(detail);
  } catch (err) {
    next(err);
  }
}

async function detail(req, res, next) {
  try {
    const userId = Number(req.user.userId);
    const bookingId = parsePositiveInt(req.params.id, 'booking id');
    const row = await customerService.getBookingDetail(userId, bookingId);
    if (!row) {
      const e = new Error('Booking not found');
      e.statusCode = 404;
      throw e;
    }
    res.json(row);
  } catch (err) {
    next(err);
  }
}

async function checkout(req, res, next) {
  try {
    const userId = Number(req.user.userId);
    const bookingId = parsePositiveInt(req.params.id, 'booking id');
    const detail = await customerService.checkoutBooking(userId, bookingId);
    res.json(detail);
  } catch (err) {
    next(err);
  }
}

async function complete(req, res, next) {
  try {
    const userId = Number(req.user.userId);
    const bookingId = parsePositiveInt(req.params.id, 'booking id');
    const detail = await customerService.completeBooking(userId, bookingId);
    res.json(detail);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listSeats,
  createBooking,
  latest,
  detail,
  checkout,
  complete,
};
