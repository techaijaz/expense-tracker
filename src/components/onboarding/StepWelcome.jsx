import React from 'react';

const StepWelcome = ({ onNext }) => {
  return (
    <div className="onboard-card p-12 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="onboard-progress flex items-center gap-2 mb-9">
        <div className="prog-step done"></div>
        <div className="prog-step"></div>
        <div className="prog-step"></div>
      </div>
      
      <div className="w-14 h-14 rounded-[14px] bg-[#5B8DEF]/15 border border-[#5B8DEF]/20 flex items-center justify-center text-2xl mb-5">
        👋
      </div>
      
      <h1 className="text-[26px] font-bold tracking-[-0.4px] mb-2 leading-tight">
        Welcome to aiexpenser!
      </h1>
      <p className="text-sm text-[#8892B0] leading-relaxed mb-7">
        Let's get your workspace ready. It takes less than 2 minutes to get started.
      </p>
      
      <div className="flex flex-col gap-2.5 mb-7">
        <div className="p-4 border border-[#5B8DEF] bg-[#5B8DEF]/15 rounded-[10px] cursor-pointer transition-all flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1C2235] flex items-center justify-center text-base shrink-0">
            ⚙️
          </div>
          <div>
            <div className="text-[13px] font-semibold">Setup my workspace</div>
            <div className="text-[11px] text-[#8892B0] mt-0.5">Set preferences + add first account</div>
          </div>
        </div>
      </div>
      
      <div className="flex">
        <button 
          className="flex-1 py-[11px] bg-[#5B8DEF] hover:bg-[#4070D4] text-white rounded-[10px] font-semibold text-[13px] transition-all flex items-center justify-center gap-1.5"
          onClick={onNext}
        >
          Continue →
        </button>
      </div>
      
      <div className="text-center mt-[14px] text-[11px] text-[#4A5578]">
        Default settings: DD/MM/YYYY · INR · 2 decimals · Dark · English
      </div>
    </div>
  );
};

export default StepWelcome;
