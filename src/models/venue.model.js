const { pool } = require('../db/pool');

async function findAll() {
  const [rows] = await pool.query(
    'SELECT * FROM venues ORDER BY venues_id ASC'
  );
  return rows;
}

async function findById(venueId) {
  const [rows] = await pool.query(
    'SELECT * FROM venues WHERE venues_id = ?',
    [venueId]
  );
  return rows[0] || null;
}

async function create({ name, address }) {
  const [result] = await pool.query(
    'INSERT INTO venues (venues_name, venues_address) VALUES (?, ?)',
    [name, address]
  );
  return result.insertId;
}

async function update(venueId, { name, address }) {
  const [result] = await pool.query(
    `UPDATE venues
     SET venues_name = ?, venues_address = ?
     WHERE venues_id = ?`,
    [name, address, venueId]
  );
  return result.affectedRows;
}

async function remove(venueId) {
  const [result] = await pool.query(
    'DELETE FROM venues WHERE venues_id = ?',
    [venueId]
  );
  return result.affectedRows;
}

async function hasShowings(venueId) {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS cnt FROM showing WHERE venues_id = ?',
    [venueId]
  );
  return rows[0].cnt > 0;
}

async function listSeats(venueId) {
  const [rows] = await pool.query(
    `SELECT s.seat_id, s.seat_number
     FROM contain_seats cs
     JOIN seats s ON s.seat_id = cs.seat_id
     WHERE cs.venues_id = ?
     ORDER BY s.seat_number ASC`,
    [venueId]
  );
  return rows;
}

async function findSeatByNumber(seatNumber) {
  const [rows] = await pool.query(
    'SELECT seat_id, seat_number FROM seats WHERE seat_number = ?',
    [seatNumber]
  );
  return rows[0] || null;
}

async function createSeat(seatNumber) {
  const [result] = await pool.query(
    'INSERT INTO seats (seat_number) VALUES (?)',
    [seatNumber]
  );
  return result.insertId;
}

async function assignSeatToVenue(venueId, seatId) {
  await pool.query(
    `INSERT INTO contain_seats (venues_id, seat_id)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE venues_id = VALUES(venues_id)`,
    [venueId, seatId]
  );
}

async function seatUsedInVenueShowings(venueId, seatId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS cnt
     FROM reserved_seats rs
     JOIN showing sg ON sg.showing_id = rs.showing_id
     WHERE sg.venues_id = ? AND rs.seat_id = ?`,
    [venueId, seatId]
  );
  return rows[0].cnt > 0;
}

async function unassignSeatFromVenue(venueId, seatId) {
  const [result] = await pool.query(
    'DELETE FROM contain_seats WHERE venues_id = ? AND seat_id = ?',
    [venueId, seatId]
  );
  return result.affectedRows;
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
  hasShowings,
  listSeats,
  findSeatByNumber,
  createSeat,
  assignSeatToVenue,
  seatUsedInVenueShowings,
  unassignSeatFromVenue,
};
