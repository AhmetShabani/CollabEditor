import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import createConnection from '../services/signalRService';
import EditorNavbar from '../components/Editor/EditorNavbar';
import ChatPanel from '../components/Editor/ChatPanel';
import AIReviewPanel from '../components/Editor/AIReviewPanel';
import MembersPanel from '../components/Editor/MembersPanel';

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
    const [showMembers, setShowMembers] = useState(false);
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [inviteLink, setInviteLink] = useState('');
    const [showInvite, setShowInvite] = useState(false);
    const [collaborators, setCollaborators] = useState([]);
    const isRemoteChange = useRef(false);
    const isDirty = useRef(false);
    const connectionRef = useRef(null);
    const editorRef = useRef(null);
    const contentRef = useRef('');
    const documentRef = useRef(null);
    const cursorDecorations = useRef({});
    const cursorTimeout = useRef(null);
    const initialMessageCount = useRef(0);
    const showChatRef = useRef(false);

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
        }, 5000);
        return () => clearInterval(interval);
    }, [document]);

    const fetchDocument = async () => {
        try {
            const response = await api.get(`/document/${documentId}`);
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
            const response = await api.get(`/document/${documentId}/chat`);
            setMessages(response.data);
            initialMessageCount.current = response.data.length;
        } catch (err) {
            console.error('Failed to fetch chat history', err);
        }
    };

    const fetchCollaborators = async () => {
        try {
            const response = await api.get(`/document/${documentId}/collaborators`);
            setCollaborators(response.data);
        } catch (err) {
            console.error('Failed to fetch collaborators', err);
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
           

                connection.on('RequestCurrentContent', (requestingConnectionId) => {
                    if (connectionRef.current && contentRef.current) {
                        connectionRef.current.invoke(
                            'SendCurrentContent',
                            requestingConnectionId,
                            contentRef.current
                        ).catch(() => {});
                    }
                });

                connection.on('ReceiveCurrentContent', (content) => {
                    isRemoteChange.current = true;
                    setContent(content);
                    contentRef.current = content;
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
        setShowMembers(false);
        try {
            const response = await api.post('/ai/review', {
                code: contentRef.current,
                language: documentRef.current?.language || 'javascript'
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
            await api.delete(`/document/${documentId}/chat`);
            setMessages([]);
            initialMessageCount.current = 0;
        } catch (err) {
            console.error('Failed to clear chat', err);
        }
    };

    const generateInvite = async () => {
        try {
            const response = await api.post(`/document/${documentId}/invite`, {});
            setInviteLink(response.data.inviteLink);
            setShowInvite(true);
        } catch (err) {
            console.error('Failed to generate invite', err);
        }
    };

    const removeCollaborator = async (collaboratorUserId) => {
        try {
            await api.delete(`/document/${documentId}/collaborators/${collaboratorUserId}`);
            setCollaborators(prev => prev.filter(c => c.userId !== collaboratorUserId));
        } catch (err) {
            console.error('Failed to remove collaborator', err);
        }
    };

    const showSidePanel = showReview || showChat || showMembers;
    const isOwner = document?.ownerId === user?.id;

    return (
        <div className="h-screen bg-gray-950 flex flex-col">
            <EditorNavbar
                document={document}
                connectedUsers={connectedUsers}
                isOwner={isOwner}
                saving={saving}
                saved={saved}
                reviewing={reviewing}
                showChat={showChat}
                showMembers={showMembers}
                unreadCount={unreadCount}
                onNavigateBack={() => navigate('/dashboard')}
                onSave={saveDocument}
                onAIReview={requestAIReview}
                onToggleChat={() => {
                    setShowChat(!showChat);
                    setShowReview(false);
                    setShowMembers(false);
                    setUnreadCount(0);
                }}
                onToggleMembers={() => {
                    setShowMembers(!showMembers);
                    setShowChat(false);
                    setShowReview(false);
                }}
                onGenerateInvite={generateInvite}
            />

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
                    <AIReviewPanel
                        review={review}
                        reviewing={reviewing}
                        onClose={() => setShowReview(false)}
                    />
                )}

                {showChat && (
                    <ChatPanel
                        messages={messages}
                        chatInput={chatInput}
                        setChatInput={setChatInput}
                        sendChatMessage={sendChatMessage}
                        clearChat={clearChat}
                        isOwner={isOwner}
                        onClose={() => setShowChat(false)}
                    />
                )}

                {showMembers && (
                    <MembersPanel
                        collaborators={collaborators}
                        isOwner={isOwner}
                        onRemoveCollaborator={removeCollaborator}
                        onClose={() => setShowMembers(false)}
                    />
                )}
            </div>

            {/* Invite Modal */}
            {showInvite && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-white font-semibold mb-4">🔗 Invite Collaborator</h3>
                        <p className="text-gray-400 text-sm mb-3">Share this link — expires in 1 day:</p>
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