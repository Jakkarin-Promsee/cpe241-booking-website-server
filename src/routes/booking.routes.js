const express = require('express');
const bookingController = require('../controllers/booking.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/',             requireAuth, requireAdmin, bookingController.listBookings);
router.put('/:id/cancel',   requireAuth, requireAdmin, bookingController.cancelBooking);

module.exports = router;
