import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import authSchema from '@/schema/authSchema';
import { FcGoogle } from 'react-icons/fc';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/utils/httpMethods';
import { useDispatch, useSelector } from 'react-redux';
import { setAuthUser } from '@/redux/authSlice';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { setAccounts } from '@/redux/accountSlice';
import { setCategories } from '@/redux/categorySlice';

// Animated stat card for the left panel
function StatCard({ icon, label, value, accent, delay }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const colorClasses = {
    primary: 'border-l-primary text-primary var-glow-primary',
    tertiary: 'border-l-tertiary text-tertiary var-glow-tertiary',
    error: 'border-l-error text-error var-glow-error',
  };
  const cClass = colorClasses[accent] || colorClasses.primary;

  return (
    <div
      className={`relative overflow-hidden bg-secondary-container rounded-2xl border border-secondary-container border-l-2 p-5 transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${cClass}`}
    >
      <div className="absolute right-[-20px] bottom-[-20px] w-[100px] h-[100px] rounded-full blur-[30px] pointer-events-none glow-layer" />
      <div className="flex justify-between items-center mb-2.5">
        <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-on-surface-variant">{label}</span>
        <span className="material-symbols-outlined text-lg opacity-60" style={{ fontVariationSettings: "'FILL' 0" }}>{icon}</span>
      </div>
      <div className="text-2xl font-extrabold text-on-surface tracking-[-0.02em] font-body">{value}</div>
      <div className="text-[11px] font-bold mt-1 flex items-center gap-1">
        <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'wght' 700" }}>trending_up</span>
        +12.4% from last month
      </div>
    </div>
  );
}

// A mini bar chart decoration
function MiniChart() {
  const bars = [40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 100];
  return (
    <div className="flex items-end gap-1 h-12">
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-[3px] opacity-70"
          style={{
            height: `${h}%`,
            background: `linear-gradient(180deg, var(--accent-color) ${100 - h}%, var(--hover-bg) 100%)`,
            opacity: 0.7 + (i / bars.length) * 0.3,
            animation: `barPulse 2s ease-in-out ${i * 0.1}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

function SignIn() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((store) => store.auth);
  const { accounts } = useSelector((state) => state.accounts);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    document.title = 'Sign In | aiexpenser';
    if (user?.user?._id) navigate('/dashboard');
  }, [navigate, user?.user, accounts.length]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({ resolver: zodResolver(authSchema.signInSchema()) });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await api.post('/user/login', data);
      if (response.success) {
        setValue('email', '');
        setValue('password', '');
        dispatch(setAuthUser(response.data));
        dispatch(setAccounts(response.data.accounts));
        dispatch(setCategories(response.data.categories));
        navigate('/dashboard');
        toast.success(response.message || 'Login successful!');
      } else {
        toast.error(response.data.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = (field) => ({
    width: '100%',
    padding: '12px 16px',
    background: focusedField === field ? 'var(--hover-bg)' : 'var(--input-bg)',
    border: `1px solid ${focusedField === field ? 'var(--hover-bg)' : 'var(--input-bg)'}`,
    borderRadius: 10,
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    transition: 'all 0.25s ease',
    boxShadow: focusedField === field ? '0 0 0 3px var(--hover-bg)' : 'none',
    fontFamily: 'Inter, sans-serif',
  });

  return (
    <div className="min-h-screen bg-background flex font-body">
      <style>{`
        @keyframes barPulse { from { opacity: 0.5; } to { opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes gridScroll { from { transform: translateY(0); } to { transform: translateY(60px); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        .auth-input::placeholder { color: var(--text-muted); }
        .auth-input::-webkit-autofill { background: transparent !important; -webkit-box-shadow: 0 0 0 1000px #0a1f35 inset !important; -webkit-text-fill-color: var(--text-primary) !important; }
        .google-btn:hover { background: var(--hover-bg) !important; }
        .sign-in-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); box-shadow: 0 8px 32px var(--hover-bg); }
        .sign-in-btn:active { transform: translateY(0); }
        .var-glow-primary .glow-layer { background: var(--hover-bg); }
        .var-glow-tertiary .glow-layer { background: rgba(168,237,202,0.10); }
        .var-glow-error .glow-layer { background: rgba(249,113,113,0.10); }
      `}</style>

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex flex-col justify-center relative overflow-hidden px-14 py-16 basis-[52%]" style={{ flex: '0 0 52%' }}>
        {/* Background grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--hover-bg) 1px, transparent 1px), linear-gradient(90deg, var(--hover-bg) 1px, transparent 1px)', backgroundSize: '48px 48px', animation: 'gridScroll 8s linear infinite', opacity: 0.6 }} />
        {/* Radial glow */}
        <div style={{ position: 'absolute', top: '30%', left: '40%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, var(--hover-bg) 0%, transparent 70%)', pointerEvents: 'none', transform: 'translate(-50%,-50%)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,237,202,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Brand */}
        <div className="mb-12" style={{ animation: 'fadeIn 0.5s ease forwards' }}>
          <div className="flex items-center gap-2.5 mb-1 text-2xl font-black text-primary tracking-[-0.04em]">
            <svg width="30" height="30" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <rect width="36" height="36" rx="10" fill="url(#siLogoGrad)"/>
              <path d="M10 24L18 10L26 24" stroke="var(--bg-primary)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13 20H23" stroke="var(--bg-primary)" strokeWidth="2.2" strokeLinecap="round"/>
              <circle cx="18" cy="27" r="2" fill="var(--bg-primary)"/>
              <defs><linearGradient id="siLogoGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse"><stop stopColor="var(--accent-color)"/><stop offset="1" stopColor="var(--accent-color)"/></linearGradient></defs>
            </svg>
            aiexpenser
          </div>
          <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-on-surface-variant">Smart Finance</div>
        </div>

        {/* Heading */}
        <div className="mb-9" style={{ animation: 'fadeIn 0.6s 0.1s ease both' }}>
          <h1 className="text-4xl font-extrabold text-on-surface leading-[1.2] tracking-[-0.03em] mb-3">
            Your Finances,<br /><span className="text-primary">Reimagined.</span>
          </h1>
          <p className="text-sm text-on-surface-variant leading-[1.7]">
            Track every rupee with atmospheric precision. One unified dashboard for total financial clarity.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3.5 mb-7" style={{ animation: 'fadeIn 0.6s 0.2s ease both' }}>
          <StatCard icon="account_balance" label="Total Balance" value="₹2,84,320" accent="tertiary" delay={200} />
          <StatCard icon="trending_up" label="Monthly Income" value="₹48,500" accent="primary" delay={350} />
          <StatCard icon="shopping_cart" label="Total Expenses" value="₹21,840" accent="error" delay={500} />
          <div className="bg-secondary-container rounded-2xl border border-secondary-container p-5 opacity-0" style={{ animation: 'fadeIn 0.6s 0.65s ease forwards' }}>
            <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-on-surface-variant mb-3">Monthly Trend</div>
            <MiniChart />
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2" style={{ animation: 'fadeIn 0.6s 0.8s ease both' }}>
          {['Multi-Account', 'Smart Analytics', 'Debt Tracking', 'Fund Transfers'].map((f) => (
            <span key={f} className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-surface-variant border border-surface-variant text-primary">
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL (Form) ── */}
      <div className="flex-1 flex items-center justify-center py-10 px-6 relative">
        {/* Subtle divider for large screens */}
        <div className="hidden lg:block absolute left-0 top-[8%] bottom-[8%] w-[1px] bg-[linear-gradient(180deg,transparent,var(--hover-bg),transparent)]" />

        <div className="w-full max-w-[400px]" style={{ animation: 'fadeIn 0.5s 0.2s ease both' }}>
          {/* Mobile brand */}
          <div className="lg:hidden mb-9 text-center">
            <div className="flex items-center gap-2 justify-center mb-0.5 text-[22px] font-black text-primary tracking-[-0.04em]">
              <svg width="26" height="26" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="36" height="36" rx="10" fill="url(#siMLogoGrad)"/>
                <path d="M10 24L18 10L26 24" stroke="var(--bg-primary)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13 20H23" stroke="var(--bg-primary)" strokeWidth="2.2" strokeLinecap="round"/>
                <circle cx="18" cy="27" r="2" fill="var(--bg-primary)"/>
                <defs><linearGradient id="siMLogoGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse"><stop stopColor="var(--accent-color)"/><stop offset="1" stopColor="var(--accent-color)"/></linearGradient></defs>
              </svg>
              aiexpenser
            </div>
            <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-on-surface-variant mt-1">Smart Finance</div>
          </div>

          {/* Card */}
          <div className="bg-secondary-container border border-secondary-container rounded-3xl p-10 backdrop-blur-md">
            <h2 className="text-[22px] font-extrabold text-on-surface tracking-[-0.02em] mb-1.5">Welcome back</h2>
            <p className="text-[13px] text-on-surface-variant mb-7">Sign in to your aiexpenser account</p>

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Google button */}
              <button
                type="button"
                className="google-btn w-full p-3 bg-secondary-container border border-secondary-container rounded-xl text-on-surface text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-2.5 mb-5.5 transition-colors duration-200"
                onClick={(e) => e.preventDefault()}
              >
                <FcGoogle className="w-[18px] h-[18px]" />
                Continue with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5.5">
                <div className="flex-1 h-[1px] bg-secondary-container" />
                <span className="text-[11px] font-semibold text-on-surface-variant tracking-[0.05em]">OR</span>
                <div className="flex-1 h-[1px] bg-secondary-container" />
              </div>

              {/* Email */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-on-surface-variant mb-2 tracking-[0.02em]">Email address</label>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="you@example.com"
                  className="auth-input"
                  style={inputStyle('email')}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
                {errors.email && <p className="mt-1.5 text-xs text-error">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-on-surface-variant tracking-[0.02em]">Password</label>
                  <a href="#" className="text-[11px] text-primary no-underline font-semibold">Forgot?</a>
                </div>
                <input
                  type="password"
                  {...register('password')}
                  placeholder="••••••••"
                  className="auth-input"
                  style={inputStyle('password')}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                {errors.password && <p className="mt-1.5 text-xs text-error">{errors.password.message}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className={`sign-in-btn w-full p-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-250 ease-in-out ${
                  isLoading ? 'cursor-not-allowed opacity-70 bg-primary text-background' : 'cursor-pointer bg-primary text-background'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[rgba(6,20,35,0.3)] border-t-background rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'wght' 600" }}>arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <p className="mt-6 text-[13px] text-on-surface-variant text-center">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="text-primary font-bold no-underline">Create one</Link>
            </p>
          </div>

          {/* Secure badge */}
          <div className="mt-5 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 0" }}>shield</span>
            <span className="text-[11px] text-on-surface-variant font-medium">Secured with 256-bit encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
