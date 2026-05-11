const bookingModel = require('../models/booking.model');

async function listBookings(filters) {
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
