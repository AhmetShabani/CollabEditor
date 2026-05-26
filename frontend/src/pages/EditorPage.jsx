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

    return (
        <div>
            <div>
                <h2>{document?.title}</h2>
                <span>Connected users: {connectedUsers.length + 1}</span>
                <button onClick={saveDocument}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
            <Editor
                height="90vh"
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
        </div>
    );
};

export default EditorPage;