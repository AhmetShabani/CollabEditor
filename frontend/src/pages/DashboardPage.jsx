import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const DashboardPage = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [newLanguage, setNewLanguage] = useState('javascript');

    const { user, token, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const response = await api.get('/document', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDocuments(response.data);
        } catch (err) {
            setError('Failed to fetch documents');
        } finally {
            setLoading(false);
        }
    };

    const createDocument = async () => {
        if (!newTitle.trim()) return;
        try {
            const response = await api.post('/document', {
                title: newTitle,
                content: '',
                language: newLanguage
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDocuments([...documents, response.data]);
            setNewTitle('');
        } catch (err) {
            setError('Failed to create document');
        }
    };

    const deleteDocument = async (id) => {
        try {
            await api.delete(`/document/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDocuments(documents.filter(d => d.id !== id));
        } catch (err) {
            setError('Failed to delete document');
        }
    };

    return (
        <div>
            <h1>Welcome, {user?.username}</h1>
            <button onClick={logout}>Logout</button>
            
            <h2>Create New Document</h2>
            <input
                type="text"
                placeholder="Document title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
            />
            <select value={newLanguage} onChange={(e) => setNewLanguage(e.target.value)}>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="csharp">C#</option>
                <option value="python">Python</option>
            </select>
            <button onClick={createDocument}>Create</button>

            <h2>My Documents</h2>
            {loading && <p>Loading...</p>}
            {error && <p style={{color: 'red'}}>{error}</p>}
            {documents.map(doc => (
                <div key={doc.id}>
                    <span>{doc.title} — {doc.language}</span>
                    <button onClick={() => navigate(`/editor/${doc.id}`)}>Open</button>
                    <button onClick={() => deleteDocument(doc.id)}>Delete</button>
                </div>
            ))}
        </div>
    );
};

export default DashboardPage;