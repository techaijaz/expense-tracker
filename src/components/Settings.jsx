import UserIdentity from './settings/UserIdentity';
import Taxonomy from './settings/Taxonomy';
import DataExport from './settings/DataExport';
import Counterparties from './settings/Counterparties';
import Appearance from './settings/Appearance';
import RegionalSpecs from './settings/RegionalSpecs';
import SystemMetrics from './settings/SystemMetrics';

export default function Settings() {
  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 font-body text-on-surface">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .settings-input::placeholder { color: var(--text-muted); }
      `}</style>

      {/* Header */}
      <header className="mb-9 flex justify-between items-end flex-wrap gap-3">
        <div>
          <h1 className="text-[30px] font-extrabold text-on-surface tracking-[-0.03em] mb-1.5">Configuration</h1>
          <p className="text-[13px] text-on-surface-variant">Manage your identity, preferences, and workspace settings.</p>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[rgba(168,237,202,0.08)] border border-[rgba(168,237,202,0.15)] rounded-full">
          <span className="w-2 h-2 rounded-full bg-[#a8edca] inline-block shadow-[0_0_8px_#a8edca]" />
          <span className="text-[11px] font-bold text-[#a8edca] tracking-[0.08em]">SYSTEM OPERATIONAL</span>
        </div>
      </header>

      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-6">
        
        {/* ── LEFT COLUMN ── */}
        <div>
          <UserIdentity />
          <Taxonomy />
          <DataExport />
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div>
          <Appearance />
          <RegionalSpecs />
          <Counterparties />
          <SystemMetrics />
        </div>
        
      </div>
    </div>
  );
}
