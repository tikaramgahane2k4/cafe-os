import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('menu');
  const [menuItems, setMenuItems] = useState([]);
  const [staff, setStaff] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const owner = JSON.parse(localStorage.getItem('owner') || '{}');

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'menu') {
        const data = await api.getMenuItems();
        setMenuItems(Array.isArray(data) ? data : []);
      } else if (activeTab === 'staff') {
        const data = await api.getStaff();
        setStaff(Array.isArray(data) ? data : []);
      } else if (activeTab === 'customers') {
        const data = await api.getCustomers();
        setCustomers(Array.isArray(data) ? data : []);
      }
    } catch {
      // keep existing state on error
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="nav-brand">
          <span className="nav-logo">☕</span>
          <h1>{owner.cafeName || 'My Café'}</h1>
        </div>
        <div className="nav-right">
          <span className="nav-user">👤 {owner.name}</span>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="sidebar">
          <div className="sidebar-title">Management</div>
          {[
            { key: 'menu', icon: '🍽️', label: 'Digital Menu' },
            { key: 'staff', icon: '👥', label: 'Staff' },
            { key: 'customers', icon: '🧑‍🤝‍🧑', label: 'Customers' },
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              className={activeTab === key ? 'active' : ''}
              onClick={() => setActiveTab(key)}
            >
              <span>{icon}</span> {label}
            </button>
          ))}
        </div>

        <div className="main-content">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <>
              {activeTab === 'menu' && (
                <MenuTab
                  items={menuItems}
                  onAdd={() => { setEditItem(null); setShowModal(true); }}
                  onEdit={(item) => { setEditItem(item); setShowModal(true); }}
                  onDelete={async (id) => {
                    if (confirm('Delete this item?')) {
                      await api.deleteMenuItem(id);
                      loadData();
                    }
                  }}
                  onStockToggle={async (id, cur) => {
                    await api.updateStock(id, !cur);
                    loadData();
                  }}
                />
              )}
              {activeTab === 'staff' && <StaffTab staff={staff} onReload={loadData} />}
              {activeTab === 'customers' && <CustomerTab customers={customers} onReload={loadData} />}
            </>
          )}
        </div>
      </div>

      {showModal && (
        <MenuModal
          item={editItem}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); loadData(); }}
        />
      )}
    </div>
  );
};

const MenuTab = ({ items, onAdd, onEdit, onDelete, onStockToggle }) => {
  const categories = ['Coffee', 'Snacks', 'Desserts', 'Beverages'];

  return (
    <div>
      <div className="tab-header">
        <h2>🍽️ Digital Menu</h2>
        <button onClick={onAdd} className="btn-primary">+ Add Item</button>
      </div>
      {categories.map(category => {
        const catItems = items.filter(i => i.category === category);
        return (
          <div key={category} className="category-section">
            <h3 className="category-title">{category} <span className="count">{catItems.length}</span></h3>
            {catItems.length === 0 ? (
              <p className="empty-msg">No items in this category</p>
            ) : (
              <div className="items-grid">
                {catItems.map(item => (
                  <div key={item._id} className="item-card">
                    <div className="item-header">
                      <h4>{item.name}</h4>
                      <span className={`stock-badge ${item.inStock ? 'in-stock' : 'out-stock'}`}>
                        {item.inStock ? '✓ In Stock' : '✗ Out of Stock'}
                      </span>
                    </div>
                    {item.description && <p className="item-desc">{item.description}</p>}
                    <p className="price">₹{item.price}</p>
                    <div className="item-actions">
                      <button onClick={() => onEdit(item)} className="btn-edit">Edit</button>
                      <button onClick={() => onStockToggle(item._id, item.inStock)} className="btn-stock">
                        {item.inStock ? 'Mark Out' : 'Mark In'}
                      </button>
                      <button onClick={() => onDelete(item._id)} className="btn-danger">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const ALL_PERMISSIONS = ['View Menu', 'Edit Menu', 'View Orders', 'Manage Orders', 'View Customers', 'View Staff'];

const EMPTY_STAFF = { name: '', email: '', role: 'Waiter', phone: '', permissions: [] };

const StaffTab = ({ staff, onReload }) => {
  const [editMember, setEditMember] = useState(null); // null = add form hidden, {} = new, member = edit
  const [formData, setFormData] = useState(EMPTY_STAFF);
  const [loading, setLoading] = useState(false);

  const openAdd = () => { setFormData(EMPTY_STAFF); setEditMember({}); };
  const openEdit = (m) => { setFormData({ name: m.name, email: m.email, role: m.role, phone: m.phone || '', permissions: m.permissions || [] }); setEditMember(m); };
  const closeForm = () => setEditMember(null);

  const togglePermission = (perm) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (editMember._id) {
      await api.updateStaff(editMember._id, formData);
    } else {
      await api.addStaff(formData);
    }
    setLoading(false);
    closeForm();
    onReload();
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this staff member?')) {
      await api.deleteStaff(id);
      onReload();
    }
  };

  const roleColors = { Manager: '#8e44ad', Waiter: '#2980b9', Chef: '#e67e22', Cashier: '#27ae60' };

  return (
    <div>
      <div className="tab-header">
        <h2>👥 Staff Management</h2>
        <button onClick={editMember ? closeForm : openAdd} className="btn-primary">
          {editMember ? 'Cancel' : '+ Add Staff'}
        </button>
      </div>

      {editMember !== null && (
        <form onSubmit={handleSubmit} className="staff-form-card">
          <h4>{editMember._id ? 'Edit Staff Member' : 'Add New Staff Member'}</h4>
          <div className="staff-form-grid">
            <input placeholder="Full Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
            <input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
            <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
              <option>Manager</option>
              <option>Waiter</option>
              <option>Chef</option>
              <option>Cashier</option>
            </select>
            <input type="tel" placeholder="Phone (optional)" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          <div className="permissions-section">
            <label className="permissions-label">Permissions</label>
            <div className="permissions-grid">
              {ALL_PERMISSIONS.map(perm => (
                <label key={perm} className="perm-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(perm)}
                    onChange={() => togglePermission(perm)}
                  />
                  {perm}
                </label>
              ))}
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : (editMember._id ? 'Update Staff' : 'Add Staff')}
          </button>
        </form>
      )}

      <div className="staff-list">
        {staff.length === 0 && <p className="empty-msg">No staff members added yet</p>}
        {staff.map(member => (
          <div key={member._id} className="staff-card">
            <div className="staff-avatar">{member.name[0].toUpperCase()}</div>
            <div className="staff-info">
              <h4>{member.name}</h4>
              <p>{member.email}</p>
              {member.phone && <p>📞 {member.phone}</p>}
              {member.permissions?.length > 0 && (
                <div className="perm-tags">
                  {member.permissions.map(p => <span key={p} className="perm-tag">{p}</span>)}
                </div>
              )}
            </div>
            <div className="staff-right">
              <span className="role-badge" style={{ background: roleColors[member.role] + '20', color: roleColors[member.role] }}>
                {member.role}
              </span>
              <button onClick={() => openEdit(member)} className="btn-edit">Edit</button>
              <button onClick={() => handleDelete(member._id)} className="btn-danger">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CustomerTab = ({ customers, onReload }) => {
  const [showForm, setShowForm] = useState(false);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    await api.addCustomer(formData);
    setShowForm(false);
    setFormData({ name: '', email: '', phone: '' });
    onReload();
  };

  const handleViewDetails = async (customer) => {
    const details = await api.getCustomerDetails(customer._id);
    setCustomerDetails(details);
  };

  return (
    <div>
      <div className="tab-header">
        <h2>🧑‍🤝‍🧑 Customer CRM</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : '+ Add Customer'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddCustomer} className="inline-form">
          <input placeholder="Customer Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
          <input type="email" placeholder="Email (optional)" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
          <input type="tel" placeholder="Phone (optional)" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
          <button type="submit" className="btn-primary">Add Customer</button>
        </form>
      )}

      <div className="customer-list">
        {customers.length === 0 && <p className="empty-msg">No customers added yet</p>}
        {customers.map(customer => (
          <div key={customer._id} className="customer-card">
            <div className="customer-avatar">{customer.name[0].toUpperCase()}</div>
            <div className="customer-info">
              <h4>{customer.name}</h4>
              {customer.email && <p>✉ {customer.email}</p>}
              {customer.phone && <p>📞 {customer.phone}</p>}
            </div>
            <div className="customer-right">
              <div className="loyalty-badge">⭐ {customer.loyaltyPoints} pts</div>
              <div className="visits-count">{customer.visitHistory?.length || 0} visits</div>
              <button onClick={() => handleViewDetails(customer)} className="btn-primary btn-sm">Details</button>
              <button onClick={() => { setSelectedCustomer(customer); setShowOrderModal(true); }} className="btn-edit btn-sm">+ Order</button>
            </div>
          </div>
        ))}
      </div>

      {customerDetails && (
        <CustomerDetailsModal customer={customerDetails} onClose={() => setCustomerDetails(null)} />
      )}
      {showOrderModal && selectedCustomer && (
        <AddOrderModal
          customer={selectedCustomer}
          onClose={() => { setShowOrderModal(false); setSelectedCustomer(null); onReload(); }}
        />
      )}
    </div>
  );
};

const MenuModal = ({ item, onClose, onSave }) => {
  const [formData, setFormData] = useState(
    item ? { ...item } : { name: '', category: 'Coffee', price: '', description: '', image: '', inStock: true }
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (item) {
      await api.updateMenuItem(item._id, formData);
    } else {
      await api.addMenuItem(formData);
    }
    setLoading(false);
    onSave();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>{item ? '✏️ Edit Item' : '➕ Add Menu Item'}</h3>
        <form onSubmit={handleSubmit}>
          <input placeholder="Item Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
          <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
            <option>Coffee</option>
            <option>Snacks</option>
            <option>Desserts</option>
            <option>Beverages</option>
          </select>
          <input type="number" placeholder="Price (₹)" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required min="0" />
          <textarea placeholder="Description (optional)" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
          <input placeholder="Image URL (optional)" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} />
          <div className="modal-actions">
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CustomerDetailsModal = ({ customer, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content modal-wide" onClick={e => e.stopPropagation()}>
      <h3>👤 {customer.name}</h3>

      <div className="details-grid">
        <div className="detail-item"><span>Email</span><strong>{customer.email || '—'}</strong></div>
        <div className="detail-item"><span>Phone</span><strong>{customer.phone || '—'}</strong></div>
        <div className="detail-item"><span>Loyalty Points</span><strong>⭐ {customer.loyaltyPoints}</strong></div>
        <div className="detail-item"><span>Total Visits</span><strong>{customer.visitHistory?.length || 0}</strong></div>
      </div>

      <h4>🕐 Visit History</h4>
      {customer.visitHistory?.length > 0 ? (
        <div className="history-list">
          {customer.visitHistory.map((visit, idx) => (
            <div key={idx} className="history-item">
              <span>{new Date(visit.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              <strong>₹{visit.orderTotal}</strong>
            </div>
          ))}
        </div>
      ) : <p className="empty-msg">No visits yet</p>}

      <h4>🛒 Order History</h4>
      {customer.orders?.length > 0 ? (
        <div className="history-list">
          {customer.orders.map((order, idx) => (
            <div key={idx} className="history-item">
              <span>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              <span className="order-items-text">{order.items?.map(i => `${i.name} ×${i.quantity}`).join(', ')}</span>
              <strong>₹{order.total}</strong>
            </div>
          ))}
        </div>
      ) : <p className="empty-msg">No orders yet</p>}

      <div className="modal-actions" style={{ marginTop: '20px' }}>
        <button onClick={onClose} className="btn-secondary">Close</button>
      </div>
    </div>
  </div>
);

const AddOrderModal = ({ customer, onClose }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getMenuItems().then(data => setMenuItems(Array.isArray(data) ? data.filter(i => i.inStock) : []));
  }, []);

  const addItem = (item) => {
    setSelectedItems(prev => {
      const existing = prev.find(i => i.menuItemId === item._id);
      if (existing) return prev.map(i => i.menuItemId === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { menuItemId: item._id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const removeItem = (id) => setSelectedItems(prev => prev.filter(i => i.menuItemId !== id));

  const total = selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleSubmit = async () => {
    if (!selectedItems.length) return;
    setLoading(true);
    await api.addOrder(customer._id, { items: selectedItems, total });
    setLoading(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-wide" onClick={e => e.stopPropagation()}>
        <h3>🛒 New Order — {customer.name}</h3>
        <div className="order-form">
          <div>
            <h4>Menu Items</h4>
            <div className="menu-grid">
              {menuItems.map(item => (
                <div key={item._id} className="menu-item" onClick={() => addItem(item)}>
                  <span>{item.name}</span>
                  <span>₹{item.price}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4>Selected</h4>
            {selectedItems.length === 0 && <p className="empty-msg">Click items to add</p>}
            {selectedItems.map(item => (
              <div key={item.menuItemId} className="selected-item">
                <span>{item.name} ×{item.quantity}</span>
                <span>₹{item.price * item.quantity}</span>
                <button onClick={() => removeItem(item.menuItemId)} className="btn-danger btn-sm">✕</button>
              </div>
            ))}
            {selectedItems.length > 0 && (
              <div className="order-total">Total: <strong>₹{total}</strong></div>
            )}
          </div>
        </div>
        <div className="modal-actions">
          <button onClick={handleSubmit} className="btn-primary" disabled={!selectedItems.length || loading}>
            {loading ? 'Placing...' : 'Place Order'}
          </button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
