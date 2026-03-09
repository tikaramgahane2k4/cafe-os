import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Search, MapPin, Calendar, Star, History, ShoppingBag, Plus, X, Phone, Mail, Coffee } from 'lucide-react';

const CustomerCRM = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modals state
    const [showAddModal, setShowAddModal] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    // Form data
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
    const [saving, setSaving] = useState(false);

    // Order data
    const [menuItems, setMenuItems] = useState([]);
    const [orderItems, setOrderItems] = useState([]);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/customers');
            setCustomers(res.data);
        } catch (err) {
            console.error('Failed to fetch customers', err);
        }
        setLoading(false);
    };

    const fetchMenu = async () => {
        try {
            const res = await api.get('/menu');
            // Assuming menu API returns array of items with stock property
            if (Array.isArray(res.data)) {
                setMenuItems(res.data.filter(item => item.stock));
            } else {
                console.error('Menu data is not an array', res.data);
            }
        } catch (err) {
            console.error('Failed to fetch menu', err);
        }
    };

    useEffect(() => {
        fetchCustomers();
        fetchMenu();
    }, []);

    const handleOpenAdd = () => {
        setFormData({ name: '', email: '', phone: '' });
        setShowAddModal(true);
    };

    const handleCustomerSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/customers', formData);
            setShowAddModal(false);
            fetchCustomers();
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to add customer';
            alert(`Error: ${errorMsg}`);
            console.error('Customer submit error:', error);
        }
        setSaving(false);
    };

    const handleOpenOrder = (customer) => {
        setSelectedCustomer(customer);
        setOrderItems([]);
        setShowOrderModal(true);
    };

    const addOrderItem = (menuItem) => {
        setOrderItems(prev => {
            const exists = prev.find(i => i.menuItemId === menuItem._id);
            if (exists) {
                return prev.map(i => i.menuItemId === menuItem._id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { menuItemId: menuItem._id, name: menuItem.itemName, price: menuItem.price, quantity: 1 }];
        });
    };

    const removeOrderItem = (id) => {
        setOrderItems(prev => prev.filter(i => i.menuItemId !== id));
    };

    const orderTotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handleOrderSubmit = async () => {
        if (orderItems.length === 0) return;
        setSaving(true);
        try {
            await api.post(`/customers/${selectedCustomer._id}/orders`, {
                items: orderItems,
                total: orderTotal
            });
            setShowOrderModal(false);
            fetchCustomers(); // Refresh loyalty points
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to place order';
            alert(`Error: ${errorMsg}`);
            console.error('Order submit error:', error);
        }
        setSaving(false);
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.phone && c.phone.includes(searchTerm))
    );

    return (
        <div className="space-y-8 animate-fade-in relative block">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-[#4B2E1E] tracking-tight">Customer CRM</h1>
                    <p className="text-[#C89B6D] font-bold mt-1">Track loyalty points and customer history.</p>
                </div>
                <button onClick={handleOpenAdd} className="flex items-center gap-2 coffee-gradient text-white px-6 py-3.5 rounded-2xl font-black shadow-xl shadow-[#6B3E26]/20 transition-all hover:coffee-gradient-hover active:scale-95">
                    <Plus size={22} strokeWidth={3} />
                    Add Customer
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#F5E6D3] overflow-hidden">
                <div className="p-8 border-b border-[#F5E6D3] bg-[#FAF7F2]/30 flex">
                    <div className="relative w-full md:w-[400px] border border-[#F5E6D3] rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-[#6B3E26]/5 transition-all shadow-sm">
                        <input
                            type="text"
                            placeholder="Search customers..."
                            className="w-full pl-12 pr-4 py-3.5 bg-white text-sm font-bold text-[#4B2E1E] placeholder-[#C89B6D]/60 focus:outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#C89B6D]">
                            <Search size={20} />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[#FAF7F2] border-b border-[#F5E6D3]">
                                <th className="px-8 py-5 text-[10px] font-black text-[#C89B6D] uppercase tracking-[0.2em]">Customer</th>
                                <th className="px-8 py-5 text-[10px] font-black text-[#C89B6D] uppercase tracking-[0.2em]">Contact & ID</th>
                                <th className="px-8 py-5 text-[10px] font-black text-[#C89B6D] uppercase tracking-[0.2em]">Loyalty Points</th>
                                <th className="px-8 py-5 text-[10px] font-black text-[#C89B6D] uppercase tracking-[0.2em]">Visits</th>
                                <th className="px-8 py-5 text-[10px] font-black text-[#C89B6D] uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F5E6D3]/50">
                            {loading ? (
                                <tr><td colSpan="5" className="px-8 py-16 text-center text-[#C89B6D] font-black animate-pulse">Loading customers...</td></tr>
                            ) : filteredCustomers.length === 0 ? (
                                <tr><td colSpan="5" className="px-8 py-16 text-center text-[#C89B6D] font-black">No customers found.</td></tr>
                            ) : (
                                filteredCustomers.map((customer, index) => (
                                    <tr key={customer._id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-[#FAF7F2]/50'} hover:bg-[#F5E6D3]/30 transition-colors duration-200 group`}>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-full border-2 border-white transform group-hover:scale-110 transition-transform duration-300 bg-[#C89B6D] text-white flex items-center justify-center font-black text-xl shadow-md">
                                                    {customer.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-black text-[#4B2E1E] text-lg leading-tight group-hover:text-[#6B3E26] transition-colors">{customer.name}</p>
                                                    <p className="text-[10px] text-[#C89B6D] font-bold mt-1 uppercase tracking-wider">Joined: {new Date(customer.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="text-sm font-bold text-[#6B3E26] bg-[#F5E6D3]/50 px-3 py-1.5 rounded-lg mb-1 inline-block">
                                                <Phone size={12} className="inline mr-1" />{customer.phone || 'No phone'}
                                            </div>
                                            <p className="text-xs text-[#C89B6D] font-bold px-1"><Mail size={10} className="inline mr-1" />{customer.email || 'No email'}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-[#FAF7F2] border border-[#F5E6D3] text-[#4B2E1E] px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm font-black w-24 justify-center">
                                                    <Star size={18} className="text-[#C89B6D]" fill="#C89B6D" />
                                                    {customer.loyaltyPoints}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="flex items-center gap-2 text-sm font-black text-[#6B3E26]">
                                                <History size={18} className="text-[#C89B6D]" />
                                                {customer.visitHistory?.length || 0} visits
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button onClick={() => handleOpenOrder(customer)} className="p-2.5 text-[#4B2E1E] hover:bg-[#4B2E1E] hover:text-white rounded-xl transition-all duration-300 shadow-sm border border-[#F5E6D3] hover:border-transparent bg-white group/btn">
                                                <span className="font-bold text-xs flex items-center gap-2 px-2"><ShoppingBag size={14} className="group-hover/btn:animate-bounce" /> + Order</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Customer Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-[#F5E6D3] relative animate-fade-in">
                        <div className="bg-[#FAF7F2] p-6 border-b border-[#F5E6D3] flex justify-between items-center">
                            <h2 className="text-xl font-black text-[#4B2E1E]">Add New Customer</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-[#C89B6D] hover:text-[#4B2E1E] transition-colors rounded-full p-2 hover:bg-[#F5E6D3]/50">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCustomerSubmit} className="p-8 space-y-5">
                            <div>
                                <label className="block text-xs font-black text-[#6B3E26] mb-2 uppercase tracking-wider">Customer Name</label>
                                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[#FAF7F2] border border-[#F5E6D3] rounded-xl px-4 py-3 text-sm font-bold text-[#4B2E1E] focus:outline-none focus:border-[#C89B6D] focus:ring-2 focus:ring-[#C89B6D]/20 transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-[#6B3E26] mb-2 uppercase tracking-wider">Email Address</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-[#FAF7F2] border border-[#F5E6D3] rounded-xl px-4 py-3 text-sm font-bold text-[#4B2E1E] focus:outline-none focus:border-[#C89B6D] focus:ring-2 focus:ring-[#C89B6D]/20 transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-[#6B3E26] mb-2 uppercase tracking-wider">Phone Number</label>
                                <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-[#FAF7F2] border border-[#F5E6D3] rounded-xl px-4 py-3 text-sm font-bold text-[#4B2E1E] focus:outline-none focus:border-[#C89B6D] focus:ring-2 focus:ring-[#C89B6D]/20 transition-all" />
                            </div>
                            <button disabled={saving} type="submit" className="w-full coffee-gradient block text-white px-6 py-4 rounded-xl font-black shadow-xl shadow-[#6B3E26]/20 transition-all hover:coffee-gradient-hover mt-6 text-center">
                                {saving ? 'Adding...' : 'Add Customer'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Order Modal */}
            {showOrderModal && selectedCustomer && (
                <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-[#F5E6D3] relative animate-fade-in flex flex-col max-h-[90vh]">
                        <div className="bg-[#FAF7F2] p-6 border-b border-[#F5E6D3] flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-xl font-black text-[#4B2E1E] flex items-center gap-2">
                                    <ShoppingBag className="text-[#C89B6D]" /> Place Order for {selectedCustomer.name}
                                </h2>
                                <p className="text-xs text-[#6B3E26] font-bold mt-1 uppercase tracking-wider">Earn 1 Loyalty Point for every $10 spent</p>
                            </div>
                            <button onClick={() => setShowOrderModal(false)} className="text-[#C89B6D] hover:text-[#4B2E1E] transition-colors rounded-full p-2 hover:bg-[#F5E6D3]/50">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                            {/* Menu Selection Side */}
                            <div className="w-full md:w-3/5 p-6 border-r border-[#F5E6D3] overflow-y-auto bg-white/50">
                                <h3 className="text-sm font-black text-[#6B3E26] mb-4 uppercase tracking-wider">Select Menu Items</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {menuItems.map(item => (
                                        <button
                                            key={item._id}
                                            onClick={() => addOrderItem(item)}
                                            className="bg-white border text-left border-[#F5E6D3] p-4 rounded-2xl hover:border-[#C89B6D] hover:shadow-md transition-all active:scale-95 group flex flex-col justify-between h-28"
                                        >
                                            <span className="font-bold text-[#4B2E1E] block truncate">{item.itemName}</span>
                                            <div className="flex justify-between items-end mt-2">
                                                <span className="text-[#C89B6D] font-black">${item.price.toFixed(2)}</span>
                                                <span className="bg-[#FAF7F2] text-[#6B3E26] p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Plus size={16} /></span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Order Summary Side */}
                            <div className="w-full md:w-2/5 p-6 bg-[#FAF7F2]/30 flex flex-col">
                                <h3 className="text-sm font-black text-[#6B3E26] mb-4 uppercase tracking-wider">Order Items</h3>

                                <div className="flex-1 overflow-y-auto space-y-3 pr-2 border-b border-[#F5E6D3] pb-4 mb-4">
                                    {orderItems.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-[#C89B6D] gap-2 opacity-50">
                                            <Coffee size={40} />
                                            <p className="font-bold text-sm">Click items to add</p>
                                        </div>
                                    ) : (
                                        orderItems.map(item => (
                                            <div key={item.menuItemId} className="bg-white p-4 rounded-xl border border-[#F5E6D3] shadow-sm flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-[#4B2E1E]">{item.name}</p>
                                                    <p className="text-xs font-bold text-[#C89B6D]">${item.price.toFixed(2)} × {item.quantity}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-black text-[#6B3E26]">${(item.price * item.quantity).toFixed(2)}</span>
                                                    <button onClick={() => removeOrderItem(item.menuItemId)} className="text-red-400 hover:text-red-600 bg-red-50 p-1.5 rounded-lg transition-colors">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="shrink-0 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[#4B2E1E] font-black text-lg">Total</span>
                                        <span className="text-2xl font-black text-[#6B3E26]">${orderTotal.toFixed(2)}</span>
                                    </div>
                                    <button
                                        onClick={handleOrderSubmit}
                                        disabled={orderItems.length === 0 || saving}
                                        className="w-full coffee-gradient block text-white px-6 py-4 rounded-xl font-black shadow-xl shadow-[#6B3E26]/20 transition-all hover:coffee-gradient-hover active:scale-95 disabled:opacity-50 text-center"
                                    >
                                        {saving ? 'Placing Order...' : 'Place Order'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerCRM;
