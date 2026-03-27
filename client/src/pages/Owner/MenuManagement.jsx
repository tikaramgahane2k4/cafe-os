import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    CheckCircle,
    XCircle,
    MoreVertical,
    Filter,
    Heart,
    QrCode,
    Coffee,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import MenuForm from '../../components/MenuForm';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const MenuManagement = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [initialCategory, setInitialCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
    const [promptDialog, setPromptDialog] = useState({ isOpen: false, title: '', initialValue: '', onConfirm: null });
    const [expandedCategories, setExpandedCategories] = useState({});

    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };
    const { user } = useAuth();
    const cafeId = user?.tenantId || user?.cafeId || user?.id;

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/menu?cafeId=${cafeId}`);
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

    const handleDeleteCategory = (category) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Delete Category',
            message: `Are you sure you want to delete the entire "${category}" category and all its items? This action cannot be undone.`,
            onConfirm: async () => {
                try {
                    const itemsToDelete = items.filter(item => item.category === category);
                    for (const item of itemsToDelete) {
                        await api.delete(`/menu/${item._id}`);
                    }
                    fetchItems();
                } catch {
                    toast.error('Failed to delete some items in the category');
                }
            }
        });
    };

    const handleEditCategory = (oldCategory) => {
        setPromptDialog({
            isOpen: true,
            title: 'Edit Category Name',
            initialValue: oldCategory,
            onConfirm: async (newCategory) => {
                if (newCategory && newCategory.trim() !== '' && newCategory.trim() !== oldCategory) {
                    try {
                        const itemsToUpdate = items.filter(item => item.category === oldCategory);
                        for (const item of itemsToUpdate) {
                            const formData = new FormData();
                            formData.append('itemName', item.itemName || item.name);
                            formData.append('category', newCategory.trim());
                            formData.append('price', item.price);
                            formData.append('cafeId', item.cafeId || cafeId);
                            formData.append('stock', item.stock);

                            await api.put(`/menu/${item._id}`, formData);
                        }
                        fetchItems();
                    } catch {
                        toast.error('Failed to update category name');
                    }
                }
            }
        });
    };

    const handleDelete = (id) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Delete Item',
            message: 'Are you sure you want to delete this item?',
            onConfirm: async () => {
                try {
                    await api.delete(`/menu/${id}`);
                    fetchItems();
                } catch {
                    toast.error('Failed to delete item');
                }
            }
        });
    };

    const toggleStock = async (id, currentStock) => {
        try {
            await api.patch(`/menu/stock/${id}`, { stock: !currentStock });
            fetchItems();
        } catch {
            toast.error('Failed to update stock');
        }
    };

    const filteredItems = items.filter(item => {
        const title = (item.itemName || item.name || '').toLowerCase();
        const matchesSearch = title.includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    // Group items by category for the new UI
    const groupedItems = filteredItems.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {});

    // Derive dynamic categories from all items
    const allCategories = [...new Set(items.map(item => item.category))].sort();

    const tabs = ['General Settings', 'Menu & Items', 'Ordering Logistics', 'Visual Style'];

    return (
        <>
            <div className="animate-fade-in pb-20">
                {/* Horizontal Tabs */}
                <div className="flex items-center gap-8 border-b border-gray-200 mb-8 overflow-x-auto hide-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            className={`pb-4 text-sm font-medium whitespace-nowrap transition-colors relative ${tab === 'Menu & Items'
                                ? 'text-[#1A1A1A] font-bold'
                                : 'text-gray-400 hover:text-gray-700'
                                }`}
                        >
                            {tab}
                            {tab === 'Menu & Items' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A1A1A]"></div>
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col lg:flex-row gap-12 relative w-full">
                    {/* Left Side: Menu Content (70%) */}
                    <div className="flex-1 space-y-8">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-serif font-bold text-[#1A1A1A] mb-1">Curated Collections</h2>
                                <p className="text-gray-500 text-sm">Organize your offerings into premium menu categories.</p>
                            </div>
                            <button
                                onClick={() => {
                                    setEditingItem(null);
                                    setInitialCategory('');
                                    setShowForm(true);
                                }}
                                className="flex items-center gap-2 text-[#C67C4E] hover:text-[#b56e43] font-medium text-sm transition-colors"
                            >
                                <Plus size={18} />
                                New Category
                            </button>
                        </div>

                        {/* Filter and Search (Kept for functionality but restyled) */}
                        <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-[#EFEBE4]">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Search all items..."
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C67C4E]/30 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                            </div>
                            <select
                                className="border-none bg-gray-50 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 outline-none cursor-pointer hover:bg-gray-100 transition-colors"
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                <option value="All">All Categories</option>
                                {allCategories.map(cat => (
                                    <option key={`filter-${cat}`} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Loading State */}
                        {loading ? (
                            <div className="py-12 text-center text-gray-400 font-medium animate-pulse">
                                Loading your curated collections...
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="py-12 text-center text-gray-400 font-medium">
                                No menu items found. Click 'New Category' to add items.
                            </div>
                        ) : (
                            /* Category Blocks */
                            Object.entries(groupedItems).map(([category, catItems]) => (
                                <div key={category} className="bg-white rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-[#EFEBE4] overflow-hidden">
                                    {/* Category Header */}
                                    <div
                                        className={`p-6 border-b border-gray-50 flex items-center justify-between bg-white transition-colors ${catItems.length > 2 ? 'cursor-pointer group hover:bg-gray-50/50' : ''}`}
                                        onClick={() => { if (catItems.length > 2) toggleCategory(category); }}
                                    >
                                        <div className="flex items-center gap-4">
                                            {catItems.length > 2 ? (
                                                <button className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-50 group-hover:bg-[#FAF7F2] text-gray-400 group-hover:text-[#C67C4E] transition-colors">
                                                    {expandedCategories[category] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                </button>
                                            ) : (
                                                <div className="flex flex-col gap-1 text-gray-300 w-6 items-center">
                                                    <div className="w-1 h-1 bg-current rounded-full"></div>
                                                    <div className="w-1 h-1 bg-current rounded-full"></div>
                                                    <div className="w-1 h-1 bg-current rounded-full"></div>
                                                </div>
                                            )}
                                            <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">{category}</h3>
                                            <span className="bg-[#FAF7F2] text-[#C67C4E] text-[10px] font-bold px-3 py-1 rounded-full tracking-widest uppercase">
                                                {catItems.length} Items
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => handleEditCategory(category)} className="text-gray-400 hover:text-[#C67C4E] transition-colors p-2 hover:bg-orange-50 rounded-lg" title="Edit Category"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDeleteCategory(category)} className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg" title="Delete Category"><Trash2 size={16} /></button>
                                        </div>
                                    </div>

                                    {/* Items List */}
                                    <div className="p-6 space-y-8">
                                        {(expandedCategories[category] ? catItems : catItems.slice(0, 2)).map((item) => (
                                            <div key={item._id} className="flex gap-6 items-start group relative">
                                                {/* Item Image */}
                                                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 cursor-pointer shadow-sm relative group-hover:shadow-md transition-shadow" onClick={() => { setEditingItem(item); setShowForm(true); }}>
                                                    <img
                                                        src={`${API_BASE}${item.image}`}
                                                        alt={item.itemName || item.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                </div>

                                                {/* Item Details */}
                                                <div className="flex-1 flex flex-col md:flex-row gap-6 md:gap-4 pt-1 justify-between">
                                                    <div className="flex-1 space-y-3">
                                                        <div>
                                                            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Item Title</p>
                                                            <h4 className="text-base font-bold text-[#1A1A1A] leading-tight cursor-pointer hover:text-[#C67C4E] transition-colors" onClick={() => { setEditingItem(item); setShowForm(true); }}>
                                                                {item.itemName || item.name}
                                                            </h4>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Description</p>
                                                            <div className="h-6 border-b border-gray-100 relative">
                                                                <p className="text-sm text-gray-400 truncate pr-4 text-opacity-80 absolute bottom-1 w-full">Premium selection in {item.category.toLowerCase()}.</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="w-40 flex flex-col space-y-3 items-end">
                                                        <div className="text-right w-full">
                                                            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Price (₹)</p>
                                                            <div className="h-6 border-b border-gray-100 relative w-full">
                                                                <p className="text-sm font-bold text-[#1A1A1A] absolute bottom-1 right-0">₹ {item.price.toFixed(2)}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-end gap-2 pt-1 w-full">
                                                            <span className="text-xs font-medium text-gray-500">Available</span>
                                                            <button
                                                                onClick={() => toggleStock(item._id, item.stock)}
                                                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#C67C4E] focus:ring-offset-2 ${item.stock ? 'bg-[#C67C4E]' : 'bg-gray-200'}`}
                                                            >
                                                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${item.stock ? 'translate-x-4.5' : 'translate-x-1'}`} />
                                                            </button>
                                                        </div>
                                                        <div className="flex items-center gap-2 pt-2 justify-end w-full">
                                                            <button onClick={() => { setEditingItem(item); setShowForm(true); }} className="p-2 text-gray-400 hover:text-[#C67C4E] bg-gray-50 hover:bg-[#FAF7F2] rounded-lg transition-colors border border-gray-100 hover:border-[#E8DCC8]" title="Edit Item">
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button onClick={() => handleDelete(item._id)} className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors border border-gray-100 hover:border-red-100" title="Delete Item">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>



                                    {/* Add Button Footer */}
                                    <div className="p-4 bg-white/50">
                                        <button
                                            onClick={() => {
                                                setEditingItem(null);
                                                setInitialCategory(category);
                                                setShowForm(true);
                                            }}
                                            className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-sm font-medium text-gray-500 hover:text-[#C67C4E] hover:border-[#C67C4E] hover:bg-[#FAF7F2] transition-all flex items-center justify-center gap-2"
                                        >
                                            <div className="bg-gray-400 text-white rounded-full p-0.5"><Plus size={12} strokeWidth={3} /></div>
                                            Add another item to this category
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Right Side: Live App Preview (30%) - Render only on lg screens */}
                    <div className="hidden lg:block w-[340px] flex-shrink-0 relative">
                        <div className="sticky top-10 flex flex-col items-center">
                            <div className="w-full flex items-center gap-3 mb-6">
                                <div className="w-6 h-8 bg-[#D2B48C] rounded shadow flex-shrink-0"></div>
                                <div>
                                    <h3 className="font-serif font-bold text-[#1A1A1A] flex items-center gap-2">Live App Preview</h3>
                                    <p className="text-xs text-gray-500">Real-time mobile customer experience.</p>
                                </div>
                            </div>

                            {/* Phone Mockup Frame */}
                            <div className="w-[300px] h-[600px] border-[12px] border-[#1A1A1A] rounded-[40px] bg-[#f8f9fa] shadow-2xl relative overflow-hidden ring-4 ring-gray-100 flex flex-col">
                                {/* iPhone Notch */}
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[120px] h-6 bg-[#1A1A1A] rounded-b-[20px] z-30"></div>

                                {/* Mobile App Header */}
                                <div className="pt-10 px-5 pb-4 flex justify-between items-center bg-white/80 backdrop-blur-md z-20 sticky top-0 border-b border-gray-100 flex-shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-[#3D2B24] flex items-center justify-center text-[#D4B896] shadow-sm">
                                        <Coffee size={14} />
                                    </div>
                                    <div className="flex items-center gap-4 text-gray-600">
                                        <Search size={18} />
                                        <div className="relative">
                                            <svg xmlns="http://www.w3.org/polygons" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                                            <span className="absolute -top-2 -right-2 bg-[#C67C4E] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">2</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile App Scrollable Content */}
                                <div className="flex-1 overflow-y-auto hide-scrollbar pb-24">
                                    {/* Hero Card */}
                                    <div className="px-5 mt-2">
                                        <div className="h-[240px] rounded-[24px] overflow-hidden relative shadow-lg from-[#8B7355] to-[#4B3B2B] bg-gradient-to-b flex flex-col justify-end p-5">
                                            <div className="absolute inset-0 bg-black/20 mix-blend-overlay"></div>
                                            {/* Faux coffee bean loops from mockup (SVGs can be complex so let's simplify) */}
                                            <div className="absolute top-10 left-1/2 -translate-x-1/2 opacity-30">
                                                <div className="w-20 h-32 border-2 border-white rounded-[100%] absolute transform rotate-12 -ml-8"></div>
                                                <div className="w-20 h-32 border-2 border-white rounded-[100%] absolute transform -rotate-12 ml-4"></div>
                                                <div className="w-20 h-32 border-2 border-white rounded-[100%] absolute transform rotate-45 -mt-4 ml-6"></div>
                                            </div>

                                            <div className="relative z-10 text-center flex flex-col items-center">
                                                <p className="text-[#E09A6E] text-[10px] font-bold tracking-[0.2em] mb-2">AUTHENTIC BREWS</p>
                                                <h2 className="text-white font-serif text-2xl font-bold leading-tight italic">Crafted with Heart<br />in India</h2>
                                                <button className="mt-6 w-full py-3 bg-[#D4A373]/90 backdrop-blur text-white text-xs font-bold rounded-xl tracking-wider">ORDER NOW</button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mobile List */}
                                    <div className="mt-8 px-5">
                                        <div className="flex justify-between items-end mb-4">
                                            <h3 className="font-serif font-bold text-[#1A1A1A] text-lg">Signature Best Sellers</h3>
                                            <span className="text-[10px] text-[#C67C4E] font-bold underline cursor-pointer uppercase tracking-wider">View All</span>
                                        </div>
                                        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                                            {filteredItems.slice(0, 3).map(item => (
                                                <div key={`mob-${item._id}`} className="w-28 flex-shrink-0 bg-white p-2.5 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                                                    <div className="w-full aspect-square rounded-[20px] bg-gray-50 overflow-hidden mb-2 relative">
                                                        <img src={`${API_BASE}${item.image}`} className="w-full h-full object-cover" alt="" />
                                                    </div>
                                                    <h4 className="text-xs font-bold text-[#1A1A1A] truncate">{item.itemName || item.name}</h4>
                                                    <p className="text-xs font-bold text-[#C67C4E] mt-0.5">₹ {item.price}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile App Footer Tab Bar */}
                                <div className="absolute bottom-0 left-0 right-0 h-[72px] bg-white/90 backdrop-blur-lg border-t border-gray-200 flex justify-around items-center px-4 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.06)] pb-safe">
                                    <div className="text-[#C67C4E]"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg></div>
                                    <div className="text-gray-300"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 20.27l4.15-4.15a2.12 2.12 0 0 0-3-3L8 17.27zM2.83 14.17l8.48-8.48a2.12 2.12 0 0 1 3 3l-8.48 8.48a2.12 2.12 0 0 1-3-3z" /></svg></div>
                                    <div className="text-gray-300"><Heart size={20} strokeWidth={2.5} /></div>
                                    <div className="text-gray-300"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg></div>
                                </div>
                            </div>

                            {/* QR Print Info Card */}
                            <div className="mt-8 bg-[#FAF7F2] p-5 rounded-2xl border border-[#EFEBE4] w-full flex items-center gap-4 shadow-sm">
                                <div className="w-12 h-14 bg-white border border-gray-200 rounded-lg flex items-center justify-center p-2 shadow-sm">
                                    <QrCode size={20} className="text-gray-400" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-[#1A1A1A]">Customer Access QR</h4>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 mb-2">Download and place on your tables</p>
                                    <a href="/dashboard/tables" className="text-xs font-bold text-[#C67C4E] hover:underline">Download Print Assets</a>
                                </div>
                            </div>
                        </div>
                    </div>
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
                    existingCategories={allCategories}
                    initialCategory={initialCategory}
                />
            )}

            {/* Prompt Dialog */}
            {promptDialog.isOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex justify-center items-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-[#F5E6D3]">
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            promptDialog.onConfirm(e.target.promptInput.value);
                            setPromptDialog({ ...promptDialog, isOpen: false });
                        }} className="p-6">
                            <h3 className="text-xl font-black text-[#4B2E1E] mb-4">{promptDialog.title}</h3>
                            <input
                                name="promptInput"
                                autoFocus
                                defaultValue={promptDialog.initialValue}
                                className="w-full bg-[#FAF7F2] border border-[#F5E6D3] rounded-xl px-4 py-3 text-sm font-bold text-[#4B2E1E] focus:outline-none focus:border-[#C89B6D] focus:ring-2 focus:ring-[#C89B6D]/20 transition-all mb-6"
                            />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setPromptDialog({ ...promptDialog, isOpen: false })} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-[#C67C4E] text-white rounded-xl font-bold transition-all shadow-lg hover:bg-[#b56e43]">Save</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Confirm Dialog */}
            {confirmDialog.isOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex justify-center items-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-[#F5E6D3]">
                        <div className="p-6">
                            <h3 className="text-xl font-black text-[#4B2E1E] mb-2">{confirmDialog.title}</h3>
                            <p className="text-sm font-bold text-gray-500 mb-6">{confirmDialog.message}</p>
                            <div className="flex gap-3">
                                <button onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold transition-colors">Cancel</button>
                                <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog({ ...confirmDialog, isOpen: false }); }} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-red-200">Confirm</button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default MenuManagement;
