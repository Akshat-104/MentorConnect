import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, Plus, Trash2, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const API_BASE = 'http://localhost:4444/api/mentors/availability';

export default function MentorSchedule() {
  const [schedule, setSchedule] = useState([]);
  const [newSlot, setNewSlot] = useState({ dayOfWeek: 1, startTime: '09:00', endTime: '10:00' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Helper to extract JWT token from localStorage
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch initial schedule from backend
  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(API_BASE, {
        headers: getAuthHeaders(),
      });
      const data = res.data?.data || res.data?.schedule || res.data || [];
      setSchedule(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load availability schedule.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  // Save full schedule to backend
  const handleSaveSchedule = async (updatedSchedule = schedule) => {
    try {
      setSaving(true);
      setError('');
      
      // Map slots to backend fields
      const payload = updatedSchedule.map(({ dayOfWeek, startTime, endTime }) => ({
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
      }));

      // Fixed payload key from `slots` to `schedule`
      await axios.post(
        API_BASE,
        { schedule: payload },
        { headers: getAuthHeaders() }
      );

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save availability.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSlot = (e) => {
    e.preventDefault();
    if (newSlot.startTime >= newSlot.endTime) {
      alert('Start time must be strictly earlier than End time.');
      return;
    }

    const updated = [...schedule, { ...newSlot, id: Date.now() }];
    setSchedule(updated);
    setSaved(false);
  };

  const handleRemoveSlot = (indexOrId) => {
    const updated = schedule.filter((_, idx) => idx !== indexOrId && schedule[idx].id !== indexOrId);
    setSchedule(updated);
    setSaved(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Availability</h1>
          <p className="text-slate-600 text-sm">Configure your weekly recurring time slots for student bookings.</p>
        </div>
        <button
          onClick={() => handleSaveSchedule(schedule)}
          disabled={saving || loading}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {saved ? <CheckCircle className="w-4 h-4" /> : null}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Availability'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2 text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Add Slot Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" /> Add Time Slot
          </h2>
          <form onSubmit={handleAddSlot} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Day</label>
              <select
                value={newSlot.dayOfWeek}
                onChange={(e) => setNewSlot({ ...newSlot, dayOfWeek: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm bg-white"
              >
                {DAYS.map((day, idx) => (
                  <option key={day} value={idx + 1}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
              <input
                type="time"
                value={newSlot.startTime}
                onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Time</label>
              <input
                type="time"
                value={newSlot.endTime}
                onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors mt-2"
            >
              <Plus className="w-4 h-4" /> Add Slot
            </button>
          </form>
        </div>

        {/* Schedule Preview */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" /> Active Schedule
          </h2>

          {loading ? (
            <p className="text-sm text-slate-500 py-8 text-center">Loading availability schedule...</p>
          ) : schedule.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">No recurring slots configured yet.</p>
          ) : (
            <div className="space-y-3">
              {schedule.map((item, index) => (
                <div
                  key={item._id || item.id || index}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50"
                >
                  <div>
                    <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                      {DAYS[item.dayOfWeek - 1]}
                    </span>
                    <p className="text-sm font-semibold text-slate-800 mt-1">
                      {item.startTime} — {item.endTime}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveSlot(index)}
                    className="text-slate-400 hover:text-red-500 p-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}