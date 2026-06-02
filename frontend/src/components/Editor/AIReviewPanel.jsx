import ReactMarkdown from 'react-markdown';

const AIReviewPanel = ({ review, reviewing, onClose }) => {
    return (
        <div className="w-1/3 bg-gray-900 border-l border-gray-800 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <h3 className="text-white font-medium text-sm">🤖 AI Review</h3>
                <button
                    onClick={onClose}
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
    );
};

export default AIReviewPanel;