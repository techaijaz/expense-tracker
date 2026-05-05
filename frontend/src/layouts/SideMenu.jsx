import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/redux/authSlice';
import SubscriptionPopup from '@/components/SubscriptionPopup';
import { toast } from 'sonner';
import api from '@/utils/httpMethods';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Building2, 
  Wallet, 
  RefreshCcw, 
  Handshake, 
  TrendingUp, 
  FileText, 
  Settings,
  ShieldCheck,
  Users,
  CheckCircle2,
  Wrench,
  LogOut,
  X,
  Lock
} from 'lucide-react';

export default function SideMenu({ isOpen, setIsOpen }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  
  const userData = user?.user || user;
  const isPro = userData?.role === 'admin' || userData?.plan === 'pro';
  const plan = userData?.plan || 'basic';
  
  const trialEnd = userData?.trialEnd ? new Date(userData.trialEnd) : null;
  const daysRemaining = trialEnd ? Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24)) : 0;
  const isTrial = isPro && userData?.isTrialUsed;
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
        toast.error(response?.message || 'Failed to log out');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'An error occurred');
    }
  };

  const NavItem = ({ to, icon: Icon, label, proOnly }) => {
    const locked = proOnly && !isPro;
    const active = isActive(to);
    
    return (
      <Link
        to={locked ? '#' : to}
        onClick={() => !locked && setIsOpen(false)}
        className={`nav-item group relative ${active ? 'active' : ''} ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className={`nav-icon transition-transform duration-200 group-hover:scale-110 ${active ? 'text-accent' : 'text-text3 group-hover:text-text'}`}>
          <Icon size={18} />
        </span>
        <span className="flex-1 font-medium">{label}</span>
        {locked && (
          <Lock size={12} className="text-text3" />
        )}
        {active && (
          <div className="absolute left-0 top-[20%] bottom-[20%] w-1 bg-accent rounded-r-full shadow-[0_0_15px_var(--accent)] animate-in fade-in slide-in-from-left-1 duration-300" />
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[998] lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* SideNavBar Shell */}
      <aside
        className={`sidebar fixed inset-y-0 left-0 z-[999] transform transition-all duration-300 ease-in-out premium-shadow ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0 lg:border-r border-border`}
      >
        {/* Logo */}
        <div className="sidebar-logo flex items-center justify-between">
          <div className="logo-wrap">
            <div className="logo-box shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)] bg-accent">ai</div>
            <div>
              <div className="logo-text">aiexpenser</div>
              <div className="logo-sub">Smart Finance</div>
            </div>
          </div>
          
          {/* Mobile Close */}
          <button 
            className="lg:hidden p-2 text-text3 hover:text-text transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav overflow-y-auto hide-scrollbar px-3 py-4">
          <NavItem to="/dashboard" icon={LayoutDashboard} label={t('common.dashboard')} />
          <NavItem to="/transactions" icon={ArrowLeftRight} label={t('common.transactions')} />
          <NavItem to="/accounts" icon={Building2} label={t('common.accounts')} />

          <div className="nav-section px-2 mt-6 mb-2">{t('common.finance')}</div>
          <NavItem to="/budget" icon={Wallet} label={t('common.budget')} />
          <NavItem to="/recurring" icon={RefreshCcw} label={t('common.recurring')} />
          <NavItem to="/loans" icon={Handshake} label={t('common.loans')} />
          <NavItem to="/net-worth" icon={TrendingUp} label={t('common.net_worth')} proOnly />

          <div className="nav-section px-2 mt-6 mb-2">{t('common.insights')}</div>
          <NavItem to="/reports" icon={FileText} label={t('common.reports')} proOnly />
          <NavItem to="/settings" icon={Settings} label={t('common.settings')} />

          {userData?.role === 'admin' && (
            <>
              <div className="nav-section px-2 mt-6 mb-2">Administration</div>
              <NavItem to="/admin/dashboard" icon={ShieldCheck} label="Dashboard" />
              <NavItem to="/admin/users" icon={Users} label="Users" />
              <NavItem to="/admin/payments" icon={CheckCircle2} label="Payments" />
              <NavItem to="/admin/settings" icon={Wrench} label="System" />
            </>
          )}
        </nav>

        {/* Bottom: Plan Badge + Logout */}
        <div className="sidebar-bottom px-3 py-4 mt-auto border-t border-border">
          <div 
            className="plan-badge group relative cursor-pointer border border-border/50 hover:border-accent/40 bg-bg3/50 backdrop-blur-sm transition-all duration-300 p-3 rounded-xl mb-3 overflow-hidden" 
            onClick={() => setIsSubscriptionOpen(true)}
          >
            {/* Subtle Gradient Background on Hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative">
              <div className="plan-name text-xs font-bold text-text uppercase tracking-wider">
                {userData?.role === 'admin' ? 'Admin Access' : isPro ? (isTrial ? 'Pro Trial' : 'Pro Member') : 'Basic Plan'}
              </div>
              <div className="plan-sub text-[10px] text-text3 mt-0.5">
                {isPro 
                  ? (isTrial ? `${daysRemaining} days left` : 'All features unlocked') 
                  : 'Limited features'}
              </div>
              {!isPro && (
                <button className="w-full mt-3 py-1.5 bg-accent hover:bg-accent2 text-white text-[11px] font-bold rounded-lg transition-colors shadow-lg shadow-accent/20">
                  Upgrade ₹99/mo
                </button>
              )}
            </div>
          </div>
          
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-3 w-full px-3 py-2.5 text-text3 hover:text-red hover:bg-red-bg rounded-lg transition-all duration-200 font-medium text-sm"
          >
            <LogOut size={18} />
            <span>{t('common.logout')}</span>
          </button>
        </div>

        <SubscriptionPopup 
          isOpen={isSubscriptionOpen} 
          onOpenChange={setIsSubscriptionOpen} 
          currentPlan={plan}
        />
      </aside>
    </>
  );
}
