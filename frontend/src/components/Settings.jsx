import UserIdentity from './settings/UserIdentity';
import Taxonomy from './settings/Taxonomy';
import SubscriptionManagement from './settings/SubscriptionManagement';
import DataExport from './settings/DataExport';
import Counterparties from './settings/Counterparties';
import Appearance from './settings/Appearance';
import RegionalSpecs from './settings/RegionalSpecs';
import SystemMetrics from './settings/SystemMetrics';
import { Button } from './ui/button';

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
    <div className="page-body">
      <div className="settings-layout">
        {/* ── LEFT COLUMN ── */}
        <div>
          <UserIdentity />
          <SubscriptionManagement />
          <Appearance />
          <RegionalSpecs />
          <DataExport />
          <div className="danger-zone">
            <div className="danger-title">⚠️ Protocol Override</div>
            <div className="danger-desc">
              Executing a hard reset will permanently purge all ledger entries,
              taxonomies, accounts, and counterparty metadata. This action is{' '}
              <b>irreversible</b>. Password verification required.
            </div>
            <Button
              variant="destructive"
              onClick={handleHardReset}
              className="mt-4 w-full sm:w-auto"
            >
              Reset All Data Modules
            </Button>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div>
          <SystemMetrics />
          <Taxonomy />
          <Counterparties />
        </div>
      </div>
    </div>
  );
}
