import { Link, useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
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

  const navItems = [
    { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { path: '/transactions', icon: 'receipt_long', label: 'Transactions' },
    { path: '/accounts', icon: 'account_balance_wallet', label: 'Accounts' },
    { path: '/loans', icon: 'handshake', label: 'Loans' },
    { path: '/settings', icon: 'settings', label: 'Settings' },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* SideNavBar Shell */}
      <aside
        className={`h-screen w-64 fixed left-0 top-0 overflow-y-auto bg-surface-container-low shadow-[1px_0_0_0_var(--input-bg)] flex flex-col py-8 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Brand Header */}
        <div className="px-6 mb-10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Logo Mark */}
            <div className="flex-shrink-0">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="36" height="36" rx="10" fill="url(#logoGrad)"/>
                <path d="M10 24L18 10L26 24" stroke="var(--bg-primary)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13 20H23" stroke="var(--bg-primary)" strokeWidth="2.2" strokeLinecap="round"/>
                <circle cx="18" cy="27" r="2" fill="var(--bg-primary)"/>
                <defs>
                  <linearGradient id="logoGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                    <stop stopColor="var(--accent-color)"/>
                    <stop offset="1" stopColor="var(--accent-color)"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div>
              <div className="text-xl font-black text-primary tracking-tighter font-headline leading-none">
                aiexpenser
              </div>
              <div className="text-[9px] uppercase tracking-widest text-outline opacity-50 font-bold mt-0.5">
                Smart Finance
              </div>
            </div>
          </div>
          {/* Mobile Close Button */}
          <button
            className="lg:hidden text-outline hover:text-white transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 0" }}
            >
              close
            </span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center px-6 py-3 transition-all duration-300 group ${
                isActive(item.path)
                  ? 'text-primary bg-surface-container-high/40 border-l-2 border-tertiary font-bold'
                  : 'text-outline opacity-70 hover:bg-surface-container-high hover:text-primary font-semibold'
              }`}
            >
              <span
                className="material-symbols-outlined mr-3 text-xl"
                style={{
                  fontVariationSettings:
                    "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                }}
              >
                {item.icon}
              </span>
              <span className="font-headline tracking-tight">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="px-6 mt-auto">
          {/* Plan Card */}
          <div className="bg-surface-container-high p-4 rounded-xl mb-6">
            <p className="text-xs text-on-surface-variant mb-2">Current Plan</p>
            <p className="text-sm font-bold text-on-surface mb-3">
              Enterprise Alpha
            </p>
            <button className="w-full py-2 bg-gradient-to-br from-primary to-on-primary-container text-on-primary text-xs font-bold rounded-md hover:opacity-90 transition-opacity">
              Upgrade Pro
            </button>
          </div>
          {/* Utility Links */}
          <div className="space-y-1">
            <a
              href="#"
              className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                contact_support
              </span>
              <span className="text-sm">Support</span>
            </a>
            <a
              href="#"
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:text-error transition-colors"
            >
              <span
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                logout
              </span>
              <span className="text-sm">Logout</span>
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
