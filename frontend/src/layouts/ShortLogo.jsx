/**
 * ShortLogo – compact icon-only logo for mobile views
 * Shows just the gradient SVG mark with a minimal "ai" label
 */
const ShortLogo = () => {
  return (
    <div className="flex items-center gap-2">
      {/* Gradient mark */}
      <svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="36" rx="10" fill="url(#shortLogoGrad)" />
        <path d="M10 24L18 10L26 24" stroke="var(--bg-primary)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13 20H23" stroke="var(--bg-primary)" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="18" cy="27" r="2" fill="var(--bg-primary)" />
        <defs>
          <linearGradient id="shortLogoGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--accent-color)" />
            <stop offset="1" stopColor="var(--accent-color)" />
          </linearGradient>
        </defs>
      </svg>
      {/* Short name */}
      <span className="text-lg font-black text-primary tracking-tighter font-headline leading-none">
        ai<span className="text-on-surface">exp</span>
      </span>
    </div>
  );
};

export default ShortLogo;
