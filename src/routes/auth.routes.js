const express = require('express');
const authController = require('../controllers/auth.controller');

const router = express.Router();

router.post('/login', authController.loginUser);
router.post('/customer/login', authController.loginCustomer);

module.exports = router;
