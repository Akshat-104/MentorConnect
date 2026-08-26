const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: { 
    type: String, 
    enum: ['CONFIRMED', 'CANCELLED', 'COMPLETED'], 
    default: 'CONFIRMED' 
  },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);