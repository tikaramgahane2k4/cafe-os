import axios from 'axios';

const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const sanitizedBase = rawBase.replace(/\/$/, '');
const baseURL = sanitizedBase.endsWith('/api') ? sanitizedBase : `${sanitizedBase}/api`;

const getToken = () => localStorage.getItem('token');

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const method = error.config?.method?.toUpperCase() || 'GET';
    const path = error.config?.url || 'unknown-endpoint';
    const message = error.response?.data?.message
      || error.message
      || 'Something went wrong while talking to the server.';

    console.error(`[API ${method}] ${path}`, error);
    return Promise.reject(new Error(message));
  },
);

export async function apiRequest(config) {
  const response = await api(config);
  return response.data;
}

export const signup = (data) => apiRequest({ url: '/auth/signup', method: 'post', data });
export const login = (data) => apiRequest({ url: '/auth/login', method: 'post', data });
export const getProfile = () => apiRequest({ url: '/auth/profile' });

const ownerApi = {
  getMenuItems: () => apiRequest({ url: '/menu' }),
  addMenuItem: (item) => apiRequest({ url: '/menu', method: 'post', data: item }),
  updateMenuItem: (id, item) => apiRequest({ url: `/menu/${id}`, method: 'put', data: item }),
  deleteMenuItem: (id) => apiRequest({ url: `/menu/${id}`, method: 'delete' }),
  updateStock: (id, inStock) => apiRequest({ url: `/menu/${id}/stock`, method: 'patch', data: { inStock } }),
  getStaff: () => apiRequest({ url: '/staff' }),
  addStaff: (staff) => apiRequest({ url: '/staff', method: 'post', data: staff }),
  updateStaff: (id, staff) => apiRequest({ url: `/staff/${id}`, method: 'put', data: staff }),
  deleteStaff: (id) => apiRequest({ url: `/staff/${id}`, method: 'delete' }),
  getCustomers: () => apiRequest({ url: '/customers' }),
  getCustomerDetails: (id) => apiRequest({ url: `/customers/${id}` }),
  addCustomer: (customer) => apiRequest({ url: '/customers', method: 'post', data: customer }),
  addOrder: (customerId, order) => apiRequest({ url: `/customers/${customerId}/orders`, method: 'post', data: order }),
};

export default ownerApi;
