const express = require('express');

const authMiddleware = require('../middleware/auth');
const User = require('../models/user');

const router = express.Router();

// ==========================================
// GET CURRENT USER
// GET /api/users/me
// ==========================================
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get current user error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
});

router.patch('/me/food-support', authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'ngo') {
      return res.status(403).json({
        success: false,
        message: 'Only NGOs can update food matching preferences'
      });
    }

    const foodTypes = [
      'Cooked Food',
      'Packaged Food',
      'Fruits & Vegetables',
      'Bakery',
      'Other'
    ];
    const foodPreferences = [
      'Vegetarian',
      'Non-Vegetarian',
      'Mixed'
    ];
    const { supportedFoodTypes, supportedFoodPreferences } = req.body;
    const validTypes = Array.isArray(supportedFoodTypes)
      ? [...new Set(supportedFoodTypes.filter((value) => foodTypes.includes(value)))]
      : [];
    const validPreferences = Array.isArray(supportedFoodPreferences)
      ? [...new Set(
        supportedFoodPreferences.filter((value) => foodPreferences.includes(value))
      )]
      : [];

    if (!validTypes.length || !validPreferences.length) {
      return res.status(400).json({
        success: false,
        message: 'Select at least one food type and one dietary preference'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id || req.user._id,
      {
        $set: {
          supportedFoodTypes: validTypes,
          supportedFoodPreferences: validPreferences
        }
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'NGO account not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Food matching preferences updated',
      user
    });
  } catch (error) {
    console.error('Update NGO food preferences error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update food matching preferences'
    });
  }
});


// ==========================================
// GET USER BY ID
// GET /api/users/:id
// ==========================================
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get user error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
});


module.exports = router;