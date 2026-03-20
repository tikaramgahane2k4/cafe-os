import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Plus, Search, Edit2, Trash2, Shield, UserCircle, Phone, Mail, X } from 'lucide-react';

const ALL_PERMISSIONS = ['View Menu', 'Edit Menu', 'View Orders', 'Manage Orders', 'View Customers', 'View Staff'];
const EMPTY_STAFF = { name: '', email: '', role: 'Waiter', phone: '', permissions: [] };

const StaffManagement = () => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState(EMPTY_STAFF);
    const [saving, setSaving] = useState(false);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const res = await api.get('/staff');
            setStaff(res.data);
        } catch (err) {
            console.error('Failed to fetch staff', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this staff member?')) {
            try {
                await api.delete(`/staff/${id}`);
                fetchStaff();
            } catch {
                alert('Failed to delete staff member');
            }
        }
    };

    const handleOpenAdd = () => {
        setFormData(EMPTY_STAFF);
        setEditMode(false);
        setShowModal(true);
    };

    const handleOpenEdit = (member) => {
        setFormData({
            _id: member._id,
            name: member.name,
            email: member.email,
            role: member.role,
            phone: member.phone || '',
            permissions: member.permissions || []
        });
        setEditMode(true);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setFormData(EMPTY_STAFF);
    };

    const togglePermission = (perm) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(perm)
                ? prev.permissions.filter(p => p !== perm)
                : [...prev.permissions, perm]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editMode && formData._id) {
                await api.put(`/staff/${formData._id}`, formData);
            } else {
                await api.post('/staff', formData);
            }
            handleCloseModal();
            fetchStaff();
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to save staff data';
            alert(`Error: ${errorMsg}`);
            console.error('Staff save error:', error);
        }
        setSaving(false);
    };

    const roleColors = {
        Manager: 'bg-[#6B3E26]/20 text-[#6B3E26]',
        Waiter: 'bg-[#C89B6D]/20 text-[#C89B6D]',
        Chef: 'bg-[#9B2226]/20 text-[#9B2226]',
        Cashier: 'bg-[#2D6A4F]/20 text-[#2D6A4F]'
    };

    const filteredStaff = staff.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fade-in relative block">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-[#4B2E1E] tracking-tight">Staff Management</h1>
                    <p className="text-[#C89B6D] font-bold mt-1">Manage cafe employees and roles.</p>
                </div>
                <button onClick={handleOpenAdd} className="flex items-center gap-2 coffee-gradient text-white px-6 py-3.5 rounded-2xl font-black shadow-xl shadow-[#6B3E26]/20 transition-all hover:coffee-gradient-hover active:scale-95">
                    <Plus size={22} strokeWidth={3} />
                    Add Staff Member
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#F5E6D3] overflow-hidden">
                <div className="p-8 border-b border-[#F5E6D3] bg-[#FAF7F2]/30 flex">
                    <div className="relative w-full md:w-[400px] border border-[#F5E6D3] rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-[#6B3E26]/5 transition-all shadow-sm">
                        <input
                            type="text"
                            placeholder="Search staff by name or role..."
                            className="w-full pl-12 pr-4 py-3.5 bg-white text-sm font-bold text-[#4B2E1E] placeholder-[#C89B6D]/60 focus:outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#C89B6D]">
                            <Search size={20} />
                        </div>
                    </div>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-[#FAF7F2]/10">
                    {loading ? (
                        <div className="col-span-full text-center text-[#C89B6D] font-black py-16 animate-pulse">Loading staff records...</div>
                    ) : filteredStaff.length === 0 ? (
                        <div className="col-span-full text-center text-[#C89B6D] font-black py-16">No staff members found.</div>
                    ) : (filteredStaff.map(member => (
                        <div key={member._id} className="bg-white border border-[#F5E6D3] rounded-2xl p-6 shadow-sm hover:shadow-xl hover:shadow-[#6B3E26]/10 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="h-14 w-14 rounded-2xl bg-[#6B3E26] text-white flex items-center justify-center text-2xl font-black shadow-lg">
                                    {member.name.charAt(0).toUpperCase()}
                                </div>
                                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${roleColors[member.role] || 'bg-gray-100 text-gray-600'}`}>
                                    {member.role}
                                </span>
                            </div>

                            <h3 className="text-xl font-black text-[#4B2E1E] mb-1">{member.name}</h3>
                            <div className="space-y-2 mt-4 text-sm font-bold text-[#C89B6D]">
                                <p className="flex items-center gap-2"><Mail size={16} /> {member.email}</p>
                                {member.phone && <p className="flex items-center gap-2"><Phone size={16} /> {member.phone}</p>}
                            </div>

                            {member.permissions && member.permissions.length > 0 && (
                                <div className="mt-5 pt-5 border-t border-[#F5E6D3]/50">
                                    <p className="flex items-center gap-2 text-[10px] font-black text-[#6B3E26] uppercase tracking-widest mb-2"><Shield size={14} /> Permissions</p>
                                    <div className="flex flex-wrap gap-2">
                                        {member.permissions.map(p => (
                                            <span key={p} className="bg-[#FAF7F2] text-[#4B2E1E] text-xs font-bold px-3 py-1 rounded-full border border-[#F5E6D3]">{p}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenEdit(member)} className="flex-1 bg-[#F5E6D3]/50 text-[#6B3E26] font-bold py-2 rounded-xl hover:bg-[#C89B6D] hover:text-white transition-colors flex justify-center items-center gap-2">
                                    <Edit2 size={16} /> Edit
                                </button>
                                <button onClick={() => handleDelete(member._id)} className="flex-1 bg-red-50 text-red-600 font-bold py-2 rounded-xl hover:bg-red-600 hover:text-white transition-colors flex justify-center items-center gap-2">
                                    <Trash2 size={16} /> Delete
                                </button>
                            </div>
                        </div>
                    )))}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-[#F5E6D3] relative animate-fade-in">
                        <div className="bg-[#FAF7F2] p-6 border-b border-[#F5E6D3] flex justify-between items-center">
                            <h2 className="text-xl font-black text-[#4B2E1E]">{editMode ? 'Edit Staff Member' : 'Add New Staff Member'}</h2>
                            <button onClick={handleCloseModal} className="text-[#C89B6D] hover:text-[#4B2E1E] transition-colors rounded-full p-2 hover:bg-[#F5E6D3]/50">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 pb-10 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-black text-[#6B3E26] mb-2 uppercase tracking-wider">Full Name</label>
                                    <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[#FAF7F2] border border-[#F5E6D3] rounded-xl px-4 py-3 text-sm font-bold text-[#4B2E1E] focus:outline-none focus:border-[#C89B6D] focus:ring-2 focus:ring-[#C89B6D]/20 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-[#6B3E26] mb-2 uppercase tracking-wider">Email Address</label>
                                    <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-[#FAF7F2] border border-[#F5E6D3] rounded-xl px-4 py-3 text-sm font-bold text-[#4B2E1E] focus:outline-none focus:border-[#C89B6D] focus:ring-2 focus:ring-[#C89B6D]/20 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-[#6B3E26] mb-2 uppercase tracking-wider">Phone</label>
                                    <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-[#FAF7F2] border border-[#F5E6D3] rounded-xl px-4 py-3 text-sm font-bold text-[#4B2E1E] focus:outline-none focus:border-[#C89B6D] focus:ring-2 focus:ring-[#C89B6D]/20 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-[#6B3E26] mb-2 uppercase tracking-wider">Role</label>
                                    <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full bg-[#FAF7F2] border border-[#F5E6D3] rounded-xl px-4 py-3 text-sm font-bold text-[#4B2E1E] focus:outline-none focus:border-[#C89B6D] focus:ring-2 focus:ring-[#C89B6D]/20 transition-all cursor-pointer">
                                        <option value="Manager">Manager</option>
                                        <option value="Waiter">Waiter</option>
                                        <option value="Chef">Chef</option>
                                        <option value="Cashier">Cashier</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-[#F5E6D3]/50">
                                <label className="block text-xs font-black text-[#6B3E26] mb-4 uppercase tracking-wider">Permissions</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {ALL_PERMISSIONS.map(perm => (
                                        <label key={perm} onClick={() => togglePermission(perm)} className="flex items-center gap-3 cursor-pointer group select-none">
                                            <div className={`w-5 h-5 rounded border ${formData.permissions.includes(perm) ? 'bg-[#6B3E26] border-[#6B3E26]' : 'bg-[#FAF7F2] border-[#C89B6D]'} flex items-center justify-center transition-colors shadow-sm`}>
                                                {formData.permissions.includes(perm) && <Shield size={12} color="white" />}
                                            </div>
                                            <span className="text-sm font-bold text-[#4B2E1E] group-hover:text-[#6B3E26] transition-colors">{perm}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <button disabled={saving} type="submit" className="w-full coffee-gradient block text-white px-6 py-4 rounded-xl font-black shadow-xl shadow-[#6B3E26]/20 transition-all hover:coffee-gradient-hover hover:-translate-y-0.5 mt-8 disabled:opacity-50 text-center">
                                {saving ? 'Saving...' : (editMode ? 'Update Staff Member' : 'Add Staff Member')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffManagement;
