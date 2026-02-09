import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';

export function ProfileTab() {
  const { user, isEmailVerified } = useAuth();
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Update user profile in backend
    setMessage('Profile updated successfully!');
    setIsEditing(false);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-[#2c3e50] mb-6">My Profile</h2>

      {message && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-lg">
        <div className="mb-4">
          <label htmlFor="displayName" className="block text-sm font-medium text-[#6c7a89] mb-1">
            Full Name
          </label>
          <input
            id="displayName"
            type="text"
            value={formData.displayName}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full px-3 py-2 border border-[#d3dce6] rounded-lg text-sm text-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#3898ec] focus:border-transparent disabled:bg-gray-100"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-[#6c7a89] mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            disabled
            className="w-full px-3 py-2 border border-[#d3dce6] rounded-lg text-sm text-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#3898ec] focus:border-transparent disabled:bg-gray-100"
          />
          <p className="mt-1 text-xs text-[#6c7a89]">
            {isEmailVerified ? (
              <span className="text-green-600">✓ Email verified</span>
            ) : (
              <span className="text-yellow-600">Email not verified</span>
            )}
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-[#6c7a89] mb-1">
            Account Status
          </label>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            Active
          </span>
        </div>

        {isEditing ? (
          <div className="flex gap-3">
            <button
              type="submit"
              className="px-4 py-2 bg-[#3898ec] text-white rounded-lg text-sm font-medium hover:bg-[#2d7bc4] transition-colors"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-200 text-[#6c7a89] rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-[#3898ec] text-white rounded-lg text-sm font-medium hover:bg-[#2d7bc4] transition-colors"
          >
            Edit Profile
          </button>
        )}
      </form>
    </div>
  );
}

export default ProfileTab;
