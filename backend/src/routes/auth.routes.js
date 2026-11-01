const express = require('express');

const {
  register,
  login
} = require('../controllers/auth.controller');

const router = express.Router();


// =====================================================
// REGISTER
// =====================================================

router.post(
  '/register',
  register
);


// =====================================================
// LOGIN
// =====================================================

router.post(
  '/login',
  login
);


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;