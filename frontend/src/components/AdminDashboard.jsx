import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BASE_URL = 'https://mentorconnect-szhf.onrender.com/api/admin/applications';

export default function AdminDashboard() {
  const [applications, setApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Helper to fetch the stored JWT token
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await axios.get(`${BASE_URL}?status=${statusFilter}`, {
        headers: getAuthHeaders(),
      });

      // Flexible extraction depending on backend payload structure
      const apps =
        res.data?.data?.applications ||
        res.data?.applications ||
        res.data?.data ||
        [];

      setApplications(apps);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load applications.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await axios.patch(
        `${BASE_URL}/${id}/status`,
        { status },
        { headers: getAuthHeaders() }
      );
      fetchApplications(); // Refresh list after update
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600 text-sm">Review and manage mentor applications</p>
        </div>
        <div className="flex gap-2">
          {['PENDING', 'APPROVED', 'REJECTED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                statusFilter === status
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading applications...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : applications.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl text-center text-slate-500 border border-slate-200">
          No {statusFilter.toLowerCase()} applications found.
        </div>
      ) : (
        <div className="grid gap-4">
          {applications.map((app) => (
            <div
              key={app._id}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-start"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{app.name}</h3>
                  <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                    {app.professionalTitle || 'N/A'}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{app.email}</p>
                <div className="flex flex-wrap gap-1">
                  {app.expertise?.map((skill, index) => (
                    <span
                      key={index}
                      className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-500 italic mt-2">{app.bio}</p>
              </div>

              {statusFilter === 'PENDING' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusUpdate(app._id, 'APPROVED')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(app._id, 'REJECTED')}
                    className="bg-red-600 hover:bg-red-500 text-white text-xs px-3 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}