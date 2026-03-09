import axios from "axios";

const API_URL = 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('token');

// Tumhara auth (axios)
const API = axios.create({ baseURL: API_URL });
API.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const signup = (data) => API.post("/auth/signup", data);
export const login = (data) => API.post("/auth/login", data);
export const getProfile = () => API.get("/auth/profile");

const api = {
  // Menu
  getMenuItems: async () => {
    const res = await fetch(`${API_URL}/menu`, { headers: { Authorization: `Bearer ${getToken()}` } });
    return res.json();
  },
  addMenuItem: async (item) => {
    const res = await fetch(`${API_URL}/menu`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify(item) });
    return res.json();
  },
  updateMenuItem: async (id, item) => {
    const res = await fetch(`${API_URL}/menu/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify(item) });
    return res.json();
  },
  deleteMenuItem: async (id) => {
    const res = await fetch(`${API_URL}/menu/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
    return res.json();
  },
  updateStock: async (id, inStock) => {
    const res = await fetch(`${API_URL}/menu/${id}/stock`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ inStock }) });
    return res.json();
  },

  // Staff
  getStaff: async () => {
    const res = await fetch(`${API_URL}/staff`, { headers: { Authorization: `Bearer ${getToken()}` } });
    return res.json();
  },
  addStaff: async (staff) => {
    const res = await fetch(`${API_URL}/staff`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify(staff) });
    return res.json();
  },
  updateStaff: async (id, staff) => {
    const res = await fetch(`${API_URL}/staff/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify(staff) });
    return res.json();
  },
  deleteStaff: async (id) => {
    const res = await fetch(`${API_URL}/staff/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
    return res.json();
  },

  // Customers
  getCustomers: async () => {
    const res = await fetch(`${API_URL}/customers`, { headers: { Authorization: `Bearer ${getToken()}` } });
    return res.json();
  },
  getCustomerDetails: async (id) => {
    const res = await fetch(`${API_URL}/customers/${id}`, { headers: { Authorization: `Bearer ${getToken()}` } });
    return res.json();
  },
  addCustomer: async (customer) => {
    const res = await fetch(`${API_URL}/customers`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify(customer) });
    return res.json();
  },
  addOrder: async (customerId, order) => {
    const res = await fetch(`${API_URL}/customers/${customerId}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify(order) });
    return res.json();
  }
};

export default api;