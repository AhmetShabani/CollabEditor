const getColorForUser = (connectionId) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    const index = connectionId.charCodeAt(0) % colors.length;
    return colors[index];
};

const EditorNavbar = ({
    document,
    connectedUsers,
    isOwner,
    saving,
    saved,
    reviewing,
    showChat,
    showMembers,
    unreadCount,
    onNavigateBack,
    onSave,
    onAIReview,
    onToggleChat,
    onToggleMembers,
    onGenerateInvite,
}) => {
    return (
        <nav className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button
                    onClick={onNavigateBack}
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
                {/* Connected users */}
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
                            <span className="text-gray-300 text-xs">{u.username}</span>
                        </div>
                    ))}
                    <span className="text-gray-500 text-xs">
                        {connectedUsers.length + 1} online
                    </span>
                </div>

                <button
                    onClick={onToggleMembers}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${showMembers ? 'bg-green-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}
                >
                    👥 Members
                </button>

                <button
                    onClick={onToggleChat}
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
                    onClick={onAIReview}
                    disabled={reviewing}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                    {reviewing ? '🤖 Reviewing...' : '🤖 AI Review'}
                </button>

                {isOwner && (
                    <button
                        onClick={onGenerateInvite}
                        className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-1.5 rounded-lg text-sm font-medium transition"
                    >
                        🔗 Invite
                    </button>
                )}

                <button
                    onClick={onSave}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                    {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save'}
                </button>
            </div>
        </nav>
    );
};

export default EditorNavbar;