const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const donationRoutes = require('./routes/donation.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const supportRoutes = require('./routes/support.routes');
const { getImpactStats } = require('./controllers/public.controller');

const app = express();
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:4200',
  'http://localhost:4200',
  'http://127.0.0.1:4200'
];


// ======================================================
// CORS
// ======================================================

app.use(
  cors({
    origin: [...new Set(allowedOrigins)],

    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS'
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization'
    ]
  })
);


// ======================================================
// BODY PARSER
// ======================================================

app.use(
  express.json()
);


// ======================================================
// HEALTH CHECK
// ======================================================

app.get(
  '/api/health',
  (req, res) => {

    res.json({
      success: true,
      message:
        'MealMitra backend is working'
    });

  }
);

app.get(
  '/api/public/stats',
  getImpactStats
);


// ======================================================
// AUTH ROUTES
// ======================================================

app.use(
  '/api/auth',
  authRoutes
);


// ======================================================
// DONATION ROUTES
// ======================================================

app.use(
  '/api/donations',
  donationRoutes
);


// ======================================================
// USER ROUTES
// ======================================================

app.use(
  '/api/users',
  userRoutes
);

app.use(
  '/api/support',
  supportRoutes
);


// ======================================================
// ADMIN ROUTES
// IMPORTANT: MUST BE BEFORE 404 HANDLER
// ======================================================

app.use(
  '/api/admin',
  adminRoutes
);


// ======================================================
// 404 HANDLER
// ======================================================

app.use(
  (req, res) => {

    res.status(404).json({

      success: false,

      message:
        `Route not found: ${req.method} ${req.originalUrl}`

    });

  }
);


// ======================================================
// ERROR HANDLER
// ======================================================

app.use(
  (error, req, res, next) => {

    console.error(
      'Server error:',
      error
    );

    res.status(500).json({

      success: false,

      message:
        error.message ||
        'Internal server error'

    });

  }
);


module.exports = app;