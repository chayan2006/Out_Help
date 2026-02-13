import React from 'react';
import { ShieldCheck } from 'lucide-react';

const Loading: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
            <div className="animate-bounce mb-4">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                    <ShieldCheck className="w-8 h-8 text-white" />
                </div>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">TrustServe AI</h2>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
            </div>
        </div>
    );
};

export default Loading;
