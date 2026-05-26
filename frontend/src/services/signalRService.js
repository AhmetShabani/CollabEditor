import * as signalR from '@microsoft/signalr';
import authService from './authService';

const createConnection = () => {
    return new signalR.HubConnectionBuilder()
        .withUrl(import.meta.env.VITE_HUB_URL, {
            accessTokenFactory: () => authService.getToken(),
            skipNegotiation: true,
            transport: signalR.HttpTransportType.WebSockets
        })
        .withAutomaticReconnect()
        .build();
};

export default createConnection;