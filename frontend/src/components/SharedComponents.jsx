import { useState } from 'react';
import { toast } from 'sonner';

export function SectionCard({ children, accent = false, danger = false }) {
  return (
    <div className={`rounded-2xl p-7 mb-5 border ${
      danger ? 'bg-[var(--red)]/5 border-[var(--red)]/20' : 'bg-[var(--bg2)] border-[var(--border)]'
    } ${accent ? 'border-l-2 border-l-[var(--accent)]' : ''}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ icon, children }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <span className="material-symbols-outlined text-xl text-[var(--accent)]" style={{ fontVariationSettings: "'FILL' 0" }}>{icon}</span>
      <h3 className="text-[15px] font-bold text-[var(--text)] tracking-tight">{children}</h3>
    </div>
  );
}

export function FieldLabel({ children }) {
  return <label className="block text-[10px] font-bold text-[var(--text3)] uppercase tracking-[0.1em] mb-2">{children}</label>;
}

export function PasswordConfirmModal({ title, description, confirmLabel, onConfirm, onCancel, danger }) {
  const [pwd, setPwd] = useState('');
  const [busy, setBusy] = useState(false);
  const handleSubmit = async () => {
    if (!pwd) return toast.error('Please enter your password');
    setBusy(true);
    await onConfirm(pwd);
    setBusy(false);
  };
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div className={`relative z-[1] w-full max-w-[400px] bg-[var(--bg2)] rounded-[20px] py-8 px-7 border ${danger ? 'border-[var(--red)]/25' : 'border-[var(--border)]'}`}>
        <div className="flex items-center gap-2.5 mb-4">
          <span className={`material-symbols-outlined ${danger ? 'text-[var(--red)]' : 'text-[var(--accent)]'}`} style={{ fontVariationSettings:"'FILL' 0" }}>{danger ? 'warning' : 'lock'}</span>
          <h3 className="text-[17px] font-bold text-[var(--text)]">{title}</h3>
        </div>
        <p className="text-[13px] text-[var(--text2)] mb-5.5 leading-[1.6]">{description}</p>
        <input
          type="password" autoFocus
          value={pwd} onChange={e => setPwd(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Enter your password"
          className="w-full py-3 px-3.5 bg-[var(--bg3)] border border-[var(--border)] rounded-[10px] text-[var(--text)] text-sm outline-none mb-4.5"
        />
        <div className="flex gap-2.5">
          <button onClick={onCancel} className="flex-1 p-[11px] bg-[var(--bg3)] border border-[var(--border)] rounded-[10px] text-[var(--text2)] text-[13px] font-semibold transition-colors hover:bg-[var(--bg4)] cursor-pointer">Cancel</button>
          <button onClick={handleSubmit} disabled={busy} className={`flex-[2] p-[11px] rounded-[10px] text-[13px] font-bold transition-opacity ${busy ? 'cursor-not-allowed opacity-70' : 'hover:opacity-90 cursor-pointer'} ${danger ? 'bg-[var(--red)] text-white border-none' : 'bg-[var(--accent)] text-white border-none'}`}>
            {busy ? 'Verifying…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DeleteConfirmModal({ title, description, onConfirm, onCancel, busy }) {
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
      onClick={(e) => { if(e.target === e.currentTarget) onCancel(); }}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative z-[1] w-full max-w-[400px] bg-[var(--bg2)] border border-[var(--red)]/30 rounded-[20px] py-8 px-7 shadow-[0_40px_80px_rgba(249,113,113,0.15)]">
        <div className="flex items-center gap-4 mb-5.5">
          <div className="w-12 h-12 rounded-full bg-[var(--red)]/10 flex items-center justify-center text-[var(--red)] shrink-0">
            <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings:"'FILL' 1" }}>warning</span>
          </div>
          <div>
            <h2 className="text-[17px] font-bold text-[var(--red)] tracking-[-0.01em] mb-1">{title}</h2>
            <p className="text-[13px] text-[var(--text2)] leading-[1.4]">{description}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} disabled={busy} className="flex-1 p-[11px] bg-[var(--bg3)] border border-[var(--border)] rounded-[10px] text-[var(--text2)] text-[13px] font-semibold transition-colors hover:bg-[var(--bg4)] cursor-pointer">Cancel</button>
          <button onClick={onConfirm} disabled={busy} className={`flex-1 p-[11px] bg-[var(--red)]/90 border-none rounded-[10px] text-white text-[13px] font-bold transition-opacity ${busy ? 'cursor-not-allowed opacity-70' : 'hover:opacity-100 cursor-pointer'}`}>
            {busy ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmModal({ title, description, confirmLabel, onConfirm, onCancel, busy, danger = false }) {
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
      onClick={(e) => { if(e.target === e.currentTarget) onCancel(); }}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className={`relative z-[1] w-full max-w-[400px] bg-[var(--bg2)] border ${danger ? 'border-[var(--red)]/30' : 'border-[var(--accent)]/30'} rounded-[20px] py-8 px-7 shadow-2xl`}>
        <div className="flex items-center gap-4 mb-5.5">
          <div className={`w-12 h-12 rounded-full ${danger ? 'bg-[var(--red)]/10 text-[var(--red)]' : 'bg-[var(--accent)]/10 text-[var(--accent)]'} flex items-center justify-center shrink-0`}>
            <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings:"'FILL' 1" }}>
              {danger ? 'warning' : 'help_outline'}
            </span>
          </div>
          <div>
            <h2 className={`text-[17px] font-bold ${danger ? 'text-[var(--red)]' : 'text-[var(--accent)]'} tracking-[-0.01em] mb-1`}>{title}</h2>
            <p className="text-[13px] text-[var(--text2)] leading-[1.4]">{description}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} disabled={busy} className="flex-1 p-[11px] bg-[var(--bg3)] border border-[var(--border)] rounded-[10px] text-[var(--text2)] text-[13px] font-semibold transition-colors hover:bg-[var(--bg4)] cursor-pointer">Cancel</button>
          <button onClick={onConfirm} disabled={busy} className={`flex-1 p-[11px] border-none rounded-[10px] text-white text-[13px] font-bold transition-opacity ${busy ? 'cursor-not-allowed opacity-70' : 'hover:opacity-90 cursor-pointer'} ${danger ? 'bg-[var(--red)]' : 'bg-[var(--accent)]'}`}>
            {busy ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
