const User = require('../models/user');
const Donation = require('../models/donation');

const getImpactStats = async (req, res) => {
  try {
    const [
      totalDonations,
      ngoPartners,
      completedDonations,
      peopleServedResult,
      foodRescuedResult
    ] = await Promise.all([
      Donation.countDocuments(),
      User.countDocuments({ role: 'ngo' }),
      Donation.countDocuments({ status: 'completed' }),
      Donation.aggregate([
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
      ]),
      Donation.aggregate([
        {
          $match: {
            status: 'completed',
            quantityUnit: 'kg'
          }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$quantity'
            }
          }
        }
      ])
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalDonations,
        peopleServed: peopleServedResult[0]?.total || 0,
        ngoPartners,
        completedDonations,
        foodRescuedKg: foodRescuedResult[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get public impact stats error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to load impact statistics'
    });
  }
};

module.exports = {
  getImpactStats
};
