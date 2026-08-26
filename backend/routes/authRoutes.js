const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Helper to sign JWT Tokens
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register Student, Mentor, or Admin
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role, professionalTitle, expertise, yearsOfExperience, bio, linkedinUrl, preferredDuration } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ status: 'fail', message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userPayload = {
      name,
      email,
      password: hashedPassword,
      role: role || 'STUDENT'
    };

    // Include optional Mentor profile data if registering as a mentor
    if (role === 'MENTOR') {
      userPayload.professionalTitle = professionalTitle;
      userPayload.expertise = expertise || [];
      userPayload.yearsOfExperience = yearsOfExperience || 0;
      userPayload.bio = bio;
      userPayload.linkedinUrl = linkedinUrl;
      userPayload.preferredDuration = preferredDuration || 30;
      userPayload.applicationStatus = 'PENDING';
    }

    const newUser = await User.create(userPayload);
    const token = generateToken(newUser);

    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      token,
      user: userResponse
    });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate User & get token
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: 'fail', message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ status: 'fail', message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ status: 'fail', message: 'Invalid credentials.' });
    }

    const token = generateToken(user);
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      status: 'success',
      token,
      user: userResponse
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;