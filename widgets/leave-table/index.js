import { parseDDMMYYYYDate, formatDateToDDMMYYYY, splitPeriodByEffectiveDates } from '../../shared/utils/date-engine.js';
import { calculateDivisor } from '../../shared/utils/calc-engine.js';
import { setupMaskedDateInput } from '../../shared/ui/inputs/masked-date-input.js';
import { calculateCustomBoundaries } from '../../shared/utils/boundary-engine.js';

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

        if (!startDate || !endDate || endDate < startDate) {
            tbody.innerHTML = '';
            return;
        }

        // Save current focus and state before re-render
        const activeEl = document.activeElement;
        let focusInfo = null;
        if (activeEl && activeEl.tagName === 'INPUT') {
            const row = activeEl.closest('tr');
            focusInfo = {
                index: Array.from(tbody.children).indexOf(row),
                className: activeEl.className
            };
        }

        // ATOMIC DATA CORRELATION (Stable Key: Start Date)
        const currentRows = Array.from(tbody.querySelectorAll('tr'));
        const currentDataMap = new Map();
        currentRows.forEach(row => {
            const startKey = row.cells[0]?.textContent;
            if (startKey) {
                currentDataMap.set(startKey, {
                    absent: row.querySelector('.absent-cell').textContent,
                    leaveFrom: row.querySelector('.leave-from-input').value,
                    leaveTo: row.querySelector('.leave-to-input').value
                });
            }
        });

        const customBoundaries = calculateCustomBoundaries(currentRows);
        const periods = splitPeriodByEffectiveDates(startDate, endDate, userInfo.doj, customBoundaries);
        
        // Identify Exclusion Ranges (Leave Periods)
        const exclusionRanges = Array.from(currentDataMap.values())
            .map(d => ({ from: parseDDMMYYYYDate(d.leaveFrom), to: parseDDMMYYYYDate(d.leaveTo) }))
            .filter(r => r.from && r.to && r.to >= r.from);

        // Filter out periods that are entirely within an exclusion range
        const visiblePeriods = periods.filter(p => {
            const isExcluded = exclusionRanges.some(range => 
                p.start >= range.from && p.end <= range.to
            );
            return !isExcluded;
        });

        const existingRows = Array.from(tbody.children);
        if (existingRows.length !== visiblePeriods.length) {
            tbody.innerHTML = '';
        }
        
        let cumulativeCredit = parseInt(userInfo.openingBalance) || 0;

        visiblePeriods.forEach((period, index) => {
            let tr = existingRows.length === visiblePeriods.length ? existingRows[index] : null;
            const isNewRow = !tr;

            if (isNewRow) {
                tr = document.createElement('tr');
                tr.className = 'data-row';
                tbody.appendChild(tr);
            }
            
            const fromStr = formatDateToDDMMYYYY(period.start);
            const toStr = formatDateToDDMMYYYY(period.end);
            const savedRow = currentDataMap.get(fromStr) || initialRows.find(r => r.col1 === fromStr) || {};

            if (isNewRow) {
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

                tr.querySelectorAll('.row-clear').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const type = e.target.dataset.clearType;
                        const input = tr.querySelector(type === 'from' ? '.leave-from-input' : '.leave-to-input');
                        if (input) { input.value = ''; updateTable(); }
                    });
                });

                setupMaskedDateInput(tr.querySelector('.leave-from-input'), () => {
                    const val = tr.querySelector('.leave-from-input').value;
                    if (val.length === 10) {
                        const lFrom = parseDDMMYYYYDate(val);
                        const col1DateStr = tr.cells[0].textContent; // Live check
                        const col1Date = parseDDMMYYYYDate(col1DateStr);
                        
                        if (lFrom && col1Date && lFrom <= col1Date) {
                            alert(`त्रुटि: कॉलम 7 की तारीख (${val}) कॉलम 1 की तारीख (${col1DateStr}) के बाद होनी चाहिए।`);
                            tr.querySelector('.leave-from-input').value = '';
                        } else {
                            window._pendingTableJump = { rowIndex: index, colClass: '.leave-to-input' };
                        }
                    }
                    updateTable();
                });
                
                setupMaskedDateInput(tr.querySelector('.leave-to-input'), () => {
                    const val = tr.querySelector('.leave-to-input').value;
                    if (val.length === 10) {
                        window._pendingTableJump = { rowIndex: index + 1, colClass: '.leave-from-input' };
                    }
                    updateTable();
                });
                
                tr.querySelector('.absent-cell').addEventListener('input', (e) => {
                    e.target.textContent = e.target.textContent.replace(/[^0-9]/g, '');
                    updateTable();
                });
            } else {
                tr.cells[0].textContent = fromStr;
                tr.cells[1].textContent = toStr;
            }

            const absentDays = parseInt(tr.querySelector('.absent-cell').textContent) || 0;
            const totalDays = Math.max(0, Math.floor((period.end - period.start) / (1000 * 60 * 60 * 24)) + 1);
            const dutyDays = Math.max(0, totalDays - absentDays);
            
            const threeYrComp = userInfo.threeYearComp ? parseDDMMYYYYDate(userInfo.threeYearComp.split(' TO ')[1]) : null;
            const divisor = calculateDivisor(period.start, threeYrComp);
            const earned = Math.floor(dutyDays / divisor);
            
            cumulativeCredit += earned;

            tr.querySelector('.total-days-cell').textContent = `${dutyDays}÷${divisor}`;
            tr.querySelector('.earned-leave-cell').textContent = earned;
            tr.querySelector('.credit-cell').textContent = cumulativeCredit;

            const leaveFrom = parseDDMMYYYYDate(tr.querySelector('.leave-from-input').value);
            const leaveTo = parseDDMMYYYYDate(tr.querySelector('.leave-to-input').value);
            let leaveTaken = 0;
            if (leaveFrom && leaveTo && leaveTo >= leaveFrom) {
                leaveTaken = Math.max(0, Math.floor((leaveTo - leaveFrom) / (1000 * 60 * 60 * 24)) + 1);
            }
            tr.querySelector('.leave-taken-cell').textContent = leaveTaken;
            
            const balance = cumulativeCredit - leaveTaken;
            tr.querySelector('.balance-cell').textContent = balance;

            // PROPAGATE BALANCE TO NEXT ROW (Strict Rule)
            cumulativeCredit = balance;
        });

        // HANDLE JUMPS
        if (window._pendingTableJump) {
            const jump = window._pendingTableJump;
            delete window._pendingTableJump;
            setTimeout(() => {
                const targetRow = tbody.children[jump.rowIndex];
                const targetInput = targetRow?.querySelector(jump.colClass);
                if (targetInput) {
                    targetInput.focus();
                    if (targetInput.setSelectionRange) targetInput.setSelectionRange(0, 10);
                }
            }, 0);
        } else if (focusInfo && existingRows.length === visiblePeriods.length) {
            const targetRow = tbody.children[focusInfo.index];
            const targetInput = targetRow?.querySelector(`.${focusInfo.className.replace(/\s+/g, '.')}`);
            if (targetInput && document.activeElement !== targetInput) targetInput.focus();
        }
    }

    updateTable();

    return {
        update: (newUserInfo) => { userInfo = newUserInfo; updateTable(); },
        getData: () => Array.from(tbody.querySelectorAll('tr')).map(row => ({
            col1: row.cells[0].textContent, col2: row.cells[1].textContent,
            absent: row.querySelector('.absent-cell').textContent,
            totalDays: row.cells[3].textContent, earnedLeave: row.cells[4].textContent,
            cumulativeCredit: row.cells[5].textContent,
            leaveFrom: row.querySelector('.leave-from-input').value,
            leaveTo: row.querySelector('.leave-to-input').value,
            leaveTaken: row.cells[8].textContent, balance: row.cells[9].textContent
        }))
    };
}
