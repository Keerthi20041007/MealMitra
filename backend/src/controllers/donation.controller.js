const Donation = require('../models/donation');


// ======================================================
// CREATE DONATION
// DONOR ONLY
// ======================================================

const createDonation = async (req, res) => {
  try {

    console.log('=================================');
    console.log('CREATE DONATION');
    console.log('User:', req.user);
    console.log('=================================');

    if (
      !req.user ||
      req.user.role !== 'donor'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Only donors can create donations'
      });
    }

    const {
      foodName,
      foodType,
      foodPreference,
      quantity,
      quantityUnit,
      servings,
      description,
      pickupAddress,
      latitude,
      longitude,
      pickupDeadline
    } = req.body;


    // -----------------------------
    // VALIDATION
    // -----------------------------

    if (!foodName) {
      return res.status(400).json({
        success: false,
        message: 'Food name is required'
      });
    }

    if (!foodType) {
      return res.status(400).json({
        success: false,
        message: 'Food type is required'
      });
    }

    if (!foodPreference) {
      return res.status(400).json({
        success: false,
        message: 'Food preference is required'
      });
    }

    if (
      quantity === undefined ||
      quantity === null ||
      Number(quantity) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    if (!quantityUnit) {
      return res.status(400).json({
        success: false,
        message: 'Quantity unit is required'
      });
    }

    if (
      servings === undefined ||
      servings === null ||
      Number(servings) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid number of servings is required'
      });
    }

    if (!pickupAddress) {
      return res.status(400).json({
        success: false,
        message: 'Pickup address is required'
      });
    }

    if (
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'Pickup location is required'
      });
    }

    if (!pickupDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Pickup deadline is required'
      });
    }


    // -----------------------------
    // DEADLINE
    // -----------------------------

    const deadline =
      new Date(pickupDeadline);

    if (
      Number.isNaN(
        deadline.getTime()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pickup deadline'
      });
    }

    if (
      deadline <= new Date()
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Pickup deadline must be in the future'
      });
    }


    // -----------------------------
    // CREATE
    // -----------------------------

    const donation =
      await Donation.create({

        donorId:
          req.user.id,

        foodName:
          foodName.trim(),

        foodType,

        foodPreference,

        quantity:
          Number(quantity),

        quantityUnit,

        servings:
          Number(servings),

        description:
          description
            ? description.trim()
            : '',

        pickupAddress:
          pickupAddress.trim(),

        latitude:
          Number(latitude),

        longitude:
          Number(longitude),

        pickupDeadline:
          deadline,

        status:
          'pending',

        acceptedBy:
          null,

        acceptedAt:
          null

      });


    // -----------------------------
    // POPULATE
    // -----------------------------

    const populatedDonation =
      await Donation.findById(
        donation._id
      )
      .populate(
        'donorId',
        'donorName donorEmail donorPhone'
      );


    return res.status(201).json({

      success: true,

      message:
        'Donation created successfully',

      donation:
        populatedDonation

    });

  } catch (error) {

    console.error(
      'Create donation error:',
      error
    );

    return res.status(500).json({

      success: false,

      message:
        'Failed to create donation',

      error:
        error.message

    });

  }
};


// ======================================================
// GET MY DONATIONS
// DONOR ONLY
// ======================================================

const getMyDonations = async (
  req,
  res
) => {

  try {

    if (
      !req.user ||
      req.user.role !== 'donor'
    ) {

      return res.status(403).json({

        success: false,

        message:
          'Only donors can view their donations'

      });

    }


    const donations =
      await Donation.find({

        donorId:
          req.user.id

      })
      .populate(
        'acceptedBy',
        'organizationName organizationEmail organizationPhone'
      )
      .sort({
        createdAt: -1
      });


    return res.status(200).json({

      success: true,

      donations

    });

  } catch (error) {

    console.error(
      'Get my donations error:',
      error
    );

    return res.status(500).json({

      success: false,

      message:
        'Failed to fetch your donations'

    });

  }
};


// ======================================================
// GET AVAILABLE DONATIONS
// NGO ONLY
// ======================================================

const getAvailableDonations = async (
  req,
  res
) => {

  try {

    if (
      !req.user ||
      req.user.role !== 'ngo'
    ) {

      return res.status(403).json({

        success: false,

        message:
          'Only NGOs can view available donations'

      });

    }


    const donations =
      await Donation.find({

        status:
          'pending',

        pickupDeadline: {
          $gt: new Date()
        }

      })
      .populate(
        'donorId',
        'donorName donorEmail donorPhone'
      )
      .sort({

        pickupDeadline:
          1,

        createdAt:
          1

      });


    return res.status(200).json({

      success: true,

      donations

    });

  } catch (error) {

    console.error(
      'Get available donations error:',
      error
    );

    return res.status(500).json({

      success: false,

      message:
        'Failed to fetch available donations'

    });

  }
};


// ======================================================
// ACCEPT DONATION
// NGO ONLY
//
// FIRST COME FIRST SERVE
// ======================================================

const acceptDonation = async (
  req,
  res
) => {

  try {

    if (
      !req.user ||
      req.user.role !== 'ngo'
    ) {

      return res.status(403).json({

        success: false,

        message:
          'Only NGOs can accept donations'

      });

    }


    console.log(
      'Accepting donation:',
      req.params.id
    );

    console.log(
      'NGO:',
      req.user.id
    );


    // --------------------------------------------------
    // ATOMIC ACCEPTANCE
    //
    // Only one NGO can change:
    // pending -> accepted
    // --------------------------------------------------

    const donation =
      await Donation.findOneAndUpdate(

        {

          _id:
            req.params.id,

          status:
            'pending',

          pickupDeadline: {
            $gt: new Date()
          }

        },

        {

          $set: {

            status:
              'accepted',

            acceptedBy:
              req.user.id,

            acceptedAt:
              new Date()

          }

        },

        {

          new:
            true

        }

      )
      .populate(
        'donorId',
        'donorName donorEmail donorPhone'
      )
      .populate(
        'acceptedBy',
        'organizationName organizationEmail organizationPhone'
      );


    if (!donation) {

      const existingDonation =
        await Donation.findById(
          req.params.id
        );


      if (!existingDonation) {

        return res.status(404).json({

          success: false,

          message:
            'Donation not found'

        });

      }


      if (
        existingDonation.status !==
        'pending'
      ) {

        return res.status(409).json({

          success: false,

          message:
            'This donation has already been accepted by another NGO'

        });

      }


      if (
        existingDonation.pickupDeadline <=
        new Date()
      ) {

        return res.status(409).json({

          success: false,

          message:
            'The pickup deadline has expired'

        });

      }


      return res.status(409).json({

        success: false,

        message:
          'This donation is no longer available'

      });

    }


    return res.status(200).json({

      success: true,

      message:
        'Donation accepted successfully',

      donation

    });

  } catch (error) {

    console.error(
      'Accept donation error:',
      error
    );

    return res.status(500).json({

      success: false,

      message:
        'Failed to accept donation',

      error:
        error.message

    });

  }
};


// ======================================================
// GET ACCEPTED DONATIONS
// NGO ONLY
// ======================================================

// ======================================================
// CANCEL NGO ACCEPTANCE
// NGO ONLY
//
// accepted -> pending
// Only within 2 minutes of acceptance.
// ======================================================

const cancelAcceptedDonation = async (
  req,
  res
) => {

  try {

    if (
      !req.user ||
      req.user.role !== 'ngo'
    ) {

      return res.status(403).json({

        success: false,

        message:
          'Only NGOs can cancel accepted donations'

      });

    }


    const donation =
      await Donation.findOne({

        _id:
          req.params.id,

        acceptedBy:
          req.user.id,

        status:
          'accepted'

      });


    if (!donation) {

      return res.status(409).json({

        success: false,

        message:
          'This accepted donation cannot be cancelled because it is no longer assigned to your organization.'

      });

    }


    if (!donation.acceptedAt) {

      return res.status(409).json({

        success: false,

        message:
          'Accepted time is missing. This donation cannot be cancelled.'

      });

    }


    const allowedUntil =
      new Date(
        donation.acceptedAt.getTime() +
        (2 * 60 * 1000)
      );


    if (
      new Date() > allowedUntil
    ) {

      return res.status(409).json({

        success: false,

        message:
          'The 2-minute cancellation window has expired. This donation can no longer be cancelled.'

      });

    }


    const updatedDonation =
      await Donation.findOneAndUpdate(

        {

          _id:
            req.params.id,

          acceptedBy:
            req.user.id,

          status:
            'accepted'

        },

        {

          $set: {

            status:
              'pending',

            acceptedBy:
              null,

            acceptedAt:
              null

          }

        },

        {

          new:
            true

        }
      )
      .populate(
        'donorId',
        'donorName donorEmail donorPhone'
      )
      .populate(
        'acceptedBy',
        'organizationName organizationEmail organizationPhone'
      );


    return res.status(200).json({

      success: true,

      message:
        'Accepted donation cancelled successfully.',

      donation:
        updatedDonation

    });

  } catch (error) {

    console.error(
      'Cancel accepted donation error:',
      error
    );

    return res.status(500).json({

      success: false,

      message:
        'Failed to cancel accepted donation',

      error:
        error.message

    });

  }
};


const getAcceptedDonations = async (
  req,
  res
) => {

  try {

    if (
      !req.user ||
      req.user.role !== 'ngo'
    ) {

      return res.status(403).json({

        success: false,

        message:
          'Only NGOs can view accepted donations'

      });

    }


    const donations =
      await Donation.find({

        acceptedBy:
          req.user.id,

        status: {
          $in: [
            'accepted',
            'picked_up',
            'completed'
          ]
        }

      })
      .populate(
        'donorId',
        'donorName donorEmail donorPhone'
      )
      .populate(
        'acceptedBy',
        'organizationName organizationEmail organizationPhone'
      )
      .sort({
        acceptedAt: -1
      });


    return res.status(200).json({

      success: true,

      donations

    });

  } catch (error) {

    console.error(
      'Get accepted donations error:',
      error
    );

    return res.status(500).json({

      success: false,

      message:
        'Failed to fetch accepted donations'

    });

  }
};


// ======================================================
// MARK DONATION AS PICKED UP
// NGO ONLY
//
// accepted -> picked_up
// ======================================================

const markDonationPickedUp = async (
  req,
  res
) => {

  try {

    if (
      !req.user ||
      req.user.role !== 'ngo'
    ) {

      return res.status(403).json({

        success: false,

        message:
          'Only NGOs can confirm pickup'

      });

    }


    const donation =
      await Donation.findOneAndUpdate(

        {

          _id:
            req.params.id,

          acceptedBy:
            req.user.id,

          status:
            'accepted'

        },

        {

          $set: {

            status:
              'picked_up'

          }

        },

        {

          new:
            true

        }

      )
      .populate(
        'donorId',
        'donorName donorEmail donorPhone'
      )
      .populate(
        'acceptedBy',
        'organizationName organizationEmail organizationPhone'
      );


    if (!donation) {

      return res.status(409).json({

        success: false,

        message:
          'Donation cannot be marked as picked up. It may already be picked up or is not assigned to you.'

      });

    }


    console.log(
      'Donation marked as picked up:',
      req.params.id
    );


    return res.status(200).json({

      success: true,

      message:
        'Food pickup confirmed successfully',

      donation

    });

  } catch (error) {

    console.error(
      'Mark pickup error:',
      error
    );

    return res.status(500).json({

      success: false,

      message:
        'Failed to confirm pickup',

      error:
        error.message

    });

  }
};


// ======================================================
// MARK DONATION AS COMPLETED
// NGO ONLY
//
// picked_up -> completed
// ======================================================

const markDonationCompleted = async (
  req,
  res
) => {

  try {

    if (
      !req.user ||
      req.user.role !== 'ngo'
    ) {

      return res.status(403).json({

        success: false,

        message:
          'Only NGOs can complete donations'

      });

    }


    const donation =
      await Donation.findOneAndUpdate(

        {

          _id:
            req.params.id,

          acceptedBy:
            req.user.id,

          status:
            'picked_up'

        },

        {

          $set: {

            status:
              'completed'

          }

        },

        {

          new:
            true

        }

      )
      .populate(
        'donorId',
        'donorName donorEmail donorPhone'
      )
      .populate(
        'acceptedBy',
        'organizationName organizationEmail organizationPhone'
      );


    if (!donation) {

      return res.status(409).json({

        success: false,

        message:
          'Donation cannot be completed. Please confirm pickup first.'

      });

    }


    console.log(
      'Donation completed:',
      req.params.id
    );


    return res.status(200).json({

      success: true,

      message:
        'Donation completed successfully',

      donation

    });

  } catch (error) {

    console.error(
      'Mark completed error:',
      error
    );

    return res.status(500).json({

      success: false,

      message:
        'Failed to complete donation',

      error:
        error.message

    });

  }
};


// ======================================================
// GET DONATION BY ID
// ======================================================

const getDonationById = async (
  req,
  res
) => {

  try {

    if (!req.user) {

      return res.status(401).json({

        success: false,

        message:
          'Authentication required'

      });

    }


    const donation =
      await Donation.findById(
        req.params.id
      )
      .populate(
        'donorId',
        'donorName donorEmail donorPhone'
      )
      .populate(
        'acceptedBy',
        'organizationName organizationEmail organizationPhone'
      );


    if (!donation) {

      return res.status(404).json({

        success: false,

        message:
          'Donation not found'

      });

    }


    // --------------------------------------------------
    // DONOR ACCESS
    // --------------------------------------------------

    if (
      req.user.role === 'donor' &&
      donation.donorId &&
      donation.donorId._id.toString() !==
        req.user.id
    ) {

      return res.status(403).json({

        success: false,

        message:
          'You do not have access to this donation'

      });

    }


    // --------------------------------------------------
    // NGO ACCESS
    // --------------------------------------------------

    if (
      req.user.role === 'ngo'
    ) {

      const acceptedByThisNGO =
        donation.acceptedBy &&
        donation.acceptedBy._id.toString() ===
          req.user.id;


      if (
        donation.status !== 'pending' &&
        !acceptedByThisNGO
      ) {

        return res.status(403).json({

          success: false,

          message:
            'You do not have access to this donation'

        });

      }

    }


    return res.status(200).json({

      success: true,

      donation

    });

  } catch (error) {

    console.error(
      'Get donation by ID error:',
      error
    );

    return res.status(500).json({

      success: false,

      message:
        'Failed to fetch donation'

    });

  }
};


// ======================================================
// CANCEL DONATION
// DONOR ONLY
//
// Cancellation allowed only within
// 10 minutes of donation creation.
// ======================================================

const cancelDonation = async (
  req,
  res
) => {

  try {

    if (
      !req.user ||
      req.user.role !== 'donor'
    ) {

      return res.status(403).json({

        success: false,

        message:
          'Only donors can cancel donations'

      });

    }


    // --------------------------------------------------
    // 10-MINUTE CANCELLATION WINDOW
    // --------------------------------------------------

    const cancellationLimit =
      new Date(
        Date.now() -
        (10 * 60 * 1000)
      );


    // --------------------------------------------------
    // CANCEL ONLY IF:
    //
    // 1. Donation belongs to donor
    // 2. Donation is pending
    // 3. Donation was created within 10 minutes
    // --------------------------------------------------

    const donation =
      await Donation.findOneAndUpdate(

        {

          _id:
            req.params.id,

          donorId:
            req.user.id,

          status:
            'pending',

          createdAt: {
            $gte:
              cancellationLimit
          }

        },

        {

          $set: {

            status:
              'cancelled'

          }

        },

        {

          new:
            true

        }

      );


    // --------------------------------------------------
    // NOTHING UPDATED
    // --------------------------------------------------

    if (!donation) {

      const existingDonation =
        await Donation.findOne({

          _id:
            req.params.id,

          donorId:
            req.user.id

        });


      if (!existingDonation) {

        return res.status(404).json({

          success: false,

          message:
            'Donation not found'

        });

      }


      // ------------------------------------------------
      // ALREADY ACCEPTED / PICKED UP / COMPLETED /
      // ALREADY CANCELLED
      // ------------------------------------------------

      if (
        existingDonation.status !==
        'pending'
      ) {

        return res.status(409).json({

          success: false,

          message:
            'This donation can no longer be cancelled because it has already been accepted or processed.'

        });

      }


      // ------------------------------------------------
      // STILL PENDING BUT 10 MINUTES EXPIRED
      // ------------------------------------------------

      return res.status(409).json({

        success: false,

        message:
          'The 10-minute cancellation period has expired. This donation can no longer be cancelled.'

      });

    }


    // --------------------------------------------------
    // SUCCESS
    // --------------------------------------------------

    return res.status(200).json({

      success: true,

      message:
        'Donation cancelled successfully',

      donation

    });

  } catch (error) {

    console.error(
      'Cancel donation error:',
      error
    );

    return res.status(500).json({

      success: false,

      message:
        'Failed to cancel donation',

      error:
        error.message

    });

  }
};


// ======================================================
// EXPORT
// ======================================================

module.exports = {
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
};