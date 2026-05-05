import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { Users, UserPlus, Pencil, Trash2, ShieldCheck, ShieldAlert } from 'lucide-react';
import api from '@/utils/httpMethods';
import { DeleteConfirmModal } from '../SharedComponents';
import AddPartyPopup from '../AddPartyPopup';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/utils';

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
      setParties((p) => p.filter((x) => x._id !== deletePartyModal._id));
      toast.success('Counterparty deleted');
      window.dispatchEvent(new CustomEvent('refetch-system-metrics'));
      setDeletePartyModal(null);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || 'Failed to delete counterparty',
      );
    } finally {
      setDeletingParty(false);
    }
  };

  const handlePartySaved = (savedParty, isEdit) => {
    if (isEdit)
      setParties((prev) =>
        prev.map((p) => (p._id === savedParty._id ? savedParty : p)),
      );
    else setParties((prev) => [savedParty, ...prev]);
  };

  const currentUser = useSelector((s) => s.auth.user);
  const userObj = currentUser?.user || currentUser;
  const isPro = userObj?.role === 'admin' || userObj?.plan === 'pro';

  const limitReached = !isPro && parties.length >= 5;

  const handleAddParty = () => {
    if (limitReached) {
      toast.error(
        'Basic plan limit reached (5 counterparties). Upgrade to PRO to add more.',
      );
      return;
    }
    setPartyModal('new');
  };

  return (
    <div className="settings-card overflow-hidden">
      <div className="settings-section-title flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-glow)] flex items-center justify-center border border-[var(--accent)]/10">
            <Users className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <span className="font-bold tracking-tight">Counterparties</span>
        </div>
        {!isPro && (
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
            limitReached ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
          )}>
            {limitReached ? <ShieldAlert className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
            {parties.length}/5 Used
          </div>
        )}
      </div>

      <div className="space-y-2">
        {parties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-[var(--border)] rounded-3xl bg-[var(--bg3)]/50">
            <div className="w-12 h-12 rounded-2xl bg-[var(--bg3)] flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-[var(--text3)] opacity-20" />
            </div>
            <p className="text-xs font-bold text-[var(--text3)] uppercase tracking-widest">No counterparties found</p>
            <p className="text-[10px] text-[var(--text3)]/60 mt-1">Add people you lend to or borrow from.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {parties.slice(0, isPro ? 50 : 5).map((party) => (
              <div 
                key={party._id} 
                className="group flex items-center justify-between p-3 rounded-2xl bg-[var(--bg3)] hover:bg-[var(--bg4)] border border-transparent hover:border-[var(--border)] transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center text-white font-black text-xs shadow-md">
                    {party.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold tracking-tight text-[var(--text)]">
                      {party.name}
                    </div>
                    <div className="text-[9px] font-black text-[var(--text3)] uppercase tracking-widest opacity-70">
                      {party.relation}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 rounded-xl hover:bg-[var(--accent-glow)] hover:text-[var(--accent)]"
                    onClick={() => setPartyModal(party)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-colors"
                    onClick={() => setDeletePartyModal(party)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {!isPro && parties.length > 5 && (
              <div className="text-center py-2">
                <p className="text-[10px] font-bold text-[var(--text3)] uppercase tracking-widest bg-[var(--bg3)] inline-block px-3 py-1 rounded-full border border-[var(--border)]">
                  + {parties.length - 5} more hidden (Basic Plan)
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <Button
        onClick={handleAddParty}
        variant="outline"
        className={cn(
          "w-full mt-4 h-11 rounded-2xl border-dashed border-2 hover:border-solid transition-all font-bold text-[11px] uppercase tracking-widest",
          limitReached ? "border-red-500/50 text-red-500 hover:bg-red-500/5" : "border-[var(--accent)]/30 text-[var(--accent)] hover:bg-[var(--accent-glow)]"
        )}
      >
        <UserPlus className="w-4 h-4 mr-2" />
        {limitReached ? 'Limit Reached (Upgrade)' : 'Add Counterparty'}
      </Button>

      {partyModal && (
        <AddPartyPopup
          open={!!partyModal}
          party={partyModal === 'new' ? null : partyModal}
          onClose={() => setPartyModal(null)}
          onSave={handlePartySaved}
          partyCount={parties.length}
        />
      )}

      {deletePartyModal && (
        <DeleteConfirmModal
          title="Delete Counterparty"
          description={`Permanently remove "${deletePartyModal.name}"? This will affect related debt records.`}
          busy={deletingParty}
          onConfirm={handleDeleteParty}
          onCancel={() => setDeletePartyModal(null)}
        />
      )}
    </div>
  );
}
