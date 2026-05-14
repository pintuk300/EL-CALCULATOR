/**
 * Leave Entities Model
 */

export class UserProfile {
    constructor(data = {}) {
        this.name = data.name || '';
        this.designation = data.designation || '';
        this.dob = data.dob || '';
        this.doj = data.doj || '';
        this.leaveStart = data.leaveStart || '';
        this.leaveEnd = data.leaveEnd || '';
        this.openingBalance = data.openingBalance || '';
    }
}

export class LeaveRow {
    constructor(data = {}) {
        this.dutyFrom = data.col1 || '';
        this.dutyTo = data.col2 || '';
        this.absentDays = data.absent || '';
        this.leaveFrom = data.leaveFrom || '';
        this.leaveTo = data.leaveTo || '';
        
        // Calculated fields (optional to store, usually derived)
        this.totalDays = data.totalDays || 0;
        this.earnedLeave = data.earned || 0;
        this.cumulativeCredit = data.credit || 0;
        this.leaveTakenDays = data.leaveTaken || 0;
        this.balance = data.balance || 0;
    }
}
