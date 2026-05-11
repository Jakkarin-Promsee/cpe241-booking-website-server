const express = require('express');
const venueController = require('../controllers/venue.controller');

const router = express.Router();

router.get('/', venueController.listVenues);

module.exports = router;
