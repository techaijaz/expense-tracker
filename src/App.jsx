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
              <Route path="/accounts" element={<MainLayout />}>
                <Route index element={<Accounts />} />
              </Route>
              <Route path="/settings" element={<MainLayout />}>
                <Route index element={<Settings />} />
              </Route>
              <Route path="/loans" element={<MainLayout />}>
                <Route index element={<Loans />} />
              </Route>
            </Route>
            <Route path="/" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
          </Routes>
        </ThemeProvider>
      </Router>
      <Toaster />
    </div>
  );
}

export default App;
