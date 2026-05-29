import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import createConnection from '../services/signalRService';
import ReactMarkdown from 'react-markdown';

const getColorForUser = (connectionId) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    const index = connectionId.charCodeAt(0) % colors.length;
    return colors[index];
};

const EditorPage = () => {
    const { documentId } = useParams();
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [document, setDocument] = useState(null);
    const [content, setContent] = useState('');
    const [connectedUsers, setConnectedUsers] = useState([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [reviewing, setReviewing] = useState(false);
    const [review, setReview] = useState('');
    const [showReview, setShowReview] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [inviteLink, setInviteLink] = useState('');
    const [showInvite, setShowInvite] = useState(false);
    const isRemoteChange = useRef(false);
    const isDirty = useRef(false);
    const connectionRef = useRef(null);
    const editorRef = useRef(null);
    const contentRef = useRef('');
    const documentRef = useRef(null);
    const cursorDecorations = useRef({});
    const cursorTimeout = useRef(null);
    const messagesEndRef = useRef(null);
    const initialMessageCount = useRef(0);
    const showChatRef = useRef(false);
    const [showMembers, setShowMembers] = useState(false);
    const [collaborators, setCollaborators] = useState([]);

    useEffect(() => {
        showChatRef.current = showChat;
    }, [showChat]);

    useEffect(() => {
        fetchDocument();
        fetchChatHistory();
        fetchCollaborators();
        setupSignalR();
        

        return () => {
            if (connectionRef.current) {
                connectionRef.current.invoke('LeaveDocument', documentId)
                    .catch(() => {})
                    .finally(() => connectionRef.current.stop());
            }
        };
    }, [documentId]);

    useEffect(() => {
        if (!document) return;
        const interval = setInterval(() => {
            if (isDirty.current) {
                saveDocument();
                isDirty.current = false;
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [document]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchDocument = async () => {
        try {
            const response = await api.get(`/document/${documentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDocument(response.data);
            documentRef.current = response.data;
            setContent(response.data.content || '');
            contentRef.current = response.data.content || '';
        } catch (err) {
            console.error('Failed to fetch document', err);
        }
    };

    const fetchChatHistory = async () => {
        try {
            const response = await api.get(`/document/${documentId}/chat`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(response.data);
            initialMessageCount.current = response.data.length;
        } catch (err) {
            console.error('Failed to fetch chat history', err);
        }
    };

    const setupSignalR = async () => {
        if (connectionRef.current) return;
        try {
            const connection = createConnection();
            connectionRef.current = connection;

            connection.on('CodeChanged', (newContent) => {
                isRemoteChange.current = true;
                setContent(newContent);
            });

            connection.on('UserJoined', (connectionId, username) => {
                setConnectedUsers(prev => [...prev, { connectionId, username }]);
            });

            connection.on('UserLeft', (connectionId) => {
                setConnectedUsers(prev => prev.filter(u => u.connectionId !== connectionId));
                // update cursor cleanup too
                if (editorRef.current && cursorDecorations.current[connectionId]) {
                    editorRef.current.deltaDecorations(
                        cursorDecorations.current[connectionId], []
                    );
                    delete cursorDecorations.current[connectionId];
                }
            });

            connection.on('ChatMessage', (username, message, timestamp) => {
                setMessages(prev => [...prev, { username, message, timestamp }]);
                if (username !== user?.username && !showChatRef.current) {
                    setUnreadCount(prev => prev + 1);
                }
            });

            connection.on('CursorMoved', (connectionId, line, column) => {
                if (!editorRef.current) return;
                const color = getColorForUser(connectionId);
                const newDecorations = [{
                    range: {
                        startLineNumber: line,
                        startColumn: column,
                        endLineNumber: line,
                        endColumn: column + 1
                    },
                    options: {
                        className: `cursor-${connectionId.substring(0, 8)}`,
                        stickiness: 1,
                    }
                }];

                const styleId = `cursor-style-${connectionId.substring(0, 8)}`;
                let styleEl = window.document.getElementById(styleId);
                if (!styleEl) {
                    styleEl = window.document.createElement('style');
                    styleEl.id = styleId;
                    window.document.head.appendChild(styleEl);
                }
                styleEl.innerHTML = `.cursor-${connectionId.substring(0, 8)} { border-left: 2px solid ${color}; }`;

                const oldDecorations = cursorDecorations.current[connectionId] || [];
                cursorDecorations.current[connectionId] = editorRef.current.deltaDecorations(
                    oldDecorations, newDecorations
                );
            });

            await connection.start();
            console.log('SignalR Connected');
            await connection.invoke('JoinDocument', documentId);
        } catch (err) {
            console.error('SignalR connection failed', err);
        }
    };

    const handleEditorChange = async (value) => {
        if (isRemoteChange.current) {
            isRemoteChange.current = false;
            return;
        }
        setContent(value);
        contentRef.current = value;
        isDirty.current = true;
        if (connectionRef.current) {
            await connectionRef.current.invoke('SendCodeChange', documentId, value);
        }
    };

    const handleEditorMount = (editor) => {
        editorRef.current = editor;
        editor.onDidChangeCursorPosition((e) => {
            clearTimeout(cursorTimeout.current);
            cursorTimeout.current = setTimeout(() => {
                if (connectionRef.current) {
                    connectionRef.current.invoke(
                        'SendCursorPosition',
                        documentId,
                        e.position.lineNumber,
                        e.position.column
                    ).catch(() => {});
                }
            }, 100);
        });
    };

    const saveDocument = async () => {
        if (!documentRef.current) return;
        setSaving(true);
        try {
            await api.put(`/document/${documentId}`, {
                title: documentRef.current.title,
                content: contentRef.current,
                language: documentRef.current.language
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error('Failed to save', err);
        } finally {
            setSaving(false);
        }
    };

    const requestAIReview = async () => {
        setReviewing(true);
        setReview('');
        setShowReview(true);
        setShowChat(false);
        try {
            const response = await api.post('/ai/review', {
                code: contentRef.current,
                language: documentRef.current?.language || 'javascript'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReview(response.data.review);
        } catch (err) {
            console.error('AI review failed', err);
        } finally {
            setReviewing(false);
        }
    };

    const sendChatMessage = async () => {
        if (!chatInput.trim() || !connectionRef.current) return;
        await connectionRef.current.invoke('SendChatMessage', documentId, chatInput);
        setChatInput('');
    };

    const clearChat = async () => {
        try {
            await api.delete(`/document/${documentId}/chat`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages([]);
            initialMessageCount.current = 0;
        } catch (err) {
            console.error('Failed to clear chat', err);
        }
    };

    const generateInvite = async () => {
        try {
            const response = await api.post(`/document/${documentId}/invite`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInviteLink(response.data.inviteLink);
            setShowInvite(true);
        } catch (err) {
            console.error('Failed to generate invite', err);
        }
    };

    const fetchCollaborators = async () => {
        try {
            const response = await api.get(`/document/${documentId}/collaborators`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCollaborators(response.data);
        } catch (err) {
            console.error('Failed to fetch collaborators', err);
        }
    };

    const handleChatKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    };

    const showSidePanel = showReview || showChat || showMembers;
    const isOwner = document?.ownerId === user?.id;

    const removeCollaborator = async (collaboratorUserId) => {
    try {
        await api.delete(`/document/${documentId}/collaborators/${collaboratorUserId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setCollaborators(prev => prev.filter(c => c.userId !== collaboratorUserId));
    } catch (err) {
        console.error('Failed to remove collaborator', err);
    }
};

    return (
        <div className="h-screen bg-gray-950 flex flex-col">
            <nav className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-gray-400 hover:text-white transition text-sm"
                    >
                        ← Dashboard
                    </button>
                    <span className="text-gray-600">|</span>
                    <h2 className="text-white font-medium">{document?.title}</h2>
                    <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">
                        {document?.language}
                    </span>
                    <span className="text-xs text-gray-500">
                        Updated: {document ? new Date(document.updatedAt).toLocaleDateString() : ''}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-gray-800 px-2 py-1 rounded-lg">
                            <div className="w-2 h-2 rounded-full bg-green-400" />
                            <span className="text-gray-300 text-xs">You</span>
                        </div>
                        {connectedUsers.map(u => (
                            <div
                                key={u.connectionId}
                                className="flex items-center gap-1.5 bg-gray-800 px-2 py-1 rounded-lg"
                            >
                                <div
                                    style={{ background: getColorForUser(u.connectionId) }}
                                    className="w-2 h-2 rounded-full"
                                />
                                <span className="text-gray-300 text-xs">
                                    {u.username}
                                </span>
                            </div>
                        ))}
                        <span className="text-gray-500 text-xs">
                            {connectedUsers.length + 1} online
                        </span>
                    </div>

                    <button
                        onClick={() => {
                            setShowChat(!showChat);
                            setShowReview(false);
                            setUnreadCount(0);
                        }}
                        className={`relative px-4 py-1.5 rounded-lg text-sm font-medium transition ${showChat ? 'bg-green-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}
                    >
                        💬 Chat
                        {unreadCount > 0 && !showChat && (
                            <>
                                <span className="ml-1 text-xs">
                                    ({unreadCount > 10 ? '10+' : unreadCount})
                                </span>
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                            </>
                        )}
                    </button>

                    <button
                        onClick={requestAIReview}
                        disabled={reviewing}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
                    >
                        {reviewing ? '🤖 Reviewing...' : '🤖 AI Review'}
                    </button>

                    {isOwner && (
                        <button
                            onClick={generateInvite}
                            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-1.5 rounded-lg text-sm font-medium transition"
                        >
                            🔗 Invite
                        </button>
                    )}

                    <button
                        onClick={() => { setShowMembers(!showMembers); setShowChat(false); setShowReview(false); }}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${showMembers ? 'bg-green-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}
                    >
                        👥 Members ({collaborators.length})
                    </button>

                    <button
                        onClick={saveDocument}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
                    >
                        {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </nav>

            <div className="flex flex-1 overflow-hidden">
                <div className={showSidePanel ? 'w-2/3' : 'w-full'}>
                    <Editor
                        height="calc(100vh - 57px)"
                        language={document?.language || 'javascript'}
                        value={content}
                        onChange={handleEditorChange}
                        onMount={handleEditorMount}
                        theme="vs-dark"
                        options={{
                            fontSize: 14,
                            minimap: { enabled: true },
                            automaticLayout: true,
                            padding: { top: 16 }
                        }}
                    />
                </div>

                {showReview && (
                    <div className="w-1/3 bg-gray-900 border-l border-gray-800 flex flex-col">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                            <h3 className="text-white font-medium text-sm">🤖 AI Review</h3>
                            <button
                                onClick={() => setShowReview(false)}
                                className="text-gray-500 hover:text-white transition"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-4 text-sm">
                            {reviewing ? (
                                <div className="text-gray-500 text-center mt-8">
                                    Analyzing your code...
                                </div>
                            ) : (
                                <ReactMarkdown
                                    components={{
                                        h2: ({node, ...props}) => (
                                            <h2 className="text-white font-bold text-base mt-4 mb-2" {...props} />
                                        ),
                                        h3: ({node, ...props}) => (
                                            <h3 className="text-blue-400 font-semibold text-sm mt-4 mb-2 border-b border-gray-700 pb-1" {...props} />
                                        ),
                                        p: ({node, ...props}) => (
                                            <p className="text-gray-300 text-sm mb-2" {...props} />
                                        ),
                                        ul: ({node, ...props}) => (
                                            <ul className="list-disc list-inside space-y-1 mb-3" {...props} />
                                        ),
                                        li: ({node, ...props}) => (
                                            <li className="text-gray-300 text-sm" {...props} />
                                        ),
                                        code: ({node, ...props}) => (
                                            <code className="bg-gray-800 text-blue-300 px-1 rounded text-xs" {...props} />
                                        ),
                                        pre: ({node, ...props}) => (
                                            <pre className="bg-gray-800 text-gray-300 p-3 rounded-lg text-xs overflow-auto mb-3" {...props} />
                                        ),
                                        strong: ({node, ...props}) => (
                                            <strong className="text-white font-semibold" {...props} />
                                        ),
                                    }}
                                >
                                    {review}
                                </ReactMarkdown>
                            )}
                        </div>
                    </div>
                )}

                {showChat && (
                    <div className="w-1/3 bg-gray-900 border-l border-gray-800 flex flex-col">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                            <h3 className="text-white font-medium text-sm">💬 Chat</h3>
                            <div className="flex items-center gap-2">
                                {isOwner && (
                                    <button
                                        onClick={clearChat}
                                        className="text-red-400 hover:text-red-300 text-xs transition"
                                    >
                                        Clear
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowChat(false)}
                                    className="text-gray-500 hover:text-white transition"
                                >
                                    ✕
                                </button>
                            </div>
                            
                        </div>

                        <div className="flex-1 overflow-auto p-4 space-y-3">
                            {messages.length === 0 ? (
                                <div className="text-gray-500 text-center text-sm mt-8">
                                    No messages yet. Say hello! 👋
                                </div>
                            ) : (
                                messages.map((msg, index) => (
                                    <div key={index} className={`flex flex-col gap-0.5 ${msg.username === user?.username ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-blue-400 text-xs font-medium">
                                                {msg.username === user?.username ? 'You' : msg.username}
                                            </span>
                                            <span className="text-gray-600 text-xs">
                                                {new Date(msg.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <p className={`text-sm px-3 py-2 rounded-lg max-w-xs ${msg.username === user?.username ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'}`}>
                                            {msg.message}
                                        </p>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-3 border-t border-gray-800 flex gap-2">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={handleChatKeyDown}
                                placeholder="Type a message..."
                                className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                            />
                            <button
                                onClick={sendChatMessage}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition"
                            >
                                Send
                            </button>
                        </div>
                    </div>


                )}
                {showMembers && (
    <div className="w-1/3 bg-gray-900 border-l border-gray-800 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <h3 className="text-white font-medium text-sm">👥 Members</h3>
            <button
                onClick={() => setShowMembers(false)}
                className="text-gray-500 hover:text-white transition"
            >
                ✕
            </button>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-4">
            {/* Owner */}
            <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Owner</p>
                {collaborators.filter(c => c.role === 'Owner').map((c, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-800 px-3 py-2 rounded-lg">
                        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                            {c.username[0].toUpperCase()}
                        </div>
                        <div>
                            <p className="text-white text-sm font-medium">{c.username}</p>
                            <p className="text-gray-500 text-xs">Owner</p>
                        </div>
                    </div>
                ))}
            </div>
            {/* Collaborators */}
            {collaborators.filter(c => c.role !== 'Owner').length > 0 && (
                <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Collaborators</p>
                    {collaborators.filter(c => c.role !== 'Owner').map((c, i) => (
                        <div key={i} className="flex items-center gap-3 bg-gray-800 px-3 py-2 rounded-lg mb-2">
                            <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                {c.username[0].toUpperCase()}
                            </div>
                            <div>
                                <p className="text-white text-sm font-medium">{c.username}</p>
                                <p className="text-gray-500 text-xs">Collaborator</p>
                            </div>
                            {isOwner && (
                                <button
                                    className="ml-auto text-red-400 hover:text-red-300 text-xs transition"
                                    onClick={() => removeCollaborator(c.userId)}
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
            {collaborators.filter(c => c.role !== 'Owner').length === 0 && (
                <p className="text-gray-500 text-sm text-center mt-4">No collaborators yet. Use the Invite button to add people.</p>
            )}
        </div>
    </div>
)}
            </div>

            {/* Invite Modal */}
            {showInvite && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-white font-semibold mb-4">🔗 Invite Collaborator</h3>
                        <p className="text-gray-400 text-sm mb-3">Share this link — expires in 7 days:</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inviteLink}
                                readOnly
                                className="flex-1 bg-gray-800 text-gray-300 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                            />
                            <button
                                onClick={() => navigator.clipboard.writeText(inviteLink)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition"
                            >
                                Copy
                            </button>
                        </div>
                        <button
                            onClick={() => setShowInvite(false)}
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

export default EditorPage;