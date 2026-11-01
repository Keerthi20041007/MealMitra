const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {

    // ==========================================
    // ROLE
    // ==========================================

    role: {
      type: String,
      enum: ['donor', 'ngo'],
      required: true
    },

    // ==========================================
    // DONOR DETAILS
    // ==========================================

    donorName: {
      type: String,
      default: ''
    },

    donorPhone: {
      type: String,
      default: ''
    },

    donorEmail: {
      type: String,
      default: ''
    },

    // ==========================================
    // NGO DETAILS
    // ==========================================

    organizationName: {
      type: String,
      default: ''
    },

    organizationPhone: {
      type: String,
      default: ''
    },

    organizationEmail: {
      type: String,
      default: ''
    },

    organizationAbout: {
      type: String,
      default: ''
    },

    numberOfPeople: {
      type: Number,
      default: 0
    },

    supportedFoodTypes: {
      type: [{
        type: String,
        enum: [
          'Cooked Food',
          'Packaged Food',
          'Fruits & Vegetables',
          'Bakery',
          'Other'
        ]
      }],
      default: [
        'Cooked Food',
        'Packaged Food',
        'Fruits & Vegetables',
        'Bakery',
        'Other'
      ]
    },

    supportedFoodPreferences: {
      type: [{
        type: String,
        enum: [
          'Vegetarian',
          'Non-Vegetarian',
          'Mixed'
        ]
      }],
      default: [
        'Vegetarian',
        'Non-Vegetarian',
        'Mixed'
      ]
    },

    // ==========================================
    // LOCATION
    // ==========================================

    address: {
      type: String,
      default: ''
    },

    latitude: {
      type: Number,
      default: 0
    },

    longitude: {
      type: Number,
      default: 0
    },

    // ==========================================
    // PASSWORD
    // ==========================================

    password: {
      type: String,
      required: true
    }

  },

  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  'User',
  userSchema
);