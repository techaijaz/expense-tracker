import React from 'react';

const StepAccount = ({ data, updateData, onNext, onBack, onSkip }) => {
  const { account } = data;

  return (
    <div className="onboard-card p-12 relative animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="onboard-progress flex items-center gap-2 mb-9">
        <div className="prog-step done"></div>
        <div className="prog-step done"></div>
        <div className="prog-step active"></div>
      </div>
      
      <div className="w-14 h-14 rounded-[14px] bg-[#5B8DEF]/15 border border-[#5B8DEF]/20 flex items-center justify-center text-2xl mb-5">
        🏦
      </div>
      
      <h1 className="text-[26px] font-bold tracking-[-0.4px] mb-2 leading-tight">
        Add your first account
      </h1>
      <p className="text-sm text-[#8892B0] leading-relaxed mb-7">
        Your Cash account is already ready. Add a bank account to start tracking.
      </p>
      
      <div className="bg-[#2DD4A0]/10 border border-[#2DD4A0]/20 rounded-[10px] p-3 flex items-center gap-2.5 mb-4 text-[13px]">
        <span className="text-lg">✅</span>
        <div>
          <div className="font-semibold text-[#2DD4A0]">Cash account ready</div>
          <div className="text-[11px] text-[#8892B0]">Auto-created — balance: ₹0.00</div>
        </div>
      </div>
      
      <div className="space-y-4 mb-7">
        <div>
          <label className="text-[11px] font-semibold text-[#8892B0] uppercase tracking-[0.08em] mb-1.5 block">Account Type</label>
          <select 
            className="w-full bg-[#141928] border border-[rgba(255,255,255,0.1)] rounded-[6px] p-2.5 text-[13px] text-[#EEF0F8] outline-none focus:border-[#5B8DEF] transition-all"
            value={account.type}
            onChange={(e) => updateData({ account: { ...account, type: e.target.value } })}
          >
            <option>Bank Account</option>
            <option>Credit Card</option>
            <option>Investment</option>
            <option>E-Wallet</option>
          </select>
        </div>
        
        <div>
          <label className="text-[11px] font-semibold text-[#8892B0] uppercase tracking-[0.08em] mb-1.5 block">Account Name</label>
          <input 
            className="w-full bg-[#141928] border border-[rgba(255,255,255,0.1)] rounded-[6px] p-2.5 text-[13px] text-[#EEF0F8] outline-none focus:border-[#5B8DEF] transition-all"
            placeholder="e.g. HDFC Savings"
            value={account.name}
            onChange={(e) => updateData({ account: { ...account, name: e.target.value } })}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-[#8892B0] uppercase tracking-[0.08em] mb-1.5 block">Last 4 digits (optional)</label>
            <input 
              className="w-full bg-[#141928] border border-[rgba(255,255,255,0.1)] rounded-[6px] p-2.5 text-[13px] text-[#EEF0F8] outline-none focus:border-[#5B8DEF] transition-all"
              placeholder="1234"
              value={account.lastDigits}
              onChange={(e) => updateData({ account: { ...account, lastDigits: e.target.value } })}
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#8892B0] uppercase tracking-[0.08em] mb-1.5 block">Opening Balance</label>
            <input 
              className="w-full bg-[#141928] border border-[rgba(255,255,255,0.1)] rounded-[6px] p-2.5 text-[13px] text-[#EEF0F8] outline-none focus:border-[#5B8DEF] transition-all font-mono"
              placeholder="₹ 0"
              value={account.balance}
              onChange={(e) => updateData({ account: { ...account, balance: e.target.value } })}
            />
          </div>
        </div>
      </div>
      
      <div className="flex gap-[10px] items-center mb-4">
        <button 
          className="flex-1 py-[11px] bg-transparent border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.16)] text-[#8892B0] hover:text-[#EEF0F8] rounded-[10px] text-[13px] font-medium transition-all"
          onClick={onBack}
        >
          ← Back
        </button>
        <button 
          className="flex-1 py-[11px] bg-transparent border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.16)] text-[#8892B0] hover:text-[#EEF0F8] rounded-[10px] text-[13px] font-medium transition-all"
          onClick={onSkip}
        >
          Skip
        </button>
        <button 
          className="flex-[2] py-[11px] bg-[#5B8DEF] hover:bg-[#4070D4] text-white rounded-[10px] font-semibold text-[13px] transition-all flex items-center justify-center gap-1.5"
          onClick={onNext}
        >
          Add & Continue →
        </button>
      </div>
    </div>
  );
};

export default StepAccount;
