require('dotenv').config();

const app = require('./src/app');
const mongoose = require('mongoose');

const PORT =
  process.env.PORT || 5000;

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/mealmitra';


console.log(
  '===================================='
);

console.log(
  'Starting MealMitra Backend'
);

console.log(
  '===================================='
);

console.log(
  'MongoDB URI:',
  MONGODB_URI
);


// ======================================================
// DATABASE CONNECTION
// ======================================================

mongoose
  .connect(MONGODB_URI)

  .then(() => {

    console.log(
      'MongoDB connected successfully'
    );


    // ==================================================
    // START SERVER
    // ==================================================

    app.listen(
      PORT,
      () => {

        console.log(
          `MealMitra backend running on port ${PORT}`
        );

        console.log(
          `http://localhost:${PORT}`
        );

        console.log(
          `http://localhost:${PORT}/api/health`
        );

        console.log(
          `http://localhost:${PORT}/api/admin/dashboard`
        );

      }
    );

  })

  .catch((error) => {

    console.error(
      'MongoDB connection failed:',
      error.message
    );

    process.exit(1);

  });