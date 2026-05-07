import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
//import { Button } from './components/ui/button';
import ProtectedRoute from '@/routes/ProtectedRoute';
import MainLayout from '@/layouts/MainLayout';
import Dashboard from '@/features/dashboard/components/Dashboard';
import SignIn from '@/features/auth/components/SignIn';
import SignUp from '@/features/auth/components/SignUp';
import Transactions from '@/features/transactions/components/Transactions';
import Accounts from '@/features/accounts/components/Accounts';
import Settings from '@/features/settings/components/Settings';
import Loans from '@/features/loans/components/Loans';
import Categories from '@/features/categories/components/Categories';
import Reports from '@/features/dashboard/components/Reports';
import Budget from '@/features/budget/components/Budget';
import Recurring from '@/features/recurring/components/Recurring';
import Onboarding from '@/features/auth/components/Onboarding';
import NetWorth from '@/features/dashboard/components/NetWorth';
import FinancialAnalysis from '@/features/dashboard/components/FinancialAnalysis';
import ForgotPassword from '@/features/auth/components/ForgotPassword';
import ResetPassword from '@/features/auth/components/ResetPassword';
import EmailVerification from '@/features/auth/components/EmailVerification';
import AdminDashboard from '@/features/admin/components/AdminDashboard';
import AdminUserList from '@/features/admin/components/AdminUserList';
import AdminPayments from '@/features/admin/components/AdminPayments';
import AdminSettings from '@/features/admin/components/AdminSettings';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/context/ThemeContext';

function App() {
  return (
    <div className="w-full min-h-screen bg-background text-on-surface">
      <Router>
        <ThemeProvider>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<MainLayout />}>
                <Route index element={<Dashboard />} />
              </Route>
              <Route path="/transactions" element={<MainLayout />}>
                <Route index element={<Transactions />} />
              </Route>
              <Route path="/categories" element={<MainLayout />}>
                <Route index element={<Categories />} />
              </Route>
              <Route path="/accounts" element={<MainLayout />}>
                <Route index element={<Accounts />} />
              </Route>
              <Route path="/settings" element={<MainLayout />}>
                <Route index element={<Settings />} />
              </Route>
              <Route path="/loans" element={<MainLayout />}>
                <Route index element={<Loans />} />
              </Route>
              <Route path="/reports" element={<MainLayout />}>
                <Route index element={<Reports />} />
              </Route>
              <Route path="/budget" element={<MainLayout />}>
                <Route index element={<Budget />} />
              </Route>
              <Route path="/recurring" element={<MainLayout />}>
                <Route index element={<Recurring />} />
              </Route>
              <Route path="/net-worth" element={<MainLayout />}>
                <Route index element={<NetWorth />} />
              </Route>
              <Route path="/analysis" element={<MainLayout />}>
                <Route index element={<FinancialAnalysis />} />
              </Route>
              <Route path="/onboarding" element={<Onboarding />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute adminOnly={true} />}>
              <Route path="/admin/dashboard" element={<MainLayout />}>
                <Route index element={<AdminDashboard />} />
              </Route>
              <Route path="/admin/users" element={<MainLayout />}>
                <Route index element={<AdminUserList />} />
              </Route>
              <Route path="/admin/payments" element={<MainLayout />}>
                <Route index element={<AdminPayments />} />
              </Route>
              <Route path="/admin/settings" element={<MainLayout />}>
                <Route index element={<AdminSettings />} />
              </Route>
            </Route>

            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<EmailVerification />} />
            <Route path="/" element={<SignIn />} />
          </Routes>
        </ThemeProvider>
      </Router>
      <Toaster />
    </div>
  );
}

export default App;
