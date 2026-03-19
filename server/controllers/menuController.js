const MenuItem = require('../models/MenuItem');
const path = require('path');

// @desc    Get all menu items
exports.getMenuItems = async (req, res) => {
    try {
        const items = await MenuItem.find();
        res.status(200).json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Add new menu item
exports.addMenuItem = async (req, res) => {
    const { itemName, category, price, cafeId, stock } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : '';

    if (!itemName || !category || !price || !cafeId || !image) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    try {
        const stockNum = stock === 'true' || stock === true ? 1 : 0;
        const newItem = new MenuItem({
            itemName,
            category,
            price,
            cafeId,
            image,
            stock: stockNum,
            inStock: stockNum > 0,
        });

        const savedItem = await newItem.save();
        res.status(201).json(savedItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// @desc    Update menu item
exports.updateMenuItem = async (req, res) => {
    const { id } = req.params;
    const { itemName, category, price, cafeId, stock } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : undefined;

    try {
        const stockNum = stock === 'true' || stock === true ? 1 : stock === 'false' || stock === false ? 0 : undefined;
        const updateData = {
            itemName,
            category,
            price,
            cafeId,
            ...(stockNum !== undefined ? { stock: stockNum, inStock: stockNum > 0 } : {}),
        };
        if (image) updateData.image = image;

        const updatedItem = await MenuItem.findByIdAndUpdate(id, updateData, { new: true });
        if (!updatedItem) return res.status(404).json({ message: 'Item not found' });
        res.status(200).json(updatedItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// @desc    Delete menu item
exports.deleteMenuItem = async (req, res) => {
    const { id } = req.params;
    try {
        const item = await MenuItem.findByIdAndDelete(id);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.status(200).json({ message: 'Item deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Update stock status
exports.updateStock = async (req, res) => {
    const { id } = req.params;
    const { stock } = req.body;
    try {
        const stockNum = stock === 'true' || stock === true ? 1 : stock === 'false' || stock === false ? 0 : parseInt(stock) || 0;
        const updatedItem = await MenuItem.findByIdAndUpdate(
            id,
            { stock: stockNum, inStock: stockNum > 0 },
            { new: true }
        );
        if (!updatedItem) return res.status(404).json({ message: 'Item not found' });
        res.status(200).json(updatedItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
