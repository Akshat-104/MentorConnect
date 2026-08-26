const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 }, // 0 = Sun, 1 = Mon...
  startTime: { type: String, required: true }, // "09:00"
  endTime: { type: String, required: true }    // "12:00"
}, { timestamps: true });

module.exports = mongoose.model('Availability', availabilitySchema);