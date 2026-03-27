import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Menu as MenuIcon,
    Warehouse,
    LogOut,
    Coffee,
    Users,
    Heart,
    QrCode
} from 'lucide-react';

const DashboardLayout = ({ children, showHeader = true }) => {
    const { user, logoutUser } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logoutUser();
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Website & Ordering', path: '/dashboard/menu', icon: <MenuIcon size={20} /> },
        { name: 'Inventory Control', path: '/dashboard/inventory', icon: <Warehouse size={20} /> },
        { name: 'Staff', path: '/dashboard/staff', icon: <Users size={20} /> },
        { name: 'Customers', path: '/dashboard/customers', icon: <Heart size={20} /> },
        { name: 'Tables & QR', path: '/dashboard/tables', icon: <QrCode size={20} /> },
    ];

    return (
        <div className="flex h-screen bg-[#FAF7F2] font-inter w-full overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-[#2C1A12] flex flex-col border-r border-[#1B100B] z-20">
                <div className="p-8 flex items-center gap-3">
                    <div className="bg-[#E69C55] p-2 rounded-lg text-[#1B100B] shadow-sm">
                        <Coffee size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-[#F5E6D3] font-serif tracking-tight">Cafe Growth</h1>
                    </div>
                </div>

                <nav className="flex-1 mt-2 px-4 space-y-1.5">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group font-medium ${isActive
                                    ? 'bg-[#4B2E1E] text-white shadow-md'
                                    : 'text-[#C2A58C] hover:bg-[#4B2E1E] hover:text-[#F5E6D3]'
                                }`
                            }
                        >
                            <span className={`transition-transform duration-200 ${item.path === window.location.pathname ? 'text-[#E69C55]' : 'text-[#A68A73] group-hover:text-[#F5E6D3]'}`}>
                                {item.icon}
                            </span>
                            <span className="text-sm tracking-wide">{item.name}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-[#3A2214]">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3.5 w-full text-[#C2A58C] hover:bg-red-900/30 hover:text-red-400 rounded-xl transition-all duration-200 font-medium text-sm group"
                    >
                        <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-full h-64 bg-gradient-to-b from-[#FFF2E5]/40 to-transparent -z-10 pointer-events-none"></div>

                {showHeader && (
                    <header className="bg-transparent h-24 flex items-center justify-between px-10 z-10">
                        <div className="flex flex-col">
                            <h2 className="text-3xl font-serif font-bold text-[#4B2E1E] tracking-tight">
                                {navItems.find(item => item.path === window.location.pathname)?.name || 'Admin Panel'}
                            </h2>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">LIVE • ZERO-COMMISSION ENABLED</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest inline-block mr-2">REVENUE RETAINED</p>
                                <span className="text-lg font-bold text-[#4B2E1E] italic font-serif">₹45,200.00</span>
                            </div>
                            <button className="bg-[#C67C4E] hover:bg-[#b56e43] text-white px-6 py-2.5 rounded-full font-medium text-sm shadow-md transition-colors">
                                Publish Changes
                            </button>
                        </div>
                    </header>
                )}

                <div className="p-10 overflow-auto flex-1 animate-fade-in">
                    {children ?? <Outlet />}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
