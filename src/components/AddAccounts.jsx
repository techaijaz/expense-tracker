import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import {
  addAccount,
  updateAccount as updateAccountAction,
} from '../redux/accountSlice';
import api from '@/utils/httpMethods';
import accountSchema from '@/schema/accountSchema';
import { getCurrencySymbol, restrictDecimals } from '@/utils/format';

// ── types that REQUIRE an account number ───────────────────────────────────────
const REQUIRES_ACC_NUM = ['BANK', 'CREDIT_CARD'];
const ACCOUNT_TYPE_LABELS = {
  CASH: 'Cash',
  BANK: 'Bank Account',
  CREDIT_CARD: 'Credit Card',
  WALLET: 'E-Wallet',
  INVESTMENT: 'Investment',
};

// ── old shared input styles removed (using global CSS classes now) ────────────

function AccountModal({ onClose, onSaved, account = null, hasCash = false }) {
  const isEdit = !!account;
  const dispatch = useDispatch();
  const preferences = useSelector((state) => state.auth.user?.user?.preferences);
  const { currency = 'INR', decimalPlaces = 2 } = preferences || {};
  const currencySymbol = getCurrencySymbol(currency);

  const [loading, setLoading] = useState(false);
  const [initialBalanceLoading, setInitialBalanceLoading] = useState(isEdit);
  const [isDefault, setIsDefault] = useState(account?.isDefault || false);
  //const accNumRef = useRef(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(accountSchema.addAccountSchema),
    defaultValues: {
      type: account?.type || (hasCash ? 'BANK' : 'CASH'),
      name: account?.name || '',
      accountNumber: account?.accountNumber || '',
      balance: 0,
      creditLimit: account?.creditLimit || 0,
    },
  });

  const accountType = watch('type');
  const needsAccNum = REQUIRES_ACC_NUM.includes(accountType);

  // Synchronize form with account prop changes
  useEffect(() => {
    if (isEdit && account) {
      reset({
        type: account.type,
        name: account.name,
        accountNumber: account.type === 'CASH' ? '' : account.accountNumber,
        balance: 0, // Reset to 0 while we fetch the actual opening balance
        creditLimit: account.creditLimit || 0,
      });
    }
  }, [isEdit, account, reset]);

  // Fetch initial opening balance if in edit mode
  useEffect(() => {
    if (isEdit) {
      const fetchOpeningBalance = async () => {
        try {
          const res = await api.get(`/account/${account._id}/opening-balance`);
          setValue('balance', res?.data?.amount || 0);
        } catch (err) {
          console.error('Failed to fetch opening balance', err);
        } finally {
          setInitialBalanceLoading(false);
        }
      };
      fetchOpeningBalance();
    }
  }, [isEdit, account, setValue]);

  // Auto-focus account number when editing BANK/CREDIT_CARD
  // useEffect(() => {
  //   if (isEdit && needsAccNum && accNumRef.current) {
  //     accNumRef.current.select(); // User said "account number should be selected"
  //   }
  // }, [isEdit, needsAccNum]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        name: data.name,
        type: data.type,
        balance: data.type === 'CREDIT_CARD' ? 0 : Number(data.balance || 0),
        creditLimit: data.type === 'CREDIT_CARD' ? Number(data.creditLimit || 0) : 0,
        isDefault,
        accountNumber: needsAccNum
          ? data.accountNumber
          : data.type === 'CASH'
            ? ''
            : data.accountNumber,
      };

      let res;
      if (isEdit) {
        res = await api.patch(`/account/${account._id}`, payload);
        toast.success('Account updated successfully!');
      } else {
        res = await api.post('/account', payload);
        toast.success('Account created successfully!');
      }

      onSaved(res?.data);
      onClose();
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          `Failed to ${isEdit ? 'update' : 'create'} account`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="screen active"
      style={{
        zIndex: 100,
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-close" onClick={onClose}>
          ✕
        </div>
        <div className="modal-title">
          {isEdit ? 'Refine Account' : 'Initialize Account'}
        </div>
        <div className="modal-sub">
          {isEdit
            ? 'Update your account parameters.'
            : 'Add a new financial hub to your ecosystem.'}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="modal-grid">
            {/* Account Type */}
            <div className="form-group">
              <label className="form-label">Account Type</label>
              <select
                {...register('type')}
                disabled={isEdit}
                className="form-input"
              >
                {Object.entries(ACCOUNT_TYPE_LABELS)
                  .filter(([v]) => !(v === 'CASH' && hasCash && !isEdit))
                  .map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
              </select>
            </div>

            {/* Account Name */}
            <div className="form-group">
              <label className="form-label">Account Name</label>
              <input
                {...register('name')}
                placeholder="e.g. HDFC Savings"
                className="form-input"
                type="text"
              />
              {errors.name && (
                <p style={{ fontSize: '10px', color: 'var(--red)', marginTop: '4px' }}>
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Account Number */}
            <div
              className="form-group"
              style={{ display: accountType === 'CASH' ? 'none' : 'block' }}
            >
              <label className="form-label">
                Account Number {needsAccNum && '*'}
              </label>
              <input
                {...register('accountNumber')}
                placeholder={needsAccNum ? 'Last 4 digits' : 'Max 4 digits'}
                className="form-input"
                type="text"
                maxLength={4}
              />
              {errors.accountNumber && (
                <p style={{ fontSize: '10px', color: 'var(--red)', marginTop: '4px' }}>
                  {errors.accountNumber.message}
                </p>
              )}
            </div>

            {/* Opening Balance - Hidden for Credit Cards */}
            {accountType !== 'CREDIT_CARD' && (
              <div className="form-group">
                <label className="form-label">Opening Balance</label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text)',
                      fontWeight: 700,
                    }}
                  >
                    {currencySymbol}
                  </span>
                  <input
                    {...register('balance')}
                    onInput={(e) => {
                      e.target.value = restrictDecimals(
                        e.target.value,
                        decimalPlaces,
                      );
                    }}
                    placeholder={`0.${'0'.repeat(decimalPlaces)}`}
                    className="form-input"
                    style={{ paddingLeft: '28px' }}
                    step={1 / Math.pow(10, decimalPlaces)}
                    type="number"
                    disabled={initialBalanceLoading}
                  />
                </div>
                {errors.balance && (
                  <p style={{ fontSize: '10px', color: 'var(--red)', marginTop: '4px' }}>
                    {errors.balance.message}
                  </p>
                )}
                {initialBalanceLoading && (
                  <p
                    style={{
                      fontSize: '10px',
                      color: 'var(--text3)',
                      marginTop: '4px',
                      fontStyle: 'italic',
                    }}
                  >
                    Retrieving initial balance...
                  </p>
                )}
              </div>
            )}

            {/* Credit Limit */}
            {accountType === 'CREDIT_CARD' && (
              <div className="form-group">
                <label className="form-label">Credit Limit</label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--red)',
                      fontWeight: 700,
                    }}
                  >
                    {currencySymbol}
                  </span>
                  <input
                    {...register('creditLimit')}
                    onInput={(e) => {
                      e.target.value = restrictDecimals(
                        e.target.value,
                        decimalPlaces,
                      );
                    }}
                    placeholder={`0.${'0'.repeat(decimalPlaces)}`}
                    className="form-input"
                    style={{ paddingLeft: '28px' }}
                    step={1 / Math.pow(10, decimalPlaces)}
                    type="number"
                  />
                </div>
                {errors.creditLimit && (
                  <p style={{ fontSize: '10px', color: 'var(--red)', marginTop: '4px' }}>
                    {errors.creditLimit.message}
                  </p>
                )}
              </div>
            )}
          </div>

          <div
            style={{
              background: 'var(--bg3)',
              border: '1px solid var(--border2)',
              borderRadius: 'var(--r)',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '4px',
              marginTop: '16px',
              cursor: 'pointer',
            }}
            onClick={() => setIsDefault(!isDefault)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⭐</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>
                  Set as Default
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text2)' }}>
                  Auto-selected in new transaction popup
                </div>
              </div>
            </div>
            <div className={`toggle ${isDefault ? 'on' : ''}`}></div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-save"
              disabled={loading || initialBalanceLoading}
            >
              {loading
                ? isEdit
                  ? 'Updating...'
                  : 'Creating...'
                : isEdit
                  ? 'Save Changes'
                  : 'Initialize Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AddAccounts({
  btnLabel = '+ Add',
  customTrigger = null,
  editAccount = null,
  onEditClose = null,
}) {
  const dispatch = useDispatch();
  const { accounts } = useSelector((state) => state.accounts);
  const [isOpen, setIsOpen] = useState(false);

  // Check if user already has a Cash account
  const hasCash = accounts.some((a) => a.type === 'CASH' && !a.isDeleted);

  const handleSaved = (account) => {
    if (editAccount) {
      dispatch(updateAccountAction(account));
    } else {
      dispatch(addAccount(account));
    }
  };

  const handleClose = () => {
    if (editAccount) {
      onEditClose();
    } else {
      setIsOpen(false);
    }
  };

  // If in edit mode (controlled externally), show the modal immediately
  if (editAccount) {
    return (
      <AccountModal
        account={editAccount}
        onClose={handleClose}
        onSaved={handleSaved}
        hasCash={hasCash}
      />
    );
  }

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className="inline-block cursor-pointer"
      >
        {customTrigger ?? (
          <button className="bg-primary text-background px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-all">
            {btnLabel}
          </button>
        )}
      </div>

      {isOpen && (
        <AccountModal
          onClose={handleClose}
          onSaved={handleSaved}
          hasCash={hasCash}
        />
      )}
    </>
  );
}
