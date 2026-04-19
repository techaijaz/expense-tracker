import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import authSchema from '@/schema/authSchema';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '@/utils/httpMethods';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = 'Reset Password | aiexpenser';
    if (!token) {
      toast.error('Invalid or missing reset token.');
      navigate('/signin');
    }
  }, [token, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(authSchema.resetPasswordSchema()) });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await api.post(`/user/reset-password?token=${token}`, {
        password: data.password,
      });
      if (response.success) {
        toast.success(response.message || 'Password reset successful!');
        navigate('/signin');
      } else {
        toast.error(response.data.message || 'Failed to reset password.');
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
                password
              </span>
            </div>
            <h1 className="font-headline text-4xl font-extrabold tracking-tighter text-on-surface">
              New Password
            </h1>
            <p className="font-body text-on-surface-variant tracking-wide text-sm">
              Secure your architecture with a strong new credential.
            </p>
          </div>

          <div className="bg-surface-container rounded-2xl shadow-2xl p-8 transition-all duration-300 backdrop-blur-sm border border-surface/10">
            <header className="mb-8 text-center uppercase tracking-tight">
              <h1 className="font-headline text-2xl font-bold text-on-surface mb-2">
                Reset Password
              </h1>
              <p className="text-on-surface-variant font-medium text-sm">
                Choose a strong password for your account.
              </p>
            </header>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-1" htmlFor="password">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    {...register('password')}
                    placeholder="••••••••"
                    className={`w-full bg-surface-container-lowest rounded-xl py-3 px-4 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-on-surface-variant/40 text-sm ${errors.password ? 'border-error/50 focus:border-error' : ''}`}
                  />
                  {errors.password && (
                    <p className="mt-1.5 text-[11px] font-medium text-error ml-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-1" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type="password"
                    {...register('confirmPassword')}
                    placeholder="••••••••"
                    className={`w-full bg-surface-container-lowest rounded-xl py-3 px-4 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-on-surface-variant/40 text-sm ${errors.confirmPassword ? 'border-error/50 focus:border-error' : ''}`}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1.5 text-[11px] font-medium text-error ml-1">
                      {errors.confirmPassword.message}
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
                {isLoading ? 'Updating...' : 'Update Password'}
                {!isLoading && (
                  <span className="material-symbols-outlined text-base">
                    lock_open
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ResetPassword;
