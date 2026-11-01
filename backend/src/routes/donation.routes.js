const express = require('express');

const {
  createDonation,
  getMyDonations,
  getAvailableDonations,
  getAcceptedDonations,
  getDonationById,
  cancelDonation,
  cancelAcceptedDonation,
  acceptDonation,
  markDonationPickedUp,
  markDonationCompleted
} = require('../controllers/donation.controller');

const authMiddleware = require('../middleware/auth');
const {
  getDonationRecommendations
} = require('../controllers/recommendation.controller');

const router = express.Router();


// ======================================================
// CREATE DONATION
// POST /api/donations/
// ======================================================

router.post(
  '/',
  authMiddleware,
  createDonation
);


// ======================================================
// GET MY DONATIONS
// GET /api/donations/my
// ======================================================

router.get(
  '/my',
  authMiddleware,
  getMyDonations
);


// ======================================================
// GET AVAILABLE DONATIONS
// GET /api/donations/available
// ======================================================

router.get(
  '/available',
  authMiddleware,
  getAvailableDonations
);


// ======================================================
// GET ACCEPTED DONATIONS
// GET /api/donations/accepted
// ======================================================

router.get(
  '/accepted',
  authMiddleware,
  getAcceptedDonations
);

// ======================================================
// RECOMMEND NGOS FOR A DONATION
// GET /api/donations/:id/recommendations
// ======================================================

router.get(
  '/:id/recommendations',
  authMiddleware,
  getDonationRecommendations
);


// ======================================================
// ACCEPT DONATION
// PATCH /api/donations/:id/accept
// pending → accepted
// ======================================================

router.patch(
  '/:id/accept',
  authMiddleware,
  acceptDonation
);


// ======================================================
// CONFIRM PICKUP
// PATCH /api/donations/:id/pickup
// accepted → picked_up
// ======================================================

router.patch(
  '/:id/pickup',
  authMiddleware,
  markDonationPickedUp
);


// ======================================================
// COMPLETE DONATION
// PATCH /api/donations/:id/complete
// picked_up → completed
// ======================================================

router.patch(
  '/:id/complete',
  authMiddleware,
  markDonationCompleted
);


// ======================================================
// CANCEL NGO ACCEPTANCE
// PATCH /api/donations/:id/cancel-acceptance
// accepted -> pending
// Only within 2 minutes of acceptance
// ======================================================

router.patch(
  '/:id/cancel-acceptance',
  authMiddleware,
  cancelAcceptedDonation
);


// ======================================================
// CANCEL DONATION
// PATCH /api/donations/:id/cancel
// pending → cancelled
// Only within 10 minutes
// ======================================================

router.patch(
  '/:id/cancel',
  authMiddleware,
  cancelDonation
);


// ======================================================
// GET SINGLE DONATION
// GET /api/donations/:id
// ======================================================

router.get(
  '/:id',
  authMiddleware,
  getDonationById
);


module.exports = router;