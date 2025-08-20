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
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <div className="width-full min-h-screen bg-gray-100 dark:bg-slate-900">
      <Router>
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
          </Route>
          <Route path="/" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
        </Routes>
      </Router>
      <Toaster />
    </div>
  );
}

export default App;
