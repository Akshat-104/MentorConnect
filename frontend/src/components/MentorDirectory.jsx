import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Calendar, CheckCircle, Briefcase, Clock, AlertCircle } from 'lucide-react';

const API_BASE = 'http://localhost:4444/api';

export default function MentorDirectory() {
  const [mentors, setMentors] = useState([]);
  const [loadingMentors, setLoadingMentors] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Slot modal states
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Booking states
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [modalError, setModalError] = useState('');

  // Helper to construct Auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch all approved mentors
  const fetchMentors = async () => {
    try {
      setLoadingMentors(true);
      setError('');
      const res = await axios.get(`${API_BASE}/mentors`, {
        headers: getAuthHeaders(),
      });
      const mentorList = res.data?.data?.mentors || res.data?.mentors || res.data || [];
      setMentors(Array.isArray(mentorList) ? mentorList : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch mentors.');
    } finally {
      setLoadingMentors(false);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, []);

  // Open modal and fetch mentor slots
  const handleOpenSlotsModal = async (mentor) => {
    setSelectedMentor(mentor);
    setLoadingSlots(true);
    setModalError('');
    setBookingSuccess(false);

    try {
      const res = await axios.get(`${API_BASE}/mentors/${mentor._id}/slots`, {
        headers: getAuthHeaders(),
      });
      const rawSlots = res.data?.data?.slots || res.data?.slots || res.data || [];
      
      // Filter out past slots and already booked slots directly on frontend
      const now = new Date();
      const validSlots = (Array.isArray(rawSlots) ? rawSlots : []).filter(
        (slot) => !slot.isBooked && new Date(slot.startTime) > now
      );

      setSlots(validSlots);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to load available slots.');
    } finally {
      setLoadingSlots(false);
    }
  };

  // POST /api/bookings with exact { slotId } body matching route parameter expectation
  const handleBookSlot = async (slotId) => {
    try {
      setBookingLoading(true);
      setModalError('');

      const res = await axios.post(
        `${API_BASE}/bookings`,
        { slotId }, // Exactly matches `const { slotId } = req.body;`
        { headers: getAuthHeaders() }
      );

      if (res.data?.status === 'success' || res.status === 201) {
        setBookingSuccess(true);
        // Remove booked slot from modal list
        setSlots((prevSlots) => prevSlots.filter((s) => s._id !== slotId));

        setTimeout(() => {
          setBookingSuccess(false);
          setSelectedMentor(null);
        }, 2000);
      }
    } catch (err) {
      console.error('Booking failed:', err.response?.data);
      setModalError(
        err.response?.data?.message || 'Failed to book session slot.'
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const filteredMentors = mentors.filter((m) => {
    const query = search.toLowerCase();
    const nameMatch = m.name?.toLowerCase().includes(query);
    const titleMatch = m.professionalTitle?.toLowerCase().includes(query);
    const skillMatch = m.expertise?.some((e) => e.toLowerCase().includes(query));

    return nameMatch || titleMatch || skillMatch;
  });

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Find a Mentor</h1>
          <p className="text-slate-600 text-sm">Connect with experienced professionals for 1-on-1 guidance.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by skill, title or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Mentor List Grid */}
      {loadingMentors ? (
        <p className="text-slate-500 text-sm">Loading approved mentors...</p>
      ) : error ? (
        <p className="text-red-500 text-sm">{error}</p>
      ) : filteredMentors.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl text-center text-slate-500 border border-slate-200">
          No mentors found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredMentors.map((mentor) => (
            <div
              key={mentor._id}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{mentor.name}</h3>
                    <p className="text-sm font-semibold text-indigo-600 flex items-center gap-1 mt-0.5">
                      <Briefcase className="w-3.5 h-3.5" /> {mentor.professionalTitle || 'Mentor'}
                    </p>
                  </div>
                  {mentor.yearsOfExperience && (
                    <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-full">
                      {mentor.yearsOfExperience}+ Yrs Exp
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">{mentor.bio}</p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {mentor.expertise?.map((skill) => (
                    <span key={skill} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleOpenSlotsModal(mentor)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" /> View Time Slots
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {selectedMentor && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedMentor.name}</h3>
                <p className="text-xs text-slate-500">Available session time slots</p>
              </div>
              <button
                onClick={() => setSelectedMentor(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl flex items-center gap-2 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" /> {modalError}
              </div>
            )}

            {bookingSuccess ? (
              <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl flex items-center gap-2 font-medium text-sm">
                <CheckCircle className="w-5 h-5 shrink-0" /> Session booked successfully!
              </div>
            ) : loadingSlots ? (
              <p className="text-slate-500 text-sm text-center py-4">Fetching available slots...</p>
            ) : slots.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">No available upcoming slots for this mentor.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {slots.map((slot) => {
                  const start = new Date(slot.startTime);
                  const end = new Date(slot.endTime);

                  const dateStr = !isNaN(start)
                    ? start.toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })
                    : slot.startTime;

                  const timeStr =
                    !isNaN(start) && !isNaN(end)
                      ? `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : `${slot.startTime} - ${slot.endTime}`;

                  return (
                    <div
                      key={slot._id}
                      className="flex justify-between items-center p-3 rounded-xl border border-slate-200 hover:border-indigo-500 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-indigo-600">{dateStr}</p>
                        <p className="text-xs font-medium text-slate-800 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" /> {timeStr}
                        </p>
                      </div>
                      <button
                        disabled={bookingLoading}
                        onClick={() => handleBookSlot(slot._id)}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
                      >
                        {bookingLoading ? 'Booking...' : 'Book Session'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}