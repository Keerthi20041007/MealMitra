const Donation = require('../models/donation');
const User = require('../models/user');
const mongoose = require('mongoose');

const EARTH_RADIUS_KM = 6371;

const AVERAGE_PICKUP_SPEED_KMH = 25;
const PICKUP_PREPARATION_MINUTES = 15;

const distanceInKm = (latitudeA, longitudeA, latitudeB, longitudeB) => {
  const toRadians = (degrees) => degrees * Math.PI / 180;
  const latitudeDifference = toRadians(latitudeB - latitudeA);
  const longitudeDifference = toRadians(longitudeB - longitudeA);
  const haversine =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(latitudeA)) *
      Math.cos(toRadians(latitudeB)) *
      Math.sin(longitudeDifference / 2) ** 2;

  return 2 * EARTH_RADIUS_KM *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const hasFoodPreference = (ngo, preference) => {
  const supported = ngo.supportedFoodPreferences || [];

  if (supported.includes('Mixed') || supported.includes(preference)) {
    return true;
  }

  return preference === 'Mixed' &&
    supported.includes('Vegetarian') &&
    supported.includes('Non-Vegetarian');
};

const getDonationRecommendations = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'donor') {
      return res.status(403).json({
        success: false,
        message: 'Only donors can request NGO recommendations'
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid donation ID'
      });
    }

    const donation = await Donation.findOne({
      _id: req.params.id,
      donorId: req.user.id
    });

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    if (donation.status !== 'pending' || donation.pickupDeadline <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Recommendations are available only for active, pending donations'
      });
    }

    const ngos = await User.find({
      role: 'ngo',
      latitude: { $gte: -90, $lte: 90 },
      longitude: { $gte: -180, $lte: 180 },
      numberOfPeople: { $gt: 0 }
    }).select(
      'organizationName organizationAbout numberOfPeople supportedFoodTypes supportedFoodPreferences latitude longitude address'
    );

    const activeCommitments = await Donation.aggregate([
      {
        $match: {
          acceptedBy: { $in: ngos.map((ngo) => ngo._id) },
          status: { $in: ['accepted', 'picked_up'] }
        }
      },
      {
        $group: {
          _id: '$acceptedBy',
          servings: { $sum: '$servings' }
        }
      }
    ]);

    const commitmentsByNgo = new Map(
      activeCommitments.map((commitment) => [
        String(commitment._id),
        Number(commitment.servings) || 0
      ])
    );
    const now = Date.now();
    const deadlineMs = new Date(donation.pickupDeadline).getTime();
    const minutesUntilDeadline = (deadlineMs - now) / 60000;

    const recommendations = ngos
      .map((ngo) => {
        const latitude = Number(ngo.latitude);
        const longitude = Number(ngo.longitude);

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude) ||
          Math.abs(latitude) > 90 ||
          Math.abs(longitude) > 180 ||
          (latitude === 0 && longitude === 0)
        ) {
          return null;
        }

        const supportedTypes = ngo.supportedFoodTypes || [];
        const foodTypeMatch = supportedTypes.includes(donation.foodType);
        const foodPreferenceMatch =
          hasFoodPreference(ngo, donation.foodPreference);
        const committedServings =
          commitmentsByNgo.get(String(ngo._id)) || 0;
        const availableCapacity = Math.max(
          0,
          Number(ngo.numberOfPeople) - committedServings
        );

        if (
          !foodTypeMatch ||
          !foodPreferenceMatch ||
          availableCapacity < Number(donation.servings)
        ) {
          return null;
        }

        const distanceKm = distanceInKm(
          Number(donation.latitude),
          Number(donation.longitude),
          latitude,
          longitude
        );
        const estimatedPickupMinutes =
          PICKUP_PREPARATION_MINUTES +
          (distanceKm / AVERAGE_PICKUP_SPEED_KMH) * 60;

        if (estimatedPickupMinutes > minutesUntilDeadline) {
          return null;
        }

        const distanceScore = Math.max(0, 1 - distanceKm / 100) * 25;
        const capacityScore = Math.min(
          availableCapacity / Number(donation.servings),
          1
        ) * 20;
        const urgencyBufferScore =
          Math.max(
            0,
            Math.min(
              1,
              (minutesUntilDeadline - estimatedPickupMinutes) /
                Math.max(minutesUntilDeadline, 1)
            )
          ) * 15;
        const matchScore = Math.round(
          40 + distanceScore + capacityScore + urgencyBufferScore
        );
        const matchReasons = [
          'Supports this food type and dietary preference',
          `Capacity for ${donation.servings} servings`,
          `${distanceKm.toFixed(1)} km away`,
          `Estimated pickup in ${Math.ceil(estimatedPickupMinutes)} minutes`
        ];

        return {
          id: String(ngo._id),
          name: ngo.organizationName,
          address: ngo.address,
          distanceKm: Number(distanceKm.toFixed(1)),
          availableCapacity,
          estimatedPickupMinutes: Math.ceil(estimatedPickupMinutes),
          matchScore,
          matchReasons
        };
      })
      .filter(Boolean)
      .sort((a, b) =>
        b.matchScore - a.matchScore ||
        a.distanceKm - b.distanceKm
      )
      .slice(0, 5);

    return res.status(200).json({
      success: true,
      recommendations,
      matching: {
        maxResults: 5,
        estimatedTravelSpeedKmh: AVERAGE_PICKUP_SPEED_KMH,
        pickupPreparationMinutes: PICKUP_PREPARATION_MINUTES
      }
    });
  } catch (error) {
    console.error('Get NGO recommendations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate NGO recommendations'
    });
  }
};

module.exports = {
  getDonationRecommendations
};
