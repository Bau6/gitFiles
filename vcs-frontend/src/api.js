import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:8080/api',
});

API.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default API;