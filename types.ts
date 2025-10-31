export interface TableData {
    headers: string[];
    rows: { [key: string]: any }[];
}

export interface ColumnProfile {
    name: string;
    totalRows: number;
    missing: number;
    unique: number;
    topValues: [string, number][];
}

export interface Category {
    id: string;
    name: string;
}

export interface CategorizationResult {
    input: string;
    category_id: string | null;
    category_name: string;
    rationale: string;
}

export interface ToolCall {
    id: string;
    name: string;
    args: any;
}

export interface ToolResponse {
    id: string;
    name: string;
    response: any;
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    toolCalls?: ToolCall[];
    toolResponses?: ToolResponse[];
    executionSteps?: ExecutionStep[];
}

export interface ExecutionStep {
    type: 'thought' | 'tool-call' | 'tool-result' | 'final-answer';
    content: any;
}