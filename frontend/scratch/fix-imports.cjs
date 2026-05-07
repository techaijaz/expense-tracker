const fs = require('fs');
const path = require('path');

const replacements = [
  { from: /@\/redux\/authSlice/g, to: '@/features/auth/state/authSlice' },
  { from: /@\/redux\/transactionSlice/g, to: '@/features/transactions/state/transactionSlice' },
  { from: /@\/redux\/accountSlice/g, to: '@/features/accounts/state/accountSlice' },
  { from: /@\/redux\/budgetSlice/g, to: '@/features/budget/state/budgetSlice' },
  { from: /@\/redux\/categorySlice/g, to: '@/features/categories/state/categorySlice' },
  { from: /@\/redux\/loanSlice/g, to: '@/features/loans/state/loanSlice' },
  { from: /@\/redux\/recurringSlice/g, to: '@/features/recurring/state/recurringSlice' },
  { from: /@\/redux\/adminSlice/g, to: '@/features/admin/state/adminSlice' },
  
  { from: /@\/hooks\/useAuth/g, to: '@/features/auth/hooks/useAuth' },
  { from: /@\/hooks\/useTransactionsManager/g, to: '@/features/transactions/hooks/useTransactionsManager' },
  { from: /@\/hooks\/useAccountsManager/g, to: '@/features/accounts/hooks/useAccountsManager' },
  { from: /@\/hooks\/useBudget/g, to: '@/features/budget/hooks/useBudget' },
  { from: /@\/hooks\/useCategories/g, to: '@/features/categories/hooks/useCategories' },
  { from: /@\/hooks\/useLoans/g, to: '@/features/loans/hooks/useLoans' },
  { from: /@\/hooks\/useRecurring/g, to: '@/features/recurring/hooks/useRecurring' },

  // Component relocations
  { from: /@\/components\/SignIn/g, to: '@/features/auth/components/SignIn' },
  { from: /@\/components\/SignUp/g, to: '@/features/auth/components/SignUp' },
  { from: /@\/components\/ForgotPassword/g, to: '@/features/auth/components/ForgotPassword' },
  { from: /@\/components\/ResetPassword/g, to: '@/features/auth/components/ResetPassword' },
  { from: /@\/components\/Transactions/g, to: '@/features/transactions/components/Transactions' },
  { from: /@\/components\/TransactionPopup/g, to: '@/features/transactions/components/TransactionPopup' },
  { from: /@\/components\/Accounts/g, to: '@/features/accounts/components/Accounts' },
  { from: /@\/components\/Budget/g, to: '@/features/budget/components/Budget' },
  { from: /@\/components\/Categories/g, to: '@/features/categories/components/Categories' },
  { from: /@\/components\/Loans/g, to: '@/features/loans/components/Loans' },
  { from: /@\/components\/Recurring/g, to: '@/features/recurring/components/Recurring' },
  { from: /@\/components\/DashboardStats/g, to: '@/features/dashboard/components/DashboardStats' },
  { from: /@\/components\/NetWorth/g, to: '@/features/dashboard/components/NetWorth' },
  { from: /@\/components\/FinancialAnalysis/g, to: '@/features/dashboard/components/FinancialAnalysis' },
  { from: /@\/components\/Reports/g, to: '@/features/dashboard/components/Reports' },
  { from: /@\/components\/Appearance/g, to: '@/features/settings/components/Appearance' },
  { from: /@\/components\/SubscriptionManagement/g, to: '@/features/settings/components/SubscriptionManagement' },
  { from: /@\/components\/DataExport/g, to: '@/features/settings/components/DataExport' },
  { from: /@\/components\/UserIdentity/g, to: '@/features/settings/components/UserIdentity' },
  { from: /@\/components\/RegionalSpecs/g, to: '@/features/settings/components/RegionalSpecs' },
  { from: /@\/components\/Taxonomy/g, to: '@/features/settings/components/Taxonomy' },
  { from: /@\/components\/Counterparties/g, to: '@/features/settings/components/Counterparties' },
  { from: /@\/components\/SystemMetrics/g, to: '@/features/settings/components/SystemMetrics' },
  { from: /@\/components\/SubscriptionPopup/g, to: '@/features/settings/components/SubscriptionPopup' },

  // Shared components
  { from: /@\/components\/SharedComponents/g, to: '@/components/common/SharedComponents' },
  { from: /@\/components\/ConfirmModal/g, to: '@/components/common/SharedComponents' },
  { from: /@\/components\/PasswordConfirmModal/g, to: '@/components/common/SharedComponents' },
  { from: /@\/components\/SetPasswordModal/g, to: '@/components/common/SharedComponents' },
  { from: /@\/components\/SectionCard/g, to: '@/components/common/SharedComponents' },
  { from: /@\/components\/SectionTitle/g, to: '@/components/common/SharedComponents' },
  { from: /@\/components\/FieldLabel/g, to: '@/components/common/SharedComponents' },
  { from: /@\/components\/DateRangePicker/g, to: '@/components/common/DateRangePicker' },
  { from: /@\/components\/Piechart/g, to: '@/components/common/Piechart' },
  { from: /@\/components\/Linechart/g, to: '@/components/common/Linechart' },
  { from: /@\/components\/InfoCard/g, to: '@/components/common/InfoCard' },
];

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const rep of replacements) {
        if (rep.from.test(content)) {
          content = content.replace(rep.from, rep.to);
          changed = true;
        }
      }
      if (changed) {
        console.log(`Updated: ${fullPath}`);
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
}

walk('./src');
