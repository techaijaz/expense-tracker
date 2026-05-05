const Logo = () => {
  return (
    <div className="flex items-center gap-3 group cursor-pointer">
      {/* Logo Mark - Layered Premium Design */}
      <div className="relative w-10 h-10 flex items-center justify-center">
        {/* Background Glow */}
        <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <svg 
          width="40" 
          height="40" 
          viewBox="0 0 40 40" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
        >
          <defs>
            <linearGradient id="logo-grad-main" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--accent2)" />
            </linearGradient>
            <filter id="logo-blur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
            </filter>
          </defs>

          {/* Main Body */}
          <rect x="4" y="4" width="32" height="32" rx="11" fill="url(#logo-grad-main)" />
          
          {/* Subtle Inner Shadow/Edge */}
          <rect x="5" y="5" width="30" height="30" rx="10" stroke="white" strokeOpacity="0.1" strokeWidth="1" />

          {/* Abstract "A" / Growth Mark */}
          <path 
            d="M12 28L20 12L28 28" 
            stroke="white" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="drop-shadow-sm"
          />
          <path 
            d="M16.5 22.5H23.5" 
            stroke="white" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            opacity="0.6"
          />
          
          {/* Glass Finish Over */}
          <rect 
            x="4" y="4" width="32" height="32" rx="11" 
            fill="white" fillOpacity="0.05" 
            stroke="white" strokeOpacity="0.2" 
            strokeWidth="0.5"
          />
        </svg>
      </div>

      {/* Text Branding */}
      <div className="flex flex-col -space-y-1">
        <div className="flex items-baseline">
          <span className="text-2xl font-black text-primary tracking-tight font-manrope">
            ai
          </span>
          <span className="text-2xl font-semibold text-primary tracking-tight font-manrope opacity-90">
            expenser
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-0.5">
          <div className="h-[1px] w-3 bg-accent/40" />
          <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-muted-foreground/70 font-manrope">
            Smart Finance
          </span>
        </div>
      </div>
    </div>
  );
};

export default Logo;

