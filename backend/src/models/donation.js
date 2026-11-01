const mongoose = require('mongoose');


// =====================================================
// DONATION SCHEMA
// =====================================================

const donationSchema =
  new mongoose.Schema(

    {

      // -----------------------------------------------
      // DONOR
      // -----------------------------------------------

      donorId: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          'User',

        required:
          true

      },


      // -----------------------------------------------
      // FOOD DETAILS
      // -----------------------------------------------

      foodName: {

        type:
          String,

        required:
          true,

        trim:
          true

      },


      foodType: {

        type:
          String,

        required:
          true,

        enum: [

          'Cooked Food',

          'Packaged Food',

          'Fruits & Vegetables',

          'Bakery',

          'Other'

        ]

      },


      foodPreference: {

        type:
          String,

        required:
          true,

        enum: [

          'Vegetarian',

          'Non-Vegetarian',

          'Mixed'

        ]

      },


      quantity: {

        type:
          Number,

        required:
          true,

        min:
          0.1

      },


      quantityUnit: {

        type:
          String,

        required:
          true,

        enum: [

          'kg',

          'packets',

          'litres',

          'items'

        ]

      },


      servings: {

        type:
          Number,

        required:
          true,

        min:
          1

      },


      description: {

        type:
          String,

        default:
          '',

        trim:
          true

      },


      // -----------------------------------------------
      // PICKUP DETAILS
      // -----------------------------------------------

      pickupAddress: {

        type:
          String,

        required:
          true,

        trim:
          true

      },


      latitude: {

        type:
          Number,

        required:
          true

      },


      longitude: {

        type:
          Number,

        required:
          true

      },


      pickupDeadline: {

        type:
          Date,

        required:
          true

      },


      // -----------------------------------------------
      // STATUS
      // -----------------------------------------------

      status: {

        type:
          String,

        enum: [

          'pending',

          'accepted',

          'picked_up',

          'completed',

          'cancelled'

        ],

        default:
          'pending'

      },


      // -----------------------------------------------
      // NGO ACCEPTANCE
      // -----------------------------------------------

      acceptedBy: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          'User',

        default:
          null

      },


      acceptedAt: {

        type:
          Date,

        default:
          null

      }

    },

    {

      timestamps:
        true

    }

  );


module.exports =
  mongoose.model(
    'Donation',
    donationSchema
  );