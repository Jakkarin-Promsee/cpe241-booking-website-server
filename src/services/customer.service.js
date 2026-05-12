const { pool } = require('../db/pool');
const showingModel = require('../models/showing.model');
const bookingModel = require('../models/booking.model');

function normalizeSeatIds(raw) {
  if (!Array.isArray(raw)) return [];
  const set = new Set();
  for (const x of raw) {
    const n = Number(x);
    if (Number.isInteger(n) && n > 0) set.add(n);
  }
  return [...set];
}

async function getShowingSeats(showingId) {
  const sg = await showingModel.findById(showingId);
  if (!sg) {
    const e = new Error('Showing not found');
    e.statusCode = 404;
    throw e;
  }
  return showingModel.listSeatsForShowing(showingId);
}

async function createCustomerBooking(userId, { showingId, seatIds }) {
  const ids = normalizeSeatIds(seatIds);
  if (ids.length === 0) {
    const e = new Error('seatIds must include at least one seat');
    e.statusCode = 400;
    throw e;
  }
  const sg = await showingModel.findById(showingId);
  if (!sg) {
    const e = new Error('Showing not found');
    e.statusCode = 404;
    throw e;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [cntRows] = await conn.query(
      `SELECT COUNT(*) AS cnt FROM reserved_seats
       WHERE showing_id = ? AND seat_id IN (?) AND status = 'Free'`,
      [showingId, ids]
    );
    if (Number(cntRows[0].cnt) !== ids.length) {
      const e = new Error('One or more seats are not available');
      e.statusCode = 409;
      throw e;
    }
    const [ins] = await conn.query(
      `INSERT INTO booking (user_id, showing_id, date, time, status)
       VALUES (?, ?, CURDATE(), CURTIME(), 'Booking')`,
      [userId, showingId]
    );
    const bookingId = ins.insertId;
    const values = ids.map((sid) => [bookingId, sid]);
    await conn.query(
      'INSERT INTO booking_items (booking_id, seat_id) VALUES ?',
      [values]
    );
    await conn.commit();
    return bookingModel.findCustomerDetail(bookingId, userId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function checkoutBooking(userId, bookingId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      'SELECT * FROM booking WHERE booking_id = ? AND user_id = ? FOR UPDATE',
      [bookingId, userId]
    );
    const b = rows[0];
    if (!b) {
      const e = new Error('Booking not found');
      e.statusCode = 404;
      throw e;
    }
    if (b.status !== 'Booking') {
      const e = new Error('Booking is not awaiting checkout');
      e.statusCode = 400;
      throw e;
    }
    const [items] = await conn.query(
      'SELECT seat_id FROM booking_items WHERE booking_id = ?',
      [bookingId]
    );
    const seatIds = items.map((i) => i.seat_id);
    if (seatIds.length === 0) {
      const e = new Error('Booking has no seats');
      e.statusCode = 400;
      throw e;
    }
    const [locked] = await conn.query(
      `SELECT seat_id FROM reserved_seats
       WHERE showing_id = ? AND seat_id IN (?) AND status = 'Free'
       FOR UPDATE`,
      [b.showing_id, seatIds]
    );
    if (locked.length !== seatIds.length) {
      const e = new Error('One or more seats are no longer available');
      e.statusCode = 409;
      throw e;
    }
    await conn.query(
      `UPDATE reserved_seats SET status = 'Reserved'
       WHERE showing_id = ? AND seat_id IN (?)`,
      [b.showing_id, seatIds]
    );
    const holdProof = `booking:${bookingId}:reserved:${Date.now()}`;
    await conn.query(
      `UPDATE booking SET status = 'Checkout', payment_proof_url = ?
       WHERE booking_id = ?`,
      [holdProof, bookingId]
    );
    await conn.commit();
    return bookingModel.findCustomerDetail(bookingId, userId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function completeBooking(userId, bookingId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      'SELECT * FROM booking WHERE booking_id = ? AND user_id = ? FOR UPDATE',
      [bookingId, userId]
    );
    const b = rows[0];
    if (!b) {
      const e = new Error('Booking not found');
      e.statusCode = 404;
      throw e;
    }
    if (b.status !== 'Checkout') {
      const e = new Error('Booking is not awaiting completion');
      e.statusCode = 400;
      throw e;
    }
    const [items] = await conn.query(
      'SELECT seat_id FROM booking_items WHERE booking_id = ?',
      [bookingId]
    );
    const seatIds = items.map((i) => i.seat_id);
    if (seatIds.length === 0) {
      const e = new Error('Booking has no seats');
      e.statusCode = 400;
      throw e;
    }
    const proofPayload = `booking:${bookingId}:paid:${Date.now()}`;
    await conn.query(
      `UPDATE booking SET status = 'Successful', payment_proof_url = ?
       WHERE booking_id = ?`,
      [proofPayload, bookingId]
    );
    await conn.query(
      `UPDATE reserved_seats SET status = 'Confirmed'
       WHERE showing_id = ? AND seat_id IN (?)`,
      [b.showing_id, seatIds]
    );
    await conn.commit();
    return bookingModel.findCustomerDetail(bookingId, userId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function getLatestBookingDetail(userId) {
  const id = await bookingModel.findLatestIdByUserId(userId);
  if (!id) return null;
  return bookingModel.findCustomerDetail(id, userId);
}

async function getBookingDetail(userId, bookingId) {
  return bookingModel.findCustomerDetail(bookingId, userId);
}

module.exports = {
  getShowingSeats,
  createCustomerBooking,
  checkoutBooking,
  completeBooking,
  getLatestBookingDetail,
  getBookingDetail,
};
