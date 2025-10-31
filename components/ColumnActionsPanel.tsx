
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';


interface ColumnActionsPanelProps {
    selectedColumn: string | null;
    onOpenCategorizeModal: () => void;
    columnData: any[];
    onClearSelection: () => void;
}

const ColumnActionsPanel: React.FC<ColumnActionsPanelProps> = ({ selectedColumn, onOpenCategorizeModal, columnData, onClearSelection }) => {
    const frequencyData = useMemo(() => {
        if (!selectedColumn || !columnData) return [];
        const counts = columnData.reduce((acc, val) => {
            const key = String(val);
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
        
        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a,b) => (b.count as number) - (a.count as number))
            .slice(0, 10);
    }, [selectedColumn, columnData]);

    return (
        <div className="bg-slate-800/50 rounded-lg shadow-lg border border-slate-700 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Column Operations</h3>
            {selectedColumn ? (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold text-indigo-400 font-mono truncate" title={selectedColumn}>
                            {selectedColumn}
                        </h4>
                        <button 
                            onClick={onClearSelection} 
                            className="text-xs text-slate-400 hover:text-white hover:bg-slate-700 px-2 py-1 rounded-md transition-colors"
                            title="Deselect column"
                        >
                            Clear
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        <button 
                            onClick={onOpenCategorizeModal}
                            className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                           Categorize with AI
                        </button>
                        <p className="text-xs text-slate-400">
                            Uses Gemini to map text to the Google Product Taxonomy. Adds new columns for category and rationale.
                        </p>
                    </div>

                    <div className="mt-6">
                        <h5 className="font-semibold mb-2">Value Frequency</h5>
                        {frequencyData.length > 0 ? (
                            <div style={{ width: '100%', height: 250 }}>
                                <ResponsiveContainer>
                                    <BarChart data={frequencyData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                                        <XAxis type="number" stroke="#94a3b8" />
                                        <YAxis dataKey="name" type="category" width={80} tick={{ fill: '#cbd5e1' }} tickFormatter={(value) => value.length > 10 ? `${value.substring(0,10)}...` : value} />
                                        <Tooltip cursor={{fill: '#334155'}} contentStyle={{backgroundColor: '#1e293b', border: '1px solid #475569'}} />
                                        <Bar dataKey="count" fill="#818cf8" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                             <p className="text-sm text-slate-500">Not enough data to display frequency.</p>
                        )}
                    </div>

                </div>
            ) : (
                <div className="text-center text-slate-400 py-10">
                    <p>Select a column from the data table to see available actions.</p>
                </div>
            )}
        </div>
    );
};

export default ColumnActionsPanel;