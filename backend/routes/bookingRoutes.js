const express = require('express');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const User = require('../models/User');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/bookings
// @desc    Book an available slot (Student Only)
// @access  Private (STUDENT)
router.post('/', authenticateJWT, authorizeRoles('STUDENT'), async (req, res, next) => {
  try {
    const { slotId } = req.body;
    const studentId = req.user.id || req.user._id;

    if (!slotId) {
      return res.status(400).json({ status: 'fail', message: 'Slot ID is required.' });
    }

    // 1. Fetch Slot & Validate
    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ status: 'fail', message: 'Slot not found.' });
    }

    if (slot.isBooked) {
      return res.status(400).json({ status: 'fail', message: 'Slot is already booked.' });
    }

    if (new Date(slot.startTime).getTime() <= Date.now()) {
      return res.status(400).json({ status: 'fail', message: 'Cannot book past slots.' });
    }

    // 2. Validate Mentor Approval
    const mentor = await User.findById(slot.mentorId);
    if (!mentor || mentor.applicationStatus !== 'APPROVED') {
      return res.status(400).json({ status: 'fail', message: 'Mentor is not approved for bookings.' });
    }

    // 3. Check Student Overlapping Bookings
    const studentConflict = await Booking.findOne({
      studentId,
      status: 'CONFIRMED',
      startTime: { $lt: slot.endTime },
      endTime: { $gt: slot.startTime }
    });

    if (studentConflict) {
      return res.status(400).json({
        status: 'fail',
        message: 'You already have another confirmed booking during this time slot.'
      });
    }

    // 4. Atomic Lock: Mark slot as booked
    const updatedSlot = await Slot.findOneAndUpdate(
      { _id: slotId, isBooked: false },
      { $set: { isBooked: true } },
      { new: true }
    );

    if (!updatedSlot) {
      return res.status(409).json({
        status: 'fail',
        message: 'Slot was booked by another user.'
      });
    }

    // 5. Create Booking Record
    const newBooking = await Booking.create({
      slotId: slot._id,
      studentId,
      mentorId: slot.mentorId,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: 'CONFIRMED'
    });

    res.status(201).json({
      status: 'success',
      message: 'Session booked successfully.',
      data: { booking: newBooking }
    });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/bookings/my-sessions
// @desc    View upcoming/past sessions for logged-in Student or Mentor
// @access  Private (STUDENT / MENTOR)
router.get('/my-sessions', authenticateJWT, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    const filter = role === 'MENTOR' ? { mentorId: userId } : { studentId: userId };

    const bookings = await Booking.find(filter)
      .populate('studentId', 'name email')
      .populate('mentorId', 'name professionalTitle bio')
      .populate('slotId')
      .sort({ startTime: 1 });

    res.status(200).json({
      status: 'success',
      results: bookings.length,
      data: { bookings }
    });
  } catch (err) {
    next(err);
  }
});

// @route   DELETE /api/bookings/:id
// @desc    Cancel a booking and release the slot back to the pool
// @access  Private (STUDENT)
router.delete('/:id', authenticateJWT, authorizeRoles('STUDENT'), async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const studentId = req.user.id || req.user._id;

    // 1. Fetch booking belonging to logged-in student
    const booking = await Booking.findOne({ _id: bookingId, studentId });

    if (!booking) {
      return res.status(404).json({ status: 'fail', message: 'Booking not found.' });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ status: 'fail', message: 'Booking is already cancelled.' });
    }

    // 2. Update Booking Status
    booking.status = 'CANCELLED';
    await booking.save();

    // 3. Release Slot back to pool
    if (booking.slotId) {
      await Slot.findByIdAndUpdate(booking.slotId, { $set: { isBooked: false } });
    }

    res.status(200).json({
      status: 'success',
      message: 'Booking cancelled successfully and slot released.',
      data: { booking }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;