const MembersPanel = ({ collaborators, isOwner, onRemoveCollaborator, onClose }) => {
    return (
        <div className="w-1/3 bg-gray-900 border-l border-gray-800 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <h3 className="text-white font-medium text-sm">👥 Members</h3>
                <button
                    onClick={onClose}
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
                                <div className="flex-1">
                                    <p className="text-white text-sm font-medium">{c.username}</p>
                                    <p className="text-gray-500 text-xs">Collaborator</p>
                                </div>
                                {isOwner && (
                                    <button
                                        className="text-red-400 hover:text-red-300 text-xs transition"
                                        onClick={() => onRemoveCollaborator(c.userId)}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {collaborators.filter(c => c.role !== 'Owner').length === 0 && (
                    <p className="text-gray-500 text-sm text-center mt-4">
                        No collaborators yet. Use the Invite button to add people.
                    </p>
                )}
            </div>
        </div>
    );
};

export default MembersPanel;