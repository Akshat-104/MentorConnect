import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authContext } from '../context/authContext';
import axios from 'axios';

const REGISTER_URL = 'http://localhost:4444/api/auth/register';

export default function Register() {
  const { login } = useContext(authContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
    professionalTitle: '',
    expertise: '',
    yearsOfExperience: '',
    bio: '',
    preferredDuration: '60',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Build request payload
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      if (formData.role === 'MENTOR') {
        payload.professionalTitle = formData.professionalTitle;
        payload.expertise = formData.expertise
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
        payload.yearsOfExperience = Number(formData.yearsOfExperience);
        payload.bio = formData.bio;
        payload.preferredDuration = Number(formData.preferredDuration);
      }

      // Direct axios post call
      const response = await axios.post(REGISTER_URL, payload);

      // Flexible extraction depending on backend response shape
      const token = response.data.token || response.data.data?.token;
      const user = response.data.user || response.data.data?.user;

      if (!token || !user) {
        throw new Error('Invalid server response structure');
      }

      login(user, token);

      if (user.role === 'ADMIN') {
        navigate('/admin/applications');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Registration failed. Please check your inputs.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-6 rounded-2xl bg-white p-8 shadow-sm border border-slate-200">
        <div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">
            Create an Account
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in here
            </Link>
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200 text-sm text-red-600">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Account Role Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              I want to register as
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['STUDENT', 'MENTOR', 'ADMIN'].map((roleOption) => (
                <button
                  type="button"
                  key={roleOption}
                  onClick={() => setFormData((prev) => ({ ...prev, role: roleOption }))}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors ${
                    formData.role === roleOption
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {roleOption}
                </button>
              ))}
            </div>
          </div>

          {/* Basic User Information */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {/* Conditional Mentor Fields */}
          {formData.role === 'MENTOR' && (
            <div className="space-y-4 pt-2 border-t border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Mentor Application Details
              </p>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Professional Title
                </label>
                <input
                  name="professionalTitle"
                  type="text"
                  required={formData.role === 'MENTOR'}
                  value={formData.professionalTitle}
                  onChange={handleChange}
                  placeholder="Senior Software Engineer"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Expertise (Comma-separated)
                </label>
                <input
                  name="expertise"
                  type="text"
                  required={formData.role === 'MENTOR'}
                  value={formData.expertise}
                  onChange={handleChange}
                  placeholder="Node.js, React, MongoDB"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Years Experience
                  </label>
                  <input
                    name="yearsOfExperience"
                    type="number"
                    min="0"
                    required={formData.role === 'MENTOR'}
                    value={formData.yearsOfExperience}
                    onChange={handleChange}
                    placeholder="5"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Slot Duration (Mins)
                  </label>
                  <select
                    name="preferredDuration"
                    value={formData.preferredDuration}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm bg-white"
                  >
                    <option value="30">30 Mins</option>
                    <option value="45">45 Mins</option>
                    <option value="60">60 Mins</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Short Bio
                </label>
                <textarea
                  name="bio"
                  rows="3"
                  required={formData.role === 'MENTOR'}
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Describe your background and what topics you mentor..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400 transition-colors mt-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Creating Account...
              </>
            ) : (
              'Register'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}