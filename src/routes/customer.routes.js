const express = require('express');
const { requireAuth, requireCustomer } = require('../middleware/auth.middleware');
const customerController = require('../controllers/customer.controller');

const router = express.Router();

router.get(
  '/showings/:showingId/seats',
  requireAuth,
  requireCustomer,
  customerController.listSeats
);
router.post(
  '/bookings',
  requireAuth,
  requireCustomer,
  customerController.createBooking
);
router.get(
  '/bookings/latest',
  requireAuth,
  requireCustomer,
  customerController.latest
);
router.get(
  '/bookings/:id',
  requireAuth,
  requireCustomer,
  customerController.detail
);
router.post(
  '/bookings/:id/checkout',
  requireAuth,
  requireCustomer,
  customerController.checkout
);
router.post(
  '/bookings/:id/complete',
  requireAuth,
  requireCustomer,
  customerController.complete
);

module.exports = router;
