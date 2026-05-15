import { parseDDMMYYYYDate } from './date-engine.js';

/**
 * STRICT ATOMIC RULE ENGINE
 * Logic for determining table row splits.
 */
export function calculateCustomBoundaries(rows) {
    const boundaries = [];
    
    rows.forEach(row => {
        const lfVal = row.querySelector('.leave-from-input')?.value;
        const ltVal = row.querySelector('.leave-to-input')?.value;
        
        const lf = parseDDMMYYYYDate(lfVal);
        const lt = parseDDMMYYYYDate(ltVal);
        
        // RULE 1: Current Row Ends at Leave From - 1
        if (lf) {
            const prevDay = new Date(lf);
            prevDay.setDate(prevDay.getDate() - 1);
            boundaries.push(prevDay);
        }
        
        // RULE 2: Current Row Ends at Leave To (So Next starts at Leave To + 1)
        if (lt) {
            boundaries.push(new Date(lt));
        }
    });
    
    // Sort and filter unique dates
    return [...new Set(boundaries.map(d => d.getTime()))]
        .sort((a, b) => a - b)
        .map(t => new Date(t));
}
