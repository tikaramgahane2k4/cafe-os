/**
 * Multi-tenant entity models for CafeOS.
 * Every document is scoped to a Tenant via tenantId.
 *
 * These schemas define the data contracts. Actual CRUD controllers/routes
 * should be added per-feature as the platform grows.
 *
 * Tenant isolation rule:
 *   ALL queries MUST include { tenantId: req.tenantId } — enforced by
 *   the tenantMiddleware (see middleware/tenantMiddleware.js).
 */

const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

// ── Shared helper ─────────────────────────────────────────────────────────
const tenantRef = { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true };

// ── Order ─────────────────────────────────────────────────────────────────
const orderSchema = new Schema(
  {
    tenantId:   tenantRef,
    orderNumber:{ type: String },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', default: null },
    items:      [{ name: String, qty: Number, price: Number }],
    totalAmount:{ type: Number, default: 0 },
    status:     { type: String, enum: ['Pending', 'Preparing', 'Ready', 'Delivered', 'Cancelled'], default: 'Pending' },
    paymentMethod: { type: String, default: 'Cash' },
    notes:      { type: String, default: '' },
  },
  { timestamps: true }
);
orderSchema.index({ tenantId: 1, createdAt: -1 });

// ── Customer ──────────────────────────────────────────────────────────────
const customerSchema = new Schema(
  {
    tenantId:   tenantRef,
    name:       { type: String, required: true },
    phone:      { type: String, default: '' },
    email:      { type: String, default: '' },
    totalSpend: { type: Number, default: 0 },
    visitCount: { type: Number, default: 0 },
    lastVisitAt:{ type: Date, default: null },
  },
  { timestamps: true }
);
customerSchema.index({ tenantId: 1, phone: 1 });

// ── Menu Item ─────────────────────────────────────────────────────────────
const menuItemSchema = new Schema(
  {
    tenantId:   tenantRef,
    name:       { type: String, required: true },
    category:   { type: String, default: 'Beverage' },
    price:      { type: Number, required: true },
    description:{ type: String, default: '' },
    available:  { type: Boolean, default: true },
    imageUrl:   { type: String, default: '' },
  },
  { timestamps: true }
);
menuItemSchema.index({ tenantId: 1, category: 1 });

// ── Staff ─────────────────────────────────────────────────────────────────
const staffSchema = new Schema(
  {
    tenantId:   tenantRef,
    name:       { type: String, required: true },
    role:       { type: String, enum: ['Manager', 'Barista', 'Cashier', 'Cleaner'], default: 'Barista' },
    phone:      { type: String, default: '' },
    email:      { type: String, default: '' },
    status:     { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    shiftStart: { type: String, default: '' },
    shiftEnd:   { type: String, default: '' },
    lastActiveAt: { type: Date, default: null },
  },
  { timestamps: true }
);
staffSchema.index({ tenantId: 1, status: 1 });

// ── Inventory Item ────────────────────────────────────────────────────────
const inventorySchema = new Schema(
  {
    tenantId:   tenantRef,
    name:       { type: String, required: true },
    category:   { type: String, default: 'Ingredient' },
    unit:       { type: String, default: 'kg' },
    quantity:   { type: Number, default: 0 },
    minStock:   { type: Number, default: 0 },
    costPerUnit:{ type: Number, default: 0 },
    supplier:   { type: String, default: '' },
    lastRestockedAt: { type: Date, default: null },
  },
  { timestamps: true }
);
inventorySchema.index({ tenantId: 1, category: 1 });

// ── Review ────────────────────────────────────────────────────────────────
const reviewSchema = new Schema(
  {
    tenantId:   tenantRef,
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', default: null },
    customerName:{ type: String, default: 'Anonymous' },
    rating:     { type: Number, min: 1, max: 5, required: true },
    comment:    { type: String, default: '' },
    source:     { type: String, enum: ['In-App', 'Google', 'Zomato', 'Swiggy', 'Manual'], default: 'In-App' },
    replied:    { type: Boolean, default: false },
  },
  { timestamps: true }
);
reviewSchema.index({ tenantId: 1, rating: -1 });

// ── Exports ──────────────────────────────────────────────────────────────
module.exports = {
  // Use distinct model names to avoid colliding with legacy single-tenant models.
  Order:         mongoose.models.TenantOrder || mongoose.model('TenantOrder', orderSchema),
  Customer:      mongoose.models.TenantCustomer || mongoose.model('TenantCustomer', customerSchema),
  MenuItem:      mongoose.models.TenantMenuItem || mongoose.model('TenantMenuItem', menuItemSchema),
  Staff:         mongoose.models.TenantStaff || mongoose.model('TenantStaff', staffSchema),
  InventoryItem: mongoose.models.TenantInventoryItem || mongoose.model('TenantInventoryItem', inventorySchema),
  Review:        mongoose.models.TenantReview || mongoose.model('TenantReview', reviewSchema),
};
