import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { Users, UserPlus, Pencil, Trash2, ShieldCheck, ShieldAlert, Lock } from 'lucide-react';
import api from '@/utils/httpMethods';
import { ConfirmModal } from '../SharedComponents';
import AddPartyPopup from '../AddPartyPopup';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    <Card className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold">Counterparties</CardTitle>
            <CardDescription className="text-xs">Manage people you lend to or borrow from</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {!isPro && (
          <div className="flex justify-end mb-4">
            <Badge variant="outline" className={cn(
              "text-[10px] font-bold uppercase tracking-wider px-3 py-1",
              limitReached ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
            )}>
              {parties.length}/5 Used
            </Badge>
          </div>
        )}
        <div className="p-1 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {parties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-slate-300" />
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">No counterparties found</div>
              <div className="text-[10px] text-slate-400/60 mt-1">Add contacts for tracking debts and loans</div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {parties.slice(0, isPro ? 50 : 5).map((party) => (
                <div 
                  key={party._id} 
                  className="group flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-black text-xs shadow-sm">
                      {party.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                        {party.name}
                      </div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-70">
                        {party.relation}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-indigo-500/10 hover:text-indigo-500"
                      onClick={() => setPartyModal(party)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-rose-500/10 hover:text-rose-500"
                      onClick={() => setDeletePartyModal(party)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {!isPro && parties.length > 5 && (
                <div className="p-3 text-center bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    + {parties.length - 5} more hidden (Basic Plan)
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <Button
          onClick={handleAddParty}
          variant="outline"
          className={cn(
            "w-full mt-6 h-11 rounded-xl border-dashed border-2 hover:border-solid transition-all font-bold text-[11px] uppercase tracking-widest gap-2",
            limitReached 
              ? "border-rose-500/30 text-rose-500 hover:bg-rose-500/5 hover:border-rose-500" 
              : "border-indigo-500/30 text-indigo-500 hover:bg-indigo-500/5 hover:border-indigo-500"
          )}
        >
          {limitReached ? <Lock className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {limitReached ? 'Limit Reached (Upgrade to PRO)' : 'Add Counterparty'}
        </Button>
      </CardContent>

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
        <ConfirmModal
          title="Delete Counterparty"
          description={`Permanently remove "${deletePartyModal.name}"? This will affect related debt records.`}
          confirmLabel="Delete"
          busy={deletingParty}
          onConfirm={handleDeleteParty}
          onCancel={() => setDeletePartyModal(null)}
        />
      )}
    </Card>
  );
}
