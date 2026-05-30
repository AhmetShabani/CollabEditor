import api from './api';

const friendService = {
    sendRequest: async (username, token) => {
        const response = await api.post(`/friend/request/${username}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    getPendingRequests: async (token) => {
        const response = await api.get('/friend/requests', {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    acceptRequest: async (requestId, token) => {
        const response = await api.post(`/friend/accept/${requestId}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    declineRequest: async (requestId, token) => {
        const response = await api.post(`/friend/decline/${requestId}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    getFriends: async (token) => {
        const response = await api.get('/friend', {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    removeFriend: async (friendshipId, token) => {
        const response = await api.delete(`/friend/${friendshipId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};

export default friendService;