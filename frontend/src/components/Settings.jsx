import UserIdentity from './settings/UserIdentity';
import Taxonomy from './settings/Taxonomy';
import SubscriptionManagement from './settings/SubscriptionManagement';
import DataExport from './settings/DataExport';
import Counterparties from './settings/Counterparties';
import Appearance from './settings/Appearance';
import RegionalSpecs from './settings/RegionalSpecs';
import SystemMetrics from './settings/SystemMetrics';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { ShieldAlert } from 'lucide-react';

export default function Settings() {
  const handleHardReset = () => {
    if (
      window.confirm(
        'Executing a hard reset will permanently purge all ledger entries, taxonomies, accounts, and counterparty metadata. This action is IRREVERSIBLE. Are you sure?',
      )
    ) {
      // Implement reset logic or show a custom modal
      console.log('System reset requested');
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
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
    </div>
  );
}
