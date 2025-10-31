
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ExecutionStep } from '../types';

interface AIAssistantPanelProps {
    messages: ChatMessage[];
    onSendMessage: (prompt: string) => void;
    isThinking: boolean;
    onClearChat: () => void;
}

const getStepTitleAndIcon = (step: ExecutionStep) => {
    switch (step.type) {
        case 'thought':
            return {
                title: 'Thought',
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                )
            };
        case 'tool-call':
            return {
                title: `Tool Call: ${step.content.name}`,
                icon: (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                )
            };
        case 'tool-result':
            return {
                title: `Tool Result: ${step.content.name}`,
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )
            };
        default:
             return { title: 'Log', icon: null };
    }
};

const ExecutionStepDetail: React.FC<{ step: ExecutionStep }> = ({ step }) => {
    const { title, icon } = getStepTitleAndIcon(step);

    const formatContent = (content: any) => {
        if (typeof content === 'object') {
            return JSON.stringify(content, null, 2);
        }
        return String(content);
    };

    return (
        <details className="bg-slate-900/70 rounded-lg overflow-hidden">
            <summary className="px-3 py-2 text-sm font-semibold flex items-center cursor-pointer hover:bg-slate-800">
                {icon}
                <span>{title}</span>
            </summary>
            <div className="p-3 border-t border-slate-700">
                <pre className="text-xs text-slate-300 whitespace-pre-wrap bg-slate-950 p-2 rounded-md">
                    <code>
                        {formatContent(step.type === 'thought' ? step.content : step.content.response || step.content.args)}
                    </code>
                </pre>
            </div>
        </details>
    );
};


const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({ messages, onSendMessage, isThinking, onClearChat }) => {
    const [prompt, setPrompt] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, isThinking]);

    const handleSend = () => {
        if (prompt.trim() && !isThinking) {
            onSendMessage(prompt);
            setPrompt('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    
    const suggestedPrompts = [
        "Summarize the main characteristics of this dataset.",
        "Are there any columns with a lot of missing values?",
        "Categorize the 'price' column into Low, Medium, High.",
    ];

    return (
        <div className="bg-slate-800/50 rounded-lg shadow-lg border border-slate-700 flex flex-col flex-grow min-h-0">
            <div className="p-4 border-b border-slate-700 flex-shrink-0 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">AI Assistant</h3>
                <button 
                    onClick={onClearChat} 
                    className="text-slate-400 hover:text-white hover:bg-slate-700 p-2 rounded-full transition-colors disabled:opacity-50"
                    title="Clear chat history"
                    disabled={isThinking}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
            
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`rounded-lg px-4 py-2 max-w-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                         {msg.role === 'assistant' && msg.executionSteps && msg.executionSteps.length > 1 && (
                            <details className="mt-2 max-w-sm w-full">
                                <summary className="text-xs text-slate-400 cursor-pointer hover:text-indigo-400">
                                    Show Agent Steps
                                </summary>
                                <div className="mt-2 p-2 bg-slate-800 rounded-lg space-y-2 border border-slate-700">
                                    {msg.executionSteps
                                        .filter(step => step.type !== 'final-answer')
                                        .map((step, stepIndex) => (
                                            <ExecutionStepDetail key={stepIndex} step={step} />
                                    ))}
                                </div>
                            </details>
                        )}
                    </div>
                ))}
                {isThinking && (
                     <div className="flex justify-start">
                        <div className="rounded-lg px-4 py-2 bg-slate-700 text-slate-200 flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-indigo-400 mr-2"></div>
                            <span>Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {messages.length <= 1 && (
                 <div className="p-4 border-t border-slate-700 flex-shrink-0">
                    <h4 className="text-sm font-semibold text-slate-400 mb-2">Not sure where to start? Try these:</h4>
                    <div className="flex flex-wrap gap-2">
                        {suggestedPrompts.map(p => (
                            <button 
                                key={p}
                                onClick={() => onSendMessage(p)}
                                className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm hover:bg-slate-600 disabled:opacity-50"
                                disabled={isThinking}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="p-4 border-t border-slate-700 flex-shrink-0">
                <div className="flex items-center space-x-2">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask about your data..."
                        className="flex-grow bg-slate-900 border border-slate-600 rounded-lg shadow-sm py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                        rows={1}
                        disabled={isThinking}
                    />
                    <button onClick={handleSend} disabled={isThinking || !prompt.trim()} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed">
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIAssistantPanel;
