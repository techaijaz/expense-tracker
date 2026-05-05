import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import api from '@/utils/httpMethods';

export default function AddPartyPopup({ open = true, party, onClose, onSave, partyCount }) {
  const [name, setName] = useState(party?.name || '');
  const [relation, setRelation] = useState(party?.relation || 'FRIEND');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setName(party?.name || '');
      setRelation(party?.relation || 'FRIEND');
    }
  }, [open, party]);

  const { user } = useSelector((state) => state.auth);
  const plan = user?.user?.plan || user?.plan || 'basic';
  const isPro = plan === 'pro';
  const isLimitReached = !party && !isPro && (partyCount || 0) >= 5;

  if (!open) return null;

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Name is required');
    if (isLimitReached)
      return toast.error('Upgrade to Pro to add more counterparties');

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
      toast.error(
        err?.response?.data?.message || 'Failed to save counterparty',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-center justify-center p-4 transition-all duration-300"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" />
      <div className="relative z-[1] w-full max-w-[440px] bg-bg2 border border-border rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <header className="mb-6">
          <h3 className="text-xl font-black text-text tracking-tight mb-1">
            {party ? 'Edit' : 'Add'} Counterparty
          </h3>
          <p className="text-xs text-text3 font-medium">
            Manage relationship details for debt tracking.
          </p>
        </header>

        <div className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-text3 ml-1">
              Counterparty Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full legal name"
              className="w-full bg-bg3 border border-border rounded-xl py-3 px-4 text-text focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all placeholder:text-text3/30 text-sm font-medium"
            />
          </div>

          {/* Relation Selection */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-text3 ml-1">
              Relationship Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {['FRIEND', 'FAMILY', 'VENDOR', 'CLIENT'].map((r) => (
                <label
                  key={r}
                  className={`flex items-center justify-center px-3 py-3 rounded-xl cursor-pointer border-[1.5px] transition-all duration-300 ${relation === r ? 'bg-accent-glow border-accent text-accent shadow-sm translate-y-[-1px]' : 'bg-bg3 border-border text-text3 hover:border-text3/30'}`}
                >
                  <input
                    type="radio"
                    name="relation"
                    value={r}
                    checked={relation === r}
                    onChange={() => setRelation(r)}
                    className="hidden"
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {r}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 mt-8">
          <button
            onClick={onClose}
            className="flex-1 h-12 bg-bg3 border border-border hover:bg-bg4 text-text3 hover:text-text rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={busy}
            className={`flex-[1.5] h-12 bg-gradient-to-r from-accent to-accent2 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${busy ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {busy ? (
               <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : party ? 'Update' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
