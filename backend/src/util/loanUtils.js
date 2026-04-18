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

export default {
    calculateEMI,
    generateAmortizationSchedule
};
