import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import authSchema from '@/schema/authSchema';
import { Link } from 'react-router-dom';
import api from '@/utils/httpMethods';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    document.title = 'Forgot Password | aiexpenser';
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(authSchema.forgotPasswordSchema()) });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await api.post('/user/forgot-password', data);
      if (response.success) {
        setIsSent(true);
        toast.success(response.message || 'Reset link sent to your email!');
      } else {
        toast.error(response.data.message || 'Failed to send reset link.');
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
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary-container/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-tertiary-container/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-md z-10 space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 rounded-xl bg-surface-container-high mb-4">
              <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                lock_reset
              </span>
            </div>
            <h1 className="font-headline text-4xl font-extrabold tracking-tighter text-on-surface">
              Recover Access
            </h1>
            <p className="font-body text-on-surface-variant tracking-wide text-sm">
              We'll help you get back into your financial vault.
            </p>
          </div>

          <div className="bg-surface-container rounded-2xl shadow-2xl p-8 transition-all duration-300 backdrop-blur-sm border border-surface/10">
            {isSent ? (
              <div className="text-center space-y-6 py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green/10 text-green mb-2">
                  <span className="material-symbols-outlined text-3xl">mark_email_read</span>
                </div>
                <h2 className="text-2xl font-bold text-on-surface">Check your email</h2>
                <p className="text-on-surface-variant text-sm">
                  We've sent a password reset link to your email address. Please follow the instructions to reset your password.
                </p>
                <Link
                  to="/signin"
                  className="inline-block w-full bg-surface-container-high text-on-surface font-bold py-3.5 rounded-xl text-[12px] uppercase tracking-[0.15em] hover:bg-surface-bright transition-all"
                >
                  Back to Sign In
                </Link>
              </div>
            ) : (
              <>
                <header className="mb-8 text-center uppercase tracking-tight">
                  <h1 className="font-headline text-2xl font-bold text-on-surface mb-2">
                    Forgot Password?
                  </h1>
                  <p className="text-on-surface-variant font-medium text-sm">
                    Enter your email to receive a reset link.
                  </p>
                </header>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-1" htmlFor="email">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        type="email"
                        {...register('email')}
                        placeholder="name@firm.com"
                        className={`w-full bg-surface-container-lowest rounded-xl py-3 px-4 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-on-surface-variant/40 text-sm ${errors.email ? 'border-error/50 focus:border-error' : ''}`}
                      />
                      {errors.email && (
                        <p className="mt-1.5 text-[11px] font-medium text-error ml-1">
                          {errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-primary-container to-primary text-white font-bold py-3.5 rounded-xl text-[12px] uppercase tracking-[0.15em] shadow-lg shadow-primary-container/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-[rgba(255,255,255,0.3)] border-t-white rounded-full animate-spin" />
                    ) : null}
                    {isLoading ? 'Sending Link...' : 'Send Reset Link'}
                    {!isLoading && (
                      <span className="material-symbols-outlined text-base">
                        send
                      </span>
                    )}
                  </button>
                </form>

                <p className="mt-8 text-center text-[13px] text-on-surface-variant font-medium">
                  Remembered your password?{' '}
                  <Link
                    to="/signin"
                    className="text-primary font-bold hover:underline decoration-primary/30 underline-offset-4 transition-all"
                  >
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ForgotPassword;
