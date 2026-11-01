const express = require('express');
const { rateLimit } = require('express-rate-limit');
const authMiddleware = require('../middleware/auth');
const {
  chatWithSupportAssistant
} = require('../controllers/support.controller');

const router = express.Router();
const supportChatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 12,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Please wait a moment before sending another support message.'
  }
});

router.post(
  '/chat',
  authMiddleware,
  supportChatLimiter,
  chatWithSupportAssistant
);

module.exports = router;
