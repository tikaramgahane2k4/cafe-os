import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    CheckCircle,
    XCircle,
    MoreVertical,
    Filter
} from 'lucide-react';
import MenuForm from '../components/MenuForm';

const MenuManagement = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await api.get('/menu');
            setItems(res.data);
        } catch (err) {
            console.error('Failed to fetch menu items', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        // Avoid calling setState synchronously in effect
        // Use an async IIFE
        (async () => {
            await fetchItems();
        })();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                await api.delete(`/menu/${id}`);
                fetchItems();
            } catch {
                alert('Failed to delete item');
            }
        }
    };

    const toggleStock = async (id, currentStock) => {
        try {
            await api.patch(`/menu/stock/${id}`, { stock: !currentStock });
            fetchItems();
        } catch {
            alert('Failed to update stock');
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.itemName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-[#4B2E1E] tracking-tight">Menu Management</h1>
                    <p className="text-[#C89B6D] font-bold mt-1">Manage your cafe's digital menu items here.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingItem(null);
                        setShowForm(true);
                    }}
                    className="flex items-center gap-2 coffee-gradient text-white px-6 py-3.5 rounded-2xl font-black shadow-xl shadow-[#6B3E26]/20 transition-all hover:coffee-gradient-hover active:scale-95"
                >
                    <Plus size={22} strokeWidth={3} />
                    Add New Item
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#F5E6D3] overflow-hidden">
                <div className="p-8 border-b border-[#F5E6D3] flex flex-col md:flex-row gap-6 items-center justify-between bg-[#FAF7F2]/30">
                    <div className="relative w-full md:w-[400px] border border-[#F5E6D3] rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-[#6B3E26]/5 transition-all shadow-sm">
                        <input
                            type="text"
                            placeholder="Search items..."
                            className="w-full pl-12 pr-4 py-3.5 bg-white text-sm font-bold text-[#4B2E1E] placeholder-[#C89B6D]/60 focus:outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#C89B6D]">
                            <Search size={20} />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="text-[#C89B6D]">
                            <Filter size={20} />
                        </div>
                        <select
                            className="flex-1 md:w-56 border border-[#F5E6D3] rounded-2xl px-5 py-3.5 bg-white text-sm font-black text-[#6B3E26] focus:outline-none focus:ring-4 focus:ring-[#6B3E26]/5 appearance-none shadow-sm cursor-pointer hover:border-[#6B3E26] transition-colors"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="All">All Categories</option>
                            <option value="Coffee">Coffee</option>
                            <option value="Snacks">Snacks</option>
                            <option value="Desserts">Desserts</option>
                            <option value="Beverages">Beverages</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[#FAF7F2] border-b border-[#F5E6D3]">
                                <th className="px-8 py-5 text-[10px] font-black text-[#C89B6D] uppercase tracking-[0.2em]">Item</th>
                                <th className="px-8 py-5 text-[10px] font-black text-[#C89B6D] uppercase tracking-[0.2em]">Category</th>
                                <th className="px-8 py-5 text-[10px] font-black text-[#C89B6D] uppercase tracking-[0.2em]">Price</th>
                                <th className="px-8 py-5 text-[10px] font-black text-[#C89B6D] uppercase tracking-[0.2em]">Stock Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-[#C89B6D] uppercase tracking-[0.2em]">Cafe ID</th>
                                <th className="px-8 py-5 text-[10px] font-black text-[#C89B6D] uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F5E6D3]/50">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-8 py-16 text-center text-[#C89B6D] font-black animate-pulse">Loading menu items...</td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-8 py-16 text-center text-[#C89B6D] font-black">No items found matching your criteria.</td>
                                </tr>
                            ) : (
                                filteredItems.map((item, index) => (
                                    <tr key={item._id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-[#FAF7F2]/50'} hover:bg-[#F5E6D3]/30 transition-colors duration-200 group`}>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-14 w-14 rounded-2xl overflow-hidden shadow-md border-2 border-white transform group-hover:scale-110 transition-transform duration-300 bg-white flex items-center justify-center">
                                                    <img
                                                        src={`http://localhost:3010${item.image}`}
                                                        alt={item.itemName}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-black text-[#4B2E1E] text-lg leading-tight group-hover:text-[#6B3E26] transition-colors">{item.itemName}</p>
                                                    <p className="text-[10px] text-[#C89B6D] font-bold mt-1 uppercase tracking-wider">ID: {item._id.slice(-8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-[11px] font-black text-[#6B3E26] bg-[#F5E6D3] px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm">
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 font-black text-[#4B2E1E] text-base">${item.price.toFixed(2)}</td>
                                        <td className="px-8 py-5">
                                            <button
                                                onClick={() => toggleStock(item._id, item.stock)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-sm border ${item.stock
                                                    ? 'bg-[#2D6A4F]/10 text-[#2D6A4F] border-[#2D6A4F]/20 hover:bg-[#2D6A4F]/20'
                                                    : 'bg-[#9B2226]/10 text-[#9B2226] border-[#9B2226]/20 hover:bg-[#9B2226]/20'
                                                    }`}
                                            >
                                                {item.stock ? <CheckCircle size={14} strokeWidth={3} /> : <XCircle size={14} strokeWidth={3} />}
                                                {item.stock ? 'Available' : 'Out of Stock'}
                                            </button>
                                        </td>
                                        <td className="px-8 py-5 text-xs text-[#C89B6D] font-black">CAFE-{item.cafeId}</td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <button
                                                    onClick={() => {
                                                        setEditingItem(item);
                                                        setShowForm(true);
                                                    }}
                                                    className="p-2.5 text-[#4B2E1E] hover:bg-[#4B2E1E] hover:text-white rounded-xl transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-black/20 bg-white"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item._id)}
                                                    className="p-2.5 text-[#9B2226] hover:bg-[#9B2226] hover:text-white rounded-xl transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-[#9B2226]/20 bg-white"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
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

            {showForm && (
                <MenuForm
                    onClose={() => {
                        setShowForm(false);
                        setEditingItem(null);
                    }}
                    onSuccess={() => {
                        setShowForm(false);
                        setEditingItem(null);
                        fetchItems();
                    }}
                    editingItem={editingItem}
                />
            )}
        </div>
    );
};

export default MenuManagement;
