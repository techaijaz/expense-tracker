import React from 'react';

const StepTrial = ({ data, updateData, onComplete, onBack, isLoading }) => {
  return (
    <div className="onboard-card p-12 relative animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="onboard-progress flex items-center gap-2 mb-9">
        <div className="prog-step done"></div>
        <div className="prog-step done"></div>
        <div className="prog-step done"></div>
      </div>
      
      <div className="w-14 h-14 rounded-[14px] bg-[#5B8DEF]/15 border border-[#5B8DEF]/20 flex items-center justify-center text-2xl mb-5">
        👑
      </div>
      
      <h1 className="text-[26px] font-bold tracking-[-0.4px] mb-2 leading-tight">
        Try Pro free for 14 days
      </h1>
      <p className="text-sm text-[#8892B0] leading-relaxed mb-7">
        No credit card required. Cancel anytime.
      </p>
      
      <div className="flex flex-col gap-2.5 mb-7">
        <div className="flex items-center gap-2.5 text-[13px] text-[#8892B0]">
          <span className="text-[#2DD4A0] text-base shrink-0">✓</span>
          <span>Budget module — category-wise spending limits</span>
        </div>
        <div className="flex items-center gap-2.5 text-[13px] text-[#8892B0]">
          <span className="text-[#2DD4A0] text-base shrink-0">✓</span>
          <span>Formal loan tracking with amortization schedule</span>
        </div>
        <div className="flex items-center gap-2.5 text-[13px] text-[#8892B0]">
          <span className="text-[#2DD4A0] text-base shrink-0">✓</span>
          <span>Net worth dashboard — assets vs liabilities</span>
        </div>
        <div className="flex items-center gap-2.5 text-[13px] text-[#8892B0]">
          <span className="text-[#2DD4A0] text-base shrink-0">✓</span>
          <span>Recurring transactions — auto-entry & reminders</span>
        </div>
        <div className="flex items-center gap-2.5 text-[13px] text-[#8892B0]">
          <span className="text-[#2DD4A0] text-base shrink-0">✓</span>
          <span>Credit card cycle tracking & due date alerts</span>
        </div>
        <div className="flex items-center gap-2.5 text-[13px] text-[#8892B0]">
          <span className="text-[#2DD4A0] text-base shrink-0">✓</span>
          <span>Unlimited accounts, history & advanced reports</span>
        </div>
      </div>
      
      <div className="flex flex-col gap-3">
        <button 
          className="w-full py-[11px] bg-[#5B8DEF] hover:bg-[#4070D4] text-white rounded-[10px] font-semibold text-[13px] transition-all flex items-center justify-center gap-1.5"
          onClick={() => {
            updateData({ activateTrial: true });
            onComplete(true);
          }}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : '🚀 Start 14-Day Free Trial'}
        </button>
        <button 
          className="w-full py-[11px] bg-transparent border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.16)] text-[#8892B0] hover:text-[#EEF0F8] rounded-[10px] text-[13px] font-medium transition-all"
          onClick={() => {
            updateData({ activateTrial: false });
            onComplete(false);
          }}
          disabled={isLoading}
        >
          Continue with Basic (Free)
        </button>
      </div>
      
      <div className="text-center mt-3 text-[11px] text-[#4A5578]">
        After trial: ₹99/month or ₹799/year
      </div>
    </div>
  );
};

export default StepTrial;
