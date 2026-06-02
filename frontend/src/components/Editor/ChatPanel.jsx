import { useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const ChatPanel = ({ messages, chatInput, setChatInput, sendChatMessage, clearChat, isOwner, onClose }) => {
    const { user } = useAuth();
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    };

    return (
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
                        onClick={onClose}
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
                    onKeyDown={handleKeyDown}
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
    );
};

export default ChatPanel;