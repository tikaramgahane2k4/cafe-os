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
    Heart
} from 'lucide-react';

const DashboardLayout = ({ children, showHeader = true }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Menu Management', path: '/dashboard/menu', icon: <MenuIcon size={20} /> },
        { name: 'Inventory Control', path: '/dashboard/inventory', icon: <Warehouse size={20} /> },
        { name: 'Staff', path: '/dashboard/staff', icon: <Users size={20} /> },
        { name: 'Customers', path: '/dashboard/customers', icon: <Heart size={20} /> },
    ];

    return (
        <div className="flex h-screen bg-[#FAF7F2] font-inter w-full overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-[#4B2E1E] flex flex-col shadow-2xl z-20">
                <div className="p-8 flex items-center gap-3">
                    <div className="bg-[#C89B6D] p-2.5 rounded-xl text-white shadow-lg shadow-black/20 transform hover:rotate-12 transition-transform duration-300">
                        <Coffee size={28} strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">Cafe Owner</h1>
                        <p className="text-[10px] text-[#C89B6D] uppercase font-bold tracking-widest leading-none mt-0.5">Premium Portal</p>
                    </div>
                </div>

                <nav className="flex-1 mt-4 px-4 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group ${isActive
                                    ? 'bg-[#6B3E26] text-white shadow-lg shadow-black/10'
                                    : 'text-[#C89B6D] hover:bg-[#6B3E26]/30 hover:text-[#FAF7F2]'
                                }`
                            }
                        >
                            <span className="transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
                                {item.icon}
                            </span>
                            <span className="font-bold text-sm tracking-wide">{item.name}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-[#6B3E26]/30">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3.5 w-full text-[#C89B6D] hover:bg-[#9B2226]/10 hover:text-[#9B2226] rounded-xl transition-all duration-300 font-bold text-sm group"
                    >
                        <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#F5E6D3]/30 rounded-full -mr-48 -mt-48 blur-3xl -z-10"></div>

                {showHeader && (
                    <header className="bg-white/80 backdrop-blur-md border-b border-[#F5E6D3] h-20 flex items-center justify-between px-10 z-10">
                        <div className="flex flex-col">
                            <h2 className="text-2xl font-bold text-[#4B2E1E]">
                                {navItems.find(item => item.path === window.location.pathname)?.name || 'Admin Panel'}
                            </h2>
                            <div className="h-1 w-8 bg-[#C89B6D] rounded-full mt-1"></div>
                        </div>

                        <div className="flex items-center gap-5">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-[#4B2E1E] leading-none mb-1">Welcome back</p>
                                <span className="text-xs font-medium text-[#C89B6D]">{user?.email}</span>
                            </div>
                            <div className="h-12 w-12 rounded-2xl bg-[#6B3E26] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-[#6B3E26]/20 border-2 border-white ring-2 ring-[#F5E6D3] transition-transform hover:scale-105 cursor-pointer">
                                {user?.email?.charAt(0).toUpperCase()}
                            </div>
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
