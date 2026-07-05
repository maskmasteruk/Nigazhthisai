import React, { useEffect, useState } from 'react';
import { 
  Users as UsersIcon, 
  Search, 
  Plus, 
  Shield, 
  Mail, 
  Edit2, 
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  X,
  Lock,
  Phone
} from 'lucide-react';
import { adminApi } from '../lib/api';
import { toast } from 'sonner';

export const Users: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  
  // Add User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'ADMIN'
  });

  // Edit User Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    role: 'ADMIN',
    status: 'ACTIVE'
  });

  // Delete User Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingUser, setDeletingUser] = useState<any | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getUsers();
      setUsers(data);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!formData.name.trim()) return toast.error('Please enter a name');
    if (!formData.email.trim()) return toast.error('Please enter an email address');
    if (!formData.password.trim()) return toast.error('Please enter a password');
    if (formData.password.length < 6) return toast.error('Password must be at least 6 characters long');

    try {
      setIsSubmitting(true);
      const response = await adminApi.addUser(formData);
      if (response.success) {
        toast.success(response.message || 'User added successfully!');
        setShowAddModal(false);
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          password: '',
          role: 'ADMIN'
        });
        // Refresh list
        fetchUsers();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to add user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (user: any) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name || '',
      phone: user.phone || '',
      role: user.role || 'ADMIN',
      status: user.status || 'ACTIVE'
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.name.trim()) return toast.error('Please enter a name');

    try {
      setIsSubmitting(true);
      const response = await adminApi.updateUser(editingUser.id, editFormData);
      if (response.success) {
        toast.success(response.message || 'User updated successfully!');
        setShowEditModal(false);
        fetchUsers();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (user: any) => {
    setDeletingUser(user);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsSubmitting(true);
      const response = await adminApi.deleteUser(deletingUser.id);
      if (response.success) {
        toast.success(response.message || 'User deleted successfully!');
        setShowDeleteConfirm(false);
        fetchUsers();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users
    .filter(user => {
      if (roleFilter === 'ALL') return true;
      return user.role === roleFilter;
    })
    .filter(user => 
      (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="space-y-6 relative">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white hover:bg-primary/95 transition-all font-bold text-xs uppercase tracking-widest active:scale-95"
        >
          <Plus size={16} />
          Add User
        </button>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {['ALL', 'MASTER_ADMIN', 'ADMIN', 'CONDUCTOR', 'DRIVER', 'PASSENGER'].map((roleOpt) => (
          <button
            key={roleOpt}
            onClick={() => setRoleFilter(roleOpt)}
            className={`px-4 py-1.5 text-xs font-black uppercase tracking-widest border transition-all rounded-sm whitespace-nowrap active:scale-95 ${
              roleFilter === roleOpt
                ? 'bg-slate-950 text-white border-slate-950 shadow-sm'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {roleOpt.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-[0.2em]">User Info</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Role</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="animate-spin text-primary" size={24} />
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading users...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No users found</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all rounded-sm">
                          <UsersIcon size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{user.name || 'Unnamed User'}</p>
                          <div className="flex items-center gap-1 text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                            <Mail size={12} />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Shield size={14} className="text-primary" />
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{user.role}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${
                        user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {user.status === 'ACTIVE' ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                        {user.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEditClick(user)}
                          className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all rounded-sm"
                          title="Edit User"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(user)}
                          className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all rounded-sm"
                          title="Delete User"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <UsersIcon className="text-primary" size={20} />
                <h3 className="text-sm font-black text-slate-950 uppercase tracking-widest">Create New User</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-all p-1 hover:bg-slate-200 rounded"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddUserSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Full Name</label>
                <div className="relative">
                  <UsersIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. John Doe"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm rounded-sm"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="e.g. john@nigazhthisai.tn.gov.in"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm rounded-sm"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm rounded-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Min 6 characters"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm rounded-sm"
                    required
                  />
                </div>
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">System Role</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm bg-white rounded-sm appearance-none"
                  >
                    <option value="PASSENGER">Passenger</option>
                    <option value="DRIVER">Driver</option>
                    <option value="CONDUCTOR">Conductor</option>
                    <option value="ADMIN">System Administrator</option>
                    <option value="MASTER_ADMIN">Master Administrator</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all font-bold text-xs uppercase tracking-widest rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 bg-primary text-white hover:bg-primary/95 transition-all font-bold text-xs uppercase tracking-widest active:scale-95 disabled:opacity-75 disabled:pointer-events-none rounded-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      Saving...
                    </>
                  ) : (
                    'Create User'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Edit2 className="text-primary" size={18} />
                <h3 className="text-sm font-black text-slate-950 uppercase tracking-widest">Edit User Profile</h3>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-all p-1 hover:bg-slate-200 rounded"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 border border-slate-100 rounded-sm mb-2 text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Email (Cannot be changed)</span>
                <span className="font-black text-slate-800">{editingUser.email}</span>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Full Name</label>
                <div className="relative">
                  <UsersIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm rounded-sm"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="tel"
                    name="phone"
                    value={editFormData.phone}
                    onChange={handleEditInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm rounded-sm"
                  />
                </div>
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">System Role</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <select
                    name="role"
                    value={editFormData.role}
                    onChange={handleEditInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm bg-white rounded-sm appearance-none"
                  >
                    <option value="PASSENGER">Passenger</option>
                    <option value="DRIVER">Driver</option>
                    <option value="CONDUCTOR">Conductor</option>
                    <option value="ADMIN">System Administrator</option>
                    <option value="MASTER_ADMIN">Master Administrator</option>
                  </select>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Account Status</label>
                <div className="relative">
                  <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <select
                    name="status"
                    value={editFormData.status}
                    onChange={handleEditInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm bg-white rounded-sm appearance-none"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all font-bold text-xs uppercase tracking-widest rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 bg-primary text-white hover:bg-primary/95 transition-all font-bold text-xs uppercase tracking-widest active:scale-95 disabled:opacity-75 disabled:pointer-events-none rounded-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation */}
      {showDeleteConfirm && deletingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200 rounded-sm">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 flex items-center justify-center rounded-sm mx-auto">
                <Trash2 size={24} />
              </div>
              <div className="text-center space-y-2">
                <h4 className="text-sm font-black text-slate-950 uppercase tracking-widest">Delete User?</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to permanently delete user <span className="font-bold text-slate-800">{deletingUser.name}</span> ({deletingUser.email})? This action cannot be undone and will delete their wallet and account too.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all font-bold text-xs uppercase tracking-widest rounded-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-rose-600 text-white hover:bg-rose-700 transition-all font-bold text-xs uppercase tracking-widest active:scale-95 disabled:opacity-75 disabled:pointer-events-none rounded-sm"
                >
                  {isSubmitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
