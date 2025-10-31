
import React, { useState, useCallback, useMemo } from 'react';
import Papa from 'papaparse';
import { ColumnProfile, TableData, ChatMessage, ExecutionStep, ToolCall, ToolResponse, CategorizationResult } from './types';
import FileUpload from './components/FileUpload';
import ProfilingReport from './components/ProfilingReport';
import DataTable from './components/DataTable';
import Header from './components/Header';
import AIAssistantPanel from './components/AIAssistantPanel';
import ColumnActionsPanel from './components/ColumnActionsPanel';
import CategorizationModal, { CategorizationConfig } from './components/CategorizationModal';
import { GOOGLE_PRODUCT_TAXONOMY } from './constants';
import { runAgent, generateColumnValues, categorizeData } from './services/geminiService';
import { getColumnSummary } from './lib/dataAnalysis';

const App: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [tableData, setTableData] = useState<TableData>({ headers: [], rows: [] });
    const [originalTableData, setOriginalTableData] = useState<TableData | null>(null);
    const [profilingReport, setProfilingReport] = useState<ColumnProfile[]>([]);
    const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const [isCategorizeModalOpen, setIsCategorizeModalOpen] = useState(false);
    const [isCategorizing, setIsCategorizing] = useState(false);

    const resetState = () => {
        setFile(null);
        setTableData({ headers: [], rows: [] });
        setOriginalTableData(null);
        setProfilingReport([]);
        setSelectedColumn(null);
        setError(null);
        setIsLoading(false);
        setMessages([]);
        setIsThinking(false);
        setIsCategorizeModalOpen(false);
        setIsCategorizing(false);
    };
    
    const addMessage = (message: ChatMessage) => {
        setMessages(prev => [...prev, message]);
    };

    const profileData = (data: TableData) => {
        const report: ColumnProfile[] = data.headers.map((header) => {
            const values = data.rows.map(row => row[header]);
            const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
            const uniqueValues = [...new Set(nonNullValues)];
            const valueCounts = nonNullValues.reduce((acc: Record<string, number>, val) => {
                const key = String(val);
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            const topValues = (Object.entries(valueCounts) as [string, number][])
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

            return {
                name: header,
                totalRows: values.length,
                missing: values.length - nonNullValues.length,
                unique: uniqueValues.length,
                topValues,
            };
        });
        setProfilingReport(report);
    };

    const handleFileChange = (selectedFile: File) => {
        resetState();
        setIsLoading(true);
        setFile(selectedFile);

        Papa.parse(selectedFile, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            complete: (results) => {
                const headers = results.meta.fields || [];
                const rows = results.data as { [key: string]: any }[];
                const data = { headers, rows };
                setTableData(data);
                setOriginalTableData(data);
                addMessage({ role: 'assistant', content: "File loaded successfully. What would you like to do with the data?" });
                profileData(data);
                setIsLoading(false);
            },
            error: (err: any) => {
                setError(`Error parsing file: ${err.message}`);
                setIsLoading(false);
            }
        });
    };
    
    const selectedColumnData = useMemo(() => {
        if (!selectedColumn) return [];
        return tableData.rows.map(row => row[selectedColumn]);
    }, [selectedColumn, tableData.rows]);


    const handleRevertData = () => {
        if (originalTableData) {
            setTableData(originalTableData);
            profileData(originalTableData);
            setSelectedColumn(null);
            setMessages([{ role: 'assistant', content: "Data has been reverted to its original state. What would you like to do next?" }]);
        }
    };

    const handleExportData = () => {
        if (!file) return;
        const csv = Papa.unparse(tableData.rows);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        const fileName = `${file.name.split('.').slice(0, -1).join('.')}_modified.csv`;
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleClearChat = () => {
        if (file) {
            setMessages([{ role: 'assistant', content: "Chat cleared. How can I help you with the data?" }]);
        } else {
            setMessages([]);
        }
    };

    const handleStartCategorization = async (config: CategorizationConfig) => {
        if (!selectedColumn) {
            setError("Cannot categorize: no column selected.");
            return;
        }
        setIsCategorizing(true);
        setError(null);
        
        const columnDataToCategorize = tableData.rows.map(row => row[selectedColumn]);
        const batches = [];
        for (let i = 0; i < columnDataToCategorize.length; i += config.batchSize) {
            batches.push(columnDataToCategorize.slice(i, i + config.batchSize));
        }

        try {
            const allResults: CategorizationResult[] = [];
            for (const batch of batches) {
                const results = await categorizeData(config.prompt, batch, GOOGLE_PRODUCT_TAXONOMY);
                allResults.push(...results);
            }
            
            // Assuming results are in order
            const newRows = tableData.rows.map((row, index) => {
                 const result = allResults[index] || { category_id: null, category_name: 'N/A', rationale: 'No result' };
                 return {
                    ...row,
                    [`${selectedColumn}_category_id`]: result.category_id,
                    [`${selectedColumn}_category_name`]: result.category_name,
                    [`${selectedColumn}_rationale`]: result.rationale,
                 };
            });

            const newHeaders = [
                ...tableData.headers,
                `${selectedColumn}_category_id`,
                `${selectedColumn}_category_name`,
                `${selectedColumn}_rationale`,
            ];

            const newData = { headers: newHeaders, rows: newRows };
            setTableData(newData);
            profileData(newData);
            
        } catch (e: any) {
             setError(`Categorization failed: ${e.message}`);
        } finally {
            setIsCategorizing(false);
            setIsCategorizeModalOpen(false);
        }
    };


    const executeTool = async (toolCall: ToolCall): Promise<ToolResponse> => {
        switch (toolCall.name) {
            case 'get_column_summary':
                const summary = getColumnSummary(tableData, toolCall.args.columnName);
                return { id: toolCall.id, name: toolCall.name, response: summary };
            case 'add_new_column': {
                 const { newColumnName, sourceColumnName, logicDescription } = toolCall.args;
                 if (!tableData.headers.includes(sourceColumnName)) {
                     return { id: toolCall.id, name: toolCall.name, response: { success: false, message: `Source column '${sourceColumnName}' not found.` } };
                 }
                 try {
                     const sourceData = tableData.rows.map(row => row[sourceColumnName]);
                     const newValues = await generateColumnValues(logicDescription, sourceColumnName, sourceData);

                     const newData = tableData.rows.map((row, index) => ({
                         ...row,
                         [newColumnName]: index < newValues.length ? newValues[index] : null
                     }));

                     const newHeaders = [...tableData.headers, newColumnName];
                     setTableData({ headers: newHeaders, rows: newData });
                     profileData({ headers: newHeaders, rows: newData });
                     return { id: toolCall.id, name: toolCall.name, response: { success: true, message: `Column '${newColumnName}' added based on your logic.` } };
                 } catch (e: any) {
                     console.error('Failed to execute add_new_column:', e);
                     return { id: toolCall.id, name: toolCall.name, response: { success: false, message: `Failed to generate column data: ${e.message}` } };
                 }
            }
            default:
                return { id: toolCall.id, name: toolCall.name, response: { success: false, message: `Unknown tool: ${toolCall.name}` } };
        }
    };

    const handleSendMessage = async (prompt: string) => {
        setIsThinking(true);
        const userMessage: ChatMessage = { role: 'user', content: prompt };
        addMessage(userMessage);

        const currentHistory = [...messages, userMessage];
        const executionSteps: ExecutionStep[] = [];
        
        try {
            let agentResponse = await runAgent(currentHistory, tableData.headers);
            
            while(agentResponse.toolCalls && agentResponse.toolCalls.length > 0) {
                 const toolResponses: ToolResponse[] = [];
                 
                 executionSteps.push({type: 'thought', content: agentResponse.text || 'Planning to use tools.'});

                 for(const toolCall of agentResponse.toolCalls) {
                    executionSteps.push({ type: 'tool-call', content: toolCall });
                    const toolResponse = await executeTool(toolCall);
                    toolResponses.push(toolResponse);
                    executionSteps.push({ type: 'tool-result', content: toolResponse });
                 }

                 currentHistory.push({ role: 'assistant', content: '', toolCalls: agentResponse.toolCalls });
                 currentHistory.push({ role: 'user', content: '', toolResponses });
                 
                 agentResponse = await runAgent(currentHistory, tableData.headers);
            }

            executionSteps.push({ type: 'final-answer', content: agentResponse.text });
            addMessage({ role: 'assistant', content: agentResponse.text, executionSteps });

        } catch (e: any) {
            setError(`AI Assistant failed: ${e.message}`);
            addMessage({ role: 'assistant', content: "Sorry, I encountered an error." });
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
            <Header onNewFile={resetState} />
            <main className="p-4 sm:p-6 lg:p-8">
                {isLoading && (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
                        <p className="ml-4 text-lg">Analyzing data...</p>
                    </div>
                )}
                {error && <div className="bg-red-900/50 border border-red-500 text-red-300 p-4 rounded-lg mb-6">{error}</div>}

                {!file && !isLoading && <FileUpload onFileChange={handleFileChange} />}
                
                {file && !isLoading && (
                    <>
                        <ProfilingReport report={profilingReport} fileName={file.name} />
                        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <div className="lg:col-span-8">
                                <DataTable 
                                    data={tableData} 
                                    selectedColumn={selectedColumn}
                                    onColumnSelect={setSelectedColumn}
                                    onRevertData={handleRevertData}
                                    onExportData={handleExportData}
                                />
                            </div>
                            <div className="lg:col-span-4">
                                <div className="sticky top-8 flex flex-col gap-8" style={{ height: 'calc(100vh - 8rem)' }}>
                                    <ColumnActionsPanel
                                        selectedColumn={selectedColumn}
                                        onOpenCategorizeModal={() => setIsCategorizeModalOpen(true)}
                                        columnData={selectedColumnData}
                                        onClearSelection={() => setSelectedColumn(null)}
                                    />
                                    <AIAssistantPanel
                                        messages={messages}
                                        onSendMessage={handleSendMessage}
                                        isThinking={isThinking}
                                        onClearChat={handleClearChat}
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
            {file && selectedColumn && (
                <CategorizationModal
                    isOpen={isCategorizeModalOpen}
                    onClose={() => setIsCategorizeModalOpen(false)}
                    onSubmit={handleStartCategorization}
                    isProcessing={isCategorizing}
                    columnName={selectedColumn}
                    rowCount={tableData.rows.length}
                    originalFileName={file.name}
                 />
            )}
        </div>
    );
};

export default App;
