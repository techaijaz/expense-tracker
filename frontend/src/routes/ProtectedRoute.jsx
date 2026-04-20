import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ProtectedRoute = () => {
  const { user } = useSelector((store) => store.auth);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/" />;
  }

  // Redirect to onboarding if not done
  if (!user.onboardingDone && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" />;
  }

  // Redirect away from onboarding if already done
  if (user.onboardingDone && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
