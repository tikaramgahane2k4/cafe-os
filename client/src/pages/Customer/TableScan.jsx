import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Coffee, CheckCircle, XCircle, ShoppingBag, Loader2, Search, Heart, Plus, Minus, X, Trash2 } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const TableScan = () => {
    const { cafeId, tableNumber } = useParams();
    const [table, setTable] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [menu, setMenu] = useState([]);
    const [loadingMenu, setLoadingMenu] = useState(false);
    const [occupiedByMe, setOccupiedByMe] = useState(false);
    const [activeTab, setActiveTab] = useState('All');
    const [verifyingLocation, setVerifyingLocation] = useState(false);

    // New state for functionality
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [itemQuantity, setItemQuantity] = useState(1);
    const [wishlist, setWishlist] = useState(() => {
        const saved = localStorage.getItem(`wishlist_${cafeId}`);
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        fetchTableStatus();
    }, [cafeId, tableNumber]);

    useEffect(() => {
        localStorage.setItem(`wishlist_${cafeId}`, JSON.stringify(wishlist));
    }, [wishlist, cafeId]);

    const fetchTableStatus = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`http://localhost:5000/api/tables/${cafeId}/${tableNumber}`);
            setTable(res.data);
            const savedSession = sessionStorage.getItem(`table_${cafeId}_${tableNumber}`);
            if (savedSession === 'occupied') {
                setOccupiedByMe(true);
                fetchMenu();
            }
        } catch (err) {
            console.error(err);
            setError('Table not found or invalid QR code.');
        } finally {
            setLoading(false);
        }
    };

    const fetchMenu = async () => {
        try {
            setLoadingMenu(true);
            const res = await axios.get(`${API_BASE}/api/menu?cafeId=${cafeId}`);
            const cafeMenu = res.data.filter(item => item.inStock || item.stock);
            setMenu(cafeMenu);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingMenu(false);
        }
    };

    const handleOccupy = async () => {
        if (table?.locationRequired) {
            if (!navigator.geolocation) {
                setError('Geolocation is not supported by your browser. Cannot verify location.');
                return;
            }
            setVerifyingLocation(true);
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    await occupyTableWithLocation(position.coords.latitude, position.coords.longitude);
                },
                (error) => {
                    setVerifyingLocation(false);
                    setError('Unable to retrieve your location. Check browser permissions.');
                }
            );
        } else {
            await occupyTableWithLocation(null, null);
        }
    };

    const occupyTableWithLocation = async (lat, lng) => {
        try {
            setLoading(true);
            await axios.post(`http://localhost:5000/api/tables/${cafeId}/${tableNumber}/occupy`, {
                userLat: lat,
                userLng: lng
            });
            setTable({ ...table, isOccupied: true });
            setOccupiedByMe(true);
            sessionStorage.setItem(`table_${cafeId}_${tableNumber}`, 'occupied');
            fetchMenu();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to occupy table.');
            fetchTableStatus();
        } finally {
            setLoading(false);
            setVerifyingLocation(false);
        }
    };

    if (loading && !table) {
        return (
            <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center font-inter">
                <Loader2 className="animate-spin text-[#C67C4E]" size={48} />
            </div>
        );
    }

    if (error || !table) {
        return (
            <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 font-inter">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-[#EFEBE4]">
                    <XCircle className="text-red-500 mx-auto mb-4" size={64} />
                    <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Invalid Table</h1>
                    <p className="text-gray-500 mb-6">{error || 'This table does not exist.'}</p>
                </div>
            </div>
        );
    }

    if (table.isOccupied && !occupiedByMe) {
        return (
            <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center p-6 font-inter">
                <div className="bg-white p-8 rounded-[32px] shadow-sm max-w-md w-full text-center border border-gray-100">
                    <XCircle className="text-red-500 mx-auto mb-4" size={56} strokeWidth={1.5} />
                    <h1 className="text-xl font-bold text-[#111827] mb-2">Table {table.tableNumber} is Occupied</h1>
                    <p className="text-gray-500 mb-6 text-sm">This table is currently in use. Please scan a QR code at an available table.</p>
                </div>
            </div>
        );
    }

    if (!table.isOccupied && !occupiedByMe) {
        return (
            <div className="min-h-screen bg-white flex flex-col justify-center font-inter relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-[#8B7355] to-[#4B3B2B] rounded-b-[60px] -z-10"></div>
                <div className="px-6 relative z-10 w-full max-w-md mx-auto">
                    <div className="bg-white p-8 rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] text-center border border-gray-50">
                        <div className="bg-[#3D2B24] w-20 h-20 rounded-[28px] mx-auto flex items-center justify-center text-[#D4B896] mb-6 shadow-xl shadow-[#3D2B24]/30 transform rotate-3">
                            <Coffee size={36} strokeWidth={2} />
                        </div>
                        <h1 className="text-3xl font-bold text-[#111827] mb-2 tracking-tight">Table {table.tableNumber}</h1>
                        <div className="flex justify-center mb-6">
                            <span className="text-[#C67C4E] text-sm font-bold flex items-center gap-1.5 bg-[#C67C4E]/10 px-3 py-1 rounded-full">
                                <span className="w-2 h-2 rounded-full bg-[#C67C4E]"></span>
                                Available
                            </span>
                        </div>
                        <p className="text-gray-500 mb-8 text-sm leading-relaxed">Welcome! Tap below to occupy this table and browse our digital menu.</p>
                        <button
                            onClick={handleOccupy}
                            disabled={loading || verifyingLocation}
                            className="w-full bg-[#D4A373] hover:bg-[#c39160] text-white py-4 rounded-2xl font-bold text-[15px] transition-transform active:scale-95 flex items-center justify-center shadow-lg shadow-[#D4A373]/25"
                        >
                            {loading || verifyingLocation ? <Loader2 className="animate-spin" size={24} /> : 'View Menu'}
                        </button>
                        {verifyingLocation && <p className="text-sm mt-3 text-gray-500">Verifying cafe location...</p>}
                    </div>
                </div>
            </div>
        );
    }

    // Dynamic categories calculation
    const dynamicCategories = [...new Set(menu.map(item => item.category))].sort();
    const displayCategories = dynamicCategories.map(cat => {
        const catItems = menu.filter(i => i.category === cat);
        return { name: cat, count: catItems.length };
    });

    // Filters 
    const filteredMenu = menu.filter(item => {
        const title = (item.itemName || item.name || '').toLowerCase();
        const matchesSearch = title.includes(searchQuery.toLowerCase());
        const inStock = item.inStock || item.stock;

        if (!inStock || !matchesSearch) return false;

        if (activeTab === 'Wishlist') return wishlist.includes(item._id);
        if (activeTab === 'All') return true;

        return item.category === activeTab;
    });

    // Interactive Functions
    const toggleWishlist = (itemId, e) => {
        if (e) e.stopPropagation();
        setWishlist(prev => prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]);
    };

    const addToCart = (item, e) => {
        if (e) e.stopPropagation();
        setCart(prev => {
            const existing = prev.find(i => i._id === item._id);
            if (existing) {
                return prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const addMultipleToCart = (item, quantity) => {
        setCart(prev => {
            const existing = prev.find(i => i._id === item._id);
            if (existing) {
                return prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + quantity } : i);
            }
            return [...prev, { ...item, quantity }];
        });
        setSelectedItem(null);
    };

    const updateQuantity = (itemId, delta) => {
        setCart(prev => prev.map(item => {
            if (item._id === itemId) {
                const newQuantity = item.quantity + delta;
                return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
            }
            return item;
        }));
    };

    const removeFromCart = (itemId) => {
        setCart(prev => prev.filter(item => item._id !== itemId));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const handleCheckout = () => {
        setOrderPlaced(true);
        setCart([]);
        setShowCart(false);
        setTimeout(() => setOrderPlaced(false), 3000);
    };

    return (
        <div className="h-[100dvh] w-full bg-[#f8f9fa] font-inter relative max-w-md mx-auto shadow-2xl xl:h-[90vh] xl:my-[5vh] xl:rounded-[40px] overflow-hidden ring-1 ring-gray-200 flex flex-col">
            {/* Header */}
            <div className="pt-10 px-6 pb-4 flex justify-between items-center bg-white/80 backdrop-blur-md z-10 sticky top-0 shadow-sm border-b border-gray-100 flex-shrink-0">
                <div onClick={() => setActiveTab('All')} className="w-10 h-10 rounded-full bg-[#3D2B24] flex items-center justify-center text-[#D4B896] shadow-sm cursor-pointer">
                    <Coffee size={18} />
                </div>

                {showSearch ? (
                    <div className="flex-1 ml-4 flex items-center gap-2 animate-fade-in pr-2">
                        <div className="flex-1 bg-gray-100 rounded-full flex items-center px-4 py-2">
                            <Search size={16} className="text-gray-400 mr-2" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search menu..."
                                className="bg-transparent border-none focus:outline-none text-sm w-full font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <X size={20} className="text-gray-400 cursor-pointer hover:text-gray-600" onClick={() => { setShowSearch(false); setSearchQuery(''); }} />
                    </div>
                ) : (
                    <div className="flex items-center gap-5 text-gray-600">
                        <Search size={22} className="cursor-pointer hover:text-[#C67C4E] transition-colors" onClick={() => setShowSearch(true)} />
                        <div className="relative cursor-pointer hover:text-[#C67C4E] transition-colors" onClick={() => setShowCart(true)}>
                            <ShoppingBag size={22} />
                            {cartItemCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-[#C67C4E] text-white text-[10px] w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold shadow-md animate-scale-up">
                                    {cartItemCount}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto hide-scrollbar pb-24 bg-[#f8f9fa]">
                {/* Hero Card - Hide if searching or viewing wishlist to save space */}
                {!showSearch && activeTab !== 'Wishlist' && (
                    <div className="px-5 mt-2 animate-fade-in">
                        <div className="h-[280px] rounded-[32px] overflow-hidden relative shadow-lg from-[#8B7355] to-[#4B3B2B] bg-gradient-to-b flex flex-col justify-end p-6">
                            <div className="absolute inset-0 bg-black/20 mix-blend-overlay"></div>
                            <div className="absolute top-10 left-1/2 -translate-x-1/2 opacity-30">
                                <div className="w-20 h-32 border-2 border-white rounded-[100%] absolute transform rotate-12 -ml-8"></div>
                                <div className="w-20 h-32 border-2 border-white rounded-[100%] absolute transform -rotate-12 ml-4"></div>
                                <div className="w-20 h-32 border-2 border-white rounded-[100%] absolute transform rotate-45 -mt-4 ml-6"></div>
                            </div>
                            <div className="relative z-10 text-center flex flex-col items-center">
                                <p className="text-[#E09A6E] text-[10px] font-bold tracking-[0.2em] mb-2 uppercase">Authentic Brews</p>
                                <h2 className="text-white font-serif text-[28px] font-bold leading-tight italic">Crafted with Heart<br />in India</h2>
                                <button
                                    onClick={() => document.getElementById('menu-items-grid')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="mt-6 w-full py-3.5 bg-[#D4A373]/90 backdrop-blur text-white text-sm font-bold rounded-xl tracking-wider hover:bg-[#D4A373] transition-colors shadow-xl"
                                >
                                    ORDER NOW
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Categories Tab Strip */}
                <div className="mt-8 px-5">
                    <h3 className="font-serif font-bold text-[#1A1A1A] text-xl mb-4">Categories</h3>
                    <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                        {['All', ...displayCategories.map(c => c.name)].map(tab => (
                            <div
                                key={`cat-tab-${tab}`}
                                onClick={() => setActiveTab(tab)}
                                className={`cursor-pointer px-5 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all duration-300 shadow-sm ${activeTab === tab ? 'bg-[#C67C4E] text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                            >
                                {tab}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mobile List (Menu Items) */}
                <div id="menu-items-grid" className="mt-6 px-5">
                    <div className="flex justify-between items-end mb-4">
                        <h3 className="font-serif font-bold text-[#1A1A1A] text-xl">
                            {activeTab === 'All' ? 'Signature Best Sellers' : activeTab === 'Wishlist' ? 'Your Wishlist' : `${activeTab} Menu`}
                        </h3>
                    </div>

                    {filteredMenu.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <Coffee size={40} className="text-gray-200 mb-4" />
                            <p className="text-sm font-bold text-gray-500">No items found.</p>
                            <p className="text-xs text-gray-400 mt-1">Try a different category or search term.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-6 pb-4">
                            {filteredMenu.map(item => {
                                const inWishlist = wishlist.includes(item._id);
                                const inCart = cart.find(c => c._id === item._id);

                                return (
                                    <div
                                        key={`mob-item-${item._id}`}
                                        className="flex flex-col group relative bg-white p-3 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => { setSelectedItem(item); setItemQuantity(1); }}
                                    >
                                        <div className="w-full aspect-square rounded-[20px] bg-gray-50 overflow-hidden mb-3 relative transition-all">
                                            <img src={`${API_BASE}${item.image}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.itemName || item.name} />

                                            {/* Wishlist Button */}
                                            <div
                                                onClick={(e) => toggleWishlist(item._id, e)}
                                                className={`absolute top-2 right-2 backdrop-blur-md p-2 rounded-full cursor-pointer transition-all ${inWishlist ? 'bg-white/90 text-red-500 shadow-sm' : 'bg-black/20 text-white hover:bg-black/40'}`}
                                            >
                                                <Heart size={14} fill={inWishlist ? "currentColor" : "none"} className={inWishlist ? "animate-scale-up" : ""} />
                                            </div>

                                            {/* Added to Cart Info Tag */}
                                            {inCart && (
                                                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-bold text-[#C67C4E] shadow-sm flex items-center gap-1 animate-fade-in">
                                                    <CheckCircle size={10} /> In Cart ({inCart.quantity})
                                                </div>
                                            )}
                                        </div>

                                        <h4 className="text-sm font-bold text-[#1A1A1A] truncate pr-2">{item.itemName || item.name}</h4>

                                        <div className="flex items-center justify-between mt-1">
                                            <p className="text-sm font-black text-[#C67C4E]">₹ {item.price}</p>

                                            {/* Add to Cart Button */}
                                            <div
                                                onClick={(e) => addToCart(item, e)}
                                                className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer shadow-sm transition-all transform active:scale-90 ${inCart ? 'bg-[#C67C4E] text-white' : 'bg-[#1A1A1A] text-white'}`}
                                            >
                                                <Plus size={14} strokeWidth={3} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* Bottom Tab Bar */}
            <nav className="absolute bottom-0 left-0 right-0 w-full h-[72px] bg-white/90 backdrop-blur-lg border-t border-gray-200 flex justify-around items-center px-4 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.06)] pb-safe">
                <div onClick={() => setActiveTab('All')} className={`flex flex-col items-center justify-center w-16 h-full cursor-pointer transition-colors ${activeTab !== 'Wishlist' && !showCart ? 'text-[#C67C4E]' : 'text-gray-300 hover:text-gray-400'}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
                </div>
                <div onClick={() => { setShowSearch(true); document.getElementById('menu-items-grid')?.scrollIntoView({ behavior: 'smooth' }); }} className="flex flex-col items-center justify-center w-16 h-full cursor-pointer text-gray-300 hover:text-[#C67C4E] transition-colors">
                    <Search size={22} strokeWidth={2.5} />
                </div>
                <div onClick={() => { setActiveTab('Wishlist'); setShowCart(false); document.getElementById('menu-items-grid')?.scrollIntoView({ behavior: 'smooth' }); }} className={`flex flex-col items-center justify-center w-16 h-full cursor-pointer transition-colors ${activeTab === 'Wishlist' && !showCart ? 'text-[#C67C4E]' : 'text-gray-300 hover:text-[#C67C4E]'}`}>
                    <Heart size={22} strokeWidth={2.5} fill={activeTab === 'Wishlist' ? 'currentColor' : 'none'} />
                </div>
                <div onClick={() => setShowCart(true)} className={`flex flex-col items-center justify-center w-16 h-full cursor-pointer transition-colors ${showCart ? 'text-[#C67C4E]' : 'text-gray-300 hover:text-[#C67C4E]'}`}>
                    <ShoppingBag size={22} strokeWidth={2.5} />
                </div>
            </nav>

            {/* Cart Modal Overlay */}
            {showCart && (
                <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in flex flex-col justify-end">
                    <div className="bg-white rounded-t-[32px] w-full max-h-[85vh] flex flex-col animate-slide-up shadow-2xl">
                        {/* Modal Header */}
                        <div className="p-6 pb-4 flex justify-between items-center border-b border-gray-50">
                            <div>
                                <h3 className="font-serif font-bold text-2xl text-[#1A1A1A]">Your Cart</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{cartItemCount} Items</p>
                            </div>
                            <div onClick={() => setShowCart(false)} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors">
                                <X size={20} />
                            </div>
                        </div>

                        {/* Modal Body: Cart Items */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                            {cart.length === 0 ? (
                                <div className="text-center py-10">
                                    <ShoppingBag size={48} className="text-gray-200 mx-auto mb-4" />
                                    <p className="text-lg font-bold text-gray-400">Your cart is empty</p>
                                    <button onClick={() => setShowCart(false)} className="mt-4 text-[#C67C4E] font-bold text-sm hover:underline">Browse Menu</button>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={`cart-${item._id}`} className="flex gap-4">
                                        <div className="w-20 h-20 rounded-[20px] bg-gray-50 overflow-hidden shadow-sm flex-shrink-0">
                                            <img src={`${API_BASE}${item.image}`} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between py-0.5">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold text-[#1A1A1A] text-sm leading-tight">{item.itemName || item.name}</h4>
                                                    <p className="text-[#C67C4E] font-black text-sm mt-1">₹ {item.price}</p>
                                                </div>
                                                <button onClick={() => removeFromCart(item._id)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            {/* Quantity Control */}
                                            <div className="flex items-center gap-3 bg-gray-50 rounded-full w-max px-1 p-1 mt-2">
                                                <button onClick={() => updateQuantity(item._id, -1)} className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-[#C67C4E]">
                                                    <Minus size={12} strokeWidth={3} />
                                                </button>
                                                <span className="text-xs font-bold text-[#1A1A1A] w-4 text-center">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item._id, 1)} className="w-6 h-6 rounded-full bg-[#C67C4E] shadow-sm flex items-center justify-center text-white hover:bg-[#b56e43]">
                                                    <Plus size={12} strokeWidth={3} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Modal Footer: Checkout */}
                        {cart.length > 0 && (
                            <div className="p-6 bg-white border-t border-gray-50 pb-8">
                                <div className="flex justify-between items-center mb-6">
                                    <span className="font-bold text-gray-500 text-sm">Total Amount</span>
                                    <span className="font-black text-[#1A1A1A] text-2xl">₹ {cartTotal.toFixed(2)}</span>
                                </div>
                                <button
                                    onClick={handleCheckout}
                                    className="w-full py-4 rounded-2xl bg-[#C67C4E] hover:bg-[#b56e43] text-white font-bold text-[15px] transition-transform active:scale-95 shadow-xl shadow-[#C67C4E]/20 flex items-center justify-center gap-2"
                                >
                                    Place Order Securely
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Item Details Modal Overlay */}
            {selectedItem && (
                <div className="absolute inset-0 z-[60] bg-black/40 backdrop-blur-md animate-fade-in flex flex-col justify-end">
                    <div className="bg-white rounded-t-[40px] w-full max-h-[95vh] flex flex-col animate-slide-up shadow-2xl relative overflow-hidden ring-1 ring-gray-100">
                        {/* Pull Tab */}
                        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-12 h-1.5 bg-white/50 backdrop-blur-md rounded-full z-10"></div>

                        {/* Hero Image Section */}
                        <div className="relative w-full h-[320px] bg-gray-100 flex-shrink-0">
                            <img src={`${API_BASE}${selectedItem.image}`} alt={selectedItem.itemName || selectedItem.name} className="w-full h-full object-cover" />
                            <div className="absolute top-0 left-0 w-full p-5 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent pt-8">
                                <div onClick={() => setSelectedItem(null)} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-white/30 transition-colors border border-white/20">
                                    <X size={20} />
                                </div>
                                <div onClick={(e) => toggleWishlist(selectedItem._id, e)} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-white/30 transition-colors border border-white/20">
                                    <Heart size={20} fill={wishlist.includes(selectedItem._id) ? "currentColor" : "none"} className={wishlist.includes(selectedItem._id) ? "text-red-500 animate-scale-up" : ""} />
                                </div>
                            </div>
                        </div>

                        {/* Details Section */}
                        <div className="flex-1 overflow-y-auto px-6 py-8 pb-32 bg-white rounded-t-[40px] -mt-8 relative z-10">
                            <div className="flex justify-between items-start mb-3">
                                <h2 className="font-serif font-bold text-[32px] text-[#1A1A1A] leading-tight pr-4">{selectedItem.itemName || selectedItem.name}</h2>
                                <h3 className="font-black text-[26px] text-[#C67C4E] whitespace-nowrap mt-1">₹ {selectedItem.price}</h3>
                            </div>

                            <div className="flex items-center gap-2 mb-8">
                                <span className="text-[#C67C4E] text-[10px] font-bold tracking-[0.1em] bg-[#F9F2ED] px-3 py-1.5 rounded-lg uppercase">{selectedItem.category}</span>
                                <span className="text-gray-500 text-[10px] font-bold tracking-[0.1em] bg-gray-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 uppercase"><CheckCircle size={12} className="text-green-500" /> In Stock</span>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-bold text-[#1A1A1A] text-lg">Description</h4>
                                <p className="text-gray-500 text-sm leading-relaxed">
                                    {selectedItem.description || `Experience the rich, authentic taste of our premium ${selectedItem.category.toLowerCase()} selection. Crafted with care and high-quality ingredients to deliver a delightful culinary moment just for you.`}
                                </p>
                            </div>
                        </div>

                        {/* Floating Action Bar */}
                        <div className="absolute bottom-0 left-0 w-full bg-white/95 backdrop-blur-lg border-t border-gray-100 p-5 gap-4 flex z-20 pb-safe shadow-[0_-20px_40px_rgba(0,0,0,0.06)]">
                            <div className="flex items-center justify-between bg-gray-100/80 rounded-[20px] px-2 py-2 h-[60px] w-32 border border-gray-200/50">
                                <button onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-500 hover:text-[#C67C4E] transition-colors">
                                    <Minus size={18} strokeWidth={2.5} />
                                </button>
                                <span className="text-lg font-black text-[#1A1A1A] w-6 text-center">{itemQuantity}</span>
                                <button onClick={() => setItemQuantity(itemQuantity + 1)} className="w-10 h-10 rounded-full bg-[#C67C4E] shadow-xl shadow-[#C67C4E]/20 flex items-center justify-center text-white hover:bg-[#b56e43] transition-colors">
                                    <Plus size={18} strokeWidth={2.5} />
                                </button>
                            </div>
                            <button
                                onClick={() => addMultipleToCart(selectedItem, itemQuantity)}
                                className="flex-1 h-[60px] rounded-[20px] bg-[#1A1A1A] hover:bg-black text-white font-bold text-base transition-transform active:scale-95 shadow-xl flex items-center justify-center gap-2"
                            >
                                Add item - ₹ {(selectedItem.price * itemQuantity).toFixed(2)}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Order Success Toast overlay */}
            {orderPlaced && (
                <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-[#1A1A1A] text-white px-6 py-4 rounded-full shadow-2xl z-[60] flex items-center gap-3 animate-slide-down w-max">
                    <CheckCircle className="text-[#10B981]" size={20} fill="currentColor" />
                    <span className="text-sm font-bold tracking-wide">Order Placed Successfully!</span>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        body { margin: 0; background-color: #f1f5f9; }
        
        @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        
        @keyframes scale-up { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .animate-scale-up { animation: scale-up 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        
        @keyframes slide-up { 0% { transform: translateY(100%); } 100% { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        
        @keyframes slide-down { 0% { transform: translate(-50%, -100%); opacity: 0; } 100% { transform: translate(-50%, 0); opacity: 1; } }
        .animate-slide-down { animation: slide-down 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
      `}} />
        </div>
    );
};

export default TableScan;
