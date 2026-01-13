'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

interface User {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  stationId: {
    _id: string;
    name: string;
  };
  isActive: boolean;
  createdAt: string;
}

interface Station {
  _id: string;
  name: string;
}

export default function UsersPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'staff',
    stationId: '',
    isActive: true,
  });

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'admin') {
      alert('Access denied. Admin only.');
      router.push('/dashboard');
      return;
    }

    fetchUsers();
    fetchStations();
  }, [token, user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.getUsers();

      if (response.success) {
        setUsers(response.data);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const fetchStations = async () => {
    try {
      const response = await api.getStations();

      if (response.success) {
        setStations(response.data.filter((s: Station & { isActive: boolean }) => s.isActive));
      }
    } catch (err: any) {
      console.error('Error fetching stations:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingUser) {
        // Update user
        const updateData: any = {
          fullName: formData.fullName,
          email: formData.email,
          role: formData.role,
          stationId: formData.stationId,
          isActive: formData.isActive,
        };

        // Only include password if it's provided
        if (formData.password) {
          updateData.password = formData.password;
        }

        const response = await api.updateUser(editingUser._id, updateData);

        if (response.success) {
          alert('User updated successfully');
          fetchUsers();
          handleCloseModal();
        }
      } else {
        // Create user
        const response = await api.register(formData);

        if (response.success) {
          alert('User created successfully');
          fetchUsers();
          handleCloseModal();
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving user');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) {
      return;
    }

    try {
      const response = await api.deleteUser(id);

      if (response.success) {
        alert('User deactivated successfully');
        fetchUsers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error deactivating user');
    }
  };

  const handleOpenModal = (userToEdit?: User) => {
    if (userToEdit) {
      setEditingUser(userToEdit);
      setFormData({
        username: userToEdit.username,
        email: userToEdit.email,
        password: '',
        fullName: userToEdit.fullName,
        role: userToEdit.role,
        stationId: userToEdit.stationId._id,
        isActive: userToEdit.isActive,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        fullName: '',
        role: 'staff',
        stationId: stations[0]?._id || '',
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      fullName: '',
      role: 'staff',
      stationId: '',
      isActive: true,
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'staff':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage system users and permissions</p>
          </div>
          <button onClick={() => handleOpenModal()} className="btn-primary">
            + Add User
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Users Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Station
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((userItem) => (
                  <tr key={userItem._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{userItem.fullName}</div>
                        <div className="text-sm text-gray-500">{userItem.email}</div>
                        <div className="text-xs text-gray-400">@{userItem.username}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                          userItem.role
                        )}`}
                      >
                        {userItem.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {userItem.stationId.name}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          userItem.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {userItem.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenModal(userItem)}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          Edit
                        </button>
                        {userItem.isActive && userItem._id !== user?._id && (
                          <button
                            onClick={() => handleDelete(userItem._id)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {users.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No users found</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingUser && (
                  <div>
                    <label className="label">Username *</label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="label">Full Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="label">Email *</label>
                  <input
                    type="email"
                    className="input-field"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="label">
                    Password {editingUser ? '(leave blank to keep current)' : '*'}
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required={!editingUser}
                    minLength={8}
                  />
                </div>

                <div>
                  <label className="label">Role *</label>
                  <select
                    className="input-field"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    required
                  >
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="label">Station *</label>
                  <select
                    className="input-field"
                    value={formData.stationId}
                    onChange={(e) =>
                      setFormData({ ...formData, stationId: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Station</option>
                    {stations.map((station) => (
                      <option key={station._id} value={station._id}>
                        {station.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="mr-2"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Active
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="flex-1 btn-primary">
                    {editingUser ? 'Update User' : 'Create User'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
