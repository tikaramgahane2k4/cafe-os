import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
    TrendingUp,
    Users,
    ShoppingBag,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';

const StatCard = ({ title, value, icon, trend, trendValue }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                {icon}
            </div>
            <div className={`flex items-center gap-1 text-sm font-bold ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                {trendValue}
            </div>
        </div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
    </div>
);

const Dashboard = () => {
    const { user } = useAuth();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.email}!</h1>
                <p className="text-gray-500 mt-1 font-medium">Here's what's happening in your cafe today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value="$12,450.00"
                    icon={<DollarSign size={20} />}
                    trend="up"
                    trendValue="12.5%"
                />
                <StatCard
                    title="Daily Orders"
                    value="156"
                    icon={<ShoppingBag size={20} />}
                    trend="up"
                    trendValue="8.2%"
                />
                <StatCard
                    title="Active Customers"
                    value="48"
                    icon={<Users size={20} />}
                    trend="down"
                    trendValue="3.1%"
                />
                <StatCard
                    title="Menu Growth"
                    value="12%"
                    icon={<TrendingUp size={20} />}
                    trend="up"
                    trendValue="5.4%"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80 flex items-center justify-center text-gray-400">
                    Chart Placeholder (Revenue over time)
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80 flex items-center justify-center text-gray-400">
                    Chart Placeholder (Popular categories)
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
