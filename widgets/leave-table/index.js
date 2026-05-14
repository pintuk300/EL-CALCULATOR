import { parseDDMMYYYYDate, formatDateToDDMMYYYY, splitPeriodByEffectiveDates, getPreviousDateDDMMYYYY, getNextDateDDMMYYYY } from '../../shared/utils/date-engine.js';
import { calculateDivisor, calculateEarnedLeave } from '../../shared/utils/calc-engine.js';
import { setupMaskedDateInput } from '../../shared/ui/inputs/masked-date-input.js';

export function renderLeaveTable(containerId, initialRows = [], userInfo = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <table class="detail-table">
            <thead>
                <tr>
                    <th colspan="2">DUTY PERIOD</th>
                    <th rowspan="2">ABSENT<br>(IN DAYS)</th>
                    <th rowspan="2">TOTAL NO. OF<br>DAYS</th>
                    <th rowspan="2">LEAVE<br>EARNED<br>(IN<br>DAYS)</th>
                    <th rowspan="2">EARNED<br>LEAVE AT<br>CREDIT</th>
                    <th colspan="2">UNUTILIZED LEAVE TAKEN PERIOD</th>
                    <th rowspan="2">NO. OF DAYS<br>UNUTILIZED<br>LEAVE TAKEN</th>
                    <th rowspan="2">BALANCE OF<br>UNUTILIZED EARN<br>LEAVE</th>
                </tr>
                <tr>
                    <th>FROM</th>
                    <th>TO</th>
                    <th>FROM</th>
                    <th>TO</th>
                </tr>
                <tr class="header-numbers">
                    ${Array.from({length: 10}, (_, i) => `<th>${i+1}</th>`).join('')}
                </tr>
            </thead>
            <tbody id="leaveTableBody"></tbody>
        </table>
    `;

    const tbody = container.querySelector('#leaveTableBody');

    function updateTable() {
        const startDate = parseDDMMYYYYDate(userInfo.leaveStart);
        const endDate = parseDDMMYYYYDate(userInfo.leaveEnd);

        // Save focus state
        const activeEl = document.activeElement;
        let focusInfo = null;
        if (activeEl && activeEl.tagName === 'INPUT') {
            const row = activeEl.closest('tr');
            if (row && row.parentNode === tbody) {
                focusInfo = {
                    index: Array.from(tbody.children).indexOf(row),
                    className: activeEl.className
                };
            }
        }

        if (!startDate || !endDate || endDate < startDate) {
            tbody.innerHTML = '';
            return;
        }

        // Get custom boundaries from current table state (Column 7 Leave From dates)
        const customBoundaries = Array.from(tbody.querySelectorAll('tr')).map(row => {
            const leaveFrom = row.querySelector('.leave-from-input')?.value;
            const leaveTo = row.querySelector('.leave-to-input')?.value;
            return [parseDDMMYYYYDate(leaveFrom), parseDDMMYYYYDate(leaveTo)];
        }).flat().filter(d => d);

        const periods = splitPeriodByEffectiveDates(startDate, endDate, userInfo.doj, customBoundaries);
        
        // Save current user entries
        const currentData = Array.from(tbody.querySelectorAll('tr')).map(row => ({
            absent: row.querySelector('.absent-cell').textContent,
            leaveFrom: row.querySelector('.leave-from-input').value,
            leaveTo: row.querySelector('.leave-to-input').value
        }));

        tbody.innerHTML = '';
        
        let cumulativeCredit = parseInt(userInfo.openingBalance) || 0;

        periods.forEach((period, index) => {
            const tr = document.createElement('tr');
            tr.className = 'data-row';
            
            // Restore data if available
            const savedRow = currentData[index] || initialRows[index] || {};
            
            const fromStr = formatDateToDDMMYYYY(period.start);
            const toStr = formatDateToDDMMYYYY(period.end);

            tr.innerHTML = `
                <td>${fromStr}</td>
                <td>${toStr}</td>
                <td class="absent-cell" contenteditable="true">${savedRow.absent || ''}</td>
                <td class="total-days-cell"></td>
                <td class="earned-leave-cell"></td>
                <td class="credit-cell"></td>
                <td class="yellow-cell">
                    <div class="date-input-container">
                        <input type="text" class="leave-from-input" value="${savedRow.leaveFrom || ''}">
                        <button class="clear-icon-btn row-clear" data-clear-type="from">×</button>
                    </div>
                </td>
                <td class="yellow-cell">
                    <div class="date-input-container">
                        <input type="text" class="leave-to-input" value="${savedRow.leaveTo || ''}">
                        <button class="clear-icon-btn row-clear" data-clear-type="to">×</button>
                    </div>
                </td>
                <td class="leave-taken-cell"></td>
                <td class="balance-cell"></td>
            `;

            tbody.appendChild(tr);

            // Setup row clear buttons
            tr.querySelectorAll('.row-clear').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const type = e.target.dataset.clearType;
                    const input = tr.querySelector(type === 'from' ? '.leave-from-input' : '.leave-to-input');
                    if (input) {
                        input.value = '';
                        updateTable();
                    }
                });
            });

            // Calculations
            const absentDays = parseInt(savedRow.absent) || 0;
            const totalDays = Math.max(0, Math.floor((period.end - period.start) / (1000 * 60 * 60 * 24)) + 1);
            const dutyDays = Math.max(0, totalDays - absentDays);
            
            const threeYrComp = userInfo.threeYearComp ? parseDDMMYYYYDate(userInfo.threeYearComp.split(' TO ')[1]) : null;
            const divisor = calculateDivisor(period.start, threeYrComp);
            const earned = Math.floor(dutyDays / divisor);
            
            cumulativeCredit += earned;

            tr.querySelector('.total-days-cell').textContent = `${dutyDays}÷${divisor}`;
            tr.querySelector('.earned-leave-cell').textContent = earned;
            tr.querySelector('.credit-cell').textContent = cumulativeCredit;

            const leaveFrom = parseDDMMYYYYDate(savedRow.leaveFrom);
            const leaveTo = parseDDMMYYYYDate(savedRow.leaveTo);
            let leaveTaken = 0;
            if (leaveFrom && leaveTo && leaveTo >= leaveFrom) {
                leaveTaken = Math.max(0, Math.floor((leaveTo - leaveFrom) / (1000 * 60 * 60 * 24)) + 1);
            }
            tr.querySelector('.leave-taken-cell').textContent = leaveTaken;
            tr.querySelector('.balance-cell').textContent = cumulativeCredit - leaveTaken;

            // Setup inputs
            setupMaskedDateInput(tr.querySelector('.leave-from-input'), () => {
                const val = tr.querySelector('.leave-from-input').value;
                if (val.length === 10) {
                    const lFrom = parseDDMMYYYYDate(val);
                    if (lFrom <= period.start) {
                        alert(`त्रुटि: कॉलम 7 की तारीख (${val}) कॉलम 1 की तारीख (${formatDateToDDMMYYYY(period.start)}) के बराबर या उससे पहले नहीं हो सकती।`);
                        tr.querySelector('.leave-from-input').value = '';
                    }
                }
                updateTable();
            });
            setupMaskedDateInput(tr.querySelector('.leave-to-input'), () => updateTable());
            
            tr.querySelector('.absent-cell').addEventListener('input', (e) => {
                e.target.textContent = e.target.textContent.replace(/[^0-9]/g, '');
                updateTable();
            });
        });

        // Restore Focus
        if (focusInfo && tbody.children[focusInfo.index]) {
            const targetRow = tbody.children[focusInfo.index];
            const targetInput = targetRow.querySelector(`.${focusInfo.className.replace(/\s+/g, '.')}`);
            if (targetInput) {
                targetInput.focus();
                // Move cursor to end if it's an input
                if (targetInput.tagName === 'INPUT') {
                    const val = targetInput.value;
                    targetInput.setSelectionRange(val.length, val.length);
                }
            }
        }
    }

    updateTable();

    return {
        update: (newUserInfo) => {
            userInfo = newUserInfo;
            updateTable();
        },
        getData: () => Array.from(tbody.querySelectorAll('tr')).map(row => ({
            col1: row.cells[0].textContent,
            col2: row.cells[1].textContent,
            absent: row.querySelector('.absent-cell').textContent,
            totalDays: row.cells[3].textContent,
            earnedLeave: row.cells[4].textContent,
            cumulativeCredit: row.cells[5].textContent,
            leaveFrom: row.querySelector('.leave-from-input').value,
            leaveTo: row.querySelector('.leave-to-input').value,
            leaveTaken: row.cells[8].textContent,
            balance: row.cells[9].textContent
        }))
    };
}
