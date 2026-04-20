import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
//import { Button } from './components/ui/button';
import ProtectedRoute from './routes/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Dashboard from './components/Dashboard';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import Transections from './components/Transections';
import Accounts from './components/Accounts';
import Settings from './components/Settings';
import Loans from './components/Loans';
import Categories from './components/Categories';
import Reports from './components/Reports';
import Budget from './components/Budget';
import Recurring from './components/Recurring';
import Onboarding from './components/onboarding/Onboarding';
import NetWorth from './components/NetWorth';
import FinancialAnalysis from './components/FinancialAnalysis';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import EmailVerification from './components/EmailVerification';
import AdminDashboard from './components/AdminDashboard';
import AdminUserList from './components/AdminUserList';
import AdminPayments from './components/AdminPayments';
import AdminSettings from './components/AdminSettings';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from './context/ThemeContext';

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
                <Route index element={<Transections />} />
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
