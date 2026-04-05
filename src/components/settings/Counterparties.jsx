import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '@/utils/httpMethods';
import { SectionCard, SectionTitle, FieldLabel, DeleteConfirmModal } from '../SharedComponents';

// Private component for Party Modal
function PartyModal({ party, onClose, onSave }) {
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
        <div className="mb-5.5">
          <FieldLabel>Relation</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            {['FRIEND','FAMILY','VENDOR','CLIENT'].map(r => (
              <label key={r} className={`flex items-center gap-2 px-3 py-2.5 rounded-[10px] cursor-pointer border ${relation === r ? 'bg-surface-variant border-surface-variant' : 'bg-secondary-container border-secondary-container'}`}>
                <input type="radio" name="relation" value={r} checked={relation===r} onChange={()=>setRelation(r)} className="hidden" />
                <span className={`text-xs font-bold ${relation === r ? 'text-primary' : 'text-on-surface-variant'}`}>{r}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-2.5">
          <button onClick={onClose} className="flex-1 p-[11px] bg-secondary-container border border-secondary-container rounded-[10px] text-on-surface-variant text-[13px] font-semibold cursor-pointer">Cancel</button>
          <button onClick={handleSave} disabled={busy} className={`flex-[2] p-[11px] bg-primary rounded-[10px] text-background text-[13px] font-bold border-none ${busy ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
            {busy ? 'Saving…' : (party ? 'Update' : 'Add')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Counterparties() {
  const [parties, setParties] = useState([]);
  const [partyModal, setPartyModal] = useState(null); // null | 'new' | party object
  const [deletePartyModal, setDeletePartyModal] = useState(null);
  const [deletingParty, setDeletingParty] = useState(false);

  useEffect(() => {
    const fetchParties = async () => {
      try {
        const partyRes = await api.get('/parties');
        setParties(partyRes?.data || []);
      } catch (e) {
        console.error('Failed to fetch parties');
      }
    };
    fetchParties();
  }, []);

  const handleDeleteParty = async () => {
    if (!deletePartyModal) return;
    setDeletingParty(true);
    try {
      await api.delete(`/parties/${deletePartyModal._id}`);
      setParties(p => p.filter(x => x._id !== deletePartyModal._id));
      toast.success('Counterparty deleted');
      setDeletePartyModal(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete counterparty');
    } finally {
      setDeletingParty(false);
    }
  };

  const handlePartySaved = (savedParty, isEdit) => {
    if (isEdit) setParties(prev => prev.map(p => p._id === savedParty._id ? savedParty : p));
    else setParties(prev => [savedParty, ...prev]);
  };

  return (
    <SectionCard>
      <div className="flex justify-between items-center mb-5">
        <SectionTitle icon="group">Counterparties</SectionTitle>
        <button onClick={() => setPartyModal('new')}
          className="px-3 py-1.5 bg-surface-variant border border-surface-variant rounded-[10px] text-primary text-xs font-bold cursor-pointer flex items-center gap-1">
          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 0" }}>person_add</span>Add
        </button>
      </div>
      {parties.length === 0 ? (
        <div className="text-center p-6 rounded-xl border border-dashed border-secondary-container">
          <span className="material-symbols-outlined text-[32px] text-on-surface-variant block mb-2" style={{ fontVariationSettings: "'FILL' 0" }}>group</span>
          <p className="text-[13px] text-on-surface-variant">No counterparties yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {parties.map(party => (
            <div key={party._id} className="flex items-center gap-2.5 p-2.5 bg-secondary-container border border-secondary-container rounded-[10px]">
              <div className="w-[34px] h-[34px] rounded-[10px] bg-surface-variant border border-surface-variant flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-base text-primary" style={{ fontVariationSettings: "'FILL' 0" }}>person</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-on-surface mb-0.5 capitalize truncate">{party.name}</p>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.06em]">{party.relation}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setPartyModal(party)}
                  className="p-1 rounded-[7px] bg-surface-variant border border-surface-variant cursor-pointer text-primary flex items-center">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 0" }}>edit</span>
                </button>
                <button onClick={() => setDeletePartyModal(party)}
                  className="p-1 rounded-[7px] bg-error/5 border border-error/15 cursor-pointer text-error flex items-center">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 0" }}>delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {partyModal && (
        <PartyModal
          party={partyModal === 'new' ? null : partyModal}
          onClose={() => setPartyModal(null)}
          onSave={handlePartySaved}
        />
      )}

      {deletePartyModal && (
        <DeleteConfirmModal
          title="Delete Counterparty"
          description={`Are you sure you want to delete "${deletePartyModal.name}"? This action cannot be undone.`}
          busy={deletingParty}
          onConfirm={handleDeleteParty}
          onCancel={() => setDeletePartyModal(null)}
        />
      )}
    </SectionCard>
  );
}
