import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import createConnection from '../services/signalRService';

const EditorPage = () => {
    const { documentId } = useParams();
    const { token } = useAuth();
    const [document, setDocument] = useState(null);
    const [content, setContent] = useState('');
    const [connectedUsers, setConnectedUsers] = useState([]);
    const [saving, setSaving] = useState(false);
    const [reviewing, setReviewing] = useState(false);
    const [review, setReview] = useState('');
    const isRemoteChange = useRef(false);
    const connectionRef = useRef(null);

    useEffect(() => {
        fetchDocument();
        setupSignalR();

        return () => {
            if (connectionRef.current) {
                connectionRef.current.invoke('LeaveDocument', documentId)
                    .catch(() => {})
                    .finally(() => connectionRef.current.stop());
            }
        };
    }, [documentId]);

    const fetchDocument = async () => {
        try {
            const response = await api.get(`/document/${documentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDocument(response.data);
            setContent(response.data.content || '');
        } catch (err) {
            console.error('Failed to fetch document', err);
        }
    };

    const setupSignalR = async () => {
        try {
            const connection = createConnection();
            connectionRef.current = connection;

            connection.on('CodeChanged', (newContent) => {
                isRemoteChange.current = true;
                setContent(newContent);
            });

            connection.on('UserJoined', (connectionId) => {
                setConnectedUsers(prev => [...prev, connectionId]);
            });

            connection.on('UserLeft', (connectionId) => {
                setConnectedUsers(prev => prev.filter(u => u !== connectionId));
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
        if (connectionRef.current) {
            await connectionRef.current.invoke('SendCodeChange', documentId, value);
        }
    };

    const saveDocument = async () => {
        setSaving(true);
        try {
            await api.put(`/document/${documentId}`, {
                title: document.title,
                content: content,
                language: document.language
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            console.error('Failed to save', err);
        } finally {
            setSaving(false);
        }
    };

    const requestAIReview = async () => {
        setReviewing(true);
        setReview('');
        try {
            const response = await api.post('/ai/review', {
                code: content,
                language: document?.language || 'javascript'
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

    return (
        <div>
            <div>
                <h2>{document?.title}</h2>
                <span>Connected users: {connectedUsers.length + 1}</span>
                <button onClick={saveDocument}>{saving ? 'Saving...' : 'Save'}</button>
                <button onClick={requestAIReview} disabled={reviewing}>
                    {reviewing ? 'Reviewing...' : '🤖 AI Review'}
                </button>
            </div>
            <Editor
                height="70vh"
                language={document?.language || 'javascript'}
                value={content}
                onChange={handleEditorChange}
                theme="vs-dark"
                options={{
                    fontSize: 14,
                    minimap: { enabled: true },
                    automaticLayout: true,
                }}
            />
            {review && (
                <div style={{
                    padding: '10px',
                    background: '#1e1e1e',
                    color: '#fff',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '300px',
                    overflow: 'auto'
                }}>
                    {review}
                </div>
            )}
        </div>
    );
};

export default EditorPage;