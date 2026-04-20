import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import api from '@/utils/httpMethods';
import { updatePlan } from '@/redux/authSlice';
import { Zap, AlertCircle, Calendar, Shield, Loader2 } from 'lucide-react';
import dayjs from 'dayjs';

import SubscriptionPopup from '../SubscriptionPopup';
import { ConfirmModal } from '../SharedComponents';

export default function SubscriptionManagement() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const plan = user?.plan || 'basic';
  const period = user?.subscriptionPeriod;
  const expiryDate = user?.subscriptionEnd;

  const handleCancel = async () => {
    setLoading(true);
    try {
      const res = await api.patch('/subscription/cancel', {});
      dispatch(updatePlan(res.data));
      toast.success('Your subscription has been cancelled and reverted to Basic.');
      setShowCancelModal(false);
    } catch (err) {
      console.error('Subscription cancellation failed:', err);
      let errorMsg = 'Cancellation failed';
      if (err.response) {
        console.error('Error response data:', err.response.data);
        errorMsg = err.response.data.message || `Error ${err.response.status}: ${JSON.stringify(err.response.data).substring(0, 50)}...`;
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeToYearly = async () => {
    setLoading(true);
    try {
      const res = await api.patch('/user/subscription', { plan: 'pro', period: 'yearly' });
      dispatch(updatePlan(res.data));
      toast.success('Successfully upgraded to Pro Yearly!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upgrade failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-card">
      <div className="settings-section-title">
        <div className="icon">💳</div>Subscription & Billing
      </div>

      <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${plan === 'pro' ? 'bg-[#5B8DEF]/20 text-[#5B8DEF]' : 'bg-white/10 text-[#8892B0]'}`}>
              {plan === 'pro' ? <Zap size={20} /> : <Shield size={20} />}
            </div>
            <div>
              <div className="text-sm font-bold text-white uppercase tracking-wider">
                {plan === 'pro' ? `Pro ${period === 'monthly' ? 'Monthly' : 'Yearly'}` : 'Basic Plan'}
              </div>
              <div className="text-xs text-[#8892B0]">
                {plan === 'pro' ? 'Premium features unlocked' : 'Limited feature access'}
              </div>
            </div>
          </div>
          {plan === 'pro' && (
            <span className="px-2 py-1 rounded text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
              ACTIVE
            </span>
          )}
        </div>

        {plan === 'pro' && expiryDate && (
          <div className="flex items-center gap-2 mb-4 text-xs text-[#8892B0]">
            <Calendar size={14} />
            <span>Expires on: {dayjs(expiryDate).format('MMMM DD, YYYY')}</span>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {plan === 'pro' && period === 'monthly' && (
            <button
              onClick={handleUpgradeToYearly}
              disabled={loading}
              className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} fill="currentColor" />}
              Upgrade to Pro Yearly (Save 33%)
            </button>
          )}

          {plan === 'pro' && (
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={loading}
              className="text-[#8892B0] hover:text-red-400 text-xs font-medium transition-colors text-center mt-2 underline underline-offset-4 decoration-white/10"
            >
              Cancel Subscription
            </button>
          )}

          {plan === 'basic' && (
            <>
              <div className="text-xs text-[#8892B0] bg-white/5 p-3 rounded-lg flex items-start gap-2 mb-2">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <span>You are currently using the limited version. Upgrade to Pro for unlimited accounts, budgets, and advanced analytics.</span>
              </div>
              <button
                onClick={() => setShowPopup(true)}
                className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-2"
              >
                <Zap size={14} fill="currentColor" />
                Upgrade Plan
              </button>
            </>
          )}
        </div>
      </div>

      <SubscriptionPopup 
        isOpen={showPopup} 
        onOpenChange={setShowPopup} 
      />

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
    </div>
  );
}
