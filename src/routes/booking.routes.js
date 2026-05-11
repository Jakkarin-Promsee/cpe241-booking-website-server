const express = require('express');
const bookingController = require('../controllers/booking.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/',              requireAuth, bookingController.listBookings);
router.put('/:id/cancel',   requireAuth, bookingController.cancelBooking);

module.exports = router;
