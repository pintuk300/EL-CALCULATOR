import { renderUserInfoForm } from './widgets/user-info-form/index.js';
import { renderLeaveTable } from './widgets/leave-table/index.js';
import { loadProjectData, saveProjectData, clearProjectData } from './features/auto-save/index.js';
import { downloadPDF } from './features/export/index.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Load initial data
    const savedData = loadProjectData() || {};
    
    // 2. Initialize User Info Form
    const getUserInfo = renderUserInfoForm('userInfoFormContainer', savedData);
    
    // 3. Initialize Leave Table
    const leaveTable = renderLeaveTable('leaveTableContainer', savedData.rows || [], getUserInfo());
    
    // 4. Update Stats Function
    function updateDashboardStats() {
        const tableData = leaveTable.getData();
        let totalDays = 0;
        let earned = 0;
        let taken = 0;

        tableData.forEach(row => {
            // totalDays format is "duty÷divisor", let's extract duty
            const duty = parseInt(row.col1.split('÷')[0]) || 0; // Wait, column 3 in data is dutyDays
            // Actually let's use the internal data from leaveTable if needed, 
            // but for now let's just sum up the rendered cells
            earned += parseInt(row.earnedLeave) || 0;
            taken += parseInt(row.leaveTaken) || 0;
        });

        document.getElementById('statLeaveEarned').textContent = earned;
        document.getElementById('statLeaveTaken').textContent = taken;
    }

    // 5. Connect Form to Table
    document.getElementById('userInfoFormContainer').addEventListener('user-info-change', (e) => {
        leaveTable.update(e.detail);
        updateDashboardStats();
        saveAllData();
    });

    // 6. Global Actions
    document.getElementById('clearAllBtn').addEventListener('click', () => {
        if (confirm('क्या आप सभी डेटा मिटाना चाहते हैं?')) {
            clearProjectData();
            window.location.reload();
        }
    });

    document.getElementById('printBtn').addEventListener('click', () => window.print());

    document.getElementById('downloadPdfBtn').addEventListener('click', () => {
        const userInfo = getUserInfo();
        const tableRows = leaveTable.getData();
        
        const docData = {
            user: {
                name: userInfo.name,
                designation: userInfo.designation,
                dob: userInfo.dob,
                doj: userInfo.doj,
                leaveFrom: userInfo.leaveStart,
                leaveTo: userInfo.leaveEnd,
                balance: userInfo.openingBalance,
                threeYrComp: userInfo.threeYearComp
            },
            rows: tableRows.map(r => [
                r.col1, r.col2, r.absent, r.totalDays, r.earnedLeave, 
                r.cumulativeCredit, r.leaveFrom, r.leaveTo, r.leaveTaken, r.balance
            ])
        };
        
        downloadPDF(docData);
    });

    document.getElementById('saveHtmlBtn').addEventListener('click', () => {
        alert('Saving as portable HTML feature is under maintenance.');
    });

    function saveAllData() {
        const data = {
            ...getUserInfo(),
            rows: leaveTable.getData()
        };
        saveProjectData(data);
    }

    updateDashboardStats();
});
