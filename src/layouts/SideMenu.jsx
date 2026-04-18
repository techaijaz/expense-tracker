import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '@/redux/authSlice';
import { toast } from 'sonner';
import api from '@/utils/httpMethods';

export default function SideMenu({ isOpen, setIsOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isActive = (path) => location.pathname === path;

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put('/user/logout', {});
      if (response?.success) {
        dispatch(logout());
        localStorage.clear();
        toast.success(response.message || 'Logged out successfully');
        navigate('/');
      } else {
        toast.error(
          response?.message || 'Failed to log out. Please try again.',
        );
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          'An error occurred while logging out.',
      );
    }
  };

  const NavItem = ({ to, icon, label, locked }) => (
    <Link
      to={locked ? '#' : to}
      onClick={() => !locked && setIsOpen(false)}
      className={`nav-item ${isActive(to) ? 'active' : ''} ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span className="nav-icon">{icon}</span>
      <span className="flex-1">{label}</span>
      {locked && (
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>🔒</span>
      )}
    </Link>
  );

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[998] lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* SideNavBar Shell */}
      <aside
        className={`sidebar fixed inset-y-0 left-0 z-[999] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-wrap">
            <div className="logo-box">ai</div>
            <div>
              <div className="logo-text">aiexpenser</div>
              <div className="logo-sub">Smart Finance</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <NavItem to="/dashboard" icon="📊" label="Dashboard" />
          <NavItem to="/transactions" icon="↔️" label="Transactions" />
          <NavItem to="/accounts" icon="🏦" label="Accounts" />

          <div className="nav-section">Finance</div>
          <NavItem to="/budget" icon="💰" label="Budget" />
          <NavItem to="/recurring" icon="🔄" label="Recurring" />
          <NavItem to="/loans" icon="🤝" label="Loans" />
          <NavItem to="/net-worth" icon="📈" label="Net Worth" locked />

          <div className="nav-section">Insights</div>
          <NavItem to="/reports" icon="📋" label="Reports" />
          <NavItem to="/settings" icon="⚙️" label="Settings" />
        </nav>

        {/* Bottom: Plan Badge + Logout */}
        <div className="sidebar-bottom">
          <div className="plan-badge">
            <div className="plan-name">Pro Trial</div>
            <div className="plan-sub">12 days remaining</div>
            <button className="btn-upgrade">Upgrade ₹99/mo</button>
          </div>
          <button onClick={handleLogout} className="nav-item w-full text-left">
            <span className="nav-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>

        {/* Mobile Close Button */}
        <button
          className="lg:hidden absolute top-5 right-4 text-[#8892B0] hover:text-white"
          onClick={() => setIsOpen(false)}
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </aside>
    </>
  );
}
