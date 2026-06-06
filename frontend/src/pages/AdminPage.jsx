import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const AdminPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('statistics');
    const [statistics, setStatistics] = useState(null);
    const [users, setUsers] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user?.role !== 'Admin') {
            navigate('/dashboard');
            return;
        }
        fetchStatistics();
    }, []);

    const fetchStatistics = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/statistics');
            setStatistics(response.data);
        } catch (err) {
            console.error('Failed to fetch statistics', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/users');
            setUsers(response.data);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/documents');
            setDocuments(response.data);
        } catch (err) {
            console.error('Failed to fetch documents', err);
        } finally {
            setLoading(false);
        }
    };

    const deleteUser = async (userId) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await api.delete(`/admin/users/${userId}`);
            setUsers(prev => prev.filter(u => u.id !== userId));
        } catch (err) {
            console.error('Failed to delete user', err);
        }
    };

    const changeRole = async (userId, newRole) => {
        try {
            await api.put(`/admin/users/${userId}/role`, JSON.stringify(newRole), {
                headers: { 'Content-Type': 'application/json' }
            });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (err) {
            console.error('Failed to change role', err);
        }
    };

    const deleteDocument = async (documentId) => {
        if (!confirm('Are you sure you want to delete this document?')) return;
        try {
            await api.delete(`/admin/documents/${documentId}`);
            setDocuments(prev => prev.filter(d => d.id !== documentId));
        } catch (err) {
            console.error('Failed to delete document', err);
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === 'users') fetchUsers();
        if (tab === 'documents') fetchDocuments();
        if (tab === 'statistics') fetchStatistics();
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Navbar */}
            <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-white">CollabAI</h1>
                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">Admin Panel</span>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-gray-400 hover:text-white text-sm transition"
                    >
                        ← Dashboard
                    </button>
                    <span className="text-gray-400">👤 {user?.username}</span>
                    <button
                        onClick={logout}
                        className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm transition"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-6 py-10">
                {/* Tabs */}
                <div className="flex gap-2 mb-8">
                    {['statistics', 'users', 'documents'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => handleTabChange(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}
                        >
                            {tab === 'statistics' ? '📊 Statistics' : tab === 'users' ? '👥 Users' : '📄 Documents'}
                        </button>
                    ))}
                </div>

                {loading && <div className="text-gray-400 text-center py-12">Loading...</div>}

                {/* Statistics */}
                {activeTab === 'statistics' && statistics && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Users', value: statistics.totalUsers, color: 'bg-blue-500/20 text-blue-400' },
                            { label: 'Total Documents', value: statistics.totalDocuments, color: 'bg-purple-500/20 text-purple-400' },
                            { label: 'Total Messages', value: statistics.totalMessages, color: 'bg-green-500/20 text-green-400' },
                            { label: 'Friendships', value: statistics.totalFriendships, color: 'bg-yellow-500/20 text-yellow-400' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                                <p className="text-gray-400 text-sm mb-2">{stat.label}</p>
                                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Users */}
                {activeTab === 'users' && (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-800">
                                    <th className="text-left px-6 py-3 text-gray-400 text-sm">Username</th>
                                    <th className="text-left px-6 py-3 text-gray-400 text-sm">Email</th>
                                    <th className="text-left px-6 py-3 text-gray-400 text-sm">Role</th>
                                    <th className="text-left px-6 py-3 text-gray-400 text-sm">Joined</th>
                                    <th className="text-left px-6 py-3 text-gray-400 text-sm">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition">
                                        <td className="px-6 py-4 text-white">{u.username}</td>
                                        <td className="px-6 py-4 text-gray-400">{u.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs px-2 py-1 rounded ${u.role === 'Admin' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 text-sm">
                                            {new Date(u.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => changeRole(u.id, u.role === 'Admin' ? 'User' : 'Admin')}
                                                    className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded transition"
                                                >
                                                    {u.role === 'Admin' ? 'Make User' : 'Make Admin'}
                                                </button>
                                                <button
                                                    onClick={() => deleteUser(u.id)}
                                                    className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1 rounded transition"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Documents */}
                {activeTab === 'documents' && (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-800">
                                    <th className="text-left px-6 py-3 text-gray-400 text-sm">Title</th>
                                    <th className="text-left px-6 py-3 text-gray-400 text-sm">Language</th>
                                    <th className="text-left px-6 py-3 text-gray-400 text-sm">Owner</th>
                                    <th className="text-left px-6 py-3 text-gray-400 text-sm">Created</th>
                                    <th className="text-left px-6 py-3 text-gray-400 text-sm">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {documents.map(doc => (
                                    <tr key={doc.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition">
                                        <td className="px-6 py-4 text-white">{doc.title}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                                                {doc.language}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">{doc.ownerUsername}</td>
                                        <td className="px-6 py-4 text-gray-400 text-sm">
                                            {new Date(doc.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => deleteDocument(doc.id)}
                                                className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1 rounded transition"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPage;