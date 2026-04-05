import authSchema from '@/schema/authSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { FcGoogle } from 'react-icons/fc';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/utils/httpMethods';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

// Decorative benefit row
function FeatureRow({ icon, title, desc, delay }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div className={`flex items-start gap-4 transition-all duration-[550ms] ease-out ${
      visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
    }`}>
      <div className="w-10 h-10 rounded-xl bg-surface-variant border border-surface-variant flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-lg text-primary" style={{ fontVariationSettings: "'FILL' 0" }}>{icon}</span>
      </div>
      <div>
        <div className="text-[13px] font-bold text-on-surface mb-0.5">{title}</div>
        <div className="text-xs text-on-surface-variant leading-[1.6]">{desc}</div>
      </div>
    </div>
  );
}

// Animated orbit decoration
function OrbitDeco() {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] pointer-events-none">
      {[340, 260, 180].map((size, i) => (
        <div key={i} className="absolute top-1/2 left-1/2 rounded-full" style={{
          width: size, height: size,
          marginTop: -size / 2, marginLeft: -size / 2,
          border: `1px solid rgba(76,214,251,${0.04 + i * 0.03})`,
          animation: `orbit ${12 + i * 4}s linear infinite ${i % 2 === 0 ? '' : 'reverse'}`,
        }}>
          {i === 0 && (
            <div className="absolute top-0 left-1/2 -ml-1 -mt-1 w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_var(--accent-color)]" />
          )}
        </div>
      ))}
    </div>
  );
}

function SignUp() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    document.title = 'Create Account | aiexpenser';
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(authSchema.signUpSchema()) });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await api.post('/user/register', data);
      if (response.success) {
        toast.success(response.message || 'Registration successful!');
        navigate('/');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = (field) => ({
    width: '100%',
    padding: '11px 16px',
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
        @keyframes orbit { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes gridScroll { from { transform: translateY(0); } to { transform: translateY(60px); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
        .auth-input::placeholder { color: var(--text-muted); }
        .auth-input::-webkit-autofill { -webkit-box-shadow: 0 0 0 1000px #0a1f35 inset !important; -webkit-text-fill-color: var(--text-primary) !important; }
        .google-btn:hover { background: var(--hover-bg) !important; }
        .sign-up-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); box-shadow: 0 8px 32px var(--hover-bg); }
        .sign-up-btn:active { transform: translateY(0); }
      `}</style>

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex flex-col justify-center relative overflow-hidden px-14 py-16 basis-[48%]" style={{ flex: '0 0 48%' }}>
        {/* Background grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--hover-bg) 1px, transparent 1px), linear-gradient(90deg, var(--hover-bg) 1px, transparent 1px)', backgroundSize: '48px 48px', animation: 'gridScroll 8s linear infinite', opacity: 0.6 }} />

        {/* Orbit decoration centered in left panel */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
          <OrbitDeco />
        </div>

        {/* Radial glow */}
        <div className="absolute top-[40%] left-1/2 w-[400px] h-[400px] rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2" style={{ background: 'radial-gradient(circle, var(--hover-bg) 0%, transparent 70%)' }} />

        {/* Content */}
        <div className="relative z-[2]">
          {/* Brand */}
          <div className="mb-14" style={{ animation: 'fadeIn 0.5s ease forwards' }}>
            <div className="flex items-center gap-2.5 mb-1 text-2xl font-black text-primary tracking-[-0.04em]">
              <svg width="30" height="30" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <rect width="36" height="36" rx="10" fill="url(#suLogoGrad)"/>
                <path d="M10 24L18 10L26 24" stroke="var(--bg-primary)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13 20H23" stroke="var(--bg-primary)" strokeWidth="2.2" strokeLinecap="round"/>
                <circle cx="18" cy="27" r="2" fill="var(--bg-primary)"/>
                <defs><linearGradient id="suLogoGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse"><stop stopColor="var(--accent-color)"/><stop offset="1" stopColor="var(--accent-color)"/></linearGradient></defs>
              </svg>
              aiexpenser
            </div>
            <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-on-surface-variant">Smart Finance</div>
          </div>

          {/* Heading */}
          <div className="mb-12" style={{ animation: 'fadeIn 0.6s 0.1s ease both' }}>
            <h1 className="text-[34px] font-extrabold text-on-surface leading-[1.2] tracking-[-0.03em] mb-3.5">
              Start your journey<br />to <span className="text-primary">financial clarity.</span>
            </h1>
            <p className="text-sm text-on-surface-variant leading-[1.75]">
              Join thousands of users managing money with precision and confidence.
            </p>
          </div>

          {/* Feature list */}
          <div className="flex flex-col gap-5.5">
            <FeatureRow icon="dashboard" title="Unified Dashboard" desc="See all your accounts, income, and expenses at a glance." delay={200} />
            <FeatureRow icon="receipt_long" title="Smart Transaction Tracking" desc="Categorize and filter every transaction automatically." delay={380} />
            <FeatureRow icon="account_balance_wallet" title="Multi-Account Support" desc="Link wallets, banks, and credit cards in one place." delay={560} />
            <FeatureRow icon="monitoring" title="Trend Analytics" desc="Visualize your spending patterns with beautiful charts." delay={740} />
          </div>

          {/* Social proof */}
          <div className="mt-11 px-5 py-4 bg-surface-variant border border-surface-variant rounded-xl" style={{ animation: 'fadeIn 0.6s 0.9s ease both' }}>
            <div className="flex items-center gap-2.5 mb-2.5">
              {/* Avatar stack */}
              {['A', 'B', 'C', 'D'].map((l, i) => (
                <div key={i} className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white border-2 border-background ${i > 0 ? '-ml-2' : ''}`} style={{ background: `hsl(${180 + i * 40}, 60%, 50%)` }}>
                  {l}
                </div>
              ))}
              <span className="text-xs text-on-surface-variant ml-1">+2.4k users this month</span>
            </div>
            <div className="flex gap-0.5 items-center">
              {[1,2,3,4,5].map(s => <span key={s} className="material-symbols-outlined text-sm text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>)}
              <span className="text-xs text-on-surface-variant ml-2">4.9/5 average rating</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (Form) ── */}
      <div className="flex-1 flex items-center justify-center py-10 px-6 relative">
        {/* Divider */}
        <div className="hidden lg:block absolute left-0 top-[8%] bottom-[8%] w-[1px] bg-[linear-gradient(180deg,transparent,var(--hover-bg),transparent)]" />

        <div className="w-full max-w-[420px]" style={{ animation: 'fadeIn 0.5s 0.2s ease both' }}>
          {/* Mobile brand */}
          <div className="lg:hidden mb-9 text-center">
            <div className="flex items-center gap-2 justify-center mb-0.5 text-[22px] font-black text-primary tracking-[-0.04em]">
              <svg width="26" height="26" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="36" height="36" rx="10" fill="url(#suMLogoGrad)"/>
                <path d="M10 24L18 10L26 24" stroke="var(--bg-primary)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13 20H23" stroke="var(--bg-primary)" strokeWidth="2.2" strokeLinecap="round"/>
                <circle cx="18" cy="27" r="2" fill="var(--bg-primary)"/>
                <defs><linearGradient id="suMLogoGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse"><stop stopColor="var(--accent-color)"/><stop offset="1" stopColor="var(--accent-color)"/></linearGradient></defs>
              </svg>
              aiexpenser
            </div>
            <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-on-surface-variant mt-1">Smart Finance</div>
          </div>

          {/* Card */}
          <div className="bg-secondary-container border border-secondary-container rounded-[20px] px-9 pt-9 pb-8 backdrop-blur-[20px]">
            <h2 className="text-[22px] font-extrabold text-on-surface tracking-[-0.02em] mb-1.5">Create account</h2>
            <p className="text-[13px] text-on-surface-variant mb-[26px]">Start your free account — no credit card needed</p>

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Google */}
              <button
                type="button"
                className="google-btn w-full p-2.5 bg-secondary-container border border-secondary-container rounded-[10px] text-on-surface text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-2.5 mb-5 transition-colors duration-200"
                onClick={(e) => e.preventDefault()}
              >
                <FcGoogle className="w-[18px] h-[18px]" />
                Continue with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-[1px] bg-secondary-container" />
                <span className="text-[11px] font-semibold text-on-surface-variant tracking-[0.05em]">OR</span>
                <div className="flex-1 h-[1px] bg-secondary-container" />
              </div>

              {/* Name row */}
              <div className="grid grid-cols-2 gap-3 mb-[14px]">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-[7px]">First Name</label>
                  <input
                    type="text"
                    {...register('firstName')}
                    placeholder="John"
                    className="auth-input"
                    style={inputStyle('firstName')}
                    onFocus={() => setFocusedField('firstName')}
                    onBlur={() => setFocusedField(null)}
                  />
                  {errors.firstName && <p className="mt-[5px] text-[11px] text-error">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-[7px]">Last Name</label>
                  <input
                    type="text"
                    {...register('lastName')}
                    placeholder="Doe"
                    className="auth-input"
                    style={inputStyle('lastName')}
                    onFocus={() => setFocusedField('lastName')}
                    onBlur={() => setFocusedField(null)}
                  />
                  {errors.lastName && <p className="mt-[5px] text-[11px] text-error">{errors.lastName.message}</p>}
                </div>
              </div>

              {/* Email */}
              <div className="mb-[14px]">
                <label className="block text-xs font-semibold text-on-surface-variant mb-[7px]">Email address</label>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="you@example.com"
                  className="auth-input"
                  style={inputStyle('email')}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
                {errors.email && <p className="mt-[5px] text-[11px] text-error">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div className="mb-[22px]">
                <label className="block text-xs font-semibold text-on-surface-variant mb-[7px]">Password</label>
                <input
                  type="password"
                  {...register('password')}
                  placeholder="Min. 8 characters"
                  className="auth-input"
                  style={inputStyle('password')}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                {errors.password && <p className="mt-[5px] text-[11px] text-error">{errors.password.message}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className={`sign-up-btn w-full p-[13px] rounded-[10px] text-sm font-bold flex items-center justify-center gap-2 transition-all duration-250 ease-in-out ${
                  isLoading ? 'cursor-not-allowed opacity-70 bg-primary text-background' : 'cursor-pointer bg-primary text-background'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[rgba(6,20,35,0.3)] border-t-background rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Free Account
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'wght' 600" }}>arrow_forward</span>
                  </>
                )}
              </button>

              {/* Terms */}
              <p className="mt-3.5 text-[11px] text-on-surface-variant text-center leading-[1.6]">
                By creating an account you agree to our{' '}
                <a href="#" className="text-primary no-underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-primary no-underline">Privacy Policy</a>
              </p>
            </form>

            {/* Sign in link */}
            <p className="mt-[22px] text-[13px] text-on-surface-variant text-center">
              Already have an account?{' '}
              <Link to="/" className="text-primary font-bold no-underline">Sign in</Link>
            </p>
          </div>

          {/* Security badge */}
          <div className="mt-5 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 0" }}>shield</span>
            <span className="text-[11px] text-on-surface-variant font-medium">Secured with 256-bit encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
