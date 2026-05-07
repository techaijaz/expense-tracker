import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import authSchema from '@/schema/authSchema';

import { Link, useNavigate } from 'react-router-dom';
import api from '@/utils/httpMethods';
import { useDispatch, useSelector } from 'react-redux';
import { setAuthUser } from '@/features/auth/state/authSlice';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { setAccounts } from '@/features/accounts/state/accountSlice';
import { setCategories } from '@/features/categories/state/categorySlice';
import { GoogleLogin } from '@react-oauth/google';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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

  const onGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    try {
      const response = await api.post('/user/google-login', {
        credential: credentialResponse.credential,
      });
      if (response.success) {
        const user = response.data.user;
        dispatch(setAuthUser(user));
        dispatch(setAccounts(response.data.accounts));
        dispatch(setCategories(response.data.categories));

        if (user.onboardingDone) {
          navigate('/dashboard');
        } else {
          navigate('/onboarding');
        }
        toast.success('Signed in with Google!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Google login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text font-body selection:bg-accent/30 relative overflow-hidden flex flex-col">
      <style>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .glass-panel {
          background: var(--glass-bg);
          backdrop-filter: blur(12px);
          border: 1px solid var(--border);
        }
      `}</style>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-2 md:py-4 relative">
        {/* Decorative Ambient Background Elements */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-md z-10 space-y-2 md:space-y-4">
          {/* Brand Header */}
          <div className="flex flex-col items-center gap-1.5 text-center">
            <div className="flex items-center justify-center gap-2.5 mb-0.5">
              <div className="flex items-center justify-center p-2 rounded-xl bg-accent-glow">
                <span
                  className="material-symbols-outlined text-accent text-xl md:text-2xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  account_balance_wallet
                </span>
              </div>
              <h1 className="font-headline text-2xl md:text-3xl font-extrabold tracking-tighter text-text">
                aiexpenser
              </h1>
            </div>
            <p className="font-body text-text3 tracking-wide text-[10px] md:text-xs">
              Design your financial future with precision.
            </p>
          </div>

          {/* Sign In Card */}
          <div className="w-full bg-bg2 rounded-2xl shadow-xl p-5 md:p-6 transition-all duration-300 backdrop-blur-sm border border-border">
            <header className="mb-4 md:mb-5 text-center uppercase tracking-tight">
              <h1 className="font-headline text-xl md:text-2xl font-bold text-text mb-1">
                Welcome Back
              </h1>
              <p className="text-text3 font-medium text-[10px] md:text-xs">
                Access your financial architecture.
              </p>
            </header>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <label
                  className="block text-[10px] font-bold uppercase tracking-[0.2em] text-text3 ml-1"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="name@firm.com"
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className={errors.email ? 'border-red/50 focus-visible:ring-red' : ''}
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-[11px] font-medium text-red ml-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label
                    className="block text-[10px] font-bold uppercase tracking-[0.2em] text-text3"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] font-bold text-accent hover:text-accent2 transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    {...register('password')}
                    placeholder="••••••••"
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className={errors.password ? 'border-red/50 focus-visible:ring-red' : ''}
                  />
                  {errors.password && (
                    <p className="mt-1.5 text-[11px] font-medium text-red ml-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full font-bold py-2.5 md:py-3 text-[10px] md:text-[11px] uppercase tracking-[0.15em] shadow-lg shadow-accent/20 flex items-center justify-center gap-2.5 h-auto rounded-xl"
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
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-3 md:my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border)]"></div>
              </div>
              <div className="relative flex justify-center text-[9px] uppercase tracking-[0.25em] font-black">
                <span className="bg-bg2 px-3 text-text3/60">
                  OR
                </span>
              </div>
            </div>

            {/* Google Social Button */}
            <div className="flex justify-center scale-90 md:scale-100">
              <GoogleLogin
                onSuccess={onGoogleSuccess}
                onError={() => toast.error('Google Login Failed')}
                useOneTap
                theme="filled_black"
                shape="pill"
                size="large"
                width="100%"
              />
            </div>

            {/* Footer Link */}
            <p className="mt-3 md:mt-4 text-center text-[11px] md:text-[12px] text-text3 font-medium">
              Don&apos;t have an account?{' '}
              <Link
                to="/signup"
                className="text-accent font-bold hover:underline decoration-accent/30 underline-offset-4 transition-all"
              >
                Sign up
              </Link>
            </p>
          </div>

          {/* Secure badge */}
          <div className="mt-3 md:mt-4 flex items-center justify-center gap-2 opacity-40">
            <span className="material-symbols-outlined text-[14px] md:text-[16px] text-text3">
              lock
            </span>
            <span className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] font-black text-text3">
              Secure Vault Access
            </span>
          </div>
        </div>
      </main>

      {/* Footer Identity Rail (Asymmetric) */}
      <footer className="hidden lg:flex fixed bottom-6 left-8 items-center justify-center pointer-events-none">
        <div className="flex flex-col gap-1 px-4 py-2 bg-surface-container/30 backdrop-blur-sm rounded-lg opacity-30">
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-text3">
            Powered by aiexpenser
          </span>
          <div className="h-0.5 w-6 bg-accent/20 rounded-full"></div>
        </div>
      </footer>
    </div>
  );
}

export default SignIn;
