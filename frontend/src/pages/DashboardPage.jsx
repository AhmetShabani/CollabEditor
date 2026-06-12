import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import friendService from '../services/friendService';
import NotificationBell from '../components/NotificationBell';

const DashboardPage = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [newLanguage, setNewLanguage] = useState('javascript');
    const [creating, setCreating] = useState(false);
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [friendUsername, setFriendUsername] = useState('');
    const [friendError, setFriendError] = useState('');
    const [friendSuccess, setFriendSuccess] = useState('');
    const [showFriends, setShowFriends] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [selectedDocumentId, setSelectedDocumentId] = useState(null);
    const [invitingFriend, setInvitingFriend] = useState(null);
    const [selectedDocumentCollaborators, setSelectedDocumentCollaborators] = useState([]);
    const [sentInvites, setSentInvites] = useState([]);

    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchDocuments();
        fetchFriends();
        fetchPendingRequests();
    }, []);

    const fetchDocuments = async () => {
        try {
            const response = await api.get('/document');
            setDocuments(response.data);
        } catch (err) {
            setError('Failed to fetch documents');
        } finally {
            setLoading(false);
        }
    };

    const fetchFriends = async () => {
        try {
            const data = await friendService.getFriends();
            setFriends(data);
        } catch (err) {
            console.error('Failed to fetch friends', err);
        }
    };

    const fetchPendingRequests = async () => {
        try {
            const data = await friendService.getPendingRequests();
            setPendingRequests(data);
        } catch (err) {
            console.error('Failed to fetch pending requests', err);
        }
    };

    const sendFriendRequest = async () => {
        if (!friendUsername.trim()) return;
        setFriendError('');
        setFriendSuccess('');
        try {
            await friendService.sendRequest(friendUsername);
            setFriendSuccess(`Friend request sent to ${friendUsername}`);
            setFriendUsername('');
        } catch (err) {
            setFriendError(err.response?.data || 'Failed to send request');
        }
    };

    const acceptRequest = async (requestId) => {
        try {
            await friendService.acceptRequest(requestId);
            setPendingRequests(prev => prev.filter(r => r.id !== requestId));
            fetchFriends();
        } catch (err) {
            console.error('Failed to accept request', err);
        }
    };

    const declineRequest = async (requestId) => {
        try {
            await friendService.declineRequest(requestId);
            setPendingRequests(prev => prev.filter(r => r.id !== requestId));
        } catch (err) {
            console.error('Failed to decline request', err);
        }
    };

    const removeFriend = async (friendshipId) => {
        try {
            await friendService.removeFriend(friendshipId);
            setFriends(prev => prev.filter(f => f.friendshipId !== friendshipId));
        } catch (err) {
            console.error('Failed to remove friend', err);
        }
    };

    const openInviteModal = async (documentId) => {
        setSelectedDocumentId(documentId);
        setSentInvites([]);
        try {
            const response = await api.get(`/document/${documentId}/collaborators`);
            setSelectedDocumentCollaborators(response.data.map(c => c.userId));
        } catch (err) {
            console.error('Failed to fetch collaborators', err);
            setSelectedDocumentCollaborators([]);
        }
        setShowInviteModal(true);
    };

    const inviteFriendToDocument = async (friend, documentId) => {
        setInvitingFriend(friend.username);
        try {
            await api.post(`/document/${documentId}/invite?friendUserId=${friend.userId}`, {});
            setSentInvites(prev => [...prev, friend.userId]);
        } catch (err) {
            console.error('Failed to send invite', err);
        } finally {
            setInvitingFriend(null);
        }
    };

    const createDocument = async () => {
        if (!newTitle.trim()) return;
        setCreating(true);
        try {
            const response = await api.post('/document', {
                title: newTitle,
                content: '',
                language: newLanguage
            });
            setDocuments([...documents, response.data]);
            setNewTitle('');
        } catch (err) {
            setError('Failed to create document');
        } finally {
            setCreating(false);
        }
    };

    const deleteDocument = async (id) => {
        try {
            await api.delete(`/document/${id}`);
            setDocuments(documents.filter(d => d.id !== id));
        } catch (err) {
            setError('Failed to delete document');
        }
    };

    const languageColors = {
        javascript: 'bg-yellow-500/20 text-yellow-400',
        typescript: 'bg-blue-500/20 text-blue-400',
        csharp: 'bg-purple-500/20 text-purple-400',
        python: 'bg-green-500/20 text-green-400',
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Navbar */}
            <nav className="bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-4 flex justify-between items-center">
                <h1 className="text-lg sm:text-xl font-bold text-white">CollabAI</h1>
                <div className="flex items-center gap-2 sm:gap-4">
                    <NotificationBell />
                    <button
                        onClick={() => setShowFriends(!showFriends)}
                        className={`relative px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition ${showFriends ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}
                    >
                        👥 <span className="hidden sm:inline">Friends</span>
                        {pendingRequests.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
                                {pendingRequests.length}
                            </span>
                        )}
                    </button>
                    <span className="text-gray-400 text-sm hidden sm:inline">👤 {user?.username}</span>
                    {user?.role === 'Admin' && (
                        <button
                            onClick={() => navigate('/admin')}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition"
                        >
                            ⚙️ <span className="hidden sm:inline">Admin</span>
                        </button>
                    )}
                    <button
                        onClick={logout}
                        className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 sm:px-4 py-2 rounded-lg text-sm transition"
                    >
                        <span className="hidden sm:inline">Logout</span>
                        <span className="sm:hidden">↪</span>
                    </button>
                </div>
            </nav>

            <div className="flex">
                <div className={`flex-1 px-4 sm:px-6 py-6 sm:py-10 transition-all ${showFriends ? 'sm:mr-80' : ''}`}>
                    {/* Create Document */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8">
                        <h2 className="text-base sm:text-lg font-semibold text-white mb-4">New Document</h2>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                placeholder="Document title..."
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && createDocument()}
                                className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 text-sm"
                            />
                            <div className="flex gap-3">
                                <select
                                    value={newLanguage}
                                    onChange={(e) => setNewLanguage(e.target.value)}
                                    className="flex-1 sm:flex-none bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 text-sm"
                                >
                                    <option value="javascript">JavaScript</option>
                                    <option value="typescript">TypeScript</option>
                                    <option value="csharp">C#</option>
                                    <option value="python">Python</option>
                                </select>
                                <button
                                    onClick={createDocument}
                                    disabled={creating || !newTitle.trim()}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition disabled:opacity-50 text-sm whitespace-nowrap"
                                >
                                    {creating ? 'Creating...' : '+ Create'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Documents List */}
                    <div>
                        <h2 className="text-base sm:text-lg font-semibold text-white mb-4">My Documents</h2>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
                                {error}
                            </div>
                        )}

                        {loading ? (
                            <div className="text-gray-400 text-center py-12">Loading...</div>
                        ) : documents.length === 0 ? (
                            <div className="text-gray-500 text-center py-12 border border-dashed border-gray-800 rounded-2xl text-sm">
                                No documents yet. Create your first one above!
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {documents.map(doc => (
                                    <div
                                        key={doc.id}
                                        className="bg-gray-900 border border-gray-800 rounded-xl px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-gray-700 transition"
                                    >
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                            <span className={`text-xs px-2 py-1 rounded-md font-medium ${languageColors[doc.language] || 'bg-gray-700 text-gray-300'}`}>
                                                {doc.language}
                                            </span>
                                            <span className="text-white font-medium text-sm">{doc.title}</span>
                                            <span className="text-gray-500 text-xs hidden sm:inline">
                                                Created: {new Date(doc.createdAt).toLocaleDateString()}
                                            </span>
                                            <span className="text-gray-500 text-xs hidden sm:inline">
                                                Updated: {new Date(doc.updatedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => navigate(`/editor/${doc.id}`)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-1.5 rounded-lg text-sm transition"
                                            >
                                                Open
                                            </button>
                                            {doc.ownerId === user?.id && (
                                                <button
                                                    onClick={() => openInviteModal(doc.id)}
                                                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 sm:px-4 py-1.5 rounded-lg text-sm transition"
                                                >
                                                    🔗
                                                </button>
                                            )}
                                            {doc.ownerId === user?.id && (
                                                <button
                                                    onClick={() => deleteDocument(doc.id)}
                                                    className="bg-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400 px-3 sm:px-4 py-1.5 rounded-lg text-sm transition"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Friends Panel */}
                {showFriends && (
                    <div className="fixed right-0 top-0 h-full w-full sm:w-80 bg-gray-900 border-l border-gray-800 flex flex-col z-40">
                        <div className="p-4 border-b border-gray-800">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-white font-semibold">👥 Friends</h2>
                                <button
                                    onClick={() => setShowFriends(false)}
                                    className="text-gray-500 hover:text-white transition"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Search username..."
                                    value={friendUsername}
                                    onChange={(e) => setFriendUsername(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendFriendRequest()}
                                    className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                />
                                <button
                                    onClick={sendFriendRequest}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition"
                                >
                                    Add
                                </button>
                            </div>
                            {friendError && <p className="text-red-400 text-xs mt-2">{friendError}</p>}
                            {friendSuccess && <p className="text-green-400 text-xs mt-2">{friendSuccess}</p>}
                        </div>

                        <div className="flex-1 overflow-auto p-4 space-y-4">
                            {pendingRequests.length > 0 && (
                                <div>
                                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">
                                        Pending Requests ({pendingRequests.length})
                                    </p>
                                    {pendingRequests.map(req => (
                                        <div key={req.id} className="bg-gray-800 rounded-lg px-3 py-2 mb-2">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                                                    {req.senderUsername[0].toUpperCase()}
                                                </div>
                                                <span className="text-white text-sm">{req.senderUsername}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => acceptRequest(req.id)}
                                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition"
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => declineRequest(req.id)}
                                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded text-xs transition"
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div>
                                <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">
                                    Friends ({friends.length})
                                </p>
                                {friends.length === 0 ? (
                                    <p className="text-gray-500 text-sm text-center mt-4">
                                        No friends yet. Search for users above!
                                    </p>
                                ) : (
                                    friends.map(friend => (
                                        <div key={friend.friendshipId} className="flex items-center gap-3 bg-gray-800 px-3 py-2 rounded-lg mb-2">
                                            <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                                {friend.username[0].toUpperCase()}
                                            </div>
                                            <span className="text-white text-sm flex-1">{friend.username}</span>
                                            <button
                                                onClick={() => removeFriend(friend.friendshipId)}
                                                className="text-red-400 hover:text-red-300 text-xs transition"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full">
                        <h3 className="text-white font-semibold mb-4">🔗 Invite Friend</h3>
                        {friends.length === 0 ? (
                            <p className="text-gray-400 text-sm">No friends yet. Add friends first!</p>
                        ) : (
                            <div className="space-y-2">
                                {friends.map(friend => {
                                    const isAlreadyCollaborator = selectedDocumentCollaborators.includes(friend.userId);
                                    const isInviteSent = sentInvites.includes(friend.userId);
                                    return (
                                        <div key={friend.friendshipId} className="flex items-center justify-between bg-gray-800 px-4 py-3 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                                    {friend.username[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="text-white text-sm">{friend.username}</span>
                                                    {isAlreadyCollaborator && (
                                                        <p className="text-green-400 text-xs">Already a collaborator</p>
                                                    )}
                                                    {isInviteSent && !isAlreadyCollaborator && (
                                                        <p className="text-yellow-400 text-xs">Invite sent</p>
                                                    )}
                                                </div>
                                            </div>
                                            {isAlreadyCollaborator ? (
                                                <span className="text-green-400 text-xs px-3 py-1.5">✓ Joined</span>
                                            ) : isInviteSent ? (
                                                <span className="text-yellow-400 text-xs px-3 py-1.5">📨 Sent</span>
                                            ) : (
                                                <button
                                                    onClick={() => inviteFriendToDocument(friend, selectedDocumentId)}
                                                    disabled={invitingFriend === friend.username}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs transition disabled:opacity-50"
                                                >
                                                    {invitingFriend === friend.username ? 'Sending...' : 'Send Invite'}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <button
                            onClick={() => setShowInviteModal(false)}
                            className="mt-4 w-full text-gray-500 hover:text-white text-sm transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardPage;