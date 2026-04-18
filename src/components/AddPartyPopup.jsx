import { useState } from 'react';
import { toast } from 'sonner';
import api from '@/utils/httpMethods';
import { FieldLabel } from './SharedComponents';

export default function AddPartyPopup({ party, onClose, onSave }) {
  const [name, setName] = useState(party?.name || '');
  const [relation, setRelation] = useState(party?.relation || 'FRIEND');
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Name is required');
    setBusy(true);
    try {
      const url = party ? `/parties/${party._id}` : '/parties';
      const method = party ? 'patch' : 'post';
      const resData = await api[method](url, { name: name.trim(), relation });
      onSave(resData.data, !!party);
      toast.success(party ? 'Counterparty updated' : 'Counterparty added');
      window.dispatchEvent(new CustomEvent('refetch-system-metrics'));
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save counterparty');
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-[8px]" />
      <div className="relative z-[1] w-full max-w-[400px] bg-surface border border-input-bg rounded-[20px] p-7">
        <h3 className="text-base font-extrabold text-on-surface mb-5">{party ? 'Edit' : 'Add'} Counterparty</h3>
        <div className="mb-4">
          <FieldLabel>Name</FieldLabel>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name"
            className="w-full py-[11px] px-3.5 bg-secondary-container border border-outline rounded-[10px] text-on-surface text-sm outline-none font-body" />
        </div>
        <div className="mb-6">
          <FieldLabel>Relation</FieldLabel>
          <div className="grid grid-cols-2 gap-3">
            {['FRIEND','FAMILY','VENDOR','CLIENT'].map(r => (
              <label key={r} className={`flex items-center justify-center px-3 py-2.5 rounded-xl cursor-pointer border-2 transition-all duration-200 ${relation === r ? 'bg-primary/10 border-primary text-primary' : 'bg-surface-container-low border-transparent text-on-surface-variant hover:border-outline-variant/30'}`}>
                <input type="radio" name="relation" value={r} checked={relation===r} onChange={()=>setRelation(r)} className="hidden" />
                <span className="text-[11px] font-bold tracking-wider">{r}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="flex-1 h-11 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-xl text-sm font-bold transition-all">
            Cancel
          </button>
          <button onClick={handleSave} disabled={busy} className={`flex-[1.5] h-11 bg-primary text-background rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all ${busy ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {busy ? 'Saving…' : (party ? 'Update' : 'Add')}
          </button>
        </div>
      </div>
    </div>
  );
}
