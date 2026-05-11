const bookingService = require('../services/booking.service');

async function listBookings(req, res, next) {
  try {
    const bookings = await bookingService.listBookings(req.query);
    res.json(bookings);
  } catch (err) {
    next(err);
  }
}

async function cancelBooking(req, res, next) {
  try {
    await bookingService.cancelBooking(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { listBookings, cancelBooking };
