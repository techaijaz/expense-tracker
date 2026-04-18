import React from 'react';

const StepPreferences = ({ data, updateData, onNext, onBack }) => {
  const { language, currency, dateFormat, decimalPlaces, theme, fiscalYear } = data;

  return (
    <div className="onboard-card p-12 relative animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="onboard-progress flex items-center gap-2 mb-9">
        <div className="prog-step done"></div>
        <div className="prog-step active"></div>
        <div className="prog-step"></div>
      </div>
      
      <div className="w-14 h-14 rounded-[14px] bg-[#5B8DEF]/15 border border-[#5B8DEF]/20 flex items-center justify-center text-2xl mb-5">
        🌐
      </div>
      
      <h1 className="text-[26px] font-bold tracking-[-0.4px] mb-2 leading-tight">
        Set your preferences
      </h1>
      <p className="text-sm text-[#8892B0] leading-relaxed mb-7">
        These can be changed anytime from Settings.
      </p>
      
      <div className="grid grid-cols-2 gap-3 mb-7">
        <div className="p-[14px] border border-[rgba(255,255,255,0.1)] bg-[#141928] rounded-[10px]">
          <label className="text-[10px] font-semibold text-[#4A5578] uppercase tracking-[0.08em] mb-2 block">Language</label>
          <select 
            className="w-full bg-[#1C2235] border border-[rgba(255,255,255,0.1)] rounded-[6px] p-2 text-[13px] text-[#EEF0F8] outline-none"
            value={language}
            onChange={(e) => updateData({ language: e.target.value })}
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
          </select>
        </div>
        
        <div className="p-[14px] border border-[rgba(255,255,255,0.1)] bg-[#141928] rounded-[10px]">
          <label className="text-[10px] font-semibold text-[#4A5578] uppercase tracking-[0.08em] mb-2 block">Currency</label>
          <select 
            className="w-full bg-[#1C2235] border border-[rgba(255,255,255,0.1)] rounded-[6px] p-2 text-[13px] text-[#EEF0F8] outline-none"
            value={currency}
            onChange={(e) => updateData({ currency: e.target.value })}
          >
            <option value="INR">₹ INR — Indian Rupee</option>
            <option value="USD">$ USD</option>
          </select>
        </div>
        
        <div className="p-[14px] border border-[rgba(255,255,255,0.1)] bg-[#141928] rounded-[10px]">
          <label className="text-[10px] font-semibold text-[#4A5578] uppercase tracking-[0.08em] mb-2 block">Date Format</label>
          <select 
            className="w-full bg-[#1C2235] border border-[rgba(255,255,255,0.1)] rounded-[6px] p-2 text-[13px] text-[#EEF0F8] outline-none"
            value={dateFormat}
            onChange={(e) => updateData({ dateFormat: e.target.value })}
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY/MM/DD">YYYY/MM/DD</option>
          </select>
        </div>
        
        <div className="p-[14px] border border-[rgba(255,255,255,0.1)] bg-[#141928] rounded-[10px]">
          <label className="text-[10px] font-semibold text-[#4A5578] uppercase tracking-[0.08em] mb-2 block">Decimal Places</label>
          <select 
            className="w-full bg-[#1C2235] border border-[rgba(255,255,255,0.1)] rounded-[6px] p-2 text-[13px] text-[#EEF0F8] outline-none"
            value={decimalPlaces}
            onChange={(e) => updateData({ decimalPlaces: parseInt(e.target.value) })}
          >
            <option value="2">2 (1,234.56)</option>
            <option value="0">0 (1,235)</option>
            <option value="3">3 (1,234.567)</option>
          </select>
        </div>
        
        <div className="p-[14px] border border-[rgba(255,255,255,0.1)] bg-[#141928] rounded-[10px]">
          <label className="text-[10px] font-semibold text-[#4A5578] uppercase tracking-[0.08em] mb-2 block">Theme</label>
          <select 
            className="w-full bg-[#1C2235] border border-[rgba(255,255,255,0.1)] rounded-[6px] p-2 text-[13px] text-[#EEF0F8] outline-none"
            value={theme}
            onChange={(e) => updateData({ theme: e.target.value })}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System</option>
          </select>
        </div>
        
        <div className="p-[14px] border border-[rgba(255,255,255,0.1)] bg-[#141928] rounded-[10px]">
          <label className="text-[10px] font-semibold text-[#4A5578] uppercase tracking-[0.08em] mb-2 block">Fiscal Year</label>
          <select 
            className="w-full bg-[#1C2235] border border-[rgba(255,255,255,0.1)] rounded-[6px] p-2 text-[13px] text-[#EEF0F8] outline-none"
            value={fiscalYear}
            onChange={(e) => updateData({ fiscalYear: e.target.value })}
          >
            <option>April – March</option>
            <option>January – December</option>
          </select>
        </div>
      </div>
      
      <div className="flex gap-[10px] mb-4">
        <button 
          className="flex-1 py-[11px] bg-transparent border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.16)] text-[#8892B0] hover:text-[#EEF0F8] rounded-[10px] text-[13px] font-medium transition-all"
          onClick={onBack}
        >
          ← Back
        </button>
        <button 
          className="flex-[2] py-[11px] bg-[#5B8DEF] hover:bg-[#4070D4] text-white rounded-[10px] font-semibold text-[13px] transition-all flex items-center justify-center gap-1.5"
          onClick={onNext}
        >
          Save & Continue →
        </button>
      </div>
    </div>
  );
};

export default StepPreferences;
