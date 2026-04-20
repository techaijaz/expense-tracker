const Logo = () => {
  return (
    <div className="flex items-center gap-3">
      {/* Logo Mark */}
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="36" rx="10" fill="url(#fullLogoGrad)" />
        <path d="M10 24L18 10L26 24" stroke="var(--bg-primary)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13 20H23" stroke="var(--bg-primary)" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="18" cy="27" r="2" fill="var(--bg-primary)" />
        <defs>
          <linearGradient id="fullLogoGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--accent-color)" />
            <stop offset="1" stopColor="var(--accent-color)" />
          </linearGradient>
        </defs>
      </svg>
      {/* Text */}
      <div>
        <div className="text-xl font-black text-primary tracking-tighter font-headline leading-none">
          aiexpenser
        </div>
        <div className="text-[9px] uppercase tracking-widest opacity-50 font-bold mt-0.5 text-outline">
          Smart Finance
        </div>
      </div>
    </div>
  );
};

export default Logo;
