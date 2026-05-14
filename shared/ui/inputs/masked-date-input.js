/**
 * Masked Date Input Atom
 * Handles strict DD-MM-YYYY masking and validation
 */

export function applyStrictDateMask(input) {
    let cursor = input.selectionStart;
    let raw = input.value;
    
    // 1. Split into segments based on dashes
    let parts = raw.split('-');
    
    // Auto-splitting logic
    if (parts.length === 1 && parts[0].length > 2) {
        parts[1] = parts[0].substring(2);
        parts[0] = parts[0].substring(0, 2);
    }
    if (parts.length === 2 && parts[1].length > 2) {
        parts[2] = parts[1].substring(2);
        parts[1] = parts[1].substring(0, 2);
    }

    let ddPart = (parts[0] || '').replace(/[^0-9]/g, '').substring(0, 2);
    let mmPart = (parts[1] || '').replace(/[^0-9]/g, '').substring(0, 2);
    let yyyyPart = (parts[2] || '').replace(/[^0-9]/g, '').substring(0, 4);

    // 2. Apply Strict Validation
    if (ddPart.length > 0) {
        if (ddPart[0] > '3') ddPart = '3' + (ddPart[1] || '');
        if (ddPart.length === 2) {
            if (ddPart[0] === '3' && ddPart[1] > '1') ddPart = '31';
            if (ddPart === '00') ddPart = '01';
        }
    }
    if (mmPart.length > 0) {
        if (mmPart[0] > '1') mmPart = '1' + (mmPart[1] || '');
        if (mmPart.length === 2) {
            if (mmPart[0] === '1' && mmPart[1] > '2') mmPart = '12';
            if (mmPart === '00') mmPart = '01';
        }
    }

    // Cross-check Days vs Month
    if (ddPart.length === 2 && mmPart.length === 2) {
        let d = parseInt(ddPart);
        let m = parseInt(mmPart);
        let max = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (d > max[m]) ddPart = String(max[m]).padStart(2, '0');
    }

    // 3. Reconstruct
    let result = ddPart;
    if (raw.includes('-') || ddPart.length === 2) {
        result += '-' + mmPart;
        if (raw.lastIndexOf('-') > 2 || mmPart.length === 2) {
            result += '-' + yyyyPart;
        }
    }

    // 4. Update and fix cursor
    input.value = result;
    
    let newCursor = cursor;
    if (result[newCursor] === '-' && (raw[newCursor] !== '-' || !raw[newCursor])) {
        newCursor++;
    }
    input.setSelectionRange(newCursor, newCursor);
}

export function setupMaskedDateInput(inputElement, onComplete) {
    inputElement.classList.add('strict-date');
    inputElement.placeholder = 'DD-MM-YYYY';
    inputElement.maxLength = 10;

    inputElement.addEventListener('input', (e) => {
        applyStrictDateMask(inputElement);
        if (inputElement.value.length === 10) {
            // Year complete logic (last 4 digits)
            const parts = inputElement.value.split('-');
            if (parts.length === 3 && parts[2].length === 4) {
                // Potential jump
                setTimeout(() => {
                    const currentInput = document.activeElement && document.activeElement.tagName === 'INPUT' ? document.activeElement : inputElement;
                    const allInputs = Array.from(document.querySelectorAll('input, [contenteditable="true"]'))
                        .filter(el => !el.disabled && el.offsetParent !== null && !el.classList.contains('clear-icon-btn'));
                    const index = allInputs.indexOf(currentInput);
                    if (index > -1 && allInputs[index + 1]) {
                        allInputs[index + 1].focus();
                        if (allInputs[index + 1].select) allInputs[index + 1].select();
                    }
                }, 10); // Very short delay
            }
            if (onComplete) onComplete(inputElement.value);
        }
    });

    // Auto-focus logic state
    inputElement.addEventListener('keydown', function(e) {
        if (e.key >= '0' && e.key <= '9') {
            const parts = (this.value || '').split('-');
            const yr = (parts.length === 3) ? parts[2] : '';
            this._kd_yearWasIncomplete = (yr.length < 4);
        }
    });
}
