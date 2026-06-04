import api from './api';

const friendService = {
    sendRequest: async (username) => {
        const response = await api.post(`/friend/request/${username}`, {});
        return response.data;
    },

    getPendingRequests: async () => {
        const response = await api.get('/friend/requests');
        return response.data;
    },

    acceptRequest: async (requestId) => {
        const response = await api.post(`/friend/accept/${requestId}`, {});
        return response.data;
    },

    declineRequest: async (requestId) => {
        const response = await api.post(`/friend/decline/${requestId}`, {});
        return response.data;
    },

    getFriends: async () => {
        const response = await api.get('/friend');
        return response.data;
    },

    removeFriend: async (friendshipId) => {
        const response = await api.delete(`/friend/${friendshipId}`);
        return response.data;
    }
};

export default friendService;