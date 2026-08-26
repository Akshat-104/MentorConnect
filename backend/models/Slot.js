const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  isBooked: { type: Boolean, default: false }
}, { timestamps: true });

// Prevent duplicate slot creation for the same mentor at the same time
slotSchema.index({ mentorId: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('Slot', slotSchema);