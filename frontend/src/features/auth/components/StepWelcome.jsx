import React from 'react';

const StepWelcome = ({ onNext }) => {
  return (
    <div className="onboard-card p-6 md:p-12 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="onboard-progress flex items-center gap-2 mb-8 md:mb-9">
        <div className="prog-step done"></div>
        <div className="prog-step"></div>
        <div className="prog-step"></div>
      </div>
      
      <div className="flex items-center gap-4 mb-6 md:mb-8">
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-[14px] bg-accent/15 border border-accent/20 flex items-center justify-center text-xl md:text-2xl shrink-0">
          👋
        </div>
        <div>
          <h1 className="text-xl md:text-[26px] font-bold tracking-[-0.4px] leading-tight">
            Welcome to aiexpenser!
          </h1>
          <p className="text-xs md:text-sm text-text2 leading-relaxed">
            Let's get your workspace ready. It takes less than 2 minutes.
          </p>
        </div>
      </div>
      
      <div className="flex flex-col gap-2.5 mb-6 md:mb-7">
        <div className="p-4 border border-accent bg-accent/10 rounded-[10px] cursor-pointer transition-all flex items-center gap-3">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-bg4 flex items-center justify-center text-sm md:text-base shrink-0">
            ⚙️
          </div>
          <div>
            <div className="text-xs md:text-[13px] font-semibold">Setup my workspace</div>
            <div className="text-[10px] md:text-[11px] text-text2 mt-0.5">Set preferences + add first account</div>
          </div>
        </div>
      </div>
      
      <div className="flex">
        <button 
          className="flex-1 py-2.5 md:py-[11px] bg-accent hover:bg-accent2 text-white rounded-[10px] font-semibold text-xs md:text-[13px] transition-all flex items-center justify-center gap-1.5"
          onClick={onNext}
        >
          Continue →
        </button>
      </div>
      
      <div className="text-center mt-3 md:mt-[14px] text-[10px] md:text-[11px] text-text3">
        Default settings: DD/MM/YYYY · INR · 2 decimals · Dark · English
      </div>
    </div>
  );
};

export default StepWelcome;
