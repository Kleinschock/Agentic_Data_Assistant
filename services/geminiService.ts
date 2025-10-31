
import { GoogleGenAI, Type, FunctionDeclaration, GenerateContentResponse, Content, Part } from "@google/genai";
import { SYSTEM_PROMPT } from '../constants';
import { ChatMessage, ToolCall, CategorizationResult } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const tools: FunctionDeclaration[] = [
    {
        name: 'get_column_summary',
        description: 'Provides a statistical summary of a single column in the dataset.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                columnName: {
                    type: Type.STRING,
                    description: 'The name of the column to summarize.'
                }
            },
            required: ['columnName']
        }
    },
    {
        name: 'add_new_column',
        description: 'Adds a new column to the dataset based on a transformation of a source column.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                newColumnName: {
                    type: Type.STRING,
                    description: 'The name for the new column.'
                },
                sourceColumnName: {
                    type: Type.STRING,
                    description: 'The name of the column to use as input for the transformation.'
                },
                logicDescription: {
                    type: Type.STRING,
                    description: 'A clear, natural language description of the logic to be applied.'
                }
            },
            required: ['newColumnName', 'sourceColumnName', 'logicDescription']
        }
    }
];

const formatHistoryForGemini = (history: ChatMessage[]): Content[] => {
    return history.map(msg => {
        const parts: Part[] = [];
        if (msg.content) {
            parts.push({ text: msg.content });
        }
        if (msg.toolCalls) {
            msg.toolCalls.forEach(tc => {
                parts.push({
                    functionCall: { name: tc.name, args: tc.args }
                });
            });
        }
        if (msg.toolResponses) {
            msg.toolResponses.forEach(tr => {
                parts.push({
                    functionResponse: { name: tr.name, response: tr.response }
                });
            });
        }

        return {
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: parts,
        };
    }).filter(c => c.parts.length > 0 && c.parts.some(p => p.text || p.functionCall || p.functionResponse)); 
};


export const runAgent = async (
    history: ChatMessage[],
    columnHeaders: string[]
): Promise<{ text: string; toolCalls?: ToolCall[] }> => {
    const model = 'gemini-2.5-flash';
    const fullPrompt = `${SYSTEM_PROMPT}\n\nThe available columns in the dataset are: ${columnHeaders.join(', ')}.`;

    const contents = formatHistoryForGemini(history);

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: model,
            contents: contents,
            config: {
                systemInstruction: fullPrompt,
                tools: [{ functionDeclarations: tools }]
            }
        });

        const text = response.text || '';
        const toolCalls: ToolCall[] | undefined = response.functionCalls?.map(fc => ({
             id: `tool-call-${Date.now()}-${Math.random()}`,
             name: fc.name,
             args: fc.args
         }));

        return { text, toolCalls };

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("The AI model failed to process the request.");
    }
};


export const generateColumnValues = async (
    logicDescription: string,
    sourceColumnName: string,
    sourceData: (string | number)[]
): Promise<any[]> => {
    const model = 'gemini-2.5-flash';
    
    const prompt = `You are a data transformation engine. Your task is to apply a given logic to a set of data and return the transformed values.

The logic is: "${logicDescription}"

The data is from the "${sourceColumnName}" column. The data can be numbers, strings, or other types; apply the logic accordingly. Here are the values:
${JSON.stringify(sourceData)}

Based on the logic, generate a JSON array containing the new value for each corresponding data point. The output array must have the exact same number of elements as the input array. Only return the JSON array of values. Do not include any other text, explanation, or markdown formatting. The output should be a raw JSON array.

Example Input:
Logic: "Categorize prices into 'Low' for prices below 50, 'Medium' for prices between 50 and 150, and 'High' for prices above 150."
Data: [25, 100, 200, 49, "120"]

Example Output:
["Low", "Medium", "High", "Low", "Medium"]
`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });

        const text = response.text;
        if (!text) {
            console.error("AI response missing text content in generateColumnValues:", JSON.stringify(response, null, 2));
            throw new Error("The AI model returned an empty response.");
        }

        const cleanedText = text.trim().replace(/^```json\s*|```$/g, '');
        let newValues;
        try {
            newValues = JSON.parse(cleanedText);
        } catch (e) {
            console.error("Failed to parse AI JSON response in generateColumnValues:", cleanedText);
            throw new Error("The AI model returned malformed JSON.");
        }

        if (!Array.isArray(newValues) || newValues.length !== sourceData.length) {
            console.error('AI returned invalid data:', newValues);
            throw new Error(`AI returned an array of the wrong length. Expected ${sourceData.length}, got ${newValues.length}.`);
        }

        return newValues;

    } catch (error) {
        console.error("Error generating column values with Gemini API:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(`The AI model failed to generate column data. Reason: ${message}`);
    }
};

export const categorizeData = async (
    promptTemplate: string,
    sampleData: string[],
    taxonomy: string,
): Promise<CategorizationResult[]> => {
    const model = 'gemini-2.5-flash';
    const filledPrompt = promptTemplate
        .replace('{{GOOGLE_PRODUCT_TAXONOMY}}', taxonomy)
        .replace('{{SAMPLE_DATA}}', JSON.stringify(sampleData));

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: filledPrompt,
            config: {
                responseMimeType: "application/json",
            }
        });

        const text = response.text;
        if (!text) {
            console.error("AI response missing text content in categorizeData:", JSON.stringify(response, null, 2));
            throw new Error("The AI model returned an empty response.");
        }

        const cleanedText = text.trim().replace(/^```json\s*|```$/g, '');
        let results;
        try {
            results = JSON.parse(cleanedText);
        } catch (e) {
            console.error("Failed to parse AI JSON response in categorizeData:", cleanedText);
            throw new Error("The AI model returned malformed JSON.");
        }

        if (!Array.isArray(results) || (results.length > 0 && results.length !== sampleData.length)) {
             console.error(`AI returned ${results.length} results for ${sampleData.length} inputs.`);
            // Allow empty array result if sampleData was also empty.
            if (sampleData.length > 0) {
                 throw new Error(`AI returned ${results.length} results for ${sampleData.length} inputs.`);
            }
        }
        
        return results as CategorizationResult[];

    } catch(error) {
        console.error("Error categorizing data with Gemini API:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(`The AI model failed to categorize the data. Reason: ${message}`);
    }
};