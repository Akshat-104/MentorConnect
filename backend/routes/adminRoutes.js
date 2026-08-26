const express = require('express');
const User = require('../models/User');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Enforce authentication & ADMIN role for all admin routes
router.use(authenticateJWT, authorizeRoles('ADMIN'));

// @route   GET /api/admin/applications
// @desc    View, search, and filter mentor applications
// @access  Admin Only
router.get('/applications', async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    // Base query: Fetch users registered as MENTOR
    const query = { role: 'MENTOR' };

    // Filter by status (PENDING, APPROVED, REJECTED)
    if (status) {
      query.applicationStatus = status.toUpperCase();
    }

    // Search by mentor name or expertise
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { expertise: { $regex: search, $options: 'i' } },
        { professionalTitle: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const applications = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments(query);

    res.status(200).json({
      status: 'success',
      results: applications.length,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum)
      },
      data: { applications }
    });
  } catch (err) {
    next(err);
  }
});

// @route   PATCH /api/admin/applications/:id/status
// @desc    Approve or Reject a mentor application
// @access  Admin Only
router.patch('/applications/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // Expecting 'APPROVED' or 'REJECTED'

    if (!['APPROVED', 'REJECTED'].includes(status?.toUpperCase())) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid status. Status must be either APPROVED or REJECTED.'
      });
    }

    const mentor = await User.findOne({ _id: id, role: 'MENTOR' });

    if (!mentor) {
      return res.status(404).json({
        status: 'fail',
        message: 'Mentor application not found.'
      });
    }

    mentor.applicationStatus = status.toUpperCase();
    await mentor.save();

    const mentorResponse = mentor.toObject();
    delete mentorResponse.password;

    res.status(200).json({
      status: 'success',
      message: `Mentor application marked as ${status.toUpperCase()}.`,
      data: { mentor: mentorResponse }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;