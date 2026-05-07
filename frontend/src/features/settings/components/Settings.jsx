import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import UserIdentity from '@/features/settings/components/UserIdentity';
import Taxonomy from '@/features/settings/components/Taxonomy';
import SubscriptionManagement from '@/features/settings/components/SubscriptionManagement';
import DataExport from '@/features/settings/components/DataExport';
import Counterparties from '@/features/settings/components/Counterparties';
import Appearance from '@/features/settings/components/Appearance';
import RegionalSpecs from '@/features/settings/components/RegionalSpecs';
import SystemMetrics from '@/features/settings/components/SystemMetrics';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ShieldAlert, ShieldCheck, Lock } from 'lucide-react';
import { PasswordConfirmModal, SetPasswordModal } from '@/components/common/SharedComponents';
import api from '@/utils/httpMethods';
import { useSelector, useDispatch } from 'react-redux';
import { updateHasPassword } from '@/features/auth/state/authSlice';

export default function Settings() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector((s) => s.auth.user);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSetPwdModal, setShowSetPwdModal] = useState(false);

  const handleHardReset = () => {
    if (!currentUser?.hasPassword) {
      setShowSetPwdModal(true);
    } else {
      setShowResetModal(true);
    }
  };

  const handleSetPwdConfirm = async (newPassword) => {
    try {
      await api.put('/user/change-password', { newPassword });
      dispatch(updateHasPassword(true));
      setShowSetPwdModal(false);
      // Wait a bit then show reset modal
      setTimeout(() => setShowResetModal(true), 300);
    } catch (err) {
      throw err; // Handled by modal
    }
  };

  const confirmHardReset = async (password) => {
    try {
      await api.delete('/user/hard-reset', { password });
      toast.success('System reset successful. All data purged.');
      // Refresh to trigger re-onboarding/empty state
      window.location.reload();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Reset failed. Please check your password.');
      throw err; // Allow modal to handle busy state
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
      {!currentUser?.hasPassword && currentUser?.googleId && (
        <div className="flex flex-col md:flex-row items-center justify-between p-6 rounded-3xl bg-primary/10 border border-primary/20 gap-4 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/20 text-primary shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Security Action Required</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Your account needs a local password for advanced administrative protocols.</p>
            </div>
          </div>
          <Button 
            onClick={() => {
              const el = document.getElementById('user-identity-card');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full md:w-auto h-11 px-8 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all"
          >
            Setup Now
          </Button>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── LEFT COLUMN ── */}
        <div className="space-y-6">
          <UserIdentity />
          <SubscriptionManagement />
          <Appearance />
          <RegionalSpecs />
          <DataExport />

          <Card className="border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/10 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-rose-100 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-900/20 py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-rose-600 dark:text-rose-400">Protocol Override</CardTitle>
                  <CardDescription className="text-xs text-rose-500/70">Purge all local and cloud data modules</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/30 shadow-sm">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                  Executing a hard reset will permanently purge all ledger entries, taxonomies, accounts, and counterparty metadata. This action is <span className="font-bold text-rose-600 uppercase">Irreversible</span>.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleHardReset}
                className="w-full h-11 rounded-xl font-bold shadow-lg shadow-rose-500/20 transition-all"
              >
                Reset All Data Modules
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-6">
          <SystemMetrics />
          <Taxonomy />
          <Counterparties />
        </div>
      </div>

      {showResetModal && (
        <PasswordConfirmModal
          title="Protocol Override"
          description="Executing a hard reset will permanently purge all ledger entries, taxonomies, accounts, and counterparty metadata. This action is IRREVERSIBLE. Please enter your password to authorize the purge."
          confirmLabel="Execute Purge"
          danger
          onConfirm={confirmHardReset}
          onCancel={() => setShowResetModal(false)}
        />
      )}

      {showSetPwdModal && (
        <SetPasswordModal
          onConfirm={handleSetPwdConfirm}
          onCancel={() => setShowSetPwdModal(false)}
        />
      )}
    </div>
  );
}
