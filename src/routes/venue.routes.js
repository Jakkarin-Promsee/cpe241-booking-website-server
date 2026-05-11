const express = require('express');
const venueController = require('../controllers/venue.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', venueController.listVenues);
router.post('/', requireAuth, requireAdmin, venueController.createVenue);
router.put('/:id', requireAuth, requireAdmin, venueController.updateVenue);
router.delete('/:id', requireAuth, requireAdmin, venueController.deleteVenue);
router.get('/:id/seats', venueController.listVenueSeats);
router.post('/:id/seats', requireAuth, requireAdmin, venueController.assignVenueSeats);
router.delete('/:id/seats/:seatId', requireAuth, requireAdmin, venueController.unassignVenueSeat);

module.exports = router;
