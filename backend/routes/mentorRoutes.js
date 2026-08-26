const express = require('express');
const User = require('../models/User');
const Availability = require('../models/Availability');
const Slot = require('../models/Slot');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');
const { generateSlotsForMentor } = require('../utils/slotGenerator');

const router = express.Router();

// @route   GET /api/mentors
// @desc    Public/Student endpoint to browse ONLY approved mentors
router.get('/', async (req, res, next) => {
  try {
    const mentors = await User.find({ role: 'MENTOR', applicationStatus: 'APPROVED' })
      .select('-password');

    res.status(200).json({
      status: 'success',
      results: mentors.length,
      data: { mentors }
    });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/mentors/availability
// @desc    Set or Update weekly recurring availability and regenerate future slots
// @access  Mentor Only (Must be APPROVED)
router.post('/availability', authenticateJWT, authorizeRoles('MENTOR'), async (req, res, next) => {
  try {
    const mentorId = req.user.id;
    const mentor = await User.findById(mentorId);

    if (mentor.applicationStatus !== 'APPROVED') {
      return res.status(403).json({
        status: 'fail',
        message: 'Only approved mentors can configure availability.'
      });
    }

    // Schedule payload format: [{ dayOfWeek: 1, startTime: "09:00", endTime: "12:00" }]
    const { schedule } = req.body;

    if (!Array.isArray(schedule)) {
      return res.status(400).json({ status: 'fail', message: 'Schedule must be an array of time blocks.' });
    }

    // 1. Clear previous weekly availability configuration
    await Availability.deleteMany({ mentorId });

    // 2. Insert new weekly schedule
    const newAvailabilities = schedule.map((item) => ({
      mentorId,
      dayOfWeek: item.dayOfWeek,
      startTime: item.startTime,
      endTime: item.endTime
    }));
    const savedAvailabilities = await Availability.insertMany(newAvailabilities);

    // 3. Safe Regeneration Strategy:
    // Delete future UNBOOKED slots to reflect updated availability
    await Slot.deleteMany({
      mentorId,
      isBooked: false,
      startTime: { $gt: new Date() }
    });

    // 4. Generate fresh slots while leaving confirmed bookings and past slots intact
    await generateSlotsForMentor(mentorId, savedAvailabilities, mentor.preferredDuration || 30);

    res.status(200).json({
      status: 'success',
      message: 'Weekly availability updated and future slots generated successfully.',
      data: { availabilities: savedAvailabilities }
    });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/mentors/:id/slots
// @desc    Fetch available (unbooked) future slots for a mentor
router.get('/:id/slots', async (req, res, next) => {
  try {
    const { id } = req.params;

    const slots = await Slot.find({
      mentorId: id,
      isBooked: false,
      startTime: { $gt: new Date() }
    }).sort({ startTime: 1 });

    res.status(200).json({
      status: 'success',
      results: slots.length,
      data: { slots }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;