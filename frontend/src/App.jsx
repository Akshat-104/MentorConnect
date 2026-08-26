import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import AdminDashboard from './components/AdminDashboard';
import MentorSchedule from './components/MentorSchedule';
import MentorDirectory from './components/MentorDirectory';
import StudentBookings from './components/StudentBookings';

// Inner Navbar component to safely access useNavigate and handle dynamic auth state
function NavigationBar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="bg-slate-900 text-white px-6 py-3 flex justify-between items-center shadow-md">
      <Link to="/" className="text-xl font-bold text-indigo-400">MentorConnect</Link>
      <div className="flex gap-4 text-sm font-semibold items-center">
        <Link to="/mentors" className="hover:text-indigo-300">Find Mentors</Link>
        <Link to="/bookings" className="hover:text-indigo-300">My Sessions</Link>
        <Link to="/mentor/schedule" className="hover:text-indigo-300">Schedule</Link>
        <Link to="/admin/applications" className="hover:text-indigo-300">Admin</Link>
        
        {token ? (
          <button 
            onClick={handleLogout} 
            className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded-lg transition-colors cursor-pointer"
          >
            Logout
          </button>
        ) : (
          <Link to="/login" className="bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded-lg">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
        {/* Navigation Bar */}
        <NavigationBar />

        {/* Page Container */}
        <main className="max-w-6xl mx-auto p-6">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin/applications" element={<AdminDashboard />} />
            <Route path="/mentor/schedule" element={<MentorSchedule />} />
            <Route path="/mentors" element={<MentorDirectory />} />
            <Route path="/bookings" element={<StudentBookings />} />
            <Route path="*" element={<Navigate to="/mentors" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}