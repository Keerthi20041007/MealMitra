const User = require('../models/user');
const Donation = require('../models/donation');
const mongoose = require('mongoose');

// ======================================================
// DELETE USER
// ======================================================

const deleteUser = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can delete users'
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User details deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};

// ======================================================
// DELETE DONATION
// ======================================================

const deleteDonation = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can delete donations'
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid donation ID'
      });
    }

    const donation = await Donation.findByIdAndDelete(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Donation deleted successfully'
    });
  } catch (error) {
    console.error('Delete donation error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to delete donation'
    });
  }
};

// ======================================================
// GET ADMIN DASHBOARD STATISTICS
// ======================================================

const getDashboardStats = async (req, res) => {
  try {
    // --------------------------------------------------
    // Check admin
    // --------------------------------------------------

    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can access dashboard statistics'
      });
    }

    // --------------------------------------------------
    // USER COUNTS
    // --------------------------------------------------

    const totalDonors = await User.countDocuments({
      role: 'donor'
    });

    const totalNGOs = await User.countDocuments({
      role: 'ngo'
    });

    const totalUsers = totalDonors + totalNGOs;

    // --------------------------------------------------
    // DONATION COUNTS
    // --------------------------------------------------

    const totalDonations = await Donation.countDocuments();

    const pendingDonations = await Donation.countDocuments({
      status: 'pending'
    });

    const acceptedDonations = await Donation.countDocuments({
      status: 'accepted'
    });

    const pickedUpDonations = await Donation.countDocuments({
      status: 'picked_up'
    });

    const completedDonations = await Donation.countDocuments({
      status: 'completed'
    });

    const cancelledDonations = await Donation.countDocuments({
      status: 'cancelled'
    });

    // --------------------------------------------------
    // PEOPLE SERVED
    // --------------------------------------------------

    const peopleServedResult = await Donation.aggregate([
      {
        $match: {
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: '$servings'
          }
        }
      }
    ]);

    const peopleServed =
      peopleServedResult.length > 0
        ? peopleServedResult[0].total
        : 0;

    // --------------------------------------------------
    // TOTAL FOOD
    // --------------------------------------------------
    // We keep quantities separated by unit.
    // This avoids incorrectly adding kg + packets + litres.

    const foodByUnit = await Donation.aggregate([
      {
        $match: {
          status: {
            $ne: 'cancelled'
          }
        }
      },
      {
        $group: {
          _id: '$quantityUnit',
          total: {
            $sum: '$quantity'
          }
        }
      }
    ]);

    const foodTotals = {
      kg: 0,
      packets: 0,
      litres: 0,
      items: 0
    };

    foodByUnit.forEach((item) => {
      const unit = item._id;

      if (unit === 'kg') {
        foodTotals.kg = item.total;
      }

      if (unit === 'packets') {
        foodTotals.packets = item.total;
      }

      if (unit === 'litres') {
        foodTotals.litres = item.total;
      }

      if (unit === 'items') {
        foodTotals.items = item.total;
      }
    });

    // --------------------------------------------------
    // RECENT DONATIONS
    // --------------------------------------------------

    const recentDonations = await Donation.find()
      .populate(
        'donorId',
        'donorName donorEmail donorPhone'
      )
      .populate(
        'acceptedBy',
        'organizationName organizationEmail organizationPhone'
      )
      .sort({
        createdAt: -1
      })
      .limit(10);

    // --------------------------------------------------
    // RECENT USERS
    // --------------------------------------------------

    const recentUsers = await User.find()
      .select(
        '-password'
      )
      .sort({
        createdAt: -1
      })
      .limit(10);

    // --------------------------------------------------
    // DONATION STATUS SUMMARY
    // --------------------------------------------------

    const statusSummary = await Donation.aggregate([
      {
        $group: {
          _id: '$status',
          count: {
            $sum: 1
          }
        }
      }
    ]);

    // --------------------------------------------------
    // FOOD TYPE SUMMARY
    // --------------------------------------------------

    const foodTypeSummary = await Donation.aggregate([
      {
        $group: {
          _id: '$foodType',
          count: {
            $sum: 1
          }
        }
      },
      {
        $sort: {
          count: -1
        }
      }
    ]);

    // --------------------------------------------------
    // FOOD PREFERENCE SUMMARY
    // --------------------------------------------------

    const foodPreferenceSummary = await Donation.aggregate([
      {
        $group: {
          _id: '$foodPreference',
          count: {
            $sum: 1
          }
        }
      },
      {
        $sort: {
          count: -1
        }
      }
    ]);

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return res.status(200).json({
      success: true,

      stats: {
        users: {
          total: totalUsers,
          donors: totalDonors,
          ngos: totalNGOs
        },

        donations: {
          total: totalDonations,
          pending: pendingDonations,
          accepted: acceptedDonations,
          pickedUp: pickedUpDonations,
          completed: completedDonations,
          cancelled: cancelledDonations
        },

        impact: {
          peopleServed: peopleServed,
          food: foodTotals
        }
      },

      recentDonations: recentDonations,

      recentUsers: recentUsers,

      statusSummary: statusSummary,

      foodTypeSummary: foodTypeSummary,

      foodPreferenceSummary: foodPreferenceSummary
    });

  } catch (error) {
    console.error(
      'Admin dashboard statistics error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to load admin dashboard statistics',
      error: error.message
    });
  }
};


// ======================================================
// GET ALL USERS
// ======================================================

const getAllUsers = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can access users'
      });
    }

    const users = await User.find()
      .select('-password')
      .sort({
        createdAt: -1
      });

    return res.status(200).json({
      success: true,
      users
    });

  } catch (error) {
    console.error(
      'Get all users error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};


// ======================================================
// GET ALL DONATIONS
// ======================================================

const getAllDonations = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can access donations'
      });
    }

    const donations = await Donation.find()
      .populate(
        'donorId',
        'donorName donorEmail donorPhone'
      )
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
      'Get all donations error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch donations'
    });
  }
};


module.exports = {
  getDashboardStats,
  getAllUsers,
  getAllDonations,
  deleteUser,
  deleteDonation
};