import { useState } from 'react';
import { toast } from 'sonner';

export function SectionCard({ children, accent = false, danger = false }) {
  return (
    <div className={`rounded-2xl p-7 mb-5 border ${
      danger ? 'bg-error/5 border-error/20' : 'bg-secondary-container border-secondary-container'
    } ${accent ? 'border-l-2 border-l-primary' : ''}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ icon, children }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <span className="material-symbols-outlined text-xl text-primary" style={{ fontVariationSettings: "'FILL' 0" }}>{icon}</span>
      <h3 className="text-[15px] font-extrabold text-on-surface tracking-[-0.01em]">{children}</h3>
    </div>
  );
}

export function FieldLabel({ children }) {
  return <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.1em] mb-2">{children}</label>;
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
      <div className="absolute inset-0 bg-black/75 backdrop-blur-[8px]" />
      <div className={`relative z-[1] w-full max-w-[400px] bg-surface rounded-[20px] py-8 px-7 border ${danger ? 'border-error/25' : 'border-secondary-container'}`}>
        <div className="flex items-center gap-2.5 mb-4">
          <span className={`material-symbols-outlined ${danger ? 'text-error' : 'text-primary'}`} style={{ fontVariationSettings:"'FILL' 0" }}>{danger ? 'warning' : 'lock'}</span>
          <h3 className="text-[17px] font-extrabold text-on-surface">{title}</h3>
        </div>
        <p className="text-[13px] text-on-surface-variant mb-5.5 leading-[1.6]">{description}</p>
        <input
          type="password" autoFocus
          value={pwd} onChange={e => setPwd(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Enter your password"
          className="w-full py-3 px-3.5 bg-secondary-container border border-outline rounded-[10px] text-on-surface text-sm outline-none mb-4.5 font-body"
        />
        <div className="flex gap-2.5">
          <button onClick={onCancel} className="flex-1 p-[11px] bg-secondary-container border border-secondary-container rounded-[10px] text-on-surface-variant text-[13px] font-semibold cursor-pointer">Cancel</button>
          <button onClick={handleSubmit} disabled={busy} className={`flex-[2] p-[11px] rounded-[10px] text-[13px] font-bold ${busy ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'} ${danger ? 'bg-[linear-gradient(135deg,#f97171,#c0392b)] text-white border-none' : 'bg-primary text-background border-none'}`}>
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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-[8px]" />
      <div className="relative z-[1] w-full max-w-[400px] bg-surface border border-error/30 rounded-[20px] py-8 px-7 shadow-[0_40px_80px_rgba(249,113,113,0.15)]">
        <div className="flex items-center gap-4 mb-5.5">
          <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center text-error shrink-0">
            <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings:"'FILL' 1" }}>warning</span>
          </div>
          <div>
            <h2 className="text-[17px] font-extrabold text-error tracking-[-0.01em] mb-1">{title}</h2>
            <p className="text-[13px] text-on-surface-variant leading-[1.4]">{description}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} disabled={busy} className="flex-1 p-[11px] bg-secondary-container border border-secondary-container rounded-[10px] text-on-surface-variant text-[13px] font-semibold cursor-pointer">Cancel</button>
          <button onClick={onConfirm} disabled={busy} className={`flex-1 p-[11px] bg-error/90 border-none rounded-[10px] text-white text-[13px] font-bold ${busy ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
            {busy ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
