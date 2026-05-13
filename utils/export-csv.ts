/**
 * Pure utility: converts an array of objects to a CSV string and triggers browser download.
 * @param filename - The output .csv file name (without extension)
 * @param rows - Array of objects with uniform keys
 */
export function downloadCsv(filename: string, rows: Record<string, unknown>[]): void {
    if (!rows.length) return;

    const headers = Object.keys(rows[0]);
    const escape = (val: unknown): string => {
        const str = val == null ? '' : String(val);
        // Wrap in quotes if contains comma, newline, or quote
        if (str.includes(',') || str.includes('\n') || str.includes('"')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const csvContent = [
        headers.join(','),
        ...rows.map(row => headers.map(h => escape(row[h])).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
