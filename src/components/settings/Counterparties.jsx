import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '@/utils/httpMethods';
import { DeleteConfirmModal } from '../SharedComponents';
import AddPartyPopup from '../AddPartyPopup';

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
      window.dispatchEvent(new CustomEvent('refetch-system-metrics'));
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
    <div className="settings-card">
      <div className="settings-section-title"><div className="icon">👥</div>Counterparties</div>
      
      {parties.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)', border: '1px dashed var(--border)', borderRadius: 'var(--r2)' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>👥</div>
          <div style={{ fontSize: 13 }}>No counterparties linked</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {parties.slice(0, 5).map(party => (
            <div key={party._id} className="cat-row">
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div 
                  className="party-avatar" 
                  style={{ 
                    background: 'var(--accent)', 
                    width: 28, height: 28, 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: 11, fontWeight: 700, 
                    color: '#fff', 
                    marginRight: 10 
                  }}
                >
                  {party.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{party.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase' }}>{party.relation}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button 
                  className="icon-btn" 
                  style={{ width: 26, height: 26, fontSize: 11 }}
                  onClick={() => setPartyModal(party)}
                >
                  ✏️
                </button>
                <button 
                  className="icon-btn" 
                  style={{ width: 26, height: 26, fontSize: 11 }}
                  onClick={() => setDeletePartyModal(party)}
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
          {parties.length > 5 && (
            <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 8 }}>
              + {parties.length - 5} more counterparties
            </div>
          )}
        </div>
      )}

      <button 
        onClick={() => setPartyModal('new')}
        className="btn-outline" 
        style={{ width: '100%', marginTop: 12, justifyContent: 'center' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 6 }}>person_add</span>
        Add Counterparty
      </button>

      {partyModal && (
        <AddPartyPopup
          party={partyModal === 'new' ? null : partyModal}
          onClose={() => setPartyModal(null)}
          onSave={handlePartySaved}
        />
      )}

      {deletePartyModal && (
        <DeleteConfirmModal
          title="Delete Counterparty"
          description={`Permanently remove "${deletePartyModal.name}"? This action cannot be undone.`}
          busy={deletingParty}
          onConfirm={handleDeleteParty}
          onCancel={() => setDeletePartyModal(null)}
        />
      )}
    </div>
  );
}

