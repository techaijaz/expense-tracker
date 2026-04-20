import { useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { DateRangePicker } from '@/components/DateRangePicker';
import { setDateRange } from '@/redux/dashboardSlice';

const PAGE_META = {
  '/dashboard': { title: 'Dashboard', sub: 'Global overview' },
  '/transactions': {
    title: 'Transactions',
    sub: 'Asset Ledger · All movements',
  },
  '/accounts': { title: 'Accounts', sub: 'All your accounts' },
  '/loans': { title: 'Loans', sub: 'Debt & Lending tracker' },
  '/reports': { title: 'Reports', sub: 'Financial analytics' },
  '/budget': { title: 'Budget', sub: 'Monthly spending limits' },
  '/recurring': { title: 'Recurring', sub: 'Subscriptions & fixed payments' },
  '/net-worth': { title: 'Net Worth', sub: 'Assets vs Liabilities' },
  '/categories': { title: 'Categories', sub: 'Transaction categories' },
  '/settings': {
    title: 'Settings',
    sub: 'Configuration · Identity · Preferences',
  },
};

export default function Header({ onMenuToggle, onNewTransaction }) {
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { dateRange } = useSelector((state) => state.dashboard);

  const meta = PAGE_META[location.pathname] || {
    title: 'Dashboard',
    sub: 'Global overview',
  };

  // Build initials from user name
  const initials = user
    ? (
        (user.firstName?.[0] || '') + (user.lastName?.[0] || '')
      ).toUpperCase() || 'JD'
    : 'JD';

  const backendBase =
    import.meta.env.VITE_API_URL?.replace('/api/v1', '') ||
    'http://localhost:5000';
  const getAvatarUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${backendBase.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  };
  const avatarUrl = getAvatarUrl(user?.avatar);

  const handleDateChange = (range) => {
    dispatch(
      setDateRange({
        from: range?.from ? range.from.toISOString() : null,
        to: range?.to ? range.to.toISOString() : null,
      }),
    );
  };

  const displayDateRange = {
    from: dateRange.from ? new Date(dateRange.from) : null,
    to: dateRange.to ? new Date(dateRange.to) : null,
  };

  return (
    <header className="topbar">
      {/* Mobile Hamburger */}
      <button className="lg:hidden icon-btn mr-2" onClick={onMenuToggle}>
        <span className="material-symbols-outlined">menu</span>
      </button>

      {/* Title block */}
      <div>
        <div className="topbar-title">{meta.title}</div>
        <div className="topbar-sub">{meta.sub}</div>
      </div>

      {/* Right Actions */}
      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}
      >
        {/* Date range — only on dashboard */}
        {location.pathname === '/dashboard' && (
          <DateRangePicker
            className="hidden sm:flex"
            value={displayDateRange}
            onChange={handleDateChange}
          />
        )}

        {/* Export — only on transactions */}
        {location.pathname === '/transactions' && (
          <button className="btn-outline hidden sm:flex">⬇ Export</button>
        )}

        {/* New Transaction */}
        <button onClick={onNewTransaction} className="btn-new">
          <span style={{ fontSize: 16 }}>+</span>
          <span className="hidden sm:inline">New Transaction</span>
          <span className="sm:hidden">New</span>
        </button>

        {/* Avatar */}
        <div className="avatar" style={{ overflow: 'hidden' }}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="User Avatar"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            initials
          )}
        </div>
      </div>
    </header>
  );
}
