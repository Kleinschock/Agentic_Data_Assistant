import React, { useState, useMemo } from 'react';
import { TableData } from '../types';

interface DataTableProps {
    data: TableData;
    selectedColumn: string | null;
    onColumnSelect: (header: string) => void;
    onRevertData: () => void;
    onExportData: () => void;
}

const ROWS_PER_PAGE = 10;

const DataTable: React.FC<DataTableProps> = ({ data, selectedColumn, onColumnSelect, onRevertData, onExportData }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const { headers, rows } = data;

    const paginatedRows = useMemo(() => {
        const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
        return rows.slice(startIndex, startIndex + ROWS_PER_PAGE);
    }, [rows, currentPage]);

    const totalPages = Math.ceil(rows.length / ROWS_PER_PAGE);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <div className="bg-slate-800/50 rounded-lg shadow-lg border border-slate-700 overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-slate-700 flex-shrink-0 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Data Preview</h2>
                <div className="space-x-2">
                    <button
                        onClick={onRevertData}
                        className="px-3 py-1 text-xs font-semibold text-yellow-300 border border-yellow-600 rounded-md hover:bg-yellow-600 hover:text-white transition-colors"
                    >
                        Revert to Original
                    </button>
                    <button
                        onClick={onExportData}
                        className="px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-600 rounded-md hover:bg-emerald-600 hover:text-white transition-colors"
                    >
                        Export CSV
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto flex-grow">
                <table className="w-full divide-y divide-slate-700">
                    <thead className="bg-slate-800">
                        <tr>
                            {headers.map(header => (
                                <th 
                                    key={header} 
                                    scope="col" 
                                    className={`px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700
                                    ${selectedColumn === header ? 'bg-indigo-900/50' : ''}`}
                                    onClick={() => onColumnSelect(header)}
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-slate-900 divide-y divide-slate-800">
                        {paginatedRows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-slate-800/60">
                                {headers.map(header => (
                                    <td key={`${rowIndex}-${header}`} className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-mono max-w-xs truncate" title={String(row[header])}>
                                        {String(row[header])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (
                <div className="p-4 flex items-center justify-between border-t border-slate-700 flex-shrink-0">
                    <button 
                        onClick={() => handlePageChange(currentPage - 1)} 
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-slate-400">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button 
                        onClick={() => handlePageChange(currentPage + 1)} 
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default DataTable;