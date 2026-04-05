import { useEffect, useMemo, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import api from '@/utils/httpMethods';
import {
  getAccounts,
  updateAccount,
  removeAccount,
} from '@/redux/accountSlice';
import AddAccounts from './AddAccounts';
import { formatAmount } from '@/utils/format';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ─── Account type config ──────────────────────────────────────────────────────
const getAccountConfig = (type) =>
  ({
    BANK: {
      icon: 'account_balance',
      color: 'text-primary',
      bar: 'bg-primary',
      badge: 'bg-primary/10 text-primary border-primary/20',
    },
    CASH: {
      icon: 'wallet',
      color: 'text-tertiary',
      bar: 'bg-tertiary',
      badge: 'bg-tertiary/10 text-tertiary border-tertiary/20',
    },
    INVESTMENT: {
      icon: 'show_chart',
      color: 'text-secondary',
      bar: 'bg-secondary',
      badge: 'bg-secondary/10 text-secondary border-secondary/20',
    },
    CREDIT_CARD: {
      icon: 'credit_card',
      color: 'text-error',
      bar: 'bg-error',
      badge: 'bg-error/10 text-error border-error/20',
      isNegative: true,
    },
  })[type] || {
    icon: 'savings',
    color: 'text-primary',
    bar: 'bg-primary',
    badge: 'bg-primary/10 text-primary border-primary/20',
  };

// ─── Card-level dropdown menu (2 options only) ────────────────────────────────
function AccountMenu({
  account,
  onSetDefault,
  onToggleActive,
  onEdit,
  onDelete,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const isCash = account.type === 'CASH';

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1 rounded-md hover:bg-white/5 transition-colors text-outline outline-none"
      >
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: "'FILL' 0" }}
        >
          more_vert
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-52 bg-surface-container-highest border border-outline-variant/20 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
          {/* Toggle Active/Inactive */}
          <button
            onClick={() => {
              onToggleActive();
              setOpen(false);
            }}
            disabled={isCash}
            title={isCash ? 'Cash account cannot be deactivated' : ''}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-white/5 transition-colors text-left ${isCash ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <span
              className={`material-symbols-outlined text-[18px] ${account.isActive ? 'text-error' : 'text-secondary'}`}
              style={{ fontVariationSettings: "'FILL' 0" }}
            >
              {account.isActive ? 'toggle_off' : 'toggle_on'}
            </span>
            {account.isActive ? 'Set Inactive' : 'Set Active'}
          </button>

          {/* Set as Default */}
          <button
            onClick={() => {
              onSetDefault();
              setOpen(false);
            }}
            disabled={account.isDefault}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-white/5 transition-colors text-left ${account.isDefault ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <span
              className={`material-symbols-outlined text-[18px] ${account.isDefault ? 'text-amber-400' : 'text-outline'}`}
              style={{
                fontVariationSettings: account.isDefault
                  ? "'FILL' 1"
                  : "'FILL' 0",
              }}
            >
              star
            </span>
            {account.isDefault ? 'Default Account' : 'Set as Default'}
          </button>

          {/* Edit Account */}
          <button
            onClick={() => {
              onEdit();
              setOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-white/5 transition-colors text-left"
          >
            <span
              className="material-symbols-outlined text-[18px] text-primary"
              style={{ fontVariationSettings: "'FILL' 0" }}
            >
              edit
            </span>
            Edit Account
          </button>

          {/* Delete Account - Hidden for CASH */}
          {!isCash && (
            <button
              onClick={() => {
                onDelete();
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-error hover:bg-error/5 transition-colors text-left"
            >
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                delete
              </span>
              Delete Account
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Accounts() {
  const dispatch = useDispatch();
  const { accounts } = useSelector((state) => state.accounts);
  const { user } = useSelector((state) => state.auth);
  const preferences = user?.user?.preferences || {};
  const { currency = 'INR', decimalPlaces = 2 } = preferences;
  const [loading, setLoading] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [deletingAccount, setDeletingAccount] = useState(null);
  const [deleteInput, setDeleteInput] = useState('');
  const subscriptionTier = user?.user?.subscriptionTier || 'BASIC';

  // Fetch accounts on mount
  useEffect(() => {
    const fetchAccounts = async () => {
      setLoading(true);
      try {
        const res = await api.get('/account');
        dispatch(getAccounts(res?.data || []));
      } catch (e) {
        toast.error('Failed to load accounts');
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, [dispatch]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSetDefault = async (account) => {
    try {
      const res = await api.patch(`/account/${account._id}`, {
        isDefault: true,
      });
      dispatch(updateAccount(res?.data));
      toast.success(`"${account.name}" is now your default account`);
    } catch (e) {
      toast.error('Failed to set default account');
    }
  };

  const handleToggleActive = async (account) => {
    if (account.type === 'CASH' && account.isActive) {
      toast.error('Cash account cannot be set to inactive');
      return;
    }
    try {
      const res = await api.patch(`/account/${account._id}`, {
        isActive: !account.isActive,
      });
      dispatch(updateAccount(res?.data));
      toast.success(
        `"${account.name}" is now ${!account.isActive ? 'active' : 'inactive'}`,
      );
    } catch (e) {
      toast.error(
        e?.response?.data?.message || 'Failed to update account status',
      );
    }
  };

  const handleDelete = async (account) => {
    if (deleteInput.toUpperCase() !== 'DELETE') return;
    try {
      await api.delete(`/account/${account._id}`);
      dispatch(removeAccount(account._id));
      toast.success(`"${account.name}" and all related data removed.`);
      setDeletingAccount(null);
      setDeleteInput('');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to delete account');
    }
  };

  // ── Derived stats ─────────────────────────────────────────────────────────
  const netLiquidity = useMemo(() => {
    if (!accounts) return 0;
    return accounts.reduce((sum, acc) => {
      const bal = Number(acc.balance || 0);
      return acc.type === 'CREDIT_CARD' ? sum - Math.abs(bal) : sum + bal;
    }, 0);
  }, [accounts]);

  const allocation = useMemo(() => {
    if (!accounts || accounts.length === 0)
      return { banking: 0, investments: 0, cash: 0, other: 0, total: 1 };
    let banking = 0,
      investments = 0,
      cash = 0,
      other = 0,
      totalPositive = 0;
    accounts.forEach((acc) => {
      if (acc.type === 'CREDIT_CARD') return;
      const bal = Math.max(0, Number(acc.balance || 0));
      totalPositive += bal;
      if (acc.type === 'BANK') banking += bal;
      else if (acc.type === 'INVESTMENT') investments += bal;
      else if (acc.type === 'CASH') cash += bal;
      else other += bal;
    });
    return { banking, investments, cash, other, total: totalPositive || 1 };
  }, [accounts]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 p-6 lg:p-10 w-full max-w-[1600px] mx-auto min-h-screen bg-surface">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-headline tracking-tight text-on-surface">
            Financial Ecosystem
          </h1>
          <p className="text-slate-400 text-sm font-body">
            Manage and monitor your liquidity across all platforms.
          </p>
          {subscriptionTier === 'BASIC' && (
            <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg w-max">
              <span
                className="material-symbols-outlined text-amber-400 text-[16px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                workspace_premium
              </span>
              <span className="text-amber-400 text-xs font-bold">
                BASIC — 1 bank account limit. Upgrade to PRO for unlimited.
              </span>
            </div>
          )}
        </div>

        <AddAccounts
          customTrigger={
            <button className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-br from-primary to-on-primary-container text-on-primary rounded-lg font-headline text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all outline-none">
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                add
              </span>
              Initialize New Account
            </button>
          }
        />

        {editingAccount && (
          <AddAccounts
            editAccount={editingAccount}
            onEditClose={() => setEditingAccount(null)}
          />
        )}
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          Array(4)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="bg-surface-container-highest/20 rounded-xl p-6 border border-outline-variant/10 animate-pulse"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-highest/40" />
                  <div className="w-6 h-6 rounded bg-surface-container-highest/40" />
                </div>
                <div className="space-y-3">
                  <div className="w-2/3 h-5 bg-surface-container-highest/40 rounded" />
                  <div className="w-1/3 h-3 bg-surface-container-highest/40 rounded" />
                  <div className="w-full h-8 bg-surface-container-highest/40 rounded mt-4" />
                </div>
              </div>
            ))
        ) : accounts && accounts.length > 0 ? (
          accounts.map((account) => {
            const { icon, color, bar, badge, isNegative } = getAccountConfig(
              account.type,
            );
            const balanceInt = Number(account.balance || 0);
            const isInactive = !account.isActive;

            return (
              <div
                key={account._id}
                className={`group relative bg-surface-container-lowest rounded-xl p-6 shadow-sm shadow-black/20 border transition-all duration-300 ${
                  isInactive
                    ? 'border-outline-variant/5 opacity-50 grayscale'
                    : account.isDefault
                      ? 'border-primary/20 shadow-primary/10'
                      : 'border-outline-variant/5 hover:bg-surface-container-low'
                }`}
              >
                {/* Accent left bar */}
                <div
                  className={`absolute left-0 top-6 bottom-6 w-1 ${bar} rounded-r-full`}
                />

                {/* Inactive overlay label */}
                {isInactive && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-surface-container-highest/80 text-outline px-3 py-1 rounded-full border border-outline/20">
                      INACTIVE
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className="flex justify-between items-start mb-4 pl-4">
                  <div
                    className={`w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center shadow-inner border border-white/5 ${color}`}
                  >
                    <span
                      className="material-symbols-outlined text-2xl"
                      style={{ fontVariationSettings: "'FILL' 0" }}
                    >
                      {icon}
                    </span>
                  </div>
                  <AccountMenu
                    account={account}
                    onSetDefault={() => handleSetDefault(account)}
                    onToggleActive={() => handleToggleActive(account)}
                    onEdit={() => setEditingAccount(account)}
                    onDelete={() => setDeletingAccount(account)}
                  />
                </div>

                {/* Badges */}
                <div className="flex gap-1.5 pl-4 mb-3 flex-wrap">
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge}`}
                  >
                    {account.type}
                  </span>
                  {account.isDefault && (
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/20 flex items-center gap-1">
                      <span
                        className="material-symbols-outlined text-[9px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                      DEFAULT
                    </span>
                  )}
                </div>

                {/* Name & Balance */}
                <div className="pl-4">
                  <h3 className="text-on-surface font-headline font-bold text-lg mb-1 truncate">
                    {account.name}
                  </h3>
                  {account.accountNumber && account.type !== 'CASH' && (
                    <p className="text-[10px] text-outline font-black tracking-[0.2em] uppercase mb-3 flex items-center gap-1.5 opacity-80">
                      <span
                        className="material-symbols-outlined text-[12px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        credit_card
                      </span>
                      **** {account.accountNumber}
                    </p>
                  )}
                  {isNegative ? (
                    <div>
                      <div className="tnum text-2xl font-bold font-headline text-error break-words">
                        {formatAmount(
                          Math.abs(balanceInt),
                          currency,
                          decimalPlaces,
                        )}
                        <span className="text-sm font-medium ml-1 uppercase">
                          {' '}
                          {balanceInt < 0 ? 'Owed' : 'Available'}
                        </span>
                      </div>
                      {account.creditLimit > 0 && (
                        <p className="text-xs text-on-surface-variant font-medium mt-0.5 tracking-wider">
                          Limit:{' '}
                          {formatAmount(
                            account.creditLimit,
                            currency,
                            decimalPlaces,
                          )}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="tnum text-2xl font-bold font-headline text-on-surface break-words">
                      {formatAmount(balanceInt, currency, decimalPlaces)}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/10 rounded-xl bg-surface-container-low/20">
            <span
              className="material-symbols-outlined text-5xl text-outline mb-4 opacity-50"
              style={{ fontVariationSettings: "'FILL' 0" }}
            >
              account_balance_wallet
            </span>
            <p className="text-outline font-medium">
              No accounts detected in the ecosystem.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Initialize a new account to begin tracking liquidity.
            </p>
          </div>
        )}
      </div>

      {/* Statistics Banner */}
      {accounts && accounts.length > 0 && (
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Net Liquidity */}
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700" />
            <div className="relative z-10 flex justify-between items-center h-full">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-2">
                  Net Liquidity
                </p>
                <h2 className="text-4xl lg:text-5xl font-black font-headline tnum text-on-surface">
                  {formatAmount(netLiquidity, currency, decimalPlaces)}
                </h2>
                <p className="text-tertiary text-sm font-bold mt-3 flex items-center gap-1.5 bg-tertiary/10 w-max px-3 py-1 rounded-full border border-tertiary/20">
                  <span
                    className="material-symbols-outlined text-[16px]"
                    style={{ fontVariationSettings: "'FILL' 0" }}
                  >
                    trending_up
                  </span>
                  Active Portfolio
                </p>
              </div>
              <div className="hidden sm:flex relative z-10 mr-4">
                <div className="w-32 h-32 border border-tertiary/20 rounded-full flex items-center justify-center animate-[spin_10s_linear_infinite]">
                  <div className="w-24 h-24 border-2 border-dashed border-tertiary/40 rounded-full flex items-center justify-center animate-[spin_15s_linear_infinite_reverse]">
                    <span
                      className="material-symbols-outlined text-tertiary text-4xl"
                      style={{ fontVariationSettings: "'FILL' 0" }}
                    >
                      token
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Allocation Breakdown */}
          <div className="lg:col-span-5 bg-surface-container-low rounded-xl p-8 border border-outline-variant/5 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-headline font-bold text-on-surface text-lg">
                Allocation Breakdown
              </h4>
            </div>
            <div className="space-y-5 mt-4">
              {[
                {
                  label: 'Total Banking',
                  value: allocation.banking,
                  color: 'bg-primary',
                },
                {
                  label: 'Investments',
                  value: allocation.investments,
                  color: 'bg-tertiary',
                },
                {
                  label: 'Liquid Cash',
                  value: allocation.cash,
                  color: 'bg-secondary',
                },
                {
                  label: 'Other',
                  value: allocation.other,
                  color: 'bg-outline',
                },
              ].map(({ label, value, color }) => (
                <div key={label} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                    <span className="text-slate-400">{label}</span>
                    <span className="text-on-surface tnum">
                      {((value / allocation.total) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden border border-white/5">
                    <div
                      className={`h-full ${color} transition-all duration-1000`}
                      style={{ width: `${(value / allocation.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog
        open={!!deletingAccount}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingAccount(null);
            setDeleteInput('');
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px] bg-surface-container-highest border-outline-variant/20 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-on-surface flex items-center gap-2 font-headline font-black text-xl">
              <span
                className="material-symbols-outlined text-error"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                warning
              </span>
              Critical Action
            </DialogTitle>
            <DialogDescription className="py-4 text-outline font-medium text-sm leading-relaxed">
              This will permanently remove{' '}
              <span className="text-on-surface font-bold">
                "{deletingAccount?.name}"
              </span>{' '}
              and <span className="text-error font-bold underline">ALWAYS</span>{' '}
              hide its transactions and ledger history. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-[10px] font-black text-outline uppercase tracking-[0.2em]">
              Type <span className="text-on-surface">"Delete"</span> to confirm:
            </p>
            <Input
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="Type Delete here..."
              className="bg-surface-container-low border-outline-variant/30 text-on-surface font-medium placeholder:text-outline/30 focus:ring-primary/40 focus:bg-surface-container-high transition-all"
              autoFocus
            />
          </div>
          <DialogFooter className="mt-8 flex gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setDeletingAccount(null);
                setDeleteInput('');
              }}
              className="px-6 text-xs font-bold font-headline uppercase tracking-widest text-outline hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteInput !== 'DELETE'}
              onClick={() => handleDelete(deletingAccount)}
              className="px-8 bg-error text-on-error font-bold font-headline uppercase tracking-widest text-[11px] shadow-lg shadow-error/20 hover:opacity-90 disabled:opacity-30 transition-all font-black"
            >
              Confirm Deletion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
