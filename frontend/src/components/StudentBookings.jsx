import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, User, Clock, AlertCircle, XCircle } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:4444/api/bookings';

export default function StudentBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Helper to fetch authorization header from localStorage
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch student's sessions
  const fetchMySessions = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`${API_BASE}/my-sessions`, {
        headers: getAuthHeaders(),
      });
      setBookings(res.data?.data?.bookings || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMySessions();
  }, []);

  // Handle session cancellation
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking session?')) {
      return;
    }

    try {
      setActionLoading(bookingId);
      await axios.delete(`http://localhost:4444/api/bookings/${bookingId}`, {
  headers: getAuthHeaders()
});

      // Refresh list after successful cancellation
      fetchMySessions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">My Sessions</h1>
        <p className="text-slate-600 text-sm">Manage your scheduled mentorship calls and history.</p>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading your sessions...</p>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2 text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" /> {error}
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl text-center text-slate-500 border border-slate-200">
          No scheduled sessions found.
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const mentor = booking.mentorId || {};
            const start = new Date(booking.startTime);
            const end = new Date(booking.endTime);

            const dateStr = start.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            const timeStr = `${start.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })} - ${end.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}`;

            return (
              <div
                key={booking._id}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        booking.status === 'CONFIRMED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : booking.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {booking.status}
                    </span>
                    <span className="text-xs text-slate-400">ID: #{booking._id.slice(-6)}</span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600" /> {mentor.name || 'Mentor'}
                  </h3>
                  <p className="text-xs text-slate-500">{mentor.professionalTitle || 'N/A'}</p>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <div className="md:text-right">
                    <p className="text-sm font-bold text-slate-800 flex items-center gap-1 md:justify-end">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> {dateStr}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 md:justify-end mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> {timeStr}
                    </p>
                  </div>

                  {booking.status === 'CONFIRMED' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => alert('Meeting integration coming soon!')}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded-xl font-semibold transition-colors"
                      >
                        Join Meeting
                      </button>
                      <button
                        disabled={actionLoading === booking._id}
                        onClick={() => handleCancelBooking(booking._id)}
                        className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs px-3 py-2 rounded-xl font-semibold transition-colors flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        {actionLoading === booking._id ? 'Cancelling...' : 'Cancel'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}