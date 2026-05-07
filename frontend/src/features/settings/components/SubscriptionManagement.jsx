import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import api from '@/utils/httpMethods';
import { updatePlan } from '@/features/auth/state/authSlice';
import { Zap, AlertCircle, Calendar, Shield, Loader2, CreditCard } from 'lucide-react';
import useFormat from '@/hooks/useFormat';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import SubscriptionPopup from '@/features/settings/components/SubscriptionPopup';
import { ConfirmModal } from '@/components/common/SharedComponents';

export default function SubscriptionManagement() {
  const { formatDate } = useFormat();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const userObj = user?.user || user;
  const plan = userObj?.plan || 'basic';
  const isAdmin = userObj?.role === 'admin';
  const period = userObj?.subscriptionPeriod;
  const expiryDate = userObj?.subscriptionEnd;
  const isPro = isAdmin || plan === 'pro';

  const handleCancel = async () => {
    setLoading(true);
    try {
      const res = await api.patch('/subscription/cancel', {});
      dispatch(updatePlan(res.data));
      toast.success(
        'Your subscription has been cancelled and reverted to Basic.',
      );
      setShowCancelModal(false);
    } catch (err) {
      console.error('Subscription cancellation failed:', err);
      let errorMsg = 'Cancellation failed';
      if (err.response) {
        errorMsg = err.response.data.message || 'Error occurred';
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeToYearly = async () => {
    setLoading(true);
    try {
      const res = await api.patch('/user/subscription', {
        plan: 'pro',
        period: 'yearly',
      });
      dispatch(updatePlan(res.data));
      toast.success('Successfully upgraded to Pro Yearly!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upgrade failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold">Subscription & Billing</CardTitle>
            <CardDescription className="text-xs">Manage your plan and billing preferences</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-xl ${isPro ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}
              >
                {isPro ? <Zap size={24} fill="currentColor" /> : <Shield size={24} />}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Current Plan</div>
                <div className="text-xl font-black text-slate-800 dark:text-white">
                  {isAdmin ? 'Admin Access' : (plan === 'pro'
                    ? `Pro ${period === 'monthly' ? 'Monthly' : 'Yearly'}`
                    : 'Basic Plan')}
                </div>
              </div>
            </div>
            {isPro && (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                Active
              </Badge>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-1 text-sm">
              <div className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                {isAdmin ? (
                  <>
                    <Shield size={14} />
                    <span>System Administrator - Unrestricted Access</span>
                  </>
                ) : (plan === 'pro' ? (
                  <>
                    <Zap size={14} className="text-indigo-500" />
                    <span>Premium features unlocked</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={14} className="text-orange-500" />
                    <span>Limited feature access</span>
                  </>
                ))}
              </div>
              {plan === 'pro' && !isAdmin && expiryDate && (
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <Calendar size={12} />
                  <span>Next billing: {formatDate(expiryDate)}</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              {plan === 'pro' && !isAdmin && period === 'monthly' && (
                <Button
                  onClick={handleUpgradeToYearly}
                  disabled={loading}
                  className="w-full h-11 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 gap-2 font-bold transition-all"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Zap size={16} fill="currentColor" />
                  )}
                  Upgrade to Pro Yearly (Save 33%)
                </Button>
              )}

              {plan === 'basic' && !isAdmin && (
                <Button
                  onClick={() => setShowPopup(true)}
                  className="w-full h-11 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 gap-2 font-bold transition-all"
                >
                  <Zap size={16} fill="currentColor" />
                  Upgrade to Pro
                </Button>
              )}

              {plan === 'pro' && !isAdmin && (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => setShowCancelModal(true)}
                    disabled={loading}
                    className="text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors underline underline-offset-4"
                  >
                    Cancel Subscription
                  </button>
                </div>
              )}

              {isAdmin && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed italic">
                  Administrator accounts are exempt from subscription limitations and have global access to all features.
                </div>
              )}
            </div>
          </div>
        </div>

        {plan === 'basic' && !isAdmin && (
          <div className="grid grid-cols-2 gap-3">
            {[
              'Unlimited Accounts',
              'Advanced Analytics',
              'Automated Reports',
              'Priority Support'
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                {feature}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <SubscriptionPopup isOpen={showPopup} onOpenChange={setShowPopup} />

      {showCancelModal && (
        <ConfirmModal
          title="Cancel Subscription"
          description="Are you sure you want to cancel your Pro subscription? You will immediately lose access to premium features like advanced analytics, unlimited accounts, and automated bill tracking."
          confirmLabel="Cancel Subscription"
          onConfirm={handleCancel}
          onCancel={() => setShowCancelModal(false)}
          busy={loading}
          danger={true}
        />
      )}
    </Card>
  );
}
