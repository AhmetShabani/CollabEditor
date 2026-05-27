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
    const [creating, setCreating] = useState(false);

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
        setCreating(true);
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
        } finally {
            setCreating(false);
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

    const languageColors = {
        javascript: 'bg-yellow-500/20 text-yellow-400',
        typescript: 'bg-blue-500/20 text-blue-400',
        csharp: 'bg-purple-500/20 text-purple-400',
        python: 'bg-green-500/20 text-green-400',
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Navbar */}
            <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-white">CollabAI</h1>
                <div className="flex items-center gap-4">
                    <span className="text-gray-400">👤 {user?.username}</span>
                    <button
                        onClick={logout}
                        className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm transition"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-6 py-10">
                {/* Create Document */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
                    <h2 className="text-lg font-semibold text-white mb-4">New Document</h2>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Document title..."
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && createDocument()}
                            className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                        />
                        <select
                            value={newLanguage}
                            onChange={(e) => setNewLanguage(e.target.value)}
                            className="bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500"
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="typescript">TypeScript</option>
                            <option value="csharp">C#</option>
                            <option value="python">Python</option>
                        </select>
                        <button
                            onClick={createDocument}
                            disabled={creating || !newTitle.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition disabled:opacity-50"
                        >
                            {creating ? 'Creating...' : '+ Create'}
                        </button>
                    </div>
                </div>

                {/* Documents List */}
                <div>
                    <h2 className="text-lg font-semibold text-white mb-4">My Documents</h2>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="text-gray-400 text-center py-12">Loading...</div>
                    ) : documents.length === 0 ? (
                        <div className="text-gray-500 text-center py-12 border border-dashed border-gray-800 rounded-2xl">
                            No documents yet. Create your first one above!
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {documents.map(doc => (
                                <div
                                    key={doc.id}
                                    className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center justify-between hover:border-gray-700 transition"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs px-2 py-1 rounded-md font-medium ${languageColors[doc.language] || 'bg-gray-700 text-gray-300'}`}>
                                            {doc.language}
                                        </span>
                                        <span className="text-white font-medium">{doc.title}</span>
                                        <span className="text-gray-500 text-sm">
                                            Created: {new Date(doc.createdAt).toLocaleDateString()}
                                        </span>
                                        <span className="text-gray-500 text-sm">
                                            Updated: {new Date(doc.updatedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => navigate(`/editor/${doc.id}`)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm transition"
                                        >
                                            Open
                                        </button>
                                        <button
                                            onClick={() => deleteDocument(doc.id)}
                                            className="bg-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400 px-4 py-1.5 rounded-lg text-sm transition"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;