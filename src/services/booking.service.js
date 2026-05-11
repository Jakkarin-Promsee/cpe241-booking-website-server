const bookingModel = require('../models/booking.model');

const BOOKING_STATUSES = ['Booking', 'Checkout', 'Successful', 'Cancel'];

async function listBookings(filters) {
  if (filters.status && !BOOKING_STATUSES.includes(filters.status)) {
    const err = new Error(`status must be one of: ${BOOKING_STATUSES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }
  return bookingModel.findAll(filters);
}

async function cancelBooking(id) {
  const booking = await bookingModel.findById(id);
  if (!booking) {
    const err = new Error('Booking not found');
    err.statusCode = 404;
    throw err;
  }
  if (booking.status === 'Cancel') {
    const err = new Error('Booking is already cancelled');
    err.statusCode = 400;
    throw err;
  }
  await bookingModel.cancel(id);
}

module.exports = { listBookings, cancelBooking };
