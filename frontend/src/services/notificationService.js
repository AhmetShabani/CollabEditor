import api from './api';

const notificationService = {
    getNotifications: async (token) => {
        const response = await api.get('/notification', {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    markAsRead: async (notificationId, token) => {
        const response = await api.post(`/notification/${notificationId}/read`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    markAllAsRead: async (token) => {
        const response = await api.post('/notification/read-all', {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};

export default notificationService;