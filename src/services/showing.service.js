const showingModel = require('../models/showing.model');

const SEAT_PRICE_MAP = {
  'Weekend price':  350.00,
  'Weekday price':  280.00,
  'Holiday price':  400.00,
  'Student price':  200.00,
};

function resolveSeatPrice(seatPrice) {
  if (typeof seatPrice === 'number' && seatPrice > 0) return seatPrice;
  return SEAT_PRICE_MAP[seatPrice] ?? 280.00;
}

function startHourToTime(h) {
  const hours = Math.floor(h);
  const mins  = Math.round((h - hours) * 60);
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
}

function resolveTime(hourFloat, timeStr) {
  if (typeof hourFloat === 'number') return startHourToTime(hourFloat);
  return timeStr || null;
}

async function listShowings({ venueId, date } = {}) {
  return showingModel.findAll({ venueId, date });
}

async function createShowing(data) {
  const startTime = resolveTime(data.startHour, data.startTime);
  const endTime   = resolveTime(data.endHour,   data.endTime);
  const seatPrice = resolveSeatPrice(data.seatPrice);

  if (!startTime || !endTime) {
    const err = new Error('startTime and endTime are required');
    err.statusCode = 400;
    throw err;
  }

  const overlap = await showingModel.checkOverlap({
    venueId:      data.venueId,
    showtimeDate: data.showtimeDate,
    startTime,
    endTime,
  });
  if (overlap) {
    const err = new Error('Time slot overlaps with an existing showing in this venue');
    err.statusCode = 409;
    throw err;
  }

  const showingId = await showingModel.create({
    showId:       data.showId,
    venueId:      data.venueId,
    status:       data.status || 'Ontime',
    showtimeDate: data.showtimeDate,
    startTime,
    endTime,
    bookingDate:  data.bookingDate,
    language:     data.language,
  });

  await showingModel.populateReservedSeats(showingId, data.venueId, seatPrice);
  return showingModel.findById(showingId);
}

async function updateShowing(id, data) {
  const existing = await showingModel.findById(id);
  if (!existing) {
    const err = new Error('Showing not found');
    err.statusCode = 404;
    throw err;
  }

  const startTime   = resolveTime(data.startHour, data.startTime) || existing.start_time;
  const endTime     = resolveTime(data.endHour,   data.endTime)   || existing.end_time;
  const venueId     = data.venueId     ?? existing.venues_id;
  const showtimeDate = data.showtimeDate ?? existing.showtime_date;

  const overlap = await showingModel.checkOverlap({
    venueId,
    showtimeDate,
    startTime,
    endTime,
    excludeId: id,
  });
  if (overlap) {
    const err = new Error('Time slot overlaps with an existing showing in this venue');
    err.statusCode = 409;
    throw err;
  }

  await showingModel.update(id, {
    showId:       data.showId       ?? existing.show_id,
    venueId,
    status:       data.status       ?? existing.status,
    showtimeDate,
    startTime,
    endTime,
    bookingDate:  data.bookingDate  ?? existing.booking_date,
    language:     data.language     ?? existing.language,
  });
  return showingModel.findById(id);
}

async function deleteShowing(id) {
  const existing = await showingModel.findById(id);
  if (!existing) {
    const err = new Error('Showing not found');
    err.statusCode = 404;
    throw err;
  }
  if (await showingModel.hasBookings(id)) {
    const err = new Error('Cannot delete a showing that has existing bookings');
    err.statusCode = 409;
    throw err;
  }
  await showingModel.deleteReservedSeats(id);
  await showingModel.remove(id);
}

module.exports = { listShowings, createShowing, updateShowing, deleteShowing };
