import authSchema from '@/schema/authSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { FcGoogle } from 'react-icons/fc';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/utils/httpMethods';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

// Password Strength Component
function SecurityStrength({ password = '' }) {
  const getStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'Weak' };
    let score = 0;
    if (pwd.length > 6) score++;
    if (pwd.length > 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score < 2) return { score: 1, label: 'Weak' };
    if (score < 4) return { score: 2, label: 'Medium' };
    if (score < 5) return { score: 3, label: 'Strong' };
    return { score: 4, label: 'Very Strong' };
  };

  const { score, label } = getStrength(password);
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">Security Strength</span>
        <span className={`text-[10px] font-bold uppercase tracking-tighter transition-colors duration-300 ${
          score >= 3 ? 'text-primary' : score === 2 ? 'text-orange-400' : 'text-error'
        }`}>{label}</span>
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((step) => (
          <div 
            key={step} 
            className={`strength-segment transition-all duration-300 ${step <= score ? 'strength-active' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}

// Fixed Insights Rail for Desktop
function InsightsRail() {
  return (
    <div className="hidden xl:flex fixed right-12 top-1/2 -translate-y-1/2 w-64 flex-col gap-6">
      <div className="glass-panel p-6 rounded-xl ghost-border space-y-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">Architect Intelligence</span>
        </div>
        <p className="font-headline text-sm font-bold text-on-surface leading-tight">
          Users who configure automated budgets save 22% more on average.
        </p>
        <div className="h-1 w-12 bg-primary/20 rounded-full"></div>
      </div>
      <div className="p-6 rounded-xl space-y-4 opacity-40 grayscale">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-outline">query_stats</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-outline">Real-time Analysis</span>
        </div>
        <div className="space-y-2">
          <div className="h-2 w-full bg-surface-container-high rounded-full"></div>
          <div className="h-2 w-3/4 bg-surface-container-high rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

function SignUp() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = 'Sign Up | aiexpenser';
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ 
    resolver: zodResolver(authSchema.signUpSchema()),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    }
  });

  const password = watch('password');

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

  const inputClass = "w-full bg-surface-container-lowest border-none rounded-lg px-4 py-3 text-on-surface placeholder:text-outline-variant focus:ring-1 focus:ring-primary/20 transition-all font-body text-sm ghost-border outline-none";
  const labelClass = "font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant";

  return (
    <div className="bg-surface selection:bg-primary/30 selection:text-primary min-h-screen flex flex-col items-center justify-center p-4 font-body">
      <div className="w-full max-w-[480px] space-y-8 py-10">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-xl bg-surface-container-high mb-4">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
          </div>
          <h1 className="font-headline text-4xl font-extrabold tracking-tighter text-on-surface">aiexpenser</h1>
          <p className="font-body text-on-surface-variant tracking-wide">Design your financial future with precision.</p>
        </div>

        {/* Main Sign Up Card */}
        <main className="bg-surface-container rounded-xl p-8 space-y-6 border border-on-surface/10 shadow-2xl relative overflow-hidden">
          {/* Subtle Decorative Gradient */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-[80px]"></div>
          
          <header className="relative z-10">
            <h2 className="font-headline text-2xl font-bold text-on-surface">Create your account</h2>
            <p className="font-body text-sm text-on-surface-variant mt-1">Start your journey to premium wealth management.</p>
          </header>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 relative z-10" id="signup-form">
            {/* Name Fields Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass} htmlFor="firstName">First Name</label>
                <input 
                  {...register('firstName')} 
                  className={inputClass} 
                  id="firstName" 
                  placeholder="Alexander" 
                  type="text" 
                />
                {errors.firstName && <p className="text-[10px] text-error mt-1">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className={labelClass} htmlFor="lastName">Last Name</label>
                <input 
                  {...register('lastName')} 
                  className={inputClass} 
                  id="lastName" 
                  placeholder="Hamilton" 
                  type="text" 
                />
                {errors.lastName && <p className="text-[10px] text-error mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="email">Email Address</label>
              <input 
                {...register('email')} 
                className={inputClass} 
                id="email" 
                placeholder="name@vault.com" 
                type="email" 
              />
              {errors.email && <p className="text-[10px] text-error mt-1">{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="password">Password</label>
              <input 
                {...register('password')} 
                className={inputClass} 
                id="password" 
                placeholder="••••••••" 
                type="password" 
              />
              {errors.password && <p className="text-[10px] text-error mt-1">{errors.password.message}</p>}
            </div>

            {/* Password Strength Indicator */}
            <SecurityStrength password={password} />

            {/* Action Buttons */}
            <div className="pt-4 space-y-3">
              <button 
                disabled={isLoading}
                className="w-full editorial-gradient py-3.5 rounded-lg text-white font-label text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2" 
                type="submit"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-[rgba(255,255,255,0.3)] border-t-white rounded-full animate-spin" />
                ) : null}
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-on-surface/5"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-tighter">
                  <span className="bg-surface-container px-4 text-on-surface-variant font-medium">Or architectural access</span>
                </div>
              </div>

              <button 
                className="w-full bg-surface-container-high py-3.5 rounded-lg text-on-surface font-label text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-surface-bright transition-all active:scale-[0.98]" 
                type="button"
                onClick={() => toast.info("Google access coming soon")}
              >
                <FcGoogle className="w-4 h-4" />
                Continue with Google
              </button>
            </div>
          </form>

          <footer className="pt-6 border-t border-on-surface/5 flex flex-col items-center gap-4">
            <div className="flex items-start gap-3 bg-surface-container-lowest/50 p-3 rounded-lg ghost-border">
              <span className="material-symbols-outlined text-primary text-sm">shield</span>
              <p className="font-body text-[11px] leading-relaxed text-on-surface-variant">
                Your data is completely private. We don't require bank account credentials. All encryption follows high-tier Swiss financial standards.
              </p>
            </div>
            <p className="text-sm font-body text-on-surface-variant">
              Already have an account? 
              <Link className="text-primary font-semibold hover:underline underline-offset-4 ml-1" to="/">Sign in</Link>
            </p>
          </footer>
        </main>

        {/* Aesthetic Footer Links */}
        <nav className="flex justify-center gap-8 pt-4">
          <a className="text-[10px] uppercase font-bold tracking-widest text-outline-variant hover:text-on-surface transition-colors" href="#">Security Audit</a>
          <a className="text-[10px] uppercase font-bold tracking-widest text-outline-variant hover:text-on-surface transition-colors" href="#">Privacy Charter</a>
          <a className="text-[10px] uppercase font-bold tracking-widest text-outline-variant hover:text-on-surface transition-colors" href="#">Terms of Vault</a>
        </nav>
      </div>

      {/* Asymmetric Signature Components */}
      <InsightsRail />
    </div>
  );
}

export default SignUp;
