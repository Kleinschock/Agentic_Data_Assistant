import React, { useState } from 'react';
import { DEFAULT_CATEGORIZATION_PROMPT } from '../constants';

export interface CategorizationConfig {
    batchSize: number;
    prompt: string;
    outputOption: 'merge' | 'download';
    fileName: string;
}

interface CategorizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (config: CategorizationConfig) => void;
    isProcessing: boolean;
    columnName: string;
    rowCount: number;
    originalFileName: string;
}

const CategorizationModal: React.FC<CategorizationModalProps> = ({ isOpen, onClose, onSubmit, isProcessing, columnName, rowCount, originalFileName }) => {
    const [batchSize, setBatchSize] = useState(Math.min(100, rowCount));
    const [prompt, setPrompt] = useState(DEFAULT_CATEGORIZATION_PROMPT);
    const [outputOption, setOutputOption] = useState<'merge' | 'download'>('merge');
    const [fileName, setFileName] = useState(`${originalFileName.split('.').slice(0, -1).join('.')}_categorized.csv`);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ batchSize, prompt, outputOption, fileName });
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-700"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-slate-700">
                    <h2 className="text-2xl font-bold text-white">Configure AI Categorization</h2>
                    <p className="text-slate-400 mt-1">
                        For column: <span className="font-mono text-indigo-400">{columnName}</span>
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-6">
                    <div>
                        <label htmlFor="batch-size" className="block text-sm font-medium text-slate-300">
                            Batch Size
                        </label>
                        <input
                            type="number"
                            id="batch-size"
                            value={batchSize}
                            onChange={(e) => setBatchSize(Math.max(1, Math.min(rowCount, parseInt(e.target.value, 10))))}
                            className="mt-1 block w-full bg-slate-900 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-slate-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            min="1"
                            max={rowCount}
                        />
                        <p className="mt-2 text-xs text-slate-500">
                            Number of rows to send to the AI for processing (max {rowCount}). A larger batch may increase costs and processing time.
                        </p>
                    </div>
                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-slate-300">
                            AI Prompt Template
                        </label>
                        <textarea
                            id="prompt"
                            rows={8}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="mt-1 block w-full bg-slate-900 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-slate-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                        />
                        {/* Fix: Correctly display literal curly braces in JSX to avoid parsing errors. */}
                        <p className="mt-2 text-xs text-slate-500">
                            Edit the prompt sent to Gemini. Ensure `{'{{GOOGLE_PRODUCT_TAXONOMY}}'}` and `{'{{SAMPLE_DATA}}'}` placeholders are present.
                        </p>
                    </div>
                    <fieldset>
                        <legend className="text-sm font-medium text-slate-300">Output Option</legend>
                        <div className="mt-2 space-y-2">
                             <div className="flex items-center">
                                <input id="output-merge" name="output-option" type="radio" value="merge" checked={outputOption === 'merge'} onChange={() => setOutputOption('merge')} className="h-4 w-4 text-indigo-600 border-slate-500 bg-slate-700 focus:ring-indigo-500" />
                                <label htmlFor="output-merge" className="ml-3 block text-sm font-medium text-slate-300">Merge into data table</label>
                            </div>
                            <div className="flex items-center">
                                <input id="output-download" name="output-option" type="radio" value="download" checked={outputOption === 'download'} onChange={() => setOutputOption('download')} className="h-4 w-4 text-indigo-600 border-slate-500 bg-slate-700 focus:ring-indigo-500" />
                                <label htmlFor="output-download" className="ml-3 block text-sm font-medium text-slate-300">Download results as CSV</label>
                            </div>
                        </div>
                    </fieldset>
                    {outputOption === 'download' && (
                        <div>
                            <label htmlFor="file-name" className="block text-sm font-medium text-slate-300">
                                New File Name
                            </label>
                            <input
                                type="text"
                                id="file-name"
                                value={fileName}
                                onChange={(e) => setFileName(e.target.value)}
                                className="mt-1 block w-full bg-slate-900 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-slate-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                    )}
                </form>
                <div className="p-6 border-t border-slate-700 bg-slate-800/50 flex justify-end space-x-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-slate-500">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isProcessing}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center"
                    >
                        {isProcessing && (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {isProcessing ? 'Processing...' : 'Start Categorization'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CategorizationModal;
