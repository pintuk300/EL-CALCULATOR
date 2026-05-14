import { sanitizeDigits } from '../../utils/calc-engine.js';

export function setupDigitSanitizer(inputElement) {
    inputElement.addEventListener('input', (e) => {
        const originalValue = e.target.value;
        const sanitizedValue = sanitizeDigits(originalValue);
        if (originalValue !== sanitizedValue) {
            const cursorPosition = e.target.selectionStart;
            e.target.value = sanitizedValue;
            e.target.setSelectionRange(cursorPosition, cursorPosition);
        }
    });
}
