import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bus as BusIcon, 
  Search, 
  Plus, 
  MoreVertical, 
  Edit2, 
  Trash2,
  Cpu,
  Loader2,
  X,
  Filter,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../../lib/api';
import { toast } from 'sonner';

export const BusesList: React.FC = () => {
  const navigate = useNavigate();
  const [buses, setBuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedZone, setSelectedZone] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({
    reg_no: '',
    model: '',
    type: 'NON-AC',
    etm_id: '',
    district: '',
    zone: '',
    status: 'ACTIVE'
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const userRole = localStorage.getItem('user_role') || 'ADMIN';
  const isMaster = userRole === 'MASTER_ADMIN';

  const DISTRICTS = ['All', 'Chennai', 'Madurai', 'Coimbatore', 'Salem', 'Tiruppur', 'Trichy', 'Erode'];
  const ZONES = ['All', 'North', 'South', 'West', 'East', 'Central'];
  const [submitting, setSubmitting] = useState(false);
  const [newBus, setNewBus] = useState({
    reg_no: '',
    model: '',
    type: 'NON-AC',
    etm_id: '',
    district: '',
    zone: ''
  });

  const fetchBuses = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getBuses();
      setBuses(data);
    } catch (error) {
      toast.error('Failed to fetch buses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuses();
  }, []);

  const handleAddBus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBus.reg_no || !newBus.model || !newBus.etm_id || !newBus.district || !newBus.zone) {
      toast.error('Please fill all mandatory fields including District and Zone');
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.addBus(newBus);
      toast.success('Bus added successfully');
      setIsAddModalOpen(false);
      setNewBus({ reg_no: '', model: '', type: 'NON-AC', etm_id: '', district: '', zone: '' });
      fetchBuses();
    } catch (error) {
      toast.error('Failed to add bus');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (bus: any) => {
    setEditingBus(bus);
    setEditFormData({
      reg_no: bus.reg_no || '',
      model: bus.model || '',
      type: bus.type || 'NON-AC',
      etm_id: bus.etm_id || '',
      district: bus.district || '',
      zone: bus.zone || '',
      status: bus.status || 'ACTIVE'
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.reg_no || !editFormData.model || !editFormData.etm_id || !editFormData.district || !editFormData.zone) {
      toast.error('Please fill all mandatory fields');
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.updateBus(editingBus.id, editFormData);
      toast.success('Bus updated successfully');
      setIsEditModalOpen(false);
      fetchBuses();
    } catch (error) {
      toast.error('Failed to update bus');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBus = async (id: any) => {
    if (!window.confirm('Are you sure you want to delete this bus?')) return;
    
    try {
      await adminApi.deleteBus(id);
      toast.success('Bus deleted successfully');
      fetchBuses();
    } catch (error) {
      toast.error('Failed to delete bus');
    }
  };

  const filteredBuses = buses.filter(bus => {
    const matchesSearch = bus.reg_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bus.etm_id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDistrict = selectedDistrict === 'All' || bus.district === selectedDistrict;
    const matchesZone = selectedZone === 'All' || bus.zone === selectedZone;
    
    return matchesSearch && matchesDistrict && matchesZone;
  });

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search by Registration No or ETM ID..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {isMaster && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative group">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="pl-9 pr-8 py-2 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs font-black uppercase tracking-widest text-slate-700 appearance-none cursor-pointer"
                >
                  {DISTRICTS.map(d => (
                    <option key={d} value={d}>{d} DISTRICT</option>
                  ))}
                </select>
              </div>

              <div className="relative group">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="pl-9 pr-8 py-2 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs font-black uppercase tracking-widest text-slate-700 appearance-none cursor-pointer"
                >
                  {ZONES.map(z => (
                    <option key={z} value={z}>{z} ZONE</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white hover:bg-primary/90 transition-all font-bold text-xs uppercase tracking-widest"
          >
            <Plus size={16} />
            Setup New Bus
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Bus Info</th>
                <th className="px-6 py-4 text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Type</th>
                <th className="px-6 py-4 text-sm font-black text-slate-500 uppercase tracking-[0.2em]">ETM Device</th>
                <th className="px-6 py-4 text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-4 text-sm font-black text-slate-500 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="animate-spin text-primary" size={24} />
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading buses...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredBuses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No buses found</p>
                  </td>
                </tr>
              ) : (
                filteredBuses.map((bus) => (
                  <tr key={bus.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                          <BusIcon size={20} />
                        </div>
                        <div>
                          <p className="text-base font-black text-slate-900">{bus.reg_no}</p>
                          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{bus.model}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-black px-2.5 py-1 ${
                        bus.type === 'AC' ? 'bg-cyan-100 text-cyan-700' : 'bg-orange-100 text-orange-700'
                      } uppercase tracking-widest`}>
                        {bus.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Cpu size={16} className="text-slate-400" />
                        <span className="text-sm font-bold font-mono">{bus.etm_id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-sm font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${
                        bus.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 
                        bus.status === 'MAINTENANCE' ? 'bg-amber-100 text-amber-700' : 
                        'bg-slate-100 text-slate-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          bus.status === 'ACTIVE' ? 'bg-emerald-500' : 
                          bus.status === 'MAINTENANCE' ? 'bg-amber-500' : 
                          'bg-slate-500'
                        }`} />
                        {bus.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => navigate(`/live?search=${bus.reg_no}`)}
                          className="p-2 hover:bg-white hover:shadow-sm text-slate-400 hover:text-primary transition-all"
                          title="View Live Status"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => handleEditClick(bus)}
                          className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                          title="Edit Bus"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteBus(bus.id)}
                          className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all"
                          title="Delete Bus"
                        >
                          <Trash2 size={16} />
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

      {/* Add Bus Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden rounded-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <BusIcon className="text-primary" size={20} />
                <h3 className="text-sm font-black text-slate-950 uppercase tracking-widest">Setup New Bus</h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-all p-1 hover:bg-slate-200 rounded"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddBus} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Registration Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TN 39 AB 1234"
                  value={newBus.reg_no}
                  onChange={(e) => setNewBus({ ...newBus, reg_no: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm rounded-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Model Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Leyland Viking"
                  value={newBus.model}
                  onChange={(e) => setNewBus({ ...newBus, model: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm rounded-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Bus Type</label>
                <select
                  value={newBus.type}
                  onChange={(e) => setNewBus({ ...newBus, type: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm bg-white rounded-sm"
                >
                  <option value="AC">AC</option>
                  <option value="NON-AC">NON-AC</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">ETM Device ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ETM-5001"
                  value={newBus.etm_id}
                  onChange={(e) => setNewBus({ ...newBus, etm_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm rounded-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">District</label>
                  <select
                    value={newBus.district}
                    onChange={(e) => setNewBus({ ...newBus, district: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm bg-white rounded-sm"
                  >
                    <option value="">Select District</option>
                    {DISTRICTS.filter(d => d !== 'All').map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Zone</label>
                  <select
                    value={newBus.zone}
                    onChange={(e) => setNewBus({ ...newBus, zone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm bg-white rounded-sm"
                  >
                    <option value="">Select Zone</option>
                    {ZONES.filter(z => z !== 'All').map(z => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all font-bold text-xs uppercase tracking-widest rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 bg-primary text-white hover:bg-primary/95 transition-all font-bold text-xs uppercase tracking-widest active:scale-95 disabled:opacity-75 disabled:pointer-events-none rounded-sm"
                >
                  {submitting ? 'Saving...' : 'Add Bus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Bus Modal */}
      {isEditModalOpen && editingBus && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden rounded-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <BusIcon className="text-primary" size={20} />
                <h3 className="text-sm font-black text-slate-950 uppercase tracking-widest">Edit Bus Details</h3>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-all p-1 hover:bg-slate-200 rounded"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Registration Number</label>
                <input
                  type="text"
                  required
                  value={editFormData.reg_no}
                  onChange={(e) => setEditFormData({ ...editFormData, reg_no: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm rounded-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Model Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.model}
                  onChange={(e) => setEditFormData({ ...editFormData, model: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm rounded-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Bus Type</label>
                <select
                  value={editFormData.type}
                  onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm bg-white rounded-sm"
                >
                  <option value="AC">AC</option>
                  <option value="NON-AC">NON-AC</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">ETM Device ID</label>
                <input
                  type="text"
                  required
                  value={editFormData.etm_id}
                  onChange={(e) => setEditFormData({ ...editFormData, etm_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm rounded-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">District</label>
                  <select
                    value={editFormData.district}
                    onChange={(e) => setEditFormData({ ...editFormData, district: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm bg-white rounded-sm"
                  >
                    <option value="">Select District</option>
                    {DISTRICTS.filter(d => d !== 'All').map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Zone</label>
                  <select
                    value={editFormData.zone}
                    onChange={(e) => setEditFormData({ ...editFormData, zone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm bg-white rounded-sm"
                  >
                    <option value="">Select Zone</option>
                    {ZONES.filter(z => z !== 'All').map(z => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Bus Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm bg-white rounded-sm"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                  <option value="STOPPED">STOPPED</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all font-bold text-xs uppercase tracking-widest rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 bg-primary text-white hover:bg-primary/95 transition-all font-bold text-xs uppercase tracking-widest active:scale-95 disabled:opacity-75 disabled:pointer-events-none rounded-sm"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
