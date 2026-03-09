import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { X, Upload, Loader2 } from 'lucide-react';

const MenuForm = ({ onClose, onSuccess, editingItem }) => {
    const [formData, setFormData] = useState({
        itemName: '',
        category: 'Coffee',
        price: '',
        stock: true,
        cafeId: '',
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (editingItem) {
            setFormData({
                itemName: editingItem.itemName,
                category: editingItem.category,
                price: editingItem.price,
                stock: editingItem.stock,
                cafeId: editingItem.cafeId,
            });
            setImagePreview(`http://localhost:3010${editingItem.image}`);
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

        const data = new FormData();
        data.append('itemName', formData.itemName);
        data.append('category', formData.category);
        data.append('price', formData.price);
        data.append('stock', formData.stock);
        data.append('cafeId', formData.cafeId);
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">
                        {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                    </h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-700 ml-1">Item Name</label>
                                <input
                                    required
                                    name="itemName"
                                    value={formData.itemName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all sm:text-sm"
                                    placeholder="Cappuccino"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-700 ml-1">Category</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium sm:text-sm"
                                >
                                    <option>Coffee</option>
                                    <option>Snacks</option>
                                    <option>Desserts</option>
                                    <option>Beverages</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-700 ml-1">Price ($)</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all sm:text-sm"
                                    placeholder="4.50"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-700 ml-1">Cafe ID</label>
                                <input
                                    required
                                    name="cafeId"
                                    value={formData.cafeId}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all sm:text-sm"
                                    placeholder="MAIN_BRANCH"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-bold text-gray-700 ml-1">Image</label>
                            <div className="mt-1 flex items-center gap-4 p-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 group hover:border-indigo-400 transition-colors">
                                {imagePreview ? (
                                    <div className="relative h-20 w-20 rounded-lg overflow-hidden flex-shrink-0">
                                        <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => { setImageFile(null); setImagePreview(null); }}
                                            className="absolute top-1 right-1 bg-white p-1 rounded-full text-rose-500 shadow-sm"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex h-20 w-20 items-center justify-center bg-gray-200 rounded-lg text-gray-400">
                                        <Upload size={24} />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-700">Click to upload image</p>
                                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                        id="image-upload"
                                    />
                                    <label
                                        htmlFor="image-upload"
                                        className="mt-2 inline-block px-3 py-1.5 bg-white border border-gray-200 text-xs font-bold rounded-lg cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                                    >
                                        Select File
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 ml-1">
                            <input
                                type="checkbox"
                                id="stock"
                                name="stock"
                                checked={formData.stock}
                                onChange={handleChange}
                                className="h-5 w-5 rounded-lg border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-all"
                            />
                            <label htmlFor="stock" className="text-sm font-bold text-gray-700 cursor-pointer">
                                In Stock & Available
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-white border border-gray-200 text-sm font-bold rounded-xl text-gray-700 hover:bg-gray-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] px-4 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 disabled:opacity-70 flex justify-center items-center transition-all"
                        >
                            {isSubmitting ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                editingItem ? 'Update Item' : 'Create Item'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MenuForm;
