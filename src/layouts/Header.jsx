/* eslint-disable react/prop-types */
import ShortLogo from './ShortLogo';

export default function Header({ onMenuToggle, onNewTransaction }) {
  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 z-30 bg-surface-container-low/80 backdrop-blur-xl border-b border-white/5 shadow-xl shadow-black/20 flex justify-between items-center px-4 md:px-8">
      <div className="flex items-center flex-1 gap-4">
        {/* Mobile Hamburger Toggle */}
        <button
          className="lg:hidden text-outline hover:text-primary transition-colors focus:outline-none"
          onClick={onMenuToggle}
        >
          <span
            className="material-symbols-outlined text-2xl"
            style={{ fontVariationSettings: "'FILL' 0" }}
          >
            menu
          </span>
        </button>
        {/* Mobile short logo – visible only when sidebar is hidden */}
        <div className="lg:hidden">
          <ShortLogo />
        </div>
      </div>

      <div className="flex items-center space-x-4 md:space-x-6">
        <button className="flex items-center space-x-2 text-outline hover:text-white transition-colors">
          <span className="material-symbols-outlined">notifications</span>
        </button>

        <div className="hidden md:block h-6 w-[1px] bg-white/10"></div>

        <button
          onClick={onNewTransaction}
          className="hidden sm:block btn-primary-gradient text-on-primary px-4 py-2 rounded-md font-body text-sm font-bold shadow-lg shadow-primary/10 transition-transform active:scale-95"
        >
          New Transaction
        </button>

        <div className="flex items-center space-x-3 ml-2">
          <img
            className="w-8 h-8 rounded-full border border-primary/20 object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGBNDhLJsxGn_V4NhiEPDRD8fCGdTAFlsNO0Qut7UaPUwzHmpgXMD0Dmsidu_yX1Kyv33nWgTr1IT2n5G10hi_ReVOFWJfJ8YwL3u1KeCXoSS_rjz49gu1pAN3GbyBVPLhT9VmzTj4aV6yGHuNrX4Y2mVCcB9wiBFqEPLCqTnkjA-spz66SA-PWe-sv4-N6-8V6dMawVJiGENPGKByIfIKhnez7Rt-xKQz20H5uxt6VPYD8njZ2kKiWTg0_HHH_4dAZ4izDRKf6K8"
            alt="Profile"
          />
        </div>
      </div>
    </header>
  );
}
