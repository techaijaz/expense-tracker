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
import SubscriptionPopup from './SubscriptionPopup';
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
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const isCash = account.type === 'CASH';


  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        onOpenChange?.(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <div
        className="acc-menu"
        onClick={() => {
          const next = !open;
          setOpen(next);
          onOpenChange?.(next);
        }}
        title="Account options"
      >
        ⋮
      </div>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '36px',
            zIndex: 100,
            width: '200px',
            background: 'var(--bg4)',
            border: '1px solid var(--border2)',
            borderRadius: 'var(--r)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {/* Toggle Active */}
          <button
            onClick={() => {
              onToggleActive();
              setOpen(false);
              onOpenChange?.(false);
            }}
            disabled={isCash}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              background: 'transparent',
              border: 'none',
              color: account.isActive ? 'var(--red)' : 'var(--green)',
              fontFamily: 'var(--font)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: isCash ? 'not-allowed' : 'pointer',
              opacity: isCash ? 0.4 : 1,
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              if (!isCash) e.currentTarget.style.background = 'var(--bg5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {account.isActive ? '⏸ Set Inactive' : '▶ Set Active'}
          </button>

          {/* Set Default */}
          <button
            onClick={() => {
              onSetDefault();
              setOpen(false);
              onOpenChange?.(false);
            }}
            disabled={account.isDefault}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              background: 'transparent',
              border: 'none',
              color: account.isDefault ? 'var(--amber)' : 'var(--text2)',
              fontFamily: 'var(--font)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: account.isDefault ? 'not-allowed' : 'pointer',
              opacity: account.isDefault ? 0.6 : 1,
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              if (!account.isDefault)
                e.currentTarget.style.background = 'var(--bg5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            ⭐ {account.isDefault ? 'Default Account' : 'Set as Default'}
          </button>

          {/* Edit */}
          <button
            onClick={() => {
              onEdit();
              setOpen(false);
              onOpenChange?.(false);
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              background: 'transparent',
              border: 'none',
              color: 'var(--accent)',
              fontFamily: 'var(--font)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            ✏ Edit Account
          </button>

          {/* Delete (not for CASH) */}
          {!isCash && (
            <button
              onClick={() => {
                onDelete();
                setOpen(false);
                onOpenChange?.(false);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                background: 'transparent',
                border: 'none',
                borderTop: '1px solid var(--border)',
                color: 'var(--red)',
                fontFamily: 'var(--font)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--red-bg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              🗑 Delete Account
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Skeleton loader card ─────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r3)',
        padding: '20px',
        animation: 'pulse 1.5s infinite',
      }}
    >
      <div
        style={{
          height: '22px',
          width: '70px',
          background: 'var(--bg4)',
          borderRadius: 'var(--r2)',
          marginBottom: '14px',
        }}
      />
      <div
        style={{
          height: '20px',
          width: '130px',
          background: 'var(--bg4)',
          borderRadius: 'var(--r2)',
          marginBottom: '6px',
        }}
      />
      <div
        style={{
          height: '12px',
          width: '90px',
          background: 'var(--bg4)',
          borderRadius: 'var(--r2)',
          marginBottom: '18px',
        }}
      />
      <div
        style={{
          height: '32px',
          width: '120px',
          background: 'var(--bg4)',
          borderRadius: 'var(--r2)',
        }}
      />
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
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
        <div className="net-liquidity mb-8">
          {/* Left: Net Liquidity */}
          <div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text3)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 600,
                marginBottom: '8px',
              }}
            >
              Net Liquidity
            </div>
            <div
              style={{
                fontSize: 'clamp(24px, 5vw, 36px)',
                fontWeight: 700,
                fontFamily: 'var(--mono)',
                color: netLiquidity >= 0 ? 'var(--accent)' : 'var(--red)',
                letterSpacing: '-1px',
              }}
            >
              {formatAmount(netLiquidity)}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--green)',
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              ↑ Active Portfolio
            </div>
          </div>

          {/* Right: Allocation Breakdown */}
          <div className="hidden sm:block">
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text3)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 600,
                marginBottom: '12px',
              }}
            >
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
                <div className="alloc-row" key={label}>
                  <span className="alloc-label">{label}</span>
                  <div className="alloc-bar-wrap">
                    <div
                      className="alloc-bar"
                      style={{
                        width: `${pct}%`,
                        background: color,
                        transition: 'width 0.8s ease',
                      }}
                    />
                  </div>
                  <span className="alloc-pct">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Plan Banner */}
      {plan === 'basic' && (
        <div className="flex items-center gap-3 p-3 mb-6 text-xs border rounded-lg bg-amber-500/10 border-amber-500/20 text-amber-500">
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
                className={`account-section ${hasOpenMenu ? 'section-open' : ''}`}
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
                        className={`account-card flex-1 min-w-[280px] max-w-full sm:max-w-[calc(50%-8px)] lg:max-w-[calc(33.33%-11px)] xl:max-w-[calc(25%-12px)] ${openMenuId === account._id ? 'menu-open' : ''}`}
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
                          <div
                            style={{
                              position: 'absolute',
                              top: '10px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              background: 'var(--bg4)',
                              border: '1px solid var(--border2)',
                              borderRadius: 'var(--r2)',
                              padding: '2px 8px',
                              fontSize: '10px',
                              fontWeight: 700,
                              color: 'var(--text3)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.1em',
                              zIndex: 2,
                            }}
                          >
                            INACTIVE
                          </div>
                        )}

                        {/* Header row: badge + menu */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
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
                            onOpenChange={(isOpen) =>
                              setOpenMenuId(isOpen ? account._id : null)
                            }
                          />
                        </div>

                        {/* Account name */}
                        <div className="acc-name truncate pr-8">
                          {account.name}
                          {account.isDefault && (
                            <span className="acc-default ml-2">★ Default</span>
                          )}
                        </div>

                        {/* Account number / subtitle */}
                        <div className="acc-num">
                          {account.type === 'CASH'
                            ? 'Always available'
                            : account.accountNumber
                              ? `•••• •••• •••• ${account.accountNumber}`
                              : '—'}
                        </div>

                        {/* Balance */}
                        <div
                          className="acc-balance"
                          style={{ color: cfg.balanceColor }}
                        >
                          {cfg.isNegative
                            ? `${formatAmount(Math.abs(balanceInt))}${balanceInt < 0 ? ' Owed' : ''}`
                            : formatAmount(balanceInt)}
                        </div>

                        {/* Credit limit if applicable */}
                        {cfg.isNegative && account.creditLimit > 0 && (
                          <div
                            style={{
                              fontSize: '11px',
                              color: 'var(--text3)',
                              marginTop: '6px',
                              fontFamily: 'var(--mono)',
                            }}
                          >
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
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border2 rounded-2xl gap-4">
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
              <button className="btn-new mt-2">
                + Initialize First Account
              </button>
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
        <DialogContent
          style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border2)',
            borderRadius: 'var(--r4)',
            maxWidth: '440px',
            padding: '28px',
          }}
        >
          <DialogHeader>
            <DialogTitle
              style={{
                color: 'var(--text)',
                fontSize: '18px',
                fontWeight: 700,
                letterSpacing: '-0.3px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              Delete Account
            </DialogTitle>
            <DialogDescription
              style={{
                color: 'var(--text2)',
                fontSize: '13px',
                lineHeight: 1.6,
                paddingTop: '8px',
              }}
            >
              This will remove{' '}
              <span style={{ color: 'var(--text)', fontWeight: 700 }}>
                "{deletingAccount?.name}"
              </span>{' '}
              from your account lists and filters. Related transactions will
              <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
                {' '}
                NOT{' '}
              </span>
              be deleted. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div
            style={{
              marginTop: '24px',
              padding: '16px',
              background: 'var(--red-bg)',
              border: '1px solid var(--red-border)',
              borderRadius: 'var(--r2)',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--red)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '8px',
              }}
            >
              Confirm Deletion
            </div>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text2)',
                marginBottom: '12px',
              }}
            >
              Type <b>DELETE</b> to confirm this operation.
            </div>
            <Input
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="Type DELETE here..."
              style={{
                background: 'var(--bg2)',
                border: '1px solid var(--red-border)',
                color: 'var(--text)',
                fontSize: '13px',
              }}
            />
          </div>

          <DialogFooter style={{ marginTop: '24px', gap: '10px' }}>
            <Button
              variant="outline"
              onClick={() => {
                setDeletingAccount(null);
                setDeleteInput('');
              }}
              style={{
                borderRadius: 'var(--r2)',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleDelete(deletingAccount)}
              disabled={deleteInput.toUpperCase() !== 'DELETE'}
              style={{
                borderRadius: 'var(--r2)',
                fontSize: '13px',
                fontWeight: 600,
                background: 'var(--red)',
                color: '#fff',
                border: 'none',
              }}
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
              className="w-14 h-14 rounded-full bg-primary text-background shadow-2xl flex items-center justify-center active:scale-90 transition-all border-4 border-[var(--bg)]"
              style={{
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                background: 'var(--accent)',
              }}
            >
              <span className="text-2xl font-bold">+</span>
            </button>
          }
        />
      </div>
    </div>
  );
}
