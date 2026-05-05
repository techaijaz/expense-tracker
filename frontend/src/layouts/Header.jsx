import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { DateRangePicker } from '@/components/DateRangePicker';
import { setDateRange } from '@/redux/dashboardSlice';
import AddAccounts from '@/components/AddAccounts';
import { useTheme } from '@/context/ThemeContext';
import { 
  Menu, 
  Plus, 
  Download, 
  Sun, 
  Moon, 
  Monitor,
  Palette,
  Check
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const getPageMeta = (t) => ({
  '/dashboard': { title: t('common.dashboard'), sub: 'Global overview' },
  '/transactions': {
    title: t('common.transactions'),
    sub: 'Asset Ledger · All movements',
  },
  '/accounts': { title: t('common.accounts'), sub: 'Financial hubs' },
  '/loans': { title: t('common.loans'), sub: 'Debt & Lending tracker' },
  '/reports': { title: t('common.reports'), sub: 'Financial analytics' },
  '/budget': { title: t('common.budget'), sub: 'Monthly spending' },
  '/recurring': { title: t('common.recurring'), sub: 'Subscriptions' },
  '/net-worth': { title: t('common.net_worth'), sub: 'Assets vs Liabilities' },
  '/categories': { title: t('common.categories'), sub: 'Management' },
  '/settings': {
    title: t('common.settings'),
    sub: 'Configuration & Preferences',
  },
});

const ACCENTS = [
  { name: 'Light Blue', value: 'lightblue', color: '#3b82f6' },
  { name: 'Tomato', value: 'tomato', color: '#ef4444' },
  { name: 'Orange', value: 'orange', color: '#f59e0b' },
  { name: 'Mint', value: 'mint', color: '#10b981' },
  { name: 'Purple', value: 'purple', color: '#8b5cf6' },
  { name: 'Brown', value: 'brown', color: '#92400e' },
];

export default function Header({ onMenuToggle, onNewTransaction }) {
  const { t } = useTranslation();
  const location = useLocation();
  const dispatch = useDispatch();
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();
  const user = useSelector((state) => state.auth.user);
  const { dateRange } = useSelector((state) => state.dashboard);

  const meta = getPageMeta(t)[location.pathname] || {
    title: t('common.dashboard'),
    sub: 'Global overview',
  };

  const initials = user
    ? (
        (user.firstName?.[0] || '') + (user.lastName?.[0] || '')
      ).toUpperCase() || 'JD'
    : 'JD';

  const backendBase = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
  const avatarUrl = user?.avatar 
    ? (user.avatar.startsWith('http') ? user.avatar : `${backendBase.replace(/\/$/, '')}/${user.avatar.replace(/^\//, '')}`)
    : null;

  const handleDateChange = (range) => {
    dispatch(setDateRange({
      from: range?.from ? range.from.toISOString() : null,
      to: range?.to ? range.to.toISOString() : null,
    }));
  };

  const displayDateRange = {
    from: dateRange.from ? new Date(dateRange.from) : null,
    to: dateRange.to ? new Date(dateRange.to) : null,
  };

  const userObj = user?.user || user;
  const plan = (userObj?.role === 'admin' || userObj?.plan === 'pro') ? 'pro' : 'basic';

  return (
    <header className="topbar glass-topbar">
      {/* Mobile Toggle */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="lg:hidden shrink-0" 
        onClick={onMenuToggle}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Page Title */}
      <div className="flex-1 min-w-0 mr-4">
        <h1 className="topbar-title truncate">{meta.title}</h1>
        <p className="topbar-sub truncate hidden sm:block">{meta.sub}</p>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Contextual Actions */}
        <div className="hidden md:flex items-center gap-2">
          {location.pathname === '/dashboard' && (
            <DateRangePicker value={displayDateRange} onChange={handleDateChange} />
          )}
          
          {location.pathname === '/transactions' && (
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              <span>{t('common.export')}</span>
            </Button>
          )}

          {location.pathname === '/accounts' && (
            <AddAccounts 
              btnLabel="Add Account" 
              customTrigger={
                <Button 
                  className="h-10 px-4 rounded-xl text-white font-black text-[10px] uppercase tracking-widest bg-gradient-to-r from-accent to-accent2 shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 border-none"
                >
                  {plan === 'basic' ? <span className="text-xs">🔒</span> : <Plus className="h-4 w-4 stroke-[3px]" />}
                  <span>Add Account</span>
                </Button>
              }
            />
          )}
        </div>

        {/* Global Add Button */}
        <Button 
          onClick={onNewTransaction} 
          className="h-10 px-4 sm:px-6 rounded-xl text-white font-black text-[10px] uppercase tracking-widest bg-gradient-to-r from-accent to-accent2 shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 border-none"
        >
          <Plus className="h-4 w-4 stroke-[3px]" />
          <span className="hidden sm:inline">{t('common.new_transaction')}</span>
          <span className="sm:hidden">New</span>
        </Button>

        {/* Theme & Settings Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="avatar">
              <Avatar className="h-full w-full">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="bg-accent text-white text-[11px]">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 glass-panel-heavy">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-bold leading-none">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Theme Submenu */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2">
                {theme === 'light' ? <Sun className="h-4 w-4" /> : theme === 'dark' ? <Moon className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                <span>Theme</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="glass-panel-heavy">
                  <DropdownMenuItem onClick={() => setTheme('light')} className="gap-2">
                    <Sun className="h-4 w-4" />
                    <span>Light</span>
                    {theme === 'light' && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('dark')} className="gap-2">
                    <Moon className="h-4 w-4" />
                    <span>Dark</span>
                    {theme === 'dark' && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('system')} className="gap-2">
                    <Monitor className="h-4 w-4" />
                    <span>System</span>
                    {theme === 'system' && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            {/* Accent Submenu */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2">
                <Palette className="h-4 w-4" />
                <span>Accent Color</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="glass-panel-heavy">
                  {ACCENTS.map((acc) => (
                    <DropdownMenuItem 
                      key={acc.value} 
                      onClick={() => setAccentColor(acc.value)}
                      className="gap-2"
                    >
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: acc.color }} />
                      <span>{acc.name}</span>
                      {accentColor === acc.value && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => window.location.href='/settings'} className="cursor-pointer">
              Account Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
