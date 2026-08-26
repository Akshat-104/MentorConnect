const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { 
        type: String, 
        enum: ['STUDENT', 'MENTOR', 'ADMIN'], 
        default: 'STUDENT' 
    },
  // Mentor Specific Fields
  applicationStatus: { 
    type: String, 
    enum: ['PENDING', 'APPROVED', 'REJECTED'], 
    default: 'PENDING' 
  },
  professionalTitle: { type: String, default: '' },
  expertise: [{ type: String }],
  yearsOfExperience: { type: Number, default: 0 },
  bio: { type: String, default: '' },
  linkedinUrl: { type: String, default: '' },
  preferredDuration: { type: Number, enum: [30, 60], default: 30 },
  avgRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 }
},{timestamps:true})

module.exports = mongoose.model('User',userSchema);