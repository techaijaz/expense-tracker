import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { DateRangePicker } from '@/components/DateRangePicker';
import { setDateRange } from '@/redux/dashboardSlice';
import AddAccounts from '@/components/AddAccounts';

const getPageMeta = (t) => ({
  '/dashboard': { title: t('common.dashboard'), sub: 'Global overview' },
  '/transactions': {
    title: t('common.transactions'),
    sub: 'Asset Ledger · All movements',
  },
  '/accounts': { title: t('common.accounts'), sub: 'Manage your financial hubs and liquidity' },
  '/loans': { title: t('common.loans'), sub: 'Debt & Lending tracker' },
  '/reports': { title: t('common.reports'), sub: 'Financial analytics' },
  '/budget': { title: t('common.budget'), sub: 'Monthly spending limits' },
  '/recurring': { title: t('common.recurring'), sub: 'Subscriptions & fixed payments' },
  '/net-worth': { title: t('common.net_worth'), sub: 'Assets vs Liabilities' },
  '/categories': { title: t('common.categories'), sub: 'Transaction categories' },
  '/settings': {
    title: t('common.settings'),
    sub: 'Configuration · Identity · Preferences',
  },
});

export default function Header({ onMenuToggle, onNewTransaction }) {
  const { t } = useTranslation();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { dateRange } = useSelector((state) => state.dashboard);

  const meta = getPageMeta(t)[location.pathname] || {
    title: t('common.dashboard'),
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

  const userObj = user?.user || user;
  const plan = (userObj?.role === 'admin' || userObj?.plan === 'pro') ? 'pro' : 'basic';

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
          <button className="btn-outline hidden sm:flex">⬇ {t('common.export')}</button>
        )}

        {/* Add Account — only on accounts */}
        {location.pathname === '/accounts' && (
          <div className="hidden sm:flex">
            <AddAccounts 
              btnLabel="Add Account" 
              customTrigger={
                <button className="btn-new">
                  {plan === 'basic' ? <span className="mr-1 text-[14px]">🔒</span> : <span style={{ fontSize: 16 }}>+</span>}
                  <span className="hidden md:inline">Add Account</span>
                  <span className="md:hidden">Add</span>
                </button>
              }
            />
          </div>
        )}

        {/* New Transaction */}
        <button onClick={onNewTransaction} className="btn-new">
          <span style={{ fontSize: 16 }}>+</span>
          <span className="hidden sm:inline">{t('common.new_transaction')}</span>
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
