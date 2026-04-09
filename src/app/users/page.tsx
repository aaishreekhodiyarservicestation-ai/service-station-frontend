'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { PERMISSION_GROUPS, ROLE_TEMPLATES, Permission } from '@/config/permissions';

interface UserItem {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  permissions: string[];
  isManagement: boolean;
  stationId?: { _id: string; name: string } | null;
  isActive: boolean;
  createdAt: string;
}

interface Station {
  _id: string;
  name: string;
}

function IndeterminateCheckbox({ id, checked, indeterminate, onChange }: {
  id: string; checked: boolean; indeterminate: boolean; onChange: () => void;
}) {
  return (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 rounded border-gray-300 text-primary-600"
      ref={(el) => { if (el) el.indeterminate = indeterminate; }}
    />
  );
}

const ROLE_TEMPLATE_LABELS: Record<string, string> = {
  station_manager: 'Station Manager',
  receptionist: 'Receptionist',
  mechanic: 'Mechanic',
  accountant: 'Accountant',
  basic_staff: 'Basic Staff',
};

const getRoleBadge = (role: string) => {
  switch (role) {
    case 'admin': return 'bg-purple-100 text-purple-800';
    case 'manager': return 'bg-blue-100 text-blue-800';
    default: return 'bg-green-100 text-green-800';
  }
};

const getInitials = (name: string) =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500',
  'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500',
];
const getAvatarColor = (id: string) =>
  AVATAR_COLORS[id.charCodeAt(id.length - 1) % AVATAR_COLORS.length];

const defaultForm = () => ({
  username: '',
  email: '',
  password: '',
  fullName: '',
  role: 'staff',
  isManagement: false,
  stationId: '',
  permissions: [] as string[],
  isActive: true,
});

export default function UsersPage() {
  const router = useRouter();
  const { token, user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [formData, setFormData] = useState(defaultForm());
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [showPermissions, setShowPermissions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    const canView = currentUser?.role === 'admin' || currentUser?.permissions?.includes('staff.view');
    if (!canView) { router.push('/dashboard'); return; }
    fetchUsers();
    fetchStations();
  }, [token, currentUser]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getUsers();
      if (res.success) setUsers(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error loading staff');
    } finally {
      setLoading(false);
    }
  };

  const fetchStations = async () => {
    try {
      const res = await api.getStations();
      if (res.success) setStations(res.data.filter((s: any) => s.isActive));
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
        permissions: formData.permissions,
        isManagement: formData.isManagement,
        stationId: formData.isManagement ? null : formData.stationId || null,
        isActive: formData.isActive,
      };
      if (formData.password) payload.password = formData.password;

      if (editingUser) {
        const res = await api.updateUser(editingUser._id, payload);
        if (res.success) { fetchUsers(); closeModal(); }
      } else {
        const res = await api.register({ ...payload, username: formData.username });
        if (res.success) { fetchUsers(); closeModal(); }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Error saving staff member');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!window.confirm('Deactivate this staff member?')) return;
    try {
      await api.deleteUser(id);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error deactivating user');
    }
  };

  const handleReactivate = async (id: string) => {
    try {
      await api.reactivateUser(id);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error reactivating user');
    }
  };

  const openModal = (userItem?: UserItem) => {
    if (userItem) {
      setEditingUser(userItem);
      setFormData({
        username: userItem.username,
        email: userItem.email,
        password: '',
        fullName: userItem.fullName,
        role: userItem.role,
        isManagement: userItem.isManagement,
        stationId: userItem.stationId?._id || '',
        permissions: userItem.permissions || [],
        isActive: userItem.isActive,
      });
    } else {
      setEditingUser(null);
      setFormData(defaultForm());
    }
    setShowPermissions(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData(defaultForm());
    setShowPermissions(false);
  };

  const applyTemplate = (templateKey: string) => {
    const perms = ROLE_TEMPLATES[templateKey] || [];
    setFormData(f => ({ ...f, permissions: [...perms] }));
  };

  const togglePermission = (perm: string) => {
    setFormData(f => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter(p => p !== perm)
        : [...f.permissions, perm],
    }));
  };

  const toggleGroupAll = (groupPerms: readonly { key: string }[]) => {
    const keys = groupPerms.map(p => p.key);
    const allSelected = keys.every(k => formData.permissions.includes(k));
    setFormData(f => ({
      ...f,
      permissions: allSelected
        ? f.permissions.filter(p => !keys.includes(p))
        : [...new Set([...f.permissions, ...keys])],
    }));
  };

  const filteredUsers = (activeTab === 'active' ? users.filter(u => u.isActive) : users.filter(u => !u.isActive))
    .filter(u => !searchTerm ||
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const activeCount = users.filter(u => u.isActive).length;
  const inactiveCount = users.filter(u => !u.isActive).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading staff...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
            <p className="text-gray-500 mt-1">{activeCount} active · {inactiveCount} inactive</p>
          </div>
          {(currentUser?.role === 'admin' || currentUser?.permissions?.includes('staff.create')) && (
            <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Staff Member
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1 self-start">
            {[
              { key: 'active', label: `Active (${activeCount})` },
              { key: 'inactive', label: `Inactive (${inactiveCount})` },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search by name, username or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field max-w-sm"
          />
        </div>

        {/* Staff grid */}
        {filteredUsers.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-400 text-lg">
              {searchTerm ? 'No staff members match your search' : activeTab === 'inactive' ? 'No inactive staff' : 'No staff members yet'}
            </p>
            {!searchTerm && activeTab === 'active' && (
              <button onClick={() => openModal()} className="mt-4 btn-primary">Add First Staff Member</button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredUsers.map((userItem) => (
              <div
                key={userItem._id}
                className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow ${!userItem.isActive ? 'opacity-60' : ''}`}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`h-12 w-12 rounded-xl ${getAvatarColor(userItem._id)} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white font-bold text-sm">{getInitials(userItem.fullName)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{userItem.fullName}</h3>
                          <p className="text-sm text-gray-500 truncate">@{userItem.username}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(userItem.role)}`}>
                            {userItem.role.toUpperCase()}
                          </span>
                          {userItem.isManagement && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                              Management
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">{userItem.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
                      </svg>
                      <span>{userItem.isManagement ? 'All Stations' : userItem.stationId?.name || 'No station'}</span>
                    </div>
                  </div>

                  {/* Permission count */}
                  {userItem.role !== 'admin' && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-primary-500 h-full rounded-full"
                          style={{ width: `${Math.round((userItem.permissions?.length || 0) / 24 * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{userItem.permissions?.length || 0}/24 perms</span>
                    </div>
                  )}
                </div>

                <div className="px-5 pb-4 flex gap-2 border-t border-gray-50 pt-3">
                  {(currentUser?.role === 'admin' || currentUser?.permissions?.includes('staff.edit')) && (
                    <button onClick={() => openModal(userItem)} className="flex-1 btn-primary text-sm py-2">
                      Edit
                    </button>
                  )}
                  {userItem._id !== currentUser?._id && (currentUser?.role === 'admin' || currentUser?.permissions?.includes('staff.deactivate')) && (
                    userItem.isActive ? (
                      <button onClick={() => handleDeactivate(userItem._id)} className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                        Deactivate
                      </button>
                    ) : (
                      <button onClick={() => handleReactivate(userItem._id)} className="px-4 py-2 text-sm font-medium text-green-600 border border-green-200 rounded-lg hover:bg-green-50 transition-colors">
                        Reactivate
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-xl">
            {/* Modal header */}
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingUser ? `Edit ${editingUser.fullName}` : 'Add New Staff Member'}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {editingUser ? 'Update details, role, and permissions' : 'Fill in details and assign permissions'}
                </p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-6">

                {/* Basic info */}
                <section>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {!editingUser && (
                      <div className="col-span-2 sm:col-span-1">
                        <label className="label">Username *</label>
                        <input type="text" className="input-field" value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
                      </div>
                    )}
                    <div className={`col-span-2 ${!editingUser ? 'sm:col-span-1' : ''}`}>
                      <label className="label">Full Name *</label>
                      <input type="text" className="input-field" value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="label">Email *</label>
                      <input type="email" className="input-field" value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="label">
                        Password {editingUser ? '(leave blank to keep)' : '*'}
                      </label>
                      <input type="password" className="input-field" value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required={!editingUser} minLength={8}
                        placeholder={editingUser ? '••••••••' : 'Min 8 characters'} />
                    </div>
                  </div>
                </section>

                {/* Role & access */}
                <section>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Role & Access</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="label">Role *</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'staff', label: 'Staff', color: 'bg-green-50 border-green-200 text-green-700' },
                          { value: 'manager', label: 'Manager', color: 'bg-blue-50 border-blue-200 text-blue-700' },
                          { value: 'admin', label: 'Admin', color: 'bg-purple-50 border-purple-200 text-purple-700' },
                        ].map(r => (
                          <button
                            key={r.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, role: r.value })}
                            className={`py-2.5 px-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                              formData.role === r.value
                                ? `${r.color} border-current`
                                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                            }`}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Management toggle */}
                    <div
                      onClick={() => setFormData(f => ({ ...f, isManagement: !f.isManagement }))}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                        formData.isManagement
                          ? 'bg-orange-50 border-orange-300'
                          : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div>
                        <p className="font-medium text-gray-800 text-sm">Management Access</p>
                        <p className="text-xs text-gray-500 mt-0.5">Can view and switch between all stations</p>
                      </div>
                      <div className={`w-11 h-6 rounded-full transition-colors relative ${formData.isManagement ? 'bg-orange-500' : 'bg-gray-300'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.isManagement ? 'translate-x-6' : 'translate-x-1'}`} />
                      </div>
                    </div>

                    {/* Station assignment — only when not management */}
                    {!formData.isManagement && (
                      <div>
                        <label className="label">Assigned Station</label>
                        <select className="input-field" value={formData.stationId}
                          onChange={(e) => setFormData({ ...formData, stationId: e.target.value })}>
                          <option value="">-- None --</option>
                          {stations.map((s) => (
                            <option key={s._id} value={s._id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Active toggle */}
                    {editingUser && (
                      <div
                        onClick={() => setFormData(f => ({ ...f, isActive: !f.isActive }))}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                          formData.isActive
                            ? 'bg-green-50 border-green-300'
                            : 'bg-red-50 border-red-300'
                        }`}
                      >
                        <div>
                          <p className="font-medium text-gray-800 text-sm">Account Active</p>
                          <p className="text-xs text-gray-500 mt-0.5">{formData.isActive ? 'Staff member can log in' : 'Account is disabled'}</p>
                        </div>
                        <div className={`w-11 h-6 rounded-full transition-colors relative ${formData.isActive ? 'bg-green-500' : 'bg-red-400'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* Permissions — hidden for admin role */}
                {formData.role !== 'admin' && (
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Permissions</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{formData.permissions.length} of 24 permissions granted</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPermissions(!showPermissions)}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                      >
                        {showPermissions ? 'Hide' : 'Edit Permissions'}
                        <svg className={`h-4 w-4 transition-transform ${showPermissions ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    {/* Permission bar preview */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.round(formData.permissions.length / 24 * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 font-medium">{formData.permissions.length}/24</span>
                    </div>

                    {/* Quick templates */}
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">Quick templates:</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.keys(ROLE_TEMPLATE_LABELS).map(k => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => applyTemplate(k)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 hover:bg-primary-50 hover:text-primary-700 text-gray-600 transition-colors border border-transparent hover:border-primary-200"
                          >
                            {ROLE_TEMPLATE_LABELS[k]}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setFormData(f => ({ ...f, permissions: [] }))}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                        >
                          Clear all
                        </button>
                      </div>
                    </div>

                    {/* Permission checkboxes */}
                    {showPermissions && (
                      <div className="space-y-4 border rounded-xl p-4 bg-gray-50">
                        {PERMISSION_GROUPS.map(group => {
                          const allChecked = (group.permissions as readonly { key: string }[]).every(p => formData.permissions.includes(p.key));
                          const someChecked = (group.permissions as readonly { key: string }[]).some(p => formData.permissions.includes(p.key));
                          return (
                            <div key={group.key}>
                              <div className="flex items-center gap-2 mb-2">
                                <IndeterminateCheckbox
                                  id={`group-${group.key}`}
                                  checked={allChecked}
                                  indeterminate={!allChecked && someChecked}
                                  onChange={() => toggleGroupAll(group.permissions as readonly { key: string }[])}
                                />
                                <label htmlFor={`group-${group.key}`} className="text-sm font-semibold text-gray-700 cursor-pointer select-none">
                                  {group.icon} {group.label}
                                </label>
                              </div>
                              <div className="ml-6 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {(group.permissions as readonly { key: string; label: string }[]).map(perm => (
                                  <label key={perm.key} className="flex items-center gap-2 text-sm cursor-pointer select-none group/perm">
                                    <input
                                      type="checkbox"
                                      checked={formData.permissions.includes(perm.key)}
                                      onChange={() => togglePermission(perm.key)}
                                      className="h-3.5 w-3.5 rounded border-gray-300 text-primary-600"
                                    />
                                    <span className="text-gray-600 group-hover/perm:text-gray-900">{perm.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                )}
              </div>

              {/* Modal footer */}
              <div className="p-6 border-t flex gap-3 bg-gray-50 rounded-b-2xl">
                <button type="submit" disabled={saving} className="flex-1 btn-primary disabled:opacity-50 py-3">
                  {saving ? 'Saving...' : editingUser ? 'Save Changes' : 'Create Staff Member'}
                </button>
                <button type="button" onClick={closeModal} className="flex-1 btn-secondary py-3">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
