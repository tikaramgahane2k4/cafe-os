import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../api/axios';
import { X, Upload, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const MenuForm = ({ onClose, onSuccess, editingItem, existingCategories = [], initialCategory = '' }) => {
    const [formData, setFormData] = useState({
        itemName: '',
        category: initialCategory,
        price: '',
        stock: true,
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const cafeId = user?.tenantId || user?.cafeId || user?.id;

    useEffect(() => {
        if (editingItem) {
            setFormData({
                itemName: editingItem.itemName,
                category: editingItem.category,
                price: editingItem.price,
                stock: editingItem.stock,
            });
            setImagePreview(`${API_BASE}${editingItem.image}`);
        }
    }, [editingItem]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        if (!editingItem && !imageFile) {
            setError('Please upload an image');
            setIsSubmitting(false);
            return;
        }

        const data = new FormData();
        data.append('itemName', formData.itemName);
        data.append('category', formData.category);
        data.append('price', formData.price);
        data.append('stock', formData.stock);
        data.append('cafeId', cafeId);
        if (imageFile) {
            data.append('image', imageFile);
        }

        try {
            if (editingItem) {
                await api.put(`/menu/${editingItem._id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/menu', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-[#F5E6D3] relative animate-fade-in">
                <div className="bg-[#FAF7F2] p-6 border-b border-[#F5E6D3] flex justify-between items-center">
                    <h2 className="text-xl font-black text-[#4B2E1E]">
                        {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                    </h2>
                    <button onClick={onClose} className="text-[#C89B6D] hover:text-[#4B2E1E] transition-colors rounded-full p-2 hover:bg-[#F5E6D3]/50">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 pb-10 space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-2">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-black text-[#6B3E26] mb-2 uppercase tracking-wider">Item Name</label>
                            <input
                                required
                                name="itemName"
                                value={formData.itemName}
                                onChange={handleChange}
                                className="w-full bg-[#FAF7F2] border border-[#F5E6D3] rounded-xl px-4 py-3 text-sm font-bold text-[#4B2E1E] focus:outline-none focus:border-[#C89B6D] focus:ring-2 focus:ring-[#C89B6D]/20 transition-all"
                                placeholder="Cappuccino"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-[#6B3E26] mb-2 uppercase tracking-wider">Category</label>
                            <input
                                list="category-suggestions"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                placeholder="e.g. Summer Specials"
                                autoComplete="off"
                                required
                                className="w-full bg-[#FAF7F2] border border-[#F5E6D3] rounded-xl px-4 py-3 text-sm font-bold text-[#4B2E1E] focus:outline-none focus:border-[#C89B6D] focus:ring-2 focus:ring-[#C89B6D]/20 transition-all"
                            />
                            <datalist id="category-suggestions">
                                {existingCategories.map(cat => (
                                    <option key={`dl-${cat}`} value={cat} />
                                ))}
                            </datalist>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-[#6B3E26] mb-2 uppercase tracking-wider">Price (₹)</label>
                            <input
                                required
                                type="number"
                                step="0.01"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                className="w-full bg-[#FAF7F2] border border-[#F5E6D3] rounded-xl px-4 py-3 text-sm font-bold text-[#4B2E1E] focus:outline-none focus:border-[#C89B6D] focus:ring-2 focus:ring-[#C89B6D]/20 transition-all"
                                placeholder="150"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-[#F5E6D3]/50">
                        <label className="block text-xs font-black text-[#6B3E26] mb-4 uppercase tracking-wider">Item Image</label>
                        <div className="mt-1 flex items-center gap-4 p-5 border-2 border-dashed border-[#C89B6D]/40 rounded-2xl bg-[#FAF7F2]/50 group hover:border-[#C89B6D] hover:bg-[#FAF7F2] transition-colors relative">
                            {imagePreview ? (
                                <div className="relative h-24 w-24 rounded-xl overflow-hidden flex-shrink-0 shadow-sm border border-[#F5E6D3]">
                                    <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                                        className="absolute top-1 right-1 bg-white p-1.5 rounded-full text-red-500 shadow-md transform hover:scale-110 transition-transform"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex h-24 w-24 items-center justify-center bg-white border border-[#F5E6D3] rounded-xl text-[#C89B6D] shadow-sm">
                                    <Upload size={28} />
                                </div>
                            )}
                            <div className="flex-1">
                                <p className="text-sm font-bold text-[#4B2E1E]">Click to upload product image</p>
                                <p className="text-xs text-[#C89B6D] mt-1 font-medium">High quality JPG, PNG up to 5MB</p>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                    id="image-upload"
                                />
                                <label
                                    htmlFor="image-upload"
                                    className="mt-3 inline-block px-4 py-2 bg-white border border-[#F5E6D3] text-xs font-bold text-[#6B3E26] rounded-xl cursor-pointer hover:bg-[#C89B6D] hover:text-white hover:border-[#C89B6D] transition-all shadow-sm"
                                >
                                    Select Image
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-4">
                        <input
                            type="checkbox"
                            id="stock"
                            name="stock"
                            checked={formData.stock}
                            onChange={handleChange}
                            className="h-5 w-5 rounded-lg border-[#C89B6D] text-[#C67C4E] focus:ring-[#C67C4E] transition-all cursor-pointer accent-[#C67C4E]"
                        />
                        <label htmlFor="stock" className="text-sm font-black text-[#4B2E1E] cursor-pointer">
                            In Stock & Available to Order
                        </label>
                    </div>

                    <div className="flex gap-4 pt-6 border-t border-[#F5E6D3]/50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-[1] py-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all flex justify-center items-center"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] coffee-gradient block text-white py-4 rounded-xl font-black shadow-xl shadow-[#6B3E26]/20 transition-all hover:coffee-gradient-hover hover:-translate-y-0.5 disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                            {isSubmitting ? (
                                <><Loader2 className="animate-spin" size={20} /> Saving...</>
                            ) : (
                                editingItem ? 'Save Changes to Item' : 'Add Item to Menu'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default MenuForm;
