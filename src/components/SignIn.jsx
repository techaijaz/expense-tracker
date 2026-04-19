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
        const user = response.data.user;
        dispatch(setAuthUser(user));
        dispatch(setAccounts(response.data.accounts));
        dispatch(setCategories(response.data.categories));

        if (user.onboardingDone) {
          navigate('/dashboard');
        } else {
          navigate('/onboarding');
        }

        toast.success(response.message || 'Login successful!');
      } else {
        toast.error(response.data.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'An error occurred. Please try again later.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body selection:bg-primary-container/30 relative overflow-hidden flex flex-col">
      <style>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .glass-panel {
          background: rgba(25, 31, 47, 0.8);
          backdrop-filter: blur(12px);
        }
      `}</style>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative">
        {/* Decorative Ambient Background Elements */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary-container/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-tertiary-container/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-md z-10 space-y-8">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 rounded-xl bg-surface-container-high mb-4">
              <span
                className="material-symbols-outlined text-primary text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                account_balance_wallet
              </span>
            </div>
            <h1 className="font-headline text-4xl font-extrabold tracking-tighter text-on-surface">
              aiexpenser
            </h1>
            <p className="font-body text-on-surface-variant tracking-wide text-sm">
              Design your financial future with precision.
            </p>
          </div>

          {/* Sign In Card */}
          <div className="bg-surface-container rounded-2xl shadow-2xl p-8 transition-all duration-300 backdrop-blur-sm border border-surface/10">
            <header className="mb-8 text-center uppercase tracking-tight">
              <h1 className="font-headline text-3xl font-bold text-on-surface mb-2">
                Welcome Back
              </h1>
              <p className="text-on-surface-variant font-medium text-sm">
                Access your financial architecture.
              </p>
            </header>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label
                  className="block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-1"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="name@firm.com"
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full bg-surface-container-lowest rounded-xl py-3 px-4 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-on-surface-variant/40 text-sm ${errors.email ? 'border-error/50 focus:border-error' : ''}`}
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-[11px] font-medium text-error ml-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label
                    className="block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] font-bold text-primary hover:text-on-primary-container transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    {...register('password')}
                    placeholder="••••••••"
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full bg-surface-container-lowest rounded-xl py-3 px-4 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-on-surface-variant/40 text-sm ${errors.password ? 'border-error/50 focus:border-error' : ''}`}
                  />
                  {errors.password && (
                    <p className="mt-1.5 text-[11px] font-medium text-error ml-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary-container to-primary text-white font-bold py-3.5 rounded-xl text-[12px] uppercase tracking-[0.15em] shadow-lg shadow-primary-container/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-[rgba(255,255,255,0.3)] border-t-white rounded-full animate-spin" />
                ) : null}
                {isLoading ? 'Signing In...' : 'Sign In'}
                {!isLoading && (
                  <span className="material-symbols-outlined text-base">
                    arrow_forward
                  </span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-on-surface/5"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-[0.25em] font-black">
                <span className="bg-surface-container px-4 text-on-surface-variant/60">
                  OR
                </span>
              </div>
            </div>

            {/* Google Social Button */}
            <button
              type="button"
              onClick={(e) => e.preventDefault()}
              className="w-full flex items-center justify-center gap-3 bg-surface-container-high hover:bg-surface-bright text-on-surface font-bold py-3.5 rounded-xl transition-all group text-[12px] uppercase tracking-[0.1em]"
            >
              <FcGoogle className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Continue with Google
            </button>

            {/* Footer Link */}
            <p className="mt-8 text-center text-[13px] text-on-surface-variant font-medium">
              Don&apos;t have an account?{' '}
              <Link
                to="/signup"
                className="text-primary font-bold hover:underline decoration-primary/30 underline-offset-4 transition-all"
              >
                Sign up
              </Link>
            </p>
          </div>

          {/* Secure badge */}
          <div className="mt-8 flex items-center justify-center gap-2 opacity-50">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
              lock
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] font-black text-on-surface-variant">
              Secure Vault Access
            </span>
          </div>
        </div>
      </main>

      {/* Footer Identity Rail (Asymmetric) */}
      <footer className="hidden lg:block fixed bottom-8 left-8">
        <div className="flex flex-col gap-1.5 px-4 py-2 bg-surface-container/30 backdrop-blur-sm rounded-lg">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-on-surface-variant/40">
            Powered by aiexpenser
          </span>
          <div className="h-0.5 w-8 bg-primary/30 rounded-full"></div>
        </div>
      </footer>
    </div>
  );
}

export default SignIn;
