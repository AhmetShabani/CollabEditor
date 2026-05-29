import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const InvitePage = () => {
    const { token } = useParams();
    const { token: authToken } = useAuth();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading');
    const [document, setDocument] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        joinDocument();
    }, []);

    const joinDocument = async () => {
        try {
            const response = await api.post(`/document/join/${token}`, {}, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            setDocument(response.data);
            setStatus('success');
        } catch (err) {
            setError(err.response?.data || 'Invalid or expired invite link');
            setStatus('error');
        }
    };

    if (status === 'loading') return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
            <div className="text-gray-400">Joining document...</div>
        </div>
    );

    if (status === 'error') return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center max-w-md">
                <h2 className="text-red-400 text-xl font-bold mb-2">Invalid Invite</h2>
                <p className="text-gray-400 mb-6">{error}</p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
                >
                    Go to Dashboard
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center max-w-md">
                <div className="text-4xl mb-4">🎉</div>
                <h2 className="text-white text-xl font-bold mb-2">You joined the document!</h2>
                <p className="text-gray-400 mb-2">
                    <span className="text-white font-medium">{document?.documentTitle}</span>
                </p>
                <p className="text-gray-500 text-sm mb-6">
                    Role: <span className="text-blue-400">{document?.role}</span>
                </p>
                <button
                    onClick={() => navigate(`/editor/${document?.documentId}`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
                >
                    Open Document
                </button>
            </div>
        </div>
    );
};

export default InvitePage;