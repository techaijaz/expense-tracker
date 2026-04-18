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
const ACCOUNT_TYPE_CONFIG = {
  BANK: {
    emoji: '🏛',
    label: 'Bank',
    badgeClass: 'acc-type-badge bank',
    balanceColor: 'var(--accent)',
  },
  CASH: {
    emoji: '💵',
    label: 'Cash',
    badgeClass: 'acc-type-badge cash',
    balanceColor: 'var(--green)',
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
  EWALLET: {
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

// ─── Card Dropdown Menu ───────────────────────────────────────────────────────
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
      <div
        className="acc-menu"
        onClick={() => setOpen((v) => !v)}
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
            zIndex: 50,
            width: '200px',
            background: 'var(--bg4)',
            border: '1px solid var(--border2)',
            borderRadius: 'var(--r)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            overflow: 'hidden',
          }}
        >
          {/* Toggle Active */}
          <button
            onClick={() => {
              onToggleActive();
              setOpen(false);
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
  const preferences = user?.user?.preferences || {};
  const { currency = 'INR', decimalPlaces = 2 } = preferences;
  const [loading, setLoading] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [deletingAccount, setDeletingAccount] = useState(null);
  const [deleteInput, setDeleteInput] = useState('');
  const plan = user?.user?.plan || 'basic';

  // Avatar initials from user
  const userInitials = useMemo(() => {
    const name = user?.user?.name || '';
    return (
      name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U'
    );
  }, [user]);

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
      toast.success(`"${account.name}" and all related data removed.`);
      setDeletingAccount(null);
      setDeleteInput('');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to delete account');
    }
  };

  // ── Derived stats ────────────────────────────────────────────────────────
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

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="main-content">
      {/* Page Body */}
      <div className="page-body">
        {/* Plan Banner */}
        {plan === 'basic' && (
          <div
            style={{
              background: 'var(--amber-bg)',
              border: '1px solid var(--amber-border)',
              borderRadius: 'var(--r)',
              padding: '10px 14px',
              marginBottom: '16px',
              fontSize: '12px',
              color: 'var(--amber)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            ⭐{' '}
            <span>
              <b>Basic Plan:</b> 1 bank account limit.{' '}
              <a
                href="#"
                style={{
                  color: 'var(--accent)',
                  fontWeight: 600,
                  marginLeft: 4,
                }}
              >
                Upgrade to Pro for unlimited →
              </a>
            </span>
          </div>
        )}

        {/* Accounts Grid */}
        <div className="accounts-grid">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : accounts && accounts.length > 0 ? (
            <>
              {accounts.map((account) => {
                const cfg = getTypeConfig(account.type);
                const balanceInt = Number(account.balance || 0);
                const isInactive = !account.isActive;

                return (
                  <div
                    key={account._id}
                    className="account-card"
                    style={{
                      opacity: isInactive ? 0.5 : 1,
                      filter: isInactive ? 'grayscale(0.6)' : 'none',
                      borderColor: account.isDefault
                        ? 'var(--accent)'
                        : undefined,
                      position: 'relative',
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
                      {account.type === 'CASH' ? (
                        <div
                          style={{
                            fontSize: '10px',
                            color: 'var(--text3)',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            padding: '2px 6px',
                          }}
                        >
                          Protected
                        </div>
                      ) : (
                        <AccountMenu
                          account={account}
                          onSetDefault={() => handleSetDefault(account)}
                          onToggleActive={() => handleToggleActive(account)}
                          onEdit={() => setEditingAccount(account)}
                          onDelete={() => setDeletingAccount(account)}
                        />
                      )}
                    </div>

                    {/* Account name */}
                    <div className="acc-name">
                      {account.name}
                      {account.isDefault && (
                        <span className="acc-default">★ Default</span>
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
                        ? `${formatAmount(Math.abs(balanceInt), currency, decimalPlaces)}${balanceInt < 0 ? ' Owed' : ''}`
                        : formatAmount(balanceInt, currency, decimalPlaces)}
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
                        Limit:{' '}
                        {formatAmount(
                          account.creditLimit,
                          currency,
                          decimalPlaces,
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add Account placeholder card */}
              <AddAccounts
                customTrigger={
                  <div
                    className="account-card"
                    style={{
                      border: '1px dashed var(--border2)',
                      opacity: 0.6,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <div style={{ fontSize: '28px', marginBottom: '8px' }}>
                        +
                      </div>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: 'var(--text)',
                        }}
                      >
                        Add Account
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--text3)',
                          marginTop: '4px',
                        }}
                      >
                        {plan === 'basic'
                          ? 'Pro required for more accounts'
                          : 'Add a new account'}
                      </div>
                    </div>
                  </div>
                }
              />
            </>
          ) : (
            /* Empty state */
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '60px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px dashed var(--border2)',
                borderRadius: 'var(--r3)',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '40px' }}>🏦</div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text2)',
                }}
              >
                No accounts in your ecosystem
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
                Initialize a new account to begin tracking liquidity.
              </div>
              <AddAccounts
                customTrigger={
                  <button className="btn-new" style={{ marginTop: '8px' }}>
                    + Initialize Account
                  </button>
                }
              />
            </div>
          )}
        </div>

        {/* Net Liquidity + Allocation (only if accounts exist) */}
        {accounts && accounts.length > 0 && (
          <div className="net-liquidity">
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
                  fontSize: '36px',
                  fontWeight: 700,
                  fontFamily: 'var(--mono)',
                  color: netLiquidity >= 0 ? 'var(--accent)' : 'var(--red)',
                  letterSpacing: '-1px',
                }}
              >
                {formatAmount(netLiquidity, currency, decimalPlaces)}
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
            <div>
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
      </div>

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
              ⚠️ Critical Action
            </DialogTitle>
            <DialogDescription
              style={{
                color: 'var(--text2)',
                fontSize: '13px',
                lineHeight: 1.6,
                paddingTop: '8px',
              }}
            >
              This will permanently remove{' '}
              <span style={{ color: 'var(--text)', fontWeight: 700 }}>
                "{deletingAccount?.name}"
              </span>{' '}
              and{' '}
              <span
                style={{
                  color: 'var(--red)',
                  fontWeight: 700,
                  textDecoration: 'underline',
                }}
              >
                ALWAYS
              </span>{' '}
              hide its transactions and ledger history. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <div
            style={{
              marginTop: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <p
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--text3)',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
              }}
            >
              Type <span style={{ color: 'var(--text)' }}>"DELETE"</span> to
              confirm:
            </p>
            <Input
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="Type DELETE here..."
              autoFocus
              style={{
                background: 'var(--bg3)',
                border: '1px solid var(--border2)',
                borderRadius: 'var(--r2)',
                color: 'var(--text)',
                fontSize: '13px',
                padding: '10px 12px',
                outline: 'none',
                fontFamily: 'var(--font)',
              }}
            />
          </div>

          <DialogFooter
            style={{
              marginTop: '20px',
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end',
            }}
          >
            <Button
              variant="ghost"
              onClick={() => {
                setDeletingAccount(null);
                setDeleteInput('');
              }}
              style={{
                padding: '9px 18px',
                background: 'transparent',
                border: '1px solid var(--border2)',
                borderRadius: 'var(--r2)',
                color: 'var(--text2)',
                fontFamily: 'var(--font)',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={deleteInput !== 'DELETE'}
              onClick={() => handleDelete(deletingAccount)}
              style={{
                padding: '9px 20px',
                background: 'var(--red-bg)',
                border: '1px solid var(--red-border)',
                borderRadius: 'var(--r2)',
                color: 'var(--red)',
                fontFamily: 'var(--font)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: deleteInput === 'DELETE' ? 'pointer' : 'not-allowed',
                opacity: deleteInput === 'DELETE' ? 1 : 0.5,
              }}
            >
              Confirm Deletion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
