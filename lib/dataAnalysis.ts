
import { TableData } from '../types';

export const getColumnSummary = (data: TableData, columnName: string) => {
    if (!data.headers.includes(columnName)) {
        return { error: `Column '${columnName}' not found.` };
    }

    const values = data.rows.map(row => row[columnName]);
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    const numericValues = nonNullValues.map(Number).filter(n => !isNaN(n));

    const summary: any = {
        columnName: columnName,
        totalRows: values.length,
        missing: values.length - nonNullValues.length,
        unique: new Set(nonNullValues).size,
    };
    
    if (numericValues.length > 0) {
        summary.isNumeric = true;
        numericValues.sort((a, b) => a - b);
        
        const sum = numericValues.reduce((a, b) => a + b, 0);
        summary.mean = sum / numericValues.length;
        summary.sum = sum;
        summary.min = numericValues[0];
        summary.max = numericValues[numericValues.length - 1];

        const mid = Math.floor(numericValues.length / 2);
        summary.median = numericValues.length % 2 === 0 ? (numericValues[mid - 1] + numericValues[mid]) / 2 : numericValues[mid];
        
        const q1Index = Math.floor(numericValues.length / 4);
        summary.q1 = numericValues[q1Index];

        const q3Index = Math.floor((numericValues.length * 3) / 4);
        summary.q3 = numericValues[q3Index];

        const stdDev = Math.sqrt(numericValues.map(x => Math.pow(x - summary.mean, 2)).reduce((a, b) => a + b) / numericValues.length);
        summary.stdDev = stdDev;

    } else {
        summary.isNumeric = false;
        const valueCounts = nonNullValues.reduce((acc: Record<string, number>, val) => {
            const key = String(val);
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        // Fix: Cast the initial value of reduce to ensure correct type inference for valueCounts.
        }, {} as Record<string, number>);
        // Fix: Cast Object.entries result to resolve type inference issue in sort.
        summary.topValues = (Object.entries(valueCounts) as [string, number][]).sort((a, b) => b[1] - a[1]).slice(0, 10);
    }

    return summary;
};
