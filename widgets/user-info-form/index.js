import { setupMaskedDateInput } from '../../shared/ui/inputs/masked-date-input.js';
import { setupDigitSanitizer } from '../../shared/ui/inputs/digit-sanitizer.js';
import { getDOJThreeYearDate, formatDateToDDMMYYYY } from '../../shared/utils/date-engine.js';

export function renderUserInfoForm(containerId, initialData = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <table class="user-info-table">
            <tbody>
                <tr>
                    <td class="label-cell">NAME</td>
                    <td class="value-cell"><div class="date-input-container"><input type="text" id="userName" value="${initialData.name || ''}"><button class="clear-icon-btn" data-clear="userName">×</button></div></td>
                    <td class="label-cell">D.O.B</td>
                    <td class="value-cell"><div class="date-input-container"><input type="text" id="dob" value="${initialData.dob || ''}"><button class="clear-icon-btn" data-clear="dob">×</button></div></td>
                    <td class="label-cell">D.O.J</td>
                    <td class="value-cell"><div class="date-input-container"><input type="text" id="doj" value="${initialData.doj || ''}"><button class="clear-icon-btn" data-clear="doj">×</button></div></td>
                    <td class="label-cell">3 YRS COMP</td>
                    <td class="value-cell"><span id="threeYearRange" class="three-year-range"></span></td>
                </tr>
                <tr>
                    <td class="label-cell">DESIGNATION</td>
                    <td class="value-cell"><div class="date-input-container"><input type="text" id="userDesignation" value="${initialData.designation || ''}"><button class="clear-icon-btn" data-clear="userDesignation">×</button></div></td>
                    <td class="label-cell">LEAVE FROM</td>
                    <td class="value-cell"><div class="date-input-container"><input type="text" id="leaveStart" value="${initialData.leaveStart || ''}"><button class="clear-icon-btn" data-clear="leaveStart">×</button></div></td>
                    <td class="label-cell">TO</td>
                    <td class="value-cell"><div class="date-input-container"><input type="text" id="leaveEnd" value="${initialData.leaveEnd || ''}"><button class="clear-icon-btn" data-clear="leaveEnd">×</button></div></td>
                    <td class="label-cell">BALANCE EL</td>
                    <td class="value-cell"><div class="date-input-container"><input type="number" id="openingBalance" value="${initialData.openingBalance || ''}"><button class="clear-icon-btn" data-clear="openingBalance">×</button></div></td>
                </tr>
            </tbody>
        </table>
    `;

    // Setup Date Inputs
    ['dob', 'doj', 'leaveStart', 'leaveEnd'].forEach(id => {
        setupMaskedDateInput(document.getElementById(id), () => {
            if (id === 'doj') updateThreeYearComp();
            // Trigger global change
            container.dispatchEvent(new CustomEvent('user-info-change', { detail: getUserInfoData() }));
        });
    });

    // Setup Sanitizers
    ['openingBalance'].forEach(id => {
        setupDigitSanitizer(document.getElementById(id));
    });

    // Clear buttons logic
    container.querySelectorAll('.clear-icon-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.target.dataset.clear;
            const input = document.getElementById(targetId);
            if (input) {
                input.value = '';
                if (targetId === 'doj') updateThreeYearComp();
                container.dispatchEvent(new CustomEvent('user-info-change', { detail: getUserInfoData() }));
            }
        });
    });

    function updateThreeYearComp() {
        const dojValue = document.getElementById('doj').value;
        const rangeEl = document.getElementById('threeYearRange');
        const threeYr = getDOJThreeYearDate(dojValue);
        if (threeYr) {
            const dojDate = new Date(dojValue.split('-').reverse().join('-'));
            rangeEl.textContent = `${dojValue} TO ${formatDateToDDMMYYYY(threeYr)}`;
        } else {
            rangeEl.textContent = '';
        }
    }

    function getUserInfoData() {
        return {
            name: document.getElementById('userName').value,
            designation: document.getElementById('userDesignation').value,
            dob: document.getElementById('dob').value,
            doj: document.getElementById('doj').value,
            leaveStart: document.getElementById('leaveStart').value,
            leaveEnd: document.getElementById('leaveEnd').value,
            openingBalance: document.getElementById('openingBalance').value,
            threeYearComp: document.getElementById('threeYearRange').textContent
        };
    }

    updateThreeYearComp();
    return getUserInfoData;
}
