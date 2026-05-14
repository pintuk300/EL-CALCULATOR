/**
 * Auto-Save Feature
 * Persists data to localStorage
 */

const STORAGE_KEY = 'leaveCalculatorData';

export function saveProjectData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadProjectData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (e) {
        console.error('Failed to parse saved data', e);
        return null;
    }
}

export function clearProjectData() {
    localStorage.removeItem(STORAGE_KEY);
}

export function setupAutoSave(getDataCallback) {
    document.addEventListener('input', () => {
        const data = getDataCallback();
        saveProjectData(data);
    });
}
