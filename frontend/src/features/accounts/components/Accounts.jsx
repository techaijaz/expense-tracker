import { useEffect, useMemo, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import api from '@/utils/httpMethods';
import {
  getAccounts,
  updateAccount,
  removeAccount,
} from '@/features/accounts/state/accountSlice';
import AddAccounts from './AddAccounts';
import SubscriptionPopup from '@/features/settings/components/SubscriptionPopup';
import useFormat from '@/hooks/useFormat';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Play, Pause, Star, Edit, Trash2, MoreVertical } from 'lucide-react';

// ─── Account type config ──────────────────────────────────────────────────────
const ACCOUNT_TYPE_CONFIG = {
  CASH: {
    emoji: '💵',
    label: 'Cash',
    badgeClass: 'acc-type-badge cash',
    balanceColor: 'var(--green)',
  },
  BANK: {
    emoji: '🏛',
    label: 'Bank',
    badgeClass: 'acc-type-badge bank',
    balanceColor: 'var(--accent)',
  },
  INVESTMENT: {
    emoji: '📈',
    label: 'Investment',
    badgeClass: 'acc-type-badge investment',
    balanceColor: 'var(--purple)',
  },
  CREDIT_CARD: {
    emoji: '💳',
    label: 'Credit',
    badgeClass: 'acc-type-badge credit',
    balanceColor: 'var(--red)',
    isNegative: true,
  },
  WALLET: {
    emoji: '📱',
    label: 'E-Wallet',
    badgeClass: 'acc-type-badge ewallet',
    balanceColor: 'var(--amber)',
  },
};

const getTypeConfig = (type) =>
  ACCOUNT_TYPE_CONFIG[type] || {
    emoji: '🏦',
    label: type,
    badgeClass: 'acc-type-badge bank',
    balanceColor: 'var(--accent)',
  };

function AccountMenu({
  account,
  onSetDefault,
  onToggleActive,
  onEdit,
  onDelete,
  onOpenChange,
}) {
  const isCash = account.type === 'CASH';

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger className="p-1 hover:bg-bg4 rounded-md outline-none transition-colors">
        <MoreVertical className="w-4 h-4 text-text2" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px] bg-bg4 border-border2 rounded-[var(--r)] shadow-lg">
        <DropdownMenuItem
          disabled={isCash}
          onClick={onToggleActive}
          className={`gap-2.5 px-3 py-2 text-[13px] font-medium cursor-pointer ${
            account.isActive ? 'text-red-500 hover:text-red-600 focus:text-red-600 focus:bg-red-500/10' : 'text-green-500 hover:text-green-600 focus:text-green-600 focus:bg-green-500/10'
          }`}
        >
          {account.isActive ? (
            <><Pause className="w-3.5 h-3.5" /> Set Inactive</>
          ) : (
            <><Play className="w-3.5 h-3.5" /> Set Active</>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled={account.isDefault}
          onClick={onSetDefault}
          className="gap-2.5 px-3 py-2 text-[13px] font-medium text-text2 focus:bg-bg5 focus:text-text cursor-pointer data-[disabled]:opacity-60"
        >
          <Star className={`w-3.5 h-3.5 ${account.isDefault ? 'fill-amber-500 text-amber-500' : ''}`} />
          {account.isDefault ? 'Default Account' : 'Set as Default'}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={onEdit}
          className="gap-2.5 px-3 py-2 text-[13px] font-medium text-accent focus:bg-bg5 focus:text-accent cursor-pointer"
        >
          <Edit className="w-3.5 h-3.5" /> Edit Account
        </DropdownMenuItem>

        {!isCash && (
          <>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              onClick={onDelete}
              className="gap-2.5 px-3 py-2 text-[13px] font-medium text-red-500 focus:bg-red-500/10 focus:text-red-600 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Account
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-bg2 border border-border rounded-[var(--r3)] p-5 animate-pulse">
      <div className="h-[22px] w-[70px] bg-bg4 rounded-[var(--r2)] mb-3.5" />
      <div className="h-[20px] w-[130px] bg-bg4 rounded-[var(--r2)] mb-1.5" />
      <div className="h-[12px] w-[90px] bg-bg4 rounded-[var(--r2)] mb-[18px]" />
      <div className="h-[32px] w-[120px] bg-bg4 rounded-[var(--r2)]" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Accounts() {
  const dispatch = useDispatch();
  const { accounts } = useSelector((state) => state.accounts);
  const { user } = useSelector((state) => state.auth);
  const { formatAmount } = useFormat();
  const [loading, setLoading] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [deletingAccount, setDeletingAccount] = useState(null);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deleteInput, setDeleteInput] = useState('');
  const userObj = user?.user || user;
  const isAdmin = userObj?.role === 'admin';
  const plan = (isAdmin || userObj?.plan === 'pro') ? 'pro' : 'basic';

  // Fetch accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      setLoading(true);
      try {
        const res = await api.get('/account');
        dispatch(getAccounts(res?.data || []));
      } catch {
        toast.error('Failed to load accounts');
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, [dispatch]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSetDefault = async (account) => {
    try {
      const res = await api.patch(`/account/${account._id}`, {
        isDefault: true,
      });
      dispatch(updateAccount(res?.data));
      toast.success(`"${account.name}" is now your default account`);
    } catch {
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
      toast.success(
        `"${account.name}" has been deleted. Related transactions remain in your history.`,
      );
      setDeletingAccount(null);
      setDeleteInput('');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to delete account');
    }
  };

  // ── Derived stats ────────────────────────────────────────────────────────
  const netLiquidity = useMemo(() => {
    if (!accounts) return 0;
    return accounts
      .filter((a) => !a.isDeleted)
      .reduce((sum, acc) => {
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
    accounts
      .filter((a) => !a.isDeleted)
      .forEach((acc) => {
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

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="page-body pt-0">
      {/* Net Liquidity + Allocation (Moved to Top) */}
      {accounts && accounts.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-6 mb-8 bg-bg2 p-6 rounded-[var(--r4)] border border-border">
          {/* Left: Net Liquidity */}
          <div>
            <div className="text-[11px] text-text3 uppercase tracking-[0.08em] font-semibold mb-2">
              Net Liquidity
            </div>
            <div className={`text-[clamp(24px,5vw,36px)] font-bold font-mono tracking-tight ${netLiquidity >= 0 ? 'text-accent' : 'text-red-500'}`}>
              {formatAmount(netLiquidity)}
            </div>
            <div className="text-xs text-green-500 mt-1.5 flex items-center gap-1">
              ↑ Active Portfolio
            </div>
          </div>

          {/* Right: Allocation Breakdown */}
          <div className="hidden sm:block min-w-[300px]">
            <div className="text-[11px] text-text3 uppercase tracking-[0.08em] font-semibold mb-3">
              Allocation Breakdown
            </div>

            {[
              {
                label: 'Total Banking',
                value: allocation.banking,
                color: 'var(--accent)',
              },
              {
                label: 'Investments',
                value: allocation.investments,
                color: 'var(--purple)',
              },
              {
                label: 'Liquid Cash',
                value: allocation.cash,
                color: 'var(--green)',
              },
              {
                label: 'Other',
                value: allocation.other,
                color: 'var(--amber)',
              },
            ].map(({ label, value, color }) => {
              const pct = ((value / allocation.total) * 100).toFixed(1);
              return (
                <div className="flex items-center gap-3 mb-2 last:mb-0" key={label}>
                  <span className="w-24 text-[11px] text-text2 font-medium truncate">{label}</span>
                  <div className="flex-1 h-1.5 bg-bg4 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: color,
                        transition: 'width 0.8s ease',
                      }}
                    />
                  </div>
                  <span className="w-10 text-right text-[11px] font-mono font-medium text-text">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Plan Banner */}
      {plan === 'basic' && (
        <div className="flex items-center gap-3 p-3 mb-6 text-xs border rounded-[var(--r2)] bg-amber-500/10 border-amber-500/20 text-amber-500">
          <span className="text-sm">⭐</span>
          <p className="flex-1">
            <b>Basic Plan:</b> You can have 1 account of each type.
            <a
              href="#"
              className="ml-2 font-bold underline text-accent"
              onClick={(e) => {
                e.preventDefault();
                setIsSubscriptionOpen(true);
              }}
            >
              Upgrade to Pro for unlimited →
            </a>
          </p>
        </div>
      )}

      {/* Sectioned Accounts */}
      {loading ? (
        <div className="flex flex-wrap gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : accounts && accounts.length > 0 ? (
        <div className="space-y-10">
          {Object.entries(ACCOUNT_TYPE_CONFIG).map(([type, config]) => {
            const typeAccounts = accounts.filter(
              (acc) => acc.type === type && !acc.isDeleted,
            );

            if (typeAccounts.length === 0 && type !== 'BANK' && type !== 'CASH')
              return null;

            const hasOpenMenu = typeAccounts.some(a => a._id === openMenuId);

            return (
              <div
                key={type}
                className={`mb-10 ${hasOpenMenu ? 'relative z-10' : ''}`}
              >
                <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-text2 flex items-center gap-2">
                    <span>{config.emoji}</span>
                    {config.label}s
                  </h3>
                  <span className="text-[10px] bg-bg3 px-2 py-0.5 rounded-full font-mono text-text3">
                    {typeAccounts.length} Account
                    {typeAccounts.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex flex-wrap gap-4">
                  {typeAccounts.map((account) => {
                    const cfg = getTypeConfig(account.type);
                    const balanceInt = Number(account.balance || 0);
                    const isInactive = !account.isActive;

                    return (
                      <div
                        key={account._id}
                        className={`flex-1 min-w-[280px] max-w-full sm:max-w-[calc(50%-8px)] lg:max-w-[calc(33.33%-11px)] xl:max-w-[calc(25%-12px)] bg-bg2 border border-border p-5 rounded-[var(--r3)] relative transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${openMenuId === account._id ? 'z-20 ring-2 ring-accent/20' : ''}`}
                        style={{
                          opacity: isInactive ? 0.5 : 1,
                          filter: isInactive ? 'grayscale(0.6)' : 'none',
                          borderColor: account.isDefault
                            ? 'var(--accent)'
                            : undefined,
                        }}
                      >
                        {/* Inactive badge */}
                        {isInactive && (
                          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 bg-bg4 border border-border2 rounded-[var(--r2)] px-2 py-0.5 text-[10px] font-bold text-text3 uppercase tracking-[0.1em] z-10">
                            INACTIVE
                          </div>
                        )}

                        {/* Header row: badge + menu */}
                        <div className="flex items-center justify-between">
                          <span className={cfg.badgeClass}>
                            {cfg.emoji} {cfg.label}
                          </span>
                          <AccountMenu
                            account={account}
                            onSetDefault={() => handleSetDefault(account)}
                            onToggleActive={() => handleToggleActive(account)}
                            onEdit={() => setEditingAccount(account)}
                            onDelete={
                              account.type === 'CASH'
                                ? null
                                : () => setDeletingAccount(account)
                            }
                            openMenuId={openMenuId}
                            onOpenChange={(isOpen) =>
                              setOpenMenuId(isOpen ? account._id : null)
                            }
                          />
                        </div>

                        {/* Account name */}
                        <div className="font-bold text-[15px] text-text mt-3 mb-1 truncate pr-8">
                          {account.name}
                          {account.isDefault && (
                            <span className="ml-2 text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold">★ Default</span>
                          )}
                        </div>

                        {/* Account number / subtitle */}
                        <div className="text-xs text-text3 font-mono mb-4">
                          {account.type === 'CASH'
                            ? 'Always available'
                            : account.accountNumber
                              ? `•••• •••• •••• ${account.accountNumber}`
                              : '—'}
                        </div>

                        {/* Balance */}
                        <div
                          className="text-[22px] font-bold font-mono tracking-tight"
                          style={{ color: cfg.balanceColor }}
                        >
                          {cfg.isNegative
                            ? `${formatAmount(Math.abs(balanceInt))}${balanceInt < 0 ? ' Owed' : ''}`
                            : formatAmount(balanceInt)}
                        </div>

                        {/* Credit limit if applicable */}
                        {cfg.isNegative && account.creditLimit > 0 && (
                          <div className="text-[11px] text-text3 mt-1.5 font-mono">
                            Limit: {formatAmount(account.creditLimit)}
                          </div>
                        )}

                        {/* Recurring Days for Credit Card */}
                        {account.type === 'CREDIT_CARD' &&
                          (account.statementDay || account.dueDay) && (
                            <div className="flex gap-3 mt-2 text-[10px] text-text3 font-medium">
                              {account.statementDay && (
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[12px]">
                                    description
                                  </span>
                                  Day {account.statementDay}
                                </span>
                              )}
                              {account.dueDay && (
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[12px]">
                                    event_repeat
                                  </span>
                                  Day {account.dueDay}
                                </span>
                              )}
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border2 rounded-[var(--r4)] gap-4">
          <div className="text-5xl">🏦</div>
          <div className="text-base font-bold text-text2">
            No accounts in your ecosystem
          </div>
          <p className="text-sm text-text3 max-w-xs text-center">
            Initialize your first account to begin tracking your liquidity and
            cash flow.
          </p>
          <AddAccounts
            customTrigger={
              <Button className="mt-2 font-bold text-sm h-12 bg-gradient-to-r from-accent to-accent2 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-accent/20 transition-all rounded-xl text-white border-none">
                + Initialize First Account
              </Button>
            }
          />
        </div>
      )}

      {/* Edit Account Modal */}
      {editingAccount && (
        <AddAccounts
          editAccount={editingAccount}
          onEditClose={() => setEditingAccount(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingAccount}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingAccount(null);
            setDeleteInput('');
          }
        }}
      >
        <DialogContent className="bg-bg2 border-border2 rounded-[var(--r4)] max-w-[440px] p-7">
          <DialogHeader>
            <DialogTitle className="text-text text-[18px] font-bold tracking-tight flex items-center gap-2">
              Delete Account
            </DialogTitle>
            <DialogDescription className="text-text2 text-[13px] leading-relaxed pt-2">
              This will remove{' '}
              <span className="text-text font-bold">
                "{deletingAccount?.name}"
              </span>{' '}
              from your account lists and filters. Related transactions will
              <span className="text-accent font-bold">
                {' '}
                NOT{' '}
              </span>
              be deleted. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-[var(--r2)]">
            <div className="text-[11px] font-bold text-red-500 uppercase tracking-[0.08em] mb-2">
              Confirm Deletion
            </div>
            <div className="text-xs text-text2 mb-3">
              Type <b>DELETE</b> to confirm this operation.
            </div>
            <Input
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="Type DELETE here..."
              className="bg-bg2 border-red-500/30 text-text text-[13px] focus-visible:ring-red-500"
            />
          </div>

          <DialogFooter className="mt-6 gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setDeletingAccount(null);
                setDeleteInput('');
              }}
              className="rounded-[var(--r2)] text-[13px] font-semibold border-border2 text-text2 hover:text-text hover:bg-bg4"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleDelete(deletingAccount)}
              disabled={deleteInput.toUpperCase() !== 'DELETE'}
              className="rounded-[var(--r2)] text-[13px] font-semibold bg-red-500 hover:bg-red-600 text-white border-none disabled:opacity-50"
            >
              Confirm Deletion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SubscriptionPopup
        isOpen={isSubscriptionOpen}
        onOpenChange={setIsSubscriptionOpen}
        currentPlan={plan}
      />

      {/* Mobile Floating Action Button */}
      <div className="sm:hidden fixed bottom-8 right-6 z-50">
        <AddAccounts
          customTrigger={
            <button
              className="w-14 h-14 rounded-full bg-accent text-white shadow-2xl shadow-black/30 flex items-center justify-center active:scale-90 transition-all border-4 border-bg hover:bg-accent2"
            >
              <span className="text-2xl font-bold">+</span>
            </button>
          }
        />
      </div>
    </div>
  );
}

