const showingModel = require('../models/showing.model');

const SEAT_PRICE_MAP = {
  'Weekend price': 350.00,
  'Weekday price': 280.00,
  'Holiday price': 400.00,
  'Student price': 200.00,
};

const SHOWING_STATUSES = ['Ontime', 'Overdue', 'Full'];
const DEFAULT_AD_MINUTES = 15;
const DEFAULT_BUFFER_MINUTES = 10;

function resolveSeatPrice(seatPrice) {
  if (typeof seatPrice === 'number' && seatPrice > 0) return seatPrice;
  return SEAT_PRICE_MAP[seatPrice] ?? 280.00;
}

function normalizeSeatPricing(seatPricing, allowedSeatIds) {
  const allowed = new Set((allowedSeatIds || []).map((x) => Number(x)));
  const raw = Array.isArray(seatPricing) ? seatPricing : [];
  const map = new Map();
  for (const item of raw) {
    const seatId = Number(item?.seatId);
    const seatPrice = Number(item?.seatPrice);
    if (!Number.isInteger(seatId) || seatId <= 0 || !allowed.has(seatId)) continue;
    if (!Number.isFinite(seatPrice) || seatPrice <= 0) continue;
    map.set(seatId, Number(seatPrice.toFixed(2)));
  }
  return Array.from(map.entries()).map(([seatId, seatPrice]) => ({ seatId, seatPrice }));
}

function startHourToTime(h) {
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
}

function resolveTime(hourFloat, timeStr) {
  if (typeof hourFloat === 'number') return startHourToTime(hourFloat);
  return timeStr || null;
}

function timeToMinutes(timeStr) {
  const parts = String(timeStr || '').split(':');
  const h = Number(parts[0]) || 0;
  const m = Number(parts[1]) || 0;
  return h * 60 + m;
}

function minutesToTimeStr(totalMinutes) {
  const minsInDay = 24 * 60;
  const normalized = ((totalMinutes % minsInDay) + minsInDay) % minsInDay;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

function normalizeExtraMinutes(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

async function computeEndTime({ showId, startTime, adMinutes, bufferMinutes }) {
  const movieDuration = await showingModel.findMovieDurationById(showId);
  if (!movieDuration || movieDuration <= 0) {
    const err = new Error('Cannot resolve movie duration for this showId');
    err.statusCode = 400;
    throw err;
  }
  const ad = normalizeExtraMinutes(adMinutes, DEFAULT_AD_MINUTES);
  const buffer = normalizeExtraMinutes(bufferMinutes, DEFAULT_BUFFER_MINUTES);
  const total = movieDuration + ad + buffer;
  return minutesToTimeStr(timeToMinutes(startTime) + total);
}

function assertCreateFields(data) {
  if (!data.showId || !Number.isInteger(Number(data.showId)) || Number(data.showId) <= 0) {
    const err = new Error('showId must be a positive integer');
    err.statusCode = 400;
    throw err;
  }
  if (!data.venueId || !Number.isInteger(Number(data.venueId)) || Number(data.venueId) <= 0) {
    const err = new Error('venueId must be a positive integer');
    err.statusCode = 400;
    throw err;
  }
  if (!data.showtimeDate || !/^\d{4}-\d{2}-\d{2}$/.test(data.showtimeDate)) {
    const err = new Error('showtimeDate must be a date in YYYY-MM-DD format');
    err.statusCode = 400;
    throw err;
  }
  const status = data.status !== undefined ? data.status : 'Ontime';
  if (!SHOWING_STATUSES.includes(status)) {
    const err = new Error(`status must be one of: ${SHOWING_STATUSES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }
}

async function listShowings({ venueId, date, showId } = {}) {
  return showingModel.findAll({ venueId, date, showId });
}

async function createShowing(data) {
  assertCreateFields(data);

  const startTime = resolveTime(data.startHour, data.startTime);
  const seatPrice = resolveSeatPrice(data.seatPrice);

  if (!startTime) {
    const err = new Error('startTime is required');
    err.statusCode = 400;
    throw err;
  }

  const adMinutes = normalizeExtraMinutes(data.adMinutes, DEFAULT_AD_MINUTES);
  const cleanupMinutes = normalizeExtraMinutes(data.bufferMinutes, DEFAULT_BUFFER_MINUTES);
  const endTime = await computeEndTime({
    showId: data.showId,
    startTime,
    adMinutes,
    bufferMinutes: cleanupMinutes,
  });

  const venueSeatIds = await showingModel.listSeatIdsByVenue(data.venueId);
  const seatPricing = normalizeSeatPricing(data.seatPricing, venueSeatIds);
  const showingId = await showingModel.createWithSeatPricing({
    showId: data.showId,
    venueId: data.venueId,
    status: data.status || 'Ontime',
    showtimeDate: data.showtimeDate,
    startTime,
    endTime,
    adMinutes,
    cleanupMinutes,
    bookingDate: data.bookingDate,
    language: data.language,
  }, seatPrice, seatPricing);

  return showingModel.findById(showingId);
}

async function updateShowing(id, data) {
  const existing = await showingModel.findById(id);
  if (!existing) {
    const err = new Error('Showing not found');
    err.statusCode = 404;
    throw err;
  }

  if (data.status !== undefined && !SHOWING_STATUSES.includes(data.status)) {
    const err = new Error(`status must be one of: ${SHOWING_STATUSES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }
  if (data.showtimeDate !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(data.showtimeDate)) {
    const err = new Error('showtimeDate must be a date in YYYY-MM-DD format');
    err.statusCode = 400;
    throw err;
  }

  const startTime = resolveTime(data.startHour, data.startTime) || existing.start_time;
  const showId = data.showId ?? existing.show_id;
  const venueId = data.venueId ?? existing.venues_id;
  const showtimeDate = data.showtimeDate ?? existing.showtime_date;
  const adMinutes = (data.adMinutes !== undefined && data.adMinutes !== null && data.adMinutes !== '')
    ? normalizeExtraMinutes(data.adMinutes, DEFAULT_AD_MINUTES)
    : normalizeExtraMinutes(existing.ad_minutes, DEFAULT_AD_MINUTES);
  const cleanupMinutes = (data.bufferMinutes !== undefined && data.bufferMinutes !== null && data.bufferMinutes !== '')
    ? normalizeExtraMinutes(data.bufferMinutes, DEFAULT_BUFFER_MINUTES)
    : normalizeExtraMinutes(existing.cleanup_minutes, DEFAULT_BUFFER_MINUTES);
  const endTime = await computeEndTime({
    showId,
    startTime,
    adMinutes,
    bufferMinutes: cleanupMinutes,
  });

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
    showId,
    venueId,
    status: data.status ?? existing.status,
    showtimeDate,
    startTime,
    endTime,
    adMinutes,
    cleanupMinutes,
    bookingDate: data.bookingDate ?? existing.booking_date,
    language: data.language ?? existing.language,
  });

  if (Array.isArray(data.seatPricing) && data.seatPricing.length > 0) {
    const venueSeatIds = await showingModel.listSeatIdsByVenue(venueId);
    const seatPricing = normalizeSeatPricing(data.seatPricing, venueSeatIds);
    if (seatPricing.length > 0) {
      await showingModel.updateReservedSeatPricing(id, seatPricing);
    }
  }
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
  await showingModel.removeWithSeats(id);
}

module.exports = { listShowings, createShowing, updateShowing, deleteShowing };
