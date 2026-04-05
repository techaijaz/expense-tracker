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

// ── shared input styles matching TransectionPopup ──────────────────────────────
const labelCx =
  'text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-outline ml-1';
const inputCx =
  'w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-sm text-on-surface focus:ring-1 focus:ring-primary/40 outline-none appearance-none placeholder:text-surface-variant transition-all';
const selectCx =
  'w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-sm text-on-surface focus:ring-1 focus:ring-primary/40 outline-none appearance-none cursor-pointer';
const errorCx =
  'text-[10px] text-error mt-1 ml-1 font-medium flex items-center gap-1';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div
        className="w-full max-w-lg bg-surface-container-highest shadow-2xl shadow-black/80 border border-white/10 overflow-hidden rounded-2xl animate-in zoom-in-95 duration-300"
        style={{ backdropFilter: 'blur(20px)' }}
      >
        {/* Header */}
        <div className="pt-10 pl-10 pr-6 pb-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-black text-on-surface tracking-tight font-headline">
              {isEdit ? 'Refine Account' : 'Initialize Account'}
            </h2>
            <p className="text-sm text-outline mt-1 font-body">
              {isEdit
                ? 'Update your account parameters.'
                : 'Add a new financial hub to your ecosystem.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full text-outline transition-colors outline-none"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="px-10 pb-10 space-y-6"
        >
          <div className="grid grid-cols-2 gap-6">
            {/* Account Type */}
            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <label className={labelCx}>Account Type</label>
              <div className="relative">
                <select
                  {...register('type')}
                  disabled={isEdit}
                  className={
                    selectCx + (isEdit ? ' opacity-60 cursor-not-allowed' : '')
                  }
                >
                  {Object.entries(ACCOUNT_TYPE_LABELS)
                    .filter(([v]) => !(v === 'CASH' && hasCash && !isEdit))
                    .map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                </select>
                {!isEdit && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline pointer-events-none text-sm">
                    expand_more
                  </span>
                )}
              </div>
            </div>

            {/* Account Name */}
            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <label className={labelCx}>Account Name</label>
              <input
                {...register('name')}
                placeholder="e.g. HDFC Savings"
                className={inputCx}
                type="text"
              />
              {errors.name && <p className={errorCx}>{errors.name.message}</p>}
            </div>

            {/* Account Number */}
            <div
              className={`col-span-2 sm:col-span-1 space-y-1.5 ${accountType === 'CASH' ? 'hidden' : ''}`}
            >
              <label className={labelCx}>
                Account Number{' '}
                {needsAccNum && <span className="text-error">*</span>}
              </label>
              <input
                {...register('accountNumber')}
                // ref={(e) => {
                //   register('accountNumber').ref(e);
                //   accNumRef.current = e;
                // }}
                placeholder={needsAccNum ? 'Last 4 digits' : 'Max 4 digits'}
                className={inputCx}
                type="text"
                maxLength={4}
              />
              {errors.accountNumber && (
                <p className={errorCx}>{errors.accountNumber.message}</p>
              )}
            </div>

            {/* Opening Balance - Hidden for Credit Cards */}
            {accountType !== 'CREDIT_CARD' && (
              <div className="col-span-2 sm:col-span-1 space-y-1.5 animate-in fade-in duration-300">
                <label className={labelCx}>Opening Balance</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-sm">
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
                    className={inputCx + ' pl-8'}
                    step={1 / Math.pow(10, decimalPlaces)}
                    type="number"
                    disabled={initialBalanceLoading}
                  />
                </div>
                {errors.balance && (
                  <p className={errorCx}>{errors.balance.message}</p>
                )}
                {initialBalanceLoading && (
                  <p className="text-[10px] text-primary/60 mt-1 ml-1 animate-pulse italic">
                    Retrieving initial balance...
                  </p>
                )}
              </div>
            )}

            {/* Credit Limit */}
            {accountType === 'CREDIT_CARD' && (
              <div className="col-span-2 sm:col-span-1 space-y-1.5 animate-in slide-in-from-top-2">
                <label className={labelCx}>Credit Limit</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-error font-bold text-sm">
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
                    className={inputCx + ' pl-8'}
                    step={1 / Math.pow(10, decimalPlaces)}
                    type="number"
                  />
                </div>
                {errors.creditLimit && (
                  <p className={errorCx}>{errors.creditLimit.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Set as Default Toggle */}
          <div
            onClick={() => setIsDefault(!isDefault)}
            className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low border border-outline-variant/10 cursor-pointer hover:bg-surface-container-high transition-colors group"
          >
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span
                  className={`material-symbols-outlined text-lg ${isDefault ? 'text-amber-400' : 'text-outline'} group-hover:scale-110 transition-transform`}
                  style={{
                    fontVariationSettings: isDefault ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  star
                </span>
                Set as Default
              </p>
              <p className="text-[11px] text-outline ml-6 font-medium">
                Auto-selected in new transaction popups.
              </p>
            </div>
            <div
              className={`w-10 h-5 rounded-full transition-colors relative ${isDefault ? 'bg-primary' : 'bg-surface-container-highest'}`}
            >
              <div
                className={`absolute top-1 w-3 h-3 rounded-full bg-white shadow transition-transform ${isDefault ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 flex items-center justify-end gap-4">
            <button
              onClick={onClose}
              type="button"
              className="px-6 py-2.5 text-sm font-bold text-outline hover:bg-white/5 rounded-lg transition-colors outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || initialBalanceLoading}
              className="px-8 py-2.5 text-sm font-bold bg-gradient-to-br from-primary to-on-primary-container text-on-primary rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all outline-none disabled:opacity-50 disabled:scale-100"
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

        <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
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
