import React from 'react';

const StepTrial = ({ data, updateData, onComplete, onBack, isLoading }) => {
  return (
    <div className="onboard-card p-6 md:p-12 relative animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="onboard-progress flex items-center gap-2 mb-8 md:mb-9">
        <div className="prog-step done"></div>
        <div className="prog-step done"></div>
        <div className="prog-step done"></div>
      </div>
      
      <div className="flex items-center gap-4 mb-6 md:mb-8">
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-[14px] bg-accent/15 border border-accent/20 flex items-center justify-center text-xl md:text-2xl shrink-0">
          👑
        </div>
        <div>
          <h1 className="text-xl md:text-[26px] font-bold tracking-[-0.4px] leading-tight">
            Try Pro free for 14 days
          </h1>
          <p className="text-xs md:text-sm text-text2 leading-relaxed">
            No credit card required. Cancel anytime.
          </p>
        </div>
      </div>
      
      <div className="flex flex-col gap-2.5 mb-6 md:mb-7">
        {[
          'Budget module — category-wise spending limits',
          'Formal loan tracking with amortization schedule',
          'Net worth dashboard — assets vs liabilities',
          'Recurring transactions — auto-entry & reminders',
          'Credit card cycle tracking & due date alerts',
          'Unlimited accounts, history & advanced reports'
        ].map((feature, idx) => (
          <div key={idx} className="flex items-center gap-2.5 text-xs md:text-[13px] text-text2">
            <span className="text-green text-base shrink-0">✓</span>
            <span>{feature}</span>
          </div>
        ))}
      </div>
      
      <div className="flex flex-col gap-3">
        <button 
          className="w-full py-2.5 md:py-[11px] bg-accent hover:bg-accent2 text-white rounded-[10px] font-semibold text-[13px] transition-all flex items-center justify-center gap-1.5"
          onClick={() => {
            updateData({ activateTrial: true });
            onComplete(true);
          }}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : '🚀 Start 14-Day Free Trial'}
        </button>
        <button 
          className="w-full py-2.5 md:py-[11px] bg-transparent border border-border hover:border-border2 text-text2 hover:text-text rounded-[10px] text-[13px] font-medium transition-all"
          onClick={() => {
            updateData({ activateTrial: false });
            onComplete(false);
          }}
          disabled={isLoading}
        >
          Continue with Basic (Free)
        </button>
      </div>
      
      <div className="text-center mt-3 text-[10px] md:text-[11px] text-text3">
        After trial: ₹99/month or ₹799/year
      </div>
    </div>
  );
};

export default StepTrial;
