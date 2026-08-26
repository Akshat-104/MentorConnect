const Slot = require('../models/Slot');

/**
 * Generates bookable slots for a mentor for the next 14 days
 * based on their recurring weekly availability.
 */
const generateSlotsForMentor = async (mentorId, availabilities, preferredDuration) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const slotsToCreate = [];

  // Generate slots for the next 14 days
  for (let i = 0; i < 14; i++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + i);
    const dayOfWeek = currentDate.getDay(); // 0 = Sun, 1 = Mon...

    // Find recurring slots matching current day of week
    const matchingAvailabilities = availabilities.filter(
      (avail) => avail.dayOfWeek === dayOfWeek
    );

    for (const avail of matchingAvailabilities) {
      const [startHour, startMin] = avail.startTime.split(':').map(Number);
      const [endHour, endMin] = avail.endTime.split(':').map(Number);

      let slotStart = new Date(currentDate);
      slotStart.setHours(startHour, startMin, 0, 0);

      const slotEndBoundary = new Date(currentDate);
      slotEndBoundary.setHours(endHour, endMin, 0, 0);

      // Break availability window into session durations
      while (true) {
        const slotEnd = new Date(slotStart.getTime() + preferredDuration * 60000);

        if (slotEnd > slotEndBoundary) break;

        // Only create slots in the future
        if (slotStart > new Date()) {
          slotsToCreate.push({
            mentorId,
            startTime: new Date(slotStart),
            endTime: new Date(slotEnd),
            isBooked: false
          });
        }

        slotStart = slotEnd;
      }
    }
  }

  // Use bulkWrite with upsert to prevent duplicate key errors and preserve existing slots
  if (slotsToCreate.length > 0) {
    const operations = slotsToCreate.map((slot) => ({
      updateOne: {
        filter: { mentorId: slot.mentorId, startTime: slot.startTime },
        update: { $setOnInsert: slot },
        upsert: true
      }
    }));

    await Slot.bulkWrite(operations);
  }
};

module.exports = { generateSlotsForMentor };