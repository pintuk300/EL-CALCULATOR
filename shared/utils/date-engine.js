/**
 * Date Engine for Earn Leave Calculator
 * Follows Bihar Mutation Act 2011 style boundaries
 */

export const EFFECTIVE_BOUNDARIES = [
    new Date(1984, 6, 19),
    new Date(1986, 11, 1),
    new Date(2005, 3, 1)
];

export function parseDDMMYYYYDate(dateValue) {
    if (!dateValue) return null;
    const parts = dateValue.split('-').map(Number);
    if (parts.length !== 3) return null;
    const date = new Date(parts[2], parts[1] - 1, parts[0]);
    if (
        date.getFullYear() !== parts[2] ||
        date.getMonth() !== parts[1] - 1 ||
        date.getDate() !== parts[0]
    ) {
        return null;
    }
    return date;
}

export function formatDateToDDMMYYYY(date) {
    if (!date) return '';
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
}

export function getNextDateDDMMYYYY(dateValue) {
    const date = parseDDMMYYYYDate(dateValue);
    if (!date) return '';
    date.setDate(date.getDate() + 1);
    return formatDateToDDMMYYYY(date);
}

export function getPreviousDateDDMMYYYY(dateValue) {
    const date = parseDDMMYYYYDate(dateValue);
    if (!date) return '';
    date.setDate(date.getDate() - 1);
    return formatDateToDDMMYYYY(date);
}

export function getInclusiveDayCount(startDate, endDate) {
    const oneDayMs = 24 * 60 * 60 * 1000;
    return Math.floor((endDate - startDate) / oneDayMs) + 1;
}

export function getDOJThreeYearDate(dojValue) {
    if (!dojValue || dojValue.length < 10) return null;
    const doj = parseDDMMYYYYDate(dojValue);
    if (!doj) return null;
    const threeYr = new Date(doj);
    threeYr.setFullYear(threeYr.getFullYear() + 3);
    threeYr.setDate(threeYr.getDate() - 1);
    return threeYr;
}

export function splitPeriodByEffectiveDates(startDate, endDate, dojValue, customBoundaries = []) {
    if (!startDate || !endDate || endDate < startDate) return [];
    
    let endPoints = [];
    
    // 1. DOJ 3-year boundary
    const threeYr = getDOJThreeYearDate(dojValue);
    if (threeYr) endPoints.push(threeYr);

    // 2. Historical rules boundaries
    EFFECTIVE_BOUNDARIES.forEach(b => endPoints.push(b));

    // 3. Custom boundaries (e.g. from table)
    customBoundaries.forEach(b => endPoints.push(b));

    // 4. Filter and sort
    endPoints = endPoints
        .filter(b => b >= startDate && b < endDate)
        .filter((date, index, self) => index === self.findIndex((t) => t.getTime() === date.getTime()))
        .sort((a, b) => a - b);

    // Final end point
    endPoints.push(endDate);

    const periods = [];
    let currentStart = new Date(startDate);
    
    for (let endPoint of endPoints) {
        if (currentStart <= endPoint) {
            periods.push({
                start: new Date(currentStart),
                end: new Date(endPoint)
            });
            currentStart = new Date(endPoint);
            currentStart.setDate(currentStart.getDate() + 1);
        }
    }
    
    return periods;
}
