const express = require('express');
const healthRoutes   = require('./health.routes');
const authRoutes     = require('./auth.routes');
const movieRoutes    = require('./movie.routes');
const venueRoutes    = require('./venue.routes');
const showingRoutes  = require('./showing.routes');
const bookingRoutes  = require('./booking.routes');
const dashboardRoutes = require('./dashboard.routes');
const reportRoutes   = require('./report.routes');
const customerRoutes = require('./customer.routes');

const router = express.Router();

router.use('/health',    healthRoutes);
router.use('/auth',      authRoutes);
router.use('/movies',    movieRoutes);
router.use('/venues',    venueRoutes);
router.use('/showings',  showingRoutes);
router.use('/customer',  customerRoutes);
router.use('/bookings',  bookingRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports',   reportRoutes);

module.exports = router;
