import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Coffee, Lock, Mail, Loader2 } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        const res = await login(email, password);
        if (res.success) {
            navigate('/dashboard');
        } else {
            setError(res.message);
        }
        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] relative overflow-hidden px-4">
            {/* Background pattern/elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#F5E6D3] rounded-full -mr-32 -mt-32 opacity-50 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#C89B6D] rounded-full -ml-48 -mb-48 opacity-20 blur-3xl"></div>

            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-[12px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#F5E6D3] relative z-10 animate-fade-in">
                <div className="text-center">
                    <div className="mx-auto h-20 w-20 bg-[#6B3E26] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-[#6B3E26]/20 transform hover:scale-110 transition-transform duration-300 cursor-pointer">
                        <Coffee size={40} strokeWidth={1.5} />
                    </div>
                    <h2 className="mt-8 text-3xl font-bold text-[#4B2E1E] tracking-tight">
                        Cafe Owner Portal
                    </h2>
                    <p className="mt-2 text-[#C89B6D] font-medium">
                        Manage your cafe digitally
                    </p>
                </div>

                <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-[#FAF7F2] text-[#9B2226] p-4 rounded-xl text-sm font-semibold border border-[#9B2226]/10 animate-shake">
                            {error}
                        </div>
                    )}

                    <div className="space-y-5">
                        <div className="group">
                            <label
                                htmlFor="email"
                                className="block text-sm font-bold text-[#6B3E26] mb-2 ml-1"
                            >
                                Email Address
                            </label>
                            <div className="relative">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="appearance-none block w-full px-12 py-3.5 bg-[#FAF7F2] border border-[#F5E6D3] rounded-xl text-[#4B2E1E] placeholder-[#C89B6D]/60 focus:outline-none focus:ring-2 focus:ring-[#6B3E26]/20 focus:border-[#6B3E26] focus:bg-white transition-all duration-300 sm:text-sm"
                                    placeholder="admin@cafe.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#C89B6D] group-focus-within:text-[#6B3E26] transition-colors">
                                    <Mail size={20} />
                                </div>
                            </div>
                        </div>

                        <div className="group">
                            <label
                                htmlFor="password"
                                className="block text-sm font-bold text-[#6B3E26] mb-2 ml-1"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="appearance-none block w-full px-12 py-3.5 bg-[#FAF7F2] border border-[#F5E6D3] rounded-xl text-[#4B2E1E] placeholder-[#C89B6D]/60 focus:outline-none focus:ring-2 focus:ring-[#6B3E26]/20 focus:border-[#6B3E26] focus:bg-white transition-all duration-300 sm:text-sm"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#C89B6D] group-focus-within:text-[#6B3E26] transition-colors">
                                    <Lock size={20} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-xl text-white coffee-gradient hover:coffee-gradient-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6B3E26] transition-all duration-300 shadow-xl shadow-[#6B3E26]/20 disabled:opacity-70 active:scale-[0.98]"
                        >
                            {isSubmitting ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                'Sign in to Dashboard'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
