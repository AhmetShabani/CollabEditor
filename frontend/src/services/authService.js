import api from './api';

const authService = {
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },

    register: async (username, email, password) => {
        const response = await api.post('/auth/register', { username, email, password });
        return response.data;
    },

    refreshToken: async (refreshToken) => {
        const response = await api.post('/auth/refresh', refreshToken);
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    },

    getToken: () => localStorage.getItem('token'),
    
    isAuthenticated: () => !!localStorage.getItem('token')
};

export default authService;