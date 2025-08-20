//import { useSelector } from 'react-redux';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const { user } = useSelector((store) => store.auth);
  //console.log(user.user);

  const isAuthenticated = user;
  return isAuthenticated ? <Outlet /> : <Navigate to="/" />;
};

export default ProtectedRoute;
