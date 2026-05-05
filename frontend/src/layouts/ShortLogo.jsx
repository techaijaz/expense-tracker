const ShortLogo = () => {
  return (
    <div className="flex items-center gap-2 group cursor-pointer">
      {/* Gradient mark - Layered Design */}
      <div className="relative w-9 h-9 flex items-center justify-center">
        {/* Background Glow */}
        <div className="absolute inset-0 bg-accent/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <svg 
          width="36" 
          height="36" 
          viewBox="0 0 40 40" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 transition-transform duration-500 group-hover:scale-105"
        >
          <defs>
            <linearGradient id="shortLogoGrad-main" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--accent2)" />
            </linearGradient>
          </defs>

          {/* Main Body */}
          <rect x="4" y="4" width="32" height="32" rx="11" fill="url(#shortLogoGrad-main)" />
          
          {/* Abstract Mark */}
          <path d="M12 28L20 12L28 28" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16.5 22.5H23.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
          
          {/* Glass Finish */}
          <rect x="4" y="4" width="32" height="32" rx="11" fill="white" fillOpacity="0.05" stroke="white" strokeOpacity="0.2" strokeWidth="0.5" />
        </svg>
      </div>

      {/* Short name */}
      <span className="text-xl font-black text-primary tracking-tighter font-manrope">
        ai
      </span>
    </div>
  );
};

export default ShortLogo;

