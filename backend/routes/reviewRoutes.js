const express = require('express');
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Helper to recalculate and update mentor's average rating
const updateMentorRating = async (mentorId) => {
  const stats = await Review.aggregate([
    { $match: { mentorId: new mongoose.Types.ObjectId(mentorId) } },
    {
      $group: {
        _id: '$mentorId',
        avgRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await User.findByIdAndUpdate(mentorId, {
      avgRating: parseFloat(stats[0].avgRating.toFixed(1)),
      reviewCount: stats[0].reviewCount
    });
  } else {
    await User.findByIdAndUpdate(mentorId, {
      avgRating: 0,
      reviewCount: 0
    });
  }
};

// @route   POST /api/reviews
// @desc    Submit a review for a completed session
// @access  Private (STUDENT only)
router.post('/', authenticateJWT, authorizeRoles('STUDENT'), async (req, res, next) => {
  try {
    const { bookingId, rating, feedback } = req.body;
    const studentId = req.user.id;

    // 1. Validation: Rating score
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        status: 'fail',
        message: 'Rating must be a number between 1 and 5.'
      });
    }

    // 2. Fetch booking & verify ownership + completed status
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ status: 'fail', message: 'Booking not found.' });
    }

    if (booking.studentId.toString() !== studentId) {
      return res.status(403).json({
        status: 'fail',
        message: 'You can only review sessions that you booked.'
      });
    }

    if (booking.status !== 'COMPLETED') {
      return res.status(400).json({
        status: 'fail',
        message: 'Reviews can only be submitted for completed sessions.'
      });
    }

    // 3. Check for duplicate review
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return res.status(400).json({
        status: 'fail',
        message: 'You have already submitted a review for this session.'
      });
    }

    // 4. Create Review
    const review = await Review.create({
      bookingId,
      studentId,
      mentorId: booking.mentorId,
      rating,
      feedback: feedback || ''
    });

    // 5. Recalculate mentor rating aggregate
    await updateMentorRating(booking.mentorId);

    res.status(201).json({
      status: 'success',
      message: 'Review submitted successfully.',
      data: { review }
    });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/reviews/mentor/:mentorId
// @desc    Get all reviews for a specific mentor
// @access  Public
router.get('/mentor/:mentorId', async (req, res, next) => {
  try {
    const { mentorId } = req.params;

    const reviews = await Review.find({ mentorId })
      .populate('studentId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: reviews.length,
      data: { reviews }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;