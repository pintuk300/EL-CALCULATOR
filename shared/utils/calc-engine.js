/**
 * Calculation Engine for Earn Leave Calculator
 */

export function calculateDivisor(periodStartDate, threeYearCompletionDate) {
    if (!threeYearCompletionDate || !periodStartDate) return 22;
    // Rule: After 3 years of service, divisor changes from 22 to 11
    return periodStartDate > threeYearCompletionDate ? 11 : 22;
}

export function calculateEarnedLeave(dutyDays, divisor) {
    return Math.floor(dutyDays / divisor);
}

export function calculateMaxEarnedLeave(endDate) {
    if (!endDate) return 300;

    const periods = [
        { until: new Date(1984, 6, 18), max: 120 },
        { until: new Date(1986, 10, 30), max: 180 },
        { until: new Date(2005, 2, 31), max: 240 },
        { until: null, max: 300 }
    ];

    for (let i = 0; i < periods.length; i++) {
        if (periods[i].until === null || endDate <= periods[i].until) {
            return periods[i].max;
        }
    }

    return 300;
}

export function sanitizeDigits(value) {
    // Convert ०-९ to 0-9 if any
    const hindiDigits = '०१२३४५६७८९';
    const englishDigits = '0123456789';
    return value.replace(/[०-९]/g, (m) => englishDigits[hindiDigits.indexOf(m)]);
}
