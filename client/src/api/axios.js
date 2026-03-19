import axios from 'axios';

const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const baseURL = rawBase.replace(/\/$/, '').endsWith('/api')
    ? rawBase.replace(/\/$/, '')
    : `${rawBase.replace(/\/$/, '')}/api`;

const instance = axios.create({
    baseURL,
});

// Add a request interceptor to add the token to headers
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default instance;
