const express = require('express');

const {
  getDashboardStats,
  getAllUsers,
  getAllDonations,
  deleteUser,
  deleteDonation
} = require('../controllers/admin.controller');

const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ======================================================
// ADMIN DASHBOARD
// ======================================================

router.get(
  '/dashboard',
  authMiddleware,
  getDashboardStats
);

// ======================================================
// ALL USERS
// ======================================================

router.get(
  '/users',
  authMiddleware,
  getAllUsers
);

router.delete(
  '/users/:id',
  authMiddleware,
  deleteUser
);

// ======================================================
// ALL DONATIONS
// ======================================================

router.get(
  '/donations',
  authMiddleware,
  getAllDonations
);

router.delete(
  '/donations/:id',
  authMiddleware,
  deleteDonation
);

module.exports = router;