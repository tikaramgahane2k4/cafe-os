const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
    cafeId: {
        type: String,
        required: true,
        index: true,
    },
    tableNumber: {
        type: Number,
        required: true,
    },
    qrCodeData: {
        type: String,
        required: true,
    },
    isOccupied: {
        type: Boolean,
        default: false,
    },
    currentSession: {
        type: String, // Can be used to track order IDs or customer session IDs later
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Ensure (cafeId, tableNumber) is unique
tableSchema.index({ cafeId: 1, tableNumber: 1 }, { unique: true });

module.exports = mongoose.models.Table || mongoose.model('Table', tableSchema);
