import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notificationService';
import createConnection from '../services/signalRService';

const NotificationBell = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [showPanel, setShowPanel] = useState(false);
    const connectionRef = useRef(null);

    useEffect(() => {
        fetchNotifications();
        setupSignalR();

        return () => {
            if (connectionRef.current) {
                connectionRef.current.stop();
            }
        };
    }, []);

    const fetchNotifications = async () => {
        try {
            const data = await notificationService.getNotifications(token);
            setNotifications(data);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    };

    const setupSignalR = async () => {
        if (connectionRef.current) return;
        try {
            const connection = createConnection();
            connectionRef.current = connection;

            connection.on('NewNotification', (notification) => {
                setNotifications(prev => [notification, ...prev]);
            });

            await connection.start();
        } catch (err) {
            console.error('Notification SignalR failed', err);
        }
    };

    const handleNotificationClick = async (notification) => {
        try {
            await notificationService.markAsRead(notification.id, token);
            setNotifications(prev =>
                prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
            );
            if (notification.link) {
                navigate(notification.link.replace('http://localhost:5173', ''));
            }
        } catch (err) {
            console.error('Failed to mark as read', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead(token);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error('Failed to mark all as read', err);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="relative">
            <button
                onClick={() => setShowPanel(!showPanel)}
                className="relative bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-lg transition"
            >
                🔔
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {showPanel && (
                <div className="absolute right-0 top-10 w-80 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                        <h3 className="text-white font-medium text-sm">🔔 Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-blue-400 hover:text-blue-300 text-xs transition"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-auto">
                        {notifications.length === 0 ? (
                            <div className="text-gray-500 text-center text-sm py-8">
                                No notifications yet
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`px-4 py-3 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition ${!notification.isRead ? 'bg-blue-500/5' : ''}`}
                                >
                                    <div className="flex items-start gap-2">
                                        {!notification.isRead && (
                                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                                        )}
                                        <div className={!notification.isRead ? '' : 'ml-4'}>
                                            <p className="text-white text-sm font-medium">{notification.title}</p>
                                            <p className="text-gray-400 text-xs mt-0.5">{notification.message}</p>
                                            <p className="text-gray-600 text-xs mt-1">
                                                {new Date(notification.createdAt).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;