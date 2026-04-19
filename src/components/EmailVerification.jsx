import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '@/utils/httpMethods';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

function EmailVerification() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('Please wait while we verify your email address.');

  useEffect(() => {
    document.title = 'Email Verification | aiexpenser';
    
    const verifyToken = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid or missing verification token.');
        return;
      }

      try {
        const response = await api.get(`/user/verify-email?token=${token}`);
        if (response.success) {
          setStatus('success');
          setMessage(response.message || 'Email verified successfully!');
          toast.success('Email verified! You can now sign in.');
        } else {
          setStatus('error');
          setMessage(response.data.message || 'Verification failed. The link might be expired.');
        }
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'An error occurred during verification.');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body selection:bg-primary-container/30 relative overflow-hidden flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary-container/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-tertiary-container/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-md z-10 space-y-8 text-center">
          <div className="bg-surface-container rounded-2xl shadow-2xl p-10 transition-all duration-300 backdrop-blur-sm border border-surface/10 space-y-8">
            <div className="space-y-4">
              {status === 'verifying' && (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
                  <h2 className="text-2xl font-bold text-on-surface">Verifying your email...</h2>
                </div>
              )}

              {status === 'success' && (
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-green/10 text-green flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-5xl">verified</span>
                  </div>
                  <h2 className="text-3xl font-bold text-on-surface">Verified!</h2>
                  <p className="text-on-surface-variant mt-2">{message}</p>
                </div>
              )}

              {status === 'error' && (
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-red/10 text-red flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-5xl">error</span>
                  </div>
                  <h2 className="text-3xl font-bold text-on-surface">Oops!</h2>
                  <p className="text-on-surface-variant mt-2">{message}</p>
                </div>
              )}
            </div>

            <div className="pt-4">
              {status === 'success' ? (
                <Link
                  to="/signin"
                  className="w-full bg-gradient-to-r from-primary-container to-primary text-white font-bold py-4 rounded-xl text-[12px] uppercase tracking-[0.15em] shadow-lg shadow-primary-container/20 hover:scale-[1.02] active:scale-[0.98] transition-all block"
                >
                  Go to Sign In
                </Link>
              ) : (
                <Link
                  to="/signin"
                  className="w-full bg-surface-container-high text-on-surface font-bold py-4 rounded-xl text-[12px] uppercase tracking-[0.15em] hover:bg-surface-bright transition-all block"
                >
                  Back to Sign In
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 opacity-50">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
              shield_check
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] font-black text-on-surface-variant">
              Identity Verified
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default EmailVerification;
