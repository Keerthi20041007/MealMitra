const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');


// =====================================================
// ADMIN
// =====================================================

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL?.trim().toLowerCase() || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SUPPORTED_FOOD_TYPES = [
  'Cooked Food',
  'Packaged Food',
  'Fruits & Vegetables',
  'Bakery',
  'Other'
];
const SUPPORTED_FOOD_PREFERENCES = [
  'Vegetarian',
  'Non-Vegetarian',
  'Mixed'
];


// =====================================================
// VALIDATION HELPERS
// =====================================================

const cleanString = (value) => {
  return typeof value === 'string'
    ? value.trim()
    : '';
};


const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
};


const isValidPhone = (phone) => {
  return /^[6-9]\d{9}$/.test(phone);
};


const isValidPassword = (password) => {
  return (
    typeof password === 'string' &&
    password.length >= 6 &&
    password.length <= 128
  );
};

const cleanOptions = (options, allowedOptions) => {
  if (!Array.isArray(options)) {
    return allowedOptions;
  }

  return [...new Set(
    options.filter((option) => allowedOptions.includes(option))
  )];
};


// =====================================================
// REGISTER
// =====================================================

const register = async (req, res) => {

  try {

    const {
      role,
      donorName,
      donorPhone,
      donorEmail,
      organizationName,
      organizationPhone,
      organizationEmail,
      organizationAbout,
      numberOfPeople,
      supportedFoodTypes,
      supportedFoodPreferences,
      address,
      latitude,
      longitude,
      password
    } = req.body;


    const userRole =
      cleanString(role).toLowerCase();


    // =================================================
    // BASIC VALIDATION
    // =================================================

    if (!userRole) {
      return res.status(400).json({
        success: false,
        message: 'Please select an account type.'
      });
    }


    if (
      userRole !== 'donor' &&
      userRole !== 'ngo'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid account type.'
      });
    }


    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        message:
          'Password must be between 6 and 128 characters.'
      });
    }


    // =================================================
    // DONOR REGISTRATION
    // =================================================

    if (userRole === 'donor') {

      const name =
        cleanString(donorName);

      const phone =
        cleanString(donorPhone);

      const email =
        cleanString(donorEmail).toLowerCase();


      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Please enter your name.'
        });
      }


      if (!phone) {
        return res.status(400).json({
          success: false,
          message:
            'Please enter your phone number.'
        });
      }


      if (!isValidPhone(phone)) {
        return res.status(400).json({
          success: false,
          message:
            'Please enter a valid 10-digit Indian phone number.'
        });
      }


      if (!email) {
        return res.status(400).json({
          success: false,
          message:
            'Please enter your email address.'
        });
      }


      if (!isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          message:
            'Please enter a valid email address.'
        });
      }


      const existingUser =
        await User.findOne({
          $or: [
            { donorEmail: email },
            { organizationEmail: email }
          ]
        });


      if (existingUser) {
        return res.status(409).json({
          success: false,
          message:
            'An account with this email address already exists.'
        });
      }


      const hashedPassword =
        await bcrypt.hash(password, 10);


      const user =
        await User.create({

          role: 'donor',

          donorName: name,

          donorPhone: phone,

          donorEmail: email,

          password: hashedPassword

        });


      return res.status(201).json({

        success: true,

        message:
          'Donor account created successfully.',

        user: {
          id: user._id,
          role: user.role,
          name: user.donorName,
          email: user.donorEmail,
          phone: user.donorPhone
        }

      });

    }


    // =================================================
    // NGO REGISTRATION
    // =================================================

    if (userRole === 'ngo') {

      const name =
        cleanString(organizationName);

      const phone =
        cleanString(organizationPhone);

      const email =
        cleanString(organizationEmail).toLowerCase();

      const about =
        cleanString(organizationAbout);

      const ngoAddress =
        cleanString(address);


      if (!name) {
        return res.status(400).json({
          success: false,
          message:
            'Please enter the organization name.'
        });
      }


      if (!phone) {
        return res.status(400).json({
          success: false,
          message:
            'Please enter the organization phone number.'
        });
      }


      if (!isValidPhone(phone)) {
        return res.status(400).json({
          success: false,
          message:
            'Please enter a valid 10-digit Indian phone number.'
        });
      }


      if (!email) {
        return res.status(400).json({
          success: false,
          message:
            'Please enter the organization email address.'
        });
      }


      if (!isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          message:
            'Please enter a valid organization email address.'
        });
      }


      if (!ngoAddress) {
        return res.status(400).json({
          success: false,
          message:
            'Please enter the organization address.'
        });
      }


      if (
        latitude === undefined ||
        longitude === undefined ||
        latitude === null ||
        longitude === null
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Organization location is required.'
        });
      }


      const existingUser =
        await User.findOne({
          $or: [
            { donorEmail: email },
            { organizationEmail: email }
          ]
        });


      if (existingUser) {
        return res.status(409).json({
          success: false,
          message:
            'An account with this email address already exists.'
        });
      }


      const hashedPassword =
        await bcrypt.hash(password, 10);


      const user =
        await User.create({

          role: 'ngo',

          organizationName: name,

          organizationPhone: phone,

          organizationEmail: email,

          organizationAbout: about,

          numberOfPeople:
            Number(numberOfPeople) || 0,

          supportedFoodTypes:
            cleanOptions(supportedFoodTypes, SUPPORTED_FOOD_TYPES),

          supportedFoodPreferences:
            cleanOptions(
              supportedFoodPreferences,
              SUPPORTED_FOOD_PREFERENCES
            ),

          address: ngoAddress,

          latitude: Number(latitude),

          longitude: Number(longitude),

          password: hashedPassword

        });


      return res.status(201).json({

        success: true,

        message:
          'NGO account created successfully.',

        user: {
          id: user._id,
          role: user.role,
          name: user.organizationName,
          email: user.organizationEmail,
          phone: user.organizationPhone,

          // Full NGO profile information
          organizationName: user.organizationName,
          organizationEmail: user.organizationEmail,
          organizationPhone: user.organizationPhone,
          organizationAbout: user.organizationAbout,
          numberOfPeople: user.numberOfPeople,
          supportedFoodTypes: user.supportedFoodTypes,
          supportedFoodPreferences: user.supportedFoodPreferences,
          address: user.address,
          latitude: user.latitude,
          longitude: user.longitude
        }

      });

    }

  } catch (error) {

    console.error(
      'Registration error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Registration failed. Please try again.'
    });

  }

};


// =====================================================
// LOGIN
// =====================================================

const login = async (req, res) => {

  try {

    console.log('');
    console.log('======================================');
    console.log('LOGIN REQUEST');
    console.log('======================================');


    const email =
      cleanString(req.body?.email)
        .toLowerCase();

    const password =
      req.body?.password;


    console.log('Email:', email);

    console.log(
      'Password received:',
      typeof password === 'string'
    );


    // =================================================
    // EMAIL EMPTY
    // =================================================

    if (!email) {

      return res.status(400).json({
        success: false,
        message:
          'Please enter your email address.'
      });

    }


    // =================================================
    // EMAIL FORMAT
    // =================================================

    if (!isValidEmail(email)) {

      return res.status(400).json({
        success: false,
        message:
          'Please enter a valid email address.'
      });

    }


    // =================================================
    // PASSWORD EMPTY
    // =================================================

    if (
      typeof password !== 'string' ||
      password.length === 0
    ) {

      return res.status(400).json({
        success: false,
        message:
          'Please enter your password.'
      });

    }


    // =================================================
    // ADMIN LOGIN
    // =================================================

    if (ADMIN_EMAIL && email === ADMIN_EMAIL) {

      console.log('Admin login attempt');

      if (!ADMIN_PASSWORD) {
        return res.status(503).json({
          success: false,
          message:
            'Admin sign-in is not configured. Please contact the administrator.'
        });
      }

      if (password !== ADMIN_PASSWORD) {

        console.log(
          'Admin password incorrect'
        );


        return res.status(401).json({
          success: false,
          message:
            'Incorrect password. Please try again.'
        });

      }


      const token =
        jwt.sign(
          {
            id: 'admin',
            role: 'admin'
          },
          process.env.JWT_SECRET,
          {
            expiresIn: '1d'
          }
        );


      return res.status(200).json({

        success: true,

        message:
          'Admin login successful',

        token,

        user: {
          id: 'admin',
          role: 'admin',
          name: 'MealMitra Admin',
          email: ADMIN_EMAIL,
          phone: ''
        }

      });

    }


    // =================================================
    // FIND USER
    // =================================================

    console.log(
      'Searching database for email...'
    );


    const user =
      await User.findOne({
        $or: [
          {
            donorEmail: email
          },
          {
            organizationEmail: email
          }
        ]
      });


    console.log(
      'Database search completed'
    );


    // =================================================
    // EMAIL NOT FOUND
    // =================================================

    if (!user) {

      console.log(
        'RESULT: EMAIL NOT REGISTERED'
      );


      return res.status(404).json({

        success: false,

        message:
          'No account found with this email address.'

      });

    }


    console.log(
      'User found:',
      user.role
    );


    // =================================================
    // PASSWORD CHECK
    // =================================================

    console.log(
      'Checking password...'
    );


    if (!user.password) {

      console.error(
        'ERROR: User has no password stored.'
      );


      return res.status(500).json({

        success: false,

        message:
          'Unable to verify your password. Please contact support.'

      });

    }


    const passwordMatches =
      await bcrypt.compare(
        password,
        user.password
      );


    console.log(
      'Password comparison completed:',
      passwordMatches
    );


    // =================================================
    // WRONG PASSWORD
    // =================================================

    if (!passwordMatches) {

      console.log(
        'RESULT: INCORRECT PASSWORD'
      );


      return res.status(401).json({

        success: false,

        message:
          'Incorrect password. Please try again.'

      });

    }


    // =================================================
    // CREATE TOKEN
    // =================================================

    const token =
      jwt.sign(
        {
          id: user._id.toString(),
          role: user.role
        },
        process.env.JWT_SECRET,
        {
          expiresIn: '1d'
        }
      );


    // =================================================
    // USER RESPONSE
    // =================================================

    let responseUser;


    // =================================================
    // DONOR USER RESPONSE
    // =================================================

    if (user.role === 'donor') {

      responseUser = {

        id: user._id,

        role: 'donor',

        name: user.donorName,

        email: user.donorEmail,

        phone: user.donorPhone

      };

    }


    // =================================================
    // NGO USER RESPONSE
    // =================================================

    else if (user.role === 'ngo') {

      responseUser = {

        // Basic account information
        id: user._id,

        role: 'ngo',

        name: user.organizationName,

        email: user.organizationEmail,

        phone: user.organizationPhone,


        // Organization information
        organizationName:
          user.organizationName,

        organizationEmail:
          user.organizationEmail,

        organizationPhone:
          user.organizationPhone,

        organizationAbout:
          user.organizationAbout || '',


        // Organization capacity
        numberOfPeople:
          Number(user.numberOfPeople) || 0,

        supportedFoodTypes:
          user.supportedFoodTypes || [],

        supportedFoodPreferences:
          user.supportedFoodPreferences || [],


        // Organization address
        address:
          user.address || '',


        // Organization location
        latitude:
          user.latitude !== undefined &&
          user.latitude !== null
            ? Number(user.latitude)
            : null,

        longitude:
          user.longitude !== undefined &&
          user.longitude !== null
            ? Number(user.longitude)
            : null

      };

    }


    // =================================================
    // SUCCESS
    // =================================================

    console.log(
      'LOGIN SUCCESSFUL'
    );

    console.log(
      'User returned from login:',
      responseUser
    );

    console.log(
      '======================================'
    );


    return res.status(200).json({

      success: true,

      message:
        'Login successful',

      token,

      user: responseUser

    });

  } catch (error) {

    console.error('');
    console.error(
      'LOGIN ERROR:',
      error
    );
    console.error('');


    return res.status(500).json({

      success: false,

      message:
        'Login failed. Please try again.'

    });

  }

};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
  register,
  login
};