import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Check, Zap, Star, ShieldCheck, X, Loader2 } from "lucide-react";
import { updatePlan } from '@/redux/authSlice';
import api from '@/utils/httpMethods';
import { toast } from 'sonner';

const loadScript = (src) => {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve(true);
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const SubscriptionPopup = ({ isOpen, onOpenChange }) => {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const currentPlan = user?.plan || 'basic';
  const currentPeriod = user?.subscriptionPeriod;
  
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [manualPaymentData, setManualPaymentData] = useState(null);
  const [submissionData, setSubmissionData] = useState({ transactionId: '', evidence: '', plan: '', period: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpgrade = async (planId, period) => {
    setLoadingPlan(period);
    try {
      // 1. Get Payment Config
      const configRes = await api.get('/subscription/config');
      const { gateway, razorpayKeyId, stripePublishableKey, manualPaymentInfo } = configRes.data;

      if (gateway === 'manual') {
        setManualPaymentData(manualPaymentInfo);
        setSubmissionData(prev => ({ ...prev, plan: 'pro', period }));
        return;
      }

      // 2. Create Order
      const orderRes = await api.post('/subscription/create-order', { plan: 'pro', period });
      const order = orderRes.data;

      if (gateway === 'razorpay') {
        const loaded = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
        if (!loaded) throw new Error('Razorpay SDK failed to load');

        const options = {
          key: razorpayKeyId,
          amount: order.amount,
          currency: order.currency,
          name: "AI Expenser",
          description: `Subscription: ${period}`,
          order_id: order.id,
          handler: async (response) => {
            try {
              const verifyRes = await api.post('/subscription/verify-payment', {
                paymentDetails: response,
                plan: 'pro',
                period
              });
              dispatch(updatePlan(verifyRes.data));
              toast.success('Subscription activated!');
              onOpenChange(false);
            } catch (err) {
              toast.error('Payment verification failed');
            }
          },
          prefill: {
            name: `${user?.firstName} ${user?.lastName}`,
            email: user?.email,
          },
          theme: { color: "#5B8DEF" },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else if (gateway === 'stripe') {
        // Stripe usually redirects, but we can use checkout.session.url
        if (order.url) {
          window.location.href = order.url;
        } else {
          throw new Error('Stripe checkout URL missing');
        }
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Upgrade failed');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleSubmitManual = async () => {
    setIsSubmitting(true);
    try {
      await api.post('/subscription/submit-manual', submissionData);
      toast.success('Payment submitted! Admin will verify soon.');
      onOpenChange(false);
      setManualPaymentData(null);
    } catch (err) {
      toast.error('Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: '₹0',
      period: 'forever',
      description: 'Ideal for beginners tracking personal expenses.',
      features: [
        'Max 2 Accounts (+1 Cash)',
        '3 Months Transaction History',
        'Max 3 Budgets',
        '10 Custom Categories',
        'Basic Dashboard Insights'
      ],
      buttonText: currentPlan === 'basic' ? 'Current Plan' : 'Select Basic',
      buttonClass: currentPlan === 'basic' ? 'btn-outline border-white/20 text-[#8892B0]' : 'btn-primary',
      disabled: currentPlan === 'basic',
      popular: false,
    },
    {
      id: 'pro_monthly',
      period_type: 'monthly',
      name: 'Pro Monthly',
      price: '₹99',
      period: 'per month',
      description: 'Unlock full power with unlimited features.',
      features: [
        'Unlimited Accounts',
        'Lifetime Transaction History',
        'Unlimited Budgets',
        'Advanced Net Worth Analysis',
        'Formal Loan Management',
        'Recurring Transactions',
        'Export Data (CSV/PDF)',
        'Credit Card Bill Cycles'
      ],
      buttonText: (currentPlan === 'pro' && currentPeriod === 'monthly') ? 'Current Plan' : 'Upgrade Pro',
      buttonClass: (currentPlan === 'pro' && currentPeriod === 'monthly') ? 'btn-outline border-white/20 text-[#8892B0]' : 'btn-primary',
      disabled: (currentPlan === 'pro' && currentPeriod === 'monthly'),
      popular: true,
      badge: 'Popular',
      badgeClass: 'bg-[#5B8DEF] text-white border-[#5B8DEF]'
    },
    {
      id: 'pro_yearly',
      period_type: 'yearly',
      name: 'Pro Yearly',
      price: '₹799',
      period: 'per year',
      description: 'Best value for long-term financial planning.',
      features: [
        'Everything in Pro Monthly',
        '33% Discount (Save ₹389)',
        'Priority Customer Support',
        'Early access to AI features'
      ],
      buttonText: (currentPlan === 'pro' && currentPeriod === 'yearly') 
        ? 'Current Plan' 
        : (currentPlan === 'pro' && currentPeriod === 'monthly')
          ? 'Upgrade to Pro Yearly'
          : 'Get Pro Yearly',
      buttonClass: (currentPlan === 'pro' && currentPeriod === 'yearly') ? 'btn-outline border-white/20 text-[#8892B0]' : 'btn-primary',
      disabled: (currentPlan === 'pro' && currentPeriod === 'yearly'),
      popular: false,
      badge: 'Best Value',
      badgeClass: 'bg-green-500/20 text-green-400 border-green-500/30'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 bg-[#080B12] border-white/10 overflow-hidden">
        <div className="p-6 md:p-10">
          <DialogHeader className="mb-6 text-center">
            <DialogTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent mb-2">
              Elevate Your Finance Game
            </DialogTitle>
            <DialogDescription className="text-[#8892B0] text-lg">
              Choose the plan that fits your financial journey. Upgrade to Pro for unlimited freedom.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {!manualPaymentData ? (
              plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`flex flex-col relative p-6 rounded-2xl border transition-all duration-300 hover:translate-y-[-4px] ${
                    plan.popular
                      ? 'bg-[#141928] border-[#5B8DEF]/50 shadow-[0_0_40px_-10px_rgba(91,141,239,0.2)]'
                      : 'bg-[#0E1220] border-white/10 hover:border-white/20'
                  }`}
                >
                  {plan.badge && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      plan.badgeClass
                    }`}>
                      {plan.badge}
                    </div>
                  )}

                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-white mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-3xl font-bold text-white">{plan.price}</span>
                      <span className="text-[#8892B0] text-xs">{plan.period}</span>
                    </div>
                    <p className="text-[#8892B0] text-sm leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  <div className="flex-1 space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className={`mt-0.5 p-0.5 rounded-full ${plan.popular ? 'bg-[#5B8DEF]/20 text-[#5B8DEF]' : 'bg-white/10 text-[#8892B0]'}`}>
                          <Check size={14} />
                        </div>
                        <span className="text-sm text-[#EEF0F8]/80">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    disabled={plan.disabled || loadingPlan}
                    className={`${plan.buttonClass} w-full py-3 rounded-xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 ${
                      plan.disabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={() => {
                      if (!plan.disabled && plan.period_type) {
                        handleUpgrade(plan.id, plan.period_type);
                      }
                    }}
                  >
                    {loadingPlan === plan.period_type ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        {plan.id !== 'basic' && <Zap size={16} fill="currentColor" />}
                        {plan.buttonText}
                      </>
                    )}
                  </button>
                </div>
              ))
            ) : (
              <div className="md:col-span-3 bg-[#0E1220] border border-white/10 rounded-2xl p-6 md:p-8 animate-in zoom-in-95 duration-300">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1 space-y-6">
                    <div>
                      <h3 className="text-xl font-bold mb-2">Manual Payment Verification</h3>
                      <p className="text-secondary text-sm">Please complete the transfer to the details below and provide your transaction reference.</p>
                    </div>

                    <div className="bg-[#141928] border border-white/5 rounded-xl p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-secondary text-xs uppercase font-bold tracking-tighter">Bank Name</p>
                          <p className="font-medium text-white">{manualPaymentData.bankName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-secondary text-xs uppercase font-bold tracking-tighter">Account Number</p>
                          <p className="font-mono text-white select-all">{manualPaymentData.accountNumber || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-secondary text-xs uppercase font-bold tracking-tighter">IFSC Code</p>
                          <p className="font-mono text-white">{manualPaymentData.ifsc || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-secondary text-xs uppercase font-bold tracking-tighter">UPI ID</p>
                          <p className="font-mono text-white text-lightblue select-all">{manualPaymentData.upiId || 'N/A'}</p>
                        </div>
                      </div>
                      
                      {manualPaymentData.instructions && (
                        <div className="pt-4 border-t border-white/5 text-sm italic text-secondary">
                          "{manualPaymentData.instructions}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 bg-white/5 p-6 rounded-xl border border-white/5">
                    <h4 className="font-bold">Submit Payment Proof</h4>
                    <div className="space-y-2">
                      <label className="text-xs text-secondary font-medium">Transaction ID / Reference</label>
                      <input 
                        type="text" 
                        className="w-full bg-[#080B12] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-lightblue"
                        placeholder="Enter the reference number"
                        value={submissionData.transactionId}
                        onChange={(e) => setSubmissionData({...submissionData, transactionId: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-secondary font-medium">Payment Reason / Notes (Optional)</label>
                      <textarea 
                        className="w-full bg-[#080B12] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-lightblue min-h-[80px]"
                        placeholder="Any additional details..."
                        value={submissionData.evidence}
                        onChange={(e) => setSubmissionData({...submissionData, evidence: e.target.value})}
                      />
                    </div>
                    
                    <button 
                      disabled={!submissionData.transactionId || isSubmitting}
                      onClick={handleSubmitManual}
                      className="w-full py-3 bg-lightblue text-white rounded-xl font-bold hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                      Submit for Verification
                    </button>
                    <button 
                      onClick={() => setManualPaymentData(null)}
                      className="w-full py-2 text-[#8892B0] text-sm hover:text-white transition-colors"
                    >
                      Go back
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="flex items-center gap-4 text-[#8892B0] text-sm">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[#080B12] bg-[#1C2235] flex items-center justify-center overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="User" />
                  </div>
                ))}
              </div>
              <span>Joined by 2,000+ smart savers this month</span>
            </div>

            <div className="flex flex-col items-center md:items-end gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-[#8892B0] text-xs">
                  <ShieldCheck size={16} className="text-[#2DD4A0]" />
                  <span>Secure SSL Payment</span>
                </div>
                <div className="flex items-center gap-2 text-[#8892B0] text-xs">
                  <Star size={16} className="text-[#F5A623]" fill="#F5A623" />
                  <span>Cancel Anytime</span>
                </div>
              </div>
              
              <DialogClose asChild>
                <button className="text-[#8892B0] hover:text-white text-sm font-medium transition-colors underline underline-offset-4 decoration-white/10">
                  Maybe Later, I'll explore first
                </button>
              </DialogClose>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionPopup;
