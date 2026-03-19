const MenuItem = require('../models/MenuItem');

const getAllInventory = async (req, res) => {
    try {
        const inventory = await MenuItem.find().sort({ itemName: 1 });
        res.status(200).json(inventory);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching inventory', error: error.message });
    }
};

const updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { stock } = req.body;

        const stockNum = parseInt(stock) || 0;
        let stockStatus = 'Available';
        if (stockNum === 0) stockStatus = 'Out of Stock';
        else if (stockNum < 10) stockStatus = 'Low Stock';

        const updatedItem = await MenuItem.findByIdAndUpdate(
            id,
            {
                stock: stockNum,
                stockStatus,
                lastUpdated: Date.now()
            },
            { new: true }
        );

        if (!updatedItem) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.status(200).json(updatedItem);
    } catch (error) {
        res.status(500).json({ message: 'Error updating stock', error: error.message });
    }
};

module.exports = {
    getAllInventory,
    updateStock
};
