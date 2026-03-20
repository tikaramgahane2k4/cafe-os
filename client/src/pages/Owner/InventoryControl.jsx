import {
    Search,
    Filter,
    Edit,
    Package,
    CheckCircle,
    AlertTriangle,
    XCircle,
    MoreVertical,
    Plus,
    ChevronDown,
    Save,
    X,
    RefreshCw,
    Loader2
} from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';
import api from '../../api/axios';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const InventoryControl = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [selectedItem, setSelectedItem] = useState(null);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [newStock, setNewStock] = useState('');
    const [editForm, setEditForm] = useState({ itemName: '', category: '', price: '' });
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const response = await api.get('/inventory');
            setInventory(response.data);
            setError(null);
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Failed to load inventory data');
        } finally {
            setLoading(false);
        }
    };

    const categories = ['All', ...new Set(inventory.map(item => item.category))];
    const statuses = ['All', 'Available', 'Low Stock', 'Out of Stock'];

    const filteredInventory = useMemo(() => {
        return inventory.filter(item => {
            const name = item.itemName || '';
            const id = item._id || '';
            const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
            const matchesStatus = statusFilter === 'All' || item.stockStatus === statusFilter;
            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [inventory, searchTerm, categoryFilter, statusFilter]);

    const stats = useMemo(() => {
        return {
            total: inventory.length,
            available: inventory.filter(i => i.stockStatus === 'Available').length,
            lowStock: inventory.filter(i => i.stockStatus === 'Low Stock').length,
            outOfStock: inventory.filter(i => i.stockStatus === 'Out of Stock').length
        };
    }, [inventory]);

    const handleUpdateStock = (item) => {
        setSelectedItem(item);
        setNewStock(item.stock.toString());
        setIsStockModalOpen(true);
    };

    const handleEditItem = (item) => {
        setSelectedItem(item);
        setEditForm({
            itemName: item.itemName,
            category: item.category,
            price: item.price.toString()
        });
        setIsEditModalOpen(true);
    };

    const saveStockUpdate = async () => {
        try {
            setUpdating(true);
            const response = await api.patch(`/inventory/${selectedItem._id}`, {
                stock: newStock
            });

            const updatedInventory = inventory.map(item =>
                item._id === selectedItem._id ? response.data : item
            );

            setInventory(updatedInventory);
            setIsStockModalOpen(false);
        } catch (err) {
            console.error('Update error:', err);
            alert('Failed to update stock');
        } finally {
            setUpdating(false);
        }
    };

    const saveItemEdit = async () => {
        try {
            setUpdating(true);
            const response = await api.put(`/menu/${selectedItem._id}`, {
                ...editForm,
                cafeId: selectedItem.cafeId,
                stock: selectedItem.stock > 0 // Keep stock boolean for general menu update if needed
            });

            const updatedInventory = inventory.map(item =>
                item._id === selectedItem._id ? { ...item, ...response.data } : item
            );

            setInventory(updatedInventory);
            setIsEditModalOpen(false);
        } catch (err) {
            console.error('Edit error:', err);
            alert('Failed to update item details');
        } finally {
            setUpdating(false);
        }
    };

    const markOutOfStock = async (id) => {
        try {
            const response = await api.patch(`/inventory/${id}`, {
                stock: 0
            });

            setInventory(inventory.map(item =>
                item._id === id ? response.data : item
            ));
        } catch (err) {
            console.error('Update error:', err);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            'Available': 'bg-[#2D6A4F]/10 text-[#2D6A4F] border-[#2D6A4F]/20',
            'Low Stock': 'bg-[#B08968]/10 text-[#B08968] border-[#B08968]/20',
            'Out of Stock': 'bg-[#9B2226]/10 text-[#9B2226] border-[#9B2226]/20'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border shadow-sm ${styles[status]}`}>
                {status}
            </span>
        );
    };
    if (loading) {
        return (
            <div className="h-96 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="text-indigo-600 animate-spin" size={48} />
                <p className="text-gray-500 font-medium">Loading inventory...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-96 flex flex-col items-center justify-center space-y-4">
                <div className="bg-red-50 p-4 rounded-full text-red-600">
                    <XCircle size={48} />
                </div>
                <p className="text-gray-800 font-bold text-xl">{error}</p>
                <button
                    onClick={fetchInventory}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                >
                    <RefreshCw size={18} />
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Items', value: stats.total, icon: <Package size={24} />, color: 'bg-[#6B3E26]', shadow: 'shadow-[#6B3E26]/20' },
                    { label: 'Available', value: stats.available, icon: <CheckCircle size={24} />, color: 'bg-[#2D6A4F]', shadow: 'shadow-[#2D6A4F]/20' },
                    { label: 'Low Stock', value: stats.lowStock, icon: <AlertTriangle size={24} />, color: 'bg-[#B08968]', shadow: 'shadow-[#B08968]/20' },
                    { label: 'Out of Stock', value: stats.outOfStock, icon: <XCircle size={24} />, color: 'bg-[#9B2226]', shadow: 'shadow-[#9B2226]/20' }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#F5E6D3] flex items-center gap-5 hover:translate-y-[-4px] transition-all duration-300 group">
                        <div className={`${stat.color} p-4 rounded-xl text-white shadow-lg ${stat.shadow} group-hover:scale-110 transition-transform duration-300`}>
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[#C89B6D] uppercase tracking-wider">{stat.label}</p>
                            <h3 className="text-3xl font-black text-[#4B2E1E] mt-0.5">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters Section */}
            <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#F5E6D3] flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-1 min-w-[300px] items-center bg-[#FAF7F2] border border-[#F5E6D3] rounded-xl px-4 py-2.5 group focus-within:ring-2 focus-within:ring-[#6B3E26]/10 focus-within:border-[#6B3E26] transition-all">
                    <Search className="text-[#C89B6D] mr-3 group-focus-within:text-[#6B3E26] transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search items by name or ID..."
                        className="bg-transparent border-none focus:outline-none w-full text-sm font-medium text-[#4B2E1E] placeholder-[#C89B6D]/60"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <select
                            className="bg-[#FAF7F2] border border-[#F5E6D3] rounded-xl px-4 py-2.5 text-sm font-bold text-[#6B3E26] focus:outline-none focus:ring-2 focus:ring-[#6B3E26]/10 appearance-none pr-10 hover:border-[#C89B6D] transition-colors cursor-pointer"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#C89B6D]">
                            <Filter size={14} />
                        </div>
                    </div>
                    <div className="relative">
                        <select
                            className="bg-[#FAF7F2] border border-[#F5E6D3] rounded-xl px-4 py-2.5 text-sm font-bold text-[#6B3E26] focus:outline-none focus:ring-2 focus:ring-[#6B3E26]/10 appearance-none pr-10 hover:border-[#C89B6D] transition-colors cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            {statuses.map(status => <option key={status} value={status}>{status}</option>)}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#C89B6D]">
                            <ChevronDown size={14} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#F5E6D3] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[#FAF7F2] border-b border-[#F5E6D3]">
                                <th className="px-8 py-5 text-[10px] font-black text-[#C89B6D] uppercase tracking-[0.2em]">Image</th>
                                <th className="px-8 py-5 text-[10px] font-black text-[#C89B6D] uppercase tracking-[0.2em]">Item Details</th>
                                <th className="px-8 py-5 text-[10px] font-black text-[#C89B6D] uppercase tracking-[0.2em]">Category</th>
                                <th className="px-8 py-5 text-[10px] font-black text-[#C89B6D] uppercase tracking-[0.2em]">Price</th>
                                <th className="px-8 py-5 text-[10px] font-black text-[#C89B6D] uppercase tracking-[0.2em]">Stock Level</th>
                                <th className="px-8 py-5 text-[10px] font-black text-[#C89B6D] uppercase tracking-[0.2em]">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-[#C89B6D] uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F5E6D3]/50">
                            {filteredInventory.map((item, index) => (
                                <tr key={item._id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-[#FAF7F2]/50'} hover:bg-[#F5E6D3]/30 transition-colors duration-200 group`}>
                                    <td className="px-8 py-4">
                                        <div className="h-14 w-14 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-white flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                                            {item.image ? (
                                                <img
                                                    src={item.image.startsWith('http') ? item.image : `${API_BASE}${item.image.startsWith('/') ? '' : '/'}${item.image}`}
                                                    alt={item.itemName || item.name}
                                                    className="h-full w-full object-cover"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = 'https://images.unsplash.com/photo-1559925393-8be0ec41b50d?w=100&h=100&fit=crop';
                                                    }}
                                                />
                                            ) : (
                                                <Package size={24} className="text-[#F5E6D3]" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-4">
                                        <div className="font-black text-[#4B2E1E] text-base leading-tight">{item.itemName || item.name}</div>
                                        <div className="text-[10px] text-[#C89B6D] font-bold mt-1 uppercase tracking-wider">ID: {item._id.slice(-6)} • Cafe {item.cafeId}</div>
                                    </td>
                                    <td className="px-8 py-4">
                                        <span className="text-[11px] font-black text-[#6B3E26] bg-[#F5E6D3] px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm">{item.category}</span>
                                    </td>
                                    <td className="px-8 py-4 font-black text-[#4B2E1E]">
                                        ${item.price?.toFixed(2) || '0.00'}
                                    </td>
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-3">
                                            <span className="font-black text-[#4B2E1E] text-lg">{item.stock}</span>
                                            <div className="w-20 h-2 bg-[#F5E6D3] rounded-full overflow-hidden shadow-inner">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${item.stock > 10 ? 'bg-[#2D6A4F]' :
                                                        item.stock > 0 ? 'bg-[#C89B6D]' : 'bg-[#9B2226]'
                                                        }`}
                                                    style={{ width: `${Math.min((item.stock / 50) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4">
                                        {getStatusBadge(item.stockStatus)}
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <button
                                                onClick={() => handleUpdateStock(item)}
                                                className="p-2.5 text-[#6B3E26] hover:bg-[#6B3E26] hover:text-white rounded-xl transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-[#6B3E26]/20 bg-white"
                                                title="Update Stock"
                                            >
                                                <RefreshCw size={18} />
                                            </button>
                                            <button
                                                onClick={() => markOutOfStock(item._id)}
                                                className="p-2.5 text-[#9B2226] hover:bg-[#9B2226] hover:text-white rounded-xl transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-[#9B2226]/20 bg-white"
                                                title="Mark Out of Stock"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleEditItem(item)}
                                                className="p-2.5 text-[#4B2E1E] hover:bg-[#4B2E1E] hover:text-white rounded-xl transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-black/20 bg-white"
                                                title="Edit Item"
                                            >
                                                <Edit size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredInventory.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="text-gray-300" size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-gray-600">No items found</h3>
                        <p className="text-gray-400">Try adjusting your filters or search terms</p>
                    </div>
                )}
            </div>

            {/* Update Stock Modal */}
            {isStockModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#4B2E1E]/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-[#F5E6D3]">
                        <div className="p-8 border-b border-[#F5E6D3] flex items-center justify-between bg-[#FAF7F2]">
                            <h3 className="text-2xl font-black text-[#4B2E1E] tracking-tight">Update Stock</h3>
                            <button
                                onClick={() => setIsStockModalOpen(false)}
                                className="p-2 text-[#C89B6D] hover:bg-white rounded-full transition-colors shadow-sm"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="flex items-center gap-5 bg-[#FAF7F2] p-5 rounded-2xl border border-[#F5E6D3]">
                                <div className="h-16 w-16 rounded-xl overflow-hidden flex-shrink-0 bg-white shadow-md border-2 border-white flex items-center justify-center">
                                    {selectedItem.image ? (
                                        <img src={selectedItem.image.startsWith('http') ? selectedItem.image : `${API_BASE}${selectedItem.image.startsWith('/') ? '' : '/'}${selectedItem.image}`} alt={selectedItem.itemName || selectedItem.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <Package size={28} className="text-[#F5E6D3]" />
                                    )}
                                </div>
                                <div>
                                    <div className="font-black text-xl text-[#4B2E1E] leading-tight">{selectedItem.itemName || selectedItem.name}</div>
                                    <div className="text-sm font-bold text-[#C89B6D] mt-1">Current Stock: <span className="text-[#6B3E26] font-black">{selectedItem.stock}</span></div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black text-[#6B3E26] uppercase tracking-widest ml-1">New Quantity</label>
                                <input
                                    type="number"
                                    autoFocus
                                    className="w-full px-5 py-4 bg-[#FAF7F2] border border-[#F5E6D3] rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#6B3E26]/5 focus:border-[#6B3E26] transition-all text-2xl font-black text-[#4B2E1E]"
                                    value={newStock}
                                    onChange={(e) => setNewStock(e.target.value)}
                                    placeholder="0"
                                    disabled={updating}
                                />
                            </div>
                        </div>
                        <div className="p-8 bg-[#FAF7F2] flex gap-4">
                            <button
                                onClick={() => setIsStockModalOpen(false)}
                                className="flex-1 py-4 bg-white border border-[#F5E6D3] text-[#C89B6D] font-black rounded-2xl hover:bg-white hover:border-[#6B3E26] transition-all active:scale-95 shadow-sm"
                                disabled={updating}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveStockUpdate}
                                className="flex-1 py-4 coffee-gradient text-white font-black rounded-2xl hover:coffee-gradient-hover shadow-xl shadow-[#6B3E26]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                                disabled={updating}
                            >
                                {updating ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                {updating ? 'Saving...' : 'Update Stock'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Item Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#4B2E1E]/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-[#F5E6D3]">
                        <div className="p-8 border-b border-[#F5E6D3] flex items-center justify-between bg-[#FAF7F2]">
                            <h3 className="text-2xl font-black text-[#4B2E1E] tracking-tight">Edit Item</h3>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="p-2 text-[#C89B6D] hover:bg-white rounded-full transition-colors shadow-sm"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#6B3E26] uppercase tracking-widest ml-1">Item Name</label>
                                <input
                                    type="text"
                                    className="w-full px-5 py-3.5 bg-[#FAF7F2] border border-[#F5E6D3] rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#6B3E26]/5 focus:border-[#6B3E26] transition-all font-bold text-[#4B2E1E]"
                                    value={editForm.itemName}
                                    onChange={(e) => setEditForm({ ...editForm, itemName: e.target.value })}
                                    placeholder="Espresso"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#6B3E26] uppercase tracking-widest ml-1">Category</label>
                                <select
                                    className="w-full px-5 py-3.5 bg-[#FAF7F2] border border-[#F5E6D3] rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#6B3E26]/5 focus:border-[#6B3E26] transition-all font-bold text-[#4B2E1E] appearance-none"
                                    value={editForm.category}
                                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                >
                                    {categories.filter(c => c !== 'All').map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#6B3E26] uppercase tracking-widest ml-1">Price ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full px-5 py-3.5 bg-[#FAF7F2] border border-[#F5E6D3] rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#6B3E26]/5 focus:border-[#6B3E26] transition-all font-black text-[#4B2E1E]"
                                    value={editForm.price}
                                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div className="p-8 bg-[#FAF7F2] flex gap-4">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="flex-1 py-4 bg-white border border-[#F5E6D3] text-[#C89B6D] font-black rounded-2xl hover:bg-white hover:border-[#6B3E26] transition-all active:scale-95 shadow-sm"
                                disabled={updating}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveItemEdit}
                                className="flex-1 py-4 coffee-gradient text-white font-black rounded-2xl hover:coffee-gradient-hover shadow-xl shadow-[#6B3E26]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                                disabled={updating}
                            >
                                {updating ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                {updating ? 'Updating...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
            </div>
            <div className={`p-3 ${color} rounded-2xl`}>
                {icon}
            </div>
        </div>
    </div>
);

export default InventoryControl;
