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
    
    // 4. Connect Form to Table
    document.getElementById('userInfoFormContainer').addEventListener('user-info-change', (e) => {
        leaveTable.update(e.detail);
        saveAllData();
    });

    // 5. Global Actions
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
                r.col1, r.col2, r.totalDays, r.earnedLeave, 
                r.cumulativeCredit, r.leaveFrom, r.leaveTo, r.leaveTaken, r.balance, r.absent
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
});
