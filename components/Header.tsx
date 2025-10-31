
import React from 'react';

interface HeaderProps {
    onNewFile: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNewFile }) => {
    return (
        <header className="bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-800">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6V3m0 18v-3M5.636 5.636l-1.414-1.414M19.778 19.778l-1.414-1.414M18.364 5.636l1.414-1.414M4.222 19.778l1.414-1.414M12 12a3 3 0 100-6 3 3 0 000 6z" />
                        </svg>
                        <h1 className="text-xl font-bold ml-3 text-white">
                            Agentic Data Ops Assistant
                        </h1>
                    </div>
                    <div className="flex items-center">
                        <button
                            onClick={onNewFile}
                            className="px-4 py-2 text-sm font-semibold text-indigo-300 border border-indigo-600 rounded-md hover:bg-indigo-600 hover:text-white transition-colors"
                        >
                            Analyze New File
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
