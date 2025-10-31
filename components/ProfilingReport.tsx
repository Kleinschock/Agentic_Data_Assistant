
import React from 'react';
import { ColumnProfile } from '../types';

interface ProfilingReportProps {
    report: ColumnProfile[];
    fileName: string;
}

const ProfilingReport: React.FC<ProfilingReportProps> = ({ report, fileName }) => {
    const totalRows = report.length > 0 ? report[0].totalRows : 0;
    const totalCols = report.length;

    return (
        <div className="bg-slate-800/50 rounded-lg p-6 shadow-lg border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-1">Profiling Report</h2>
            <p className="text-slate-400 mb-6">File: <span className="font-mono text-indigo-400">{fileName}</span> - {totalRows} rows, {totalCols} columns</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {report.map((col) => (
                    <div key={col.name} className="bg-slate-800 p-4 rounded-lg border border-slate-700 hover:border-indigo-500 transition-colors duration-200">
                        <h3 className="font-bold text-lg text-indigo-400 truncate">{col.name}</h3>
                        <div className="text-sm text-slate-300 mt-2 space-y-1">
                            <p>Missing: <span className="font-mono">{col.missing} ({(col.missing / col.totalRows * 100).toFixed(1)}%)</span></p>
                            <p>Unique: <span className="font-mono">{col.unique}</span></p>
                            <div>
                                <h4 className="font-semibold mt-2">Top Values:</h4>
                                <ul className="text-xs text-slate-400 pl-2">
                                    {col.topValues.length > 0 ? col.topValues.map(([value, count]) => (
                                        <li key={value} className="flex justify-between">
                                            <span className="truncate pr-2" title={String(value)}>{String(value)}</span>
                                            <span className="font-mono flex-shrink-0">{count}</span>
                                        </li>
                                    )) : <li>(No values)</li>}
                                </ul>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProfilingReport;
