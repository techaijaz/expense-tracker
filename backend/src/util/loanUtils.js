/**
 * Calculates Monthly EMI and generates a full amortization schedule.
 * @param {number} principal - Loan amount
 * @param {number} annualRate - Annual interest rate (e.g., 10.5 for 10.5%)
 * @param {number} tenureMonths - Total months
 * @param {Date} startDate - First EMI date
 */
export const calculateEMI = (principal, annualRate, tenureMonths) => {
    if (annualRate === 0) return Math.round((principal / tenureMonths) * 100) / 100;
    
    const monthlyRate = annualRate / (12 * 100);
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / 
                (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    return Math.round(emi * 100) / 100;
};

export const generateAmortizationSchedule = (principal, annualRate, tenureMonths, startDate) => {
    const monthlyRate = (annualRate || 0) / (12 * 100);
    const emi = calculateEMI(principal, annualRate, tenureMonths);
    let remainingBalance = principal;
    const schedule = [];
    const baseDate = new Date(startDate);

    for (let i = 1; i <= tenureMonths; i++) {
        const interestComponent = monthlyRate > 0 ? remainingBalance * monthlyRate : 0;
        const principalComponent = emi - interestComponent;
        remainingBalance -= principalComponent;

        // Ensure we don't have scientific notation or tiny leftovers
        const currentPrincipal = Math.round(principalComponent * 100) / 100;
        const currentInterest = Math.round(interestComponent * 100) / 100;
        const currentBalance = Math.max(0, Math.round(remainingBalance * 100) / 100);

        const dueDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + i - 1, baseDate.getDate());

        schedule.push({
            installmentNo: i,
            dueDate,
            emiAmount: emi,
            principalComponent: currentPrincipal,
            interestComponent: currentInterest,
            remainingBalance: currentBalance,
            status: 'PENDING'
        });
    }
    return schedule;
};

export const recalculateScheduleAfterPrepayment = (remainingPrincipal, annualRate, monthlyEMI, nextDueDate, startInstallmentNo) => {
    const monthlyRate = (annualRate || 0) / (12 * 100);
    let remainingBalance = remainingPrincipal;
    const schedule = [];
    const baseDate = new Date(nextDueDate);

    let i = startInstallmentNo;
    while (remainingBalance > 0.01) { // Process until negligible balance
        const interestComponent = monthlyRate > 0 ? remainingBalance * monthlyRate : 0;
        let principalComponent = monthlyEMI - interestComponent;
        
        // Final adjustment if principal exceeds remaining balance
        if (principalComponent > remainingBalance) {
            principalComponent = remainingBalance;
        }

        remainingBalance -= principalComponent;

        const currentPrincipal = Math.round(principalComponent * 100) / 100;
        const currentInterest = Math.round(interestComponent * 100) / 100;
        const currentBalance = Math.max(0, Math.round(remainingBalance * 100) / 100);

        const dueDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + (i - startInstallmentNo), baseDate.getDate());

        schedule.push({
            installmentNo: i,
            dueDate,
            emiAmount: Math.round((currentPrincipal + currentInterest) * 100) / 100,
            principalComponent: currentPrincipal,
            interestComponent: currentInterest,
            remainingBalance: currentBalance,
            status: 'PENDING'
        });
        i++;
        
        // Safety break to prevent infinite loops (e.g. if EMI < Interest)
        if (i > 1000) break; 
    }
    return schedule;
};

export default {
    calculateEMI,
    generateAmortizationSchedule,
    recalculateScheduleAfterPrepayment
};
