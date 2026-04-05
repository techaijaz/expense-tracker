import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import api from '@/utils/httpMethods';
import { SectionCard, SectionTitle, FieldLabel, PasswordConfirmModal } from '../SharedComponents';

export default function SystemMetrics() {
  const { user } = useSelector(s => s.auth);
  const currentUser = user?.user;

  const [storageStats, setStorageStats] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const statsRes = await api.get('/user/storage-stats');
      setStorageStats(statsRes?.data || null);
    } catch (e) {
      console.error('Failed to fetch storage stats');
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleHardReset = async (password) => {
    try {
      await api.delete('/user/hard-reset', { data: { password } });
      toast.success('All data has been permanently deleted');
      setShowResetModal(false);
      // Wait a moment then refresh the app to reload fresh state
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Reset failed. Check your password.');
    }
  };

  return (
    <>
      <SectionCard>
        <SectionTitle icon="storage">System Metrics</SectionTitle>
        <div className="mb-4.5">
          <div className="flex justify-between mb-1.5">
            <FieldLabel>Storage Usage</FieldLabel>
            <span className="text-[11px] text-primary font-bold">{storageStats?.usagePercent ?? 0}%</span>
          </div>
          <div className="h-1.5 bg-secondary-container rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-1000 ease-in-out" style={{ width: `${storageStats?.usagePercent ?? 0}%` }} />
          </div>
          {storageStats && (
            <div className="grid grid-cols-3 gap-2 mt-3.5">
              {[
                { label:'Transactions', val: storageStats.transactions, icon:'receipt' },
                { label:'Accounts',     val: storageStats.accounts,     icon:'account_balance_wallet' },
                { label:'Categories',   val: storageStats.categories,   icon:'category' },
              ].map(({ label, val, icon }) => (
                <div key={label} className="p-2.5 bg-secondary-container rounded-[10px] text-center border border-secondary-container">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 0" }}>{icon}</span>
                  <p className="text-base font-extrabold text-on-surface mt-1">{val}</p>
                  <p className="text-[10px] text-on-surface-variant">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="pt-3.5 border-t border-secondary-container">
          <FieldLabel>Last Synchronized</FieldLabel>
          <p className="text-xs font-mono text-primary">
            {currentUser?.lastLoginAt
              ? new Date(currentUser.lastLoginAt).toISOString().replace('T',' ').substring(0,19) + ' UTC'
              : 'No sync data'}
          </p>
        </div>
      </SectionCard>

      <SectionCard danger>
        <div className="flex items-center gap-2.5 mb-3.5">
          <span className="material-symbols-outlined text-xl text-error" style={{ fontVariationSettings: "'FILL' 0" }}>warning</span>
          <h3 className="text-sm font-extrabold text-error uppercase tracking-[0.08em]">Protocol Override</h3>
        </div>
        <p className="text-xs text-on-surface-variant mb-4.5 leading-[1.7]">
          Executing a hard reset will permanently purge all ledger entries, taxonomies, accounts, and counterparty metadata. This action is <strong className="text-error">irreversible</strong>. Password verification required.
        </p>
        <button onClick={() => setShowResetModal(true)}
          className="w-full p-3 bg-error/5 border border-error/30 rounded-[10px] text-error text-[13px] font-bold cursor-pointer transition-all duration-200">
          Reset All Data Modules
        </button>
      </SectionCard>

      {showResetModal && (
        <PasswordConfirmModal
          title="Confirm Hard Reset"
          description="This will permanently delete ALL your transactions, accounts, categories, and parties. Enter your password to confirm."
          confirmLabel="Delete All My Data"
          danger
          onConfirm={handleHardReset}
          onCancel={() => setShowResetModal(false)}
        />
      )}
    </>
  );
}
