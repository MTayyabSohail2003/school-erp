/**
 * Official academic sequence for school classes.
 * Add new levels here in their correct order.
 */
export const CLASS_SEQUENCE = [
    'Pre Nursery',
    'Nursery',
    'Prep',
    'Class 1',
    'Grade 1',
    'Step 1',
    'Class 2',
    'Grade 2',
    'Step 2',
    'Class 3',
    'Grade 3',
    'Step 3',
    'Class 4',
    'Grade 4',
    'Step 4',
    'Class 5',
    'Grade 5',
    'Step 5',
    'Class 6',
    'Grade 6',
    'Step 6',
    'Class 7',
    'Grade 7',
    'Step 7',
    'Class 8',
    'Grade 8',
    'Step 8',
    'Class 9',
    'Grade 9',
    'Step 9',
    'Class 10',
    'Grade 10',
    'Step 10'
];

/**
 * Returns a numeric rank for a class name based on the sequence.
 * Handles "Class X", "Grade X", "Step X" and specific levels like "Prep".
 */
export function getClassRank(name: string | undefined | null): number {
    if (!name) return 999;
    
    let normalized = name.toLowerCase().trim();
    
    // Remove common secondary labels for matching (e.g. "Class 1 - A" -> "class 1")
    normalized = normalized.split(/[-–—:]/)[0].trim();

    
    // 1. Check for exact match in sequence (case insensitive)
    const exactIndex = CLASS_SEQUENCE.findIndex(n => n.toLowerCase() === normalized);
    if (exactIndex !== -1) return exactIndex;

    // 2. Check for prefix match (handles "Class 10 - A" correctly by prioritizing longer matches)
    // We sort sequence by length descending to match "Class 10" before "Class 1"
    const matchedIndex = [...CLASS_SEQUENCE]
        .map((val, idx) => ({ val, idx }))
        .sort((a, b) => b.val.length - a.val.length)
        .find(item => normalized.startsWith(item.val.toLowerCase()))
        ?.idx;

    if (matchedIndex !== undefined) return matchedIndex;

    // 3. Fallback: Extract numbers for Generic "Class X"
    const numMatch = normalized.match(/\d+/);
    if (numMatch) {
        return 100 + parseInt(numMatch[0]);
    }
    
    return 999; // Unknown classes go to the end
}

/**
 * Comparator function for sorting arrays of class names or objects with names.
 */
export function sortClassesByName(a: string, b: string): number {
    return getClassRank(a) - getClassRank(b);
}
