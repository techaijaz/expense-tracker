import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { z } from 'zod';
import useApi from '@/hooks/useApi';
import { addTransection } from '@/redux/transectionSlice';
import AddCategoryPopup from './AddCategoryPopup';
import { getCurrencySymbol, restrictDecimals } from '@/utils/format';

// Using the same schema from existing codebase with slight modifications for UI harmony
const transectionSchema = z.object({
  type: z.string().min(1, 'Transaction type is required'),
  account: z.string().min(1, 'Account is required'),
  date: z.string().or(z.date()),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  description: z.string().min(3, 'Description is required'),
  category: z.string().optional(),
  toaccount: z.string().optional(),
  debttype: z.string().optional(),
  debtparty: z.string().optional(),
});

const TransactionPopup = ({ open, setOpen, onSuccess }) => {
  const dispatch = useDispatch();
  const { accounts = [] } = useSelector((state) => state.accounts);
  const { categories = [] } = useSelector((state) => state.category);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const { data: transData, makeRequest } = useApi();

  const preferences = useSelector((state) => state.auth.user?.user?.preferences);
  const { currency = 'INR', decimalPlaces = 2 } = preferences || {};
  const currencySymbol = getCurrencySymbol(currency);

  // Only show active accounts in the dropdown
  const activeAccounts = accounts.filter(a => a.isActive !== false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(transectionSchema),
    defaultValues: {
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
      amount: '',
      account: '',
      description: '',
      category: '',
      toaccount: '',
      debttype: '',
      debtparty: '',
    },
  });

  // Auto-select the default account whenever the popup opens
  useEffect(() => {
    if (open) {
      const defaultAccount = activeAccounts.find(a => a.isDefault);
      if (defaultAccount) {
        setValue('account', defaultAccount._id);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const transactionType = watch('type');


  const onSubmit = async (data) => {
    // Check required dynamic fields depending on legacy logic
    if (['expense', 'income'].includes(data.type) && !data.category) {
      toast.error('Category is required for Expense/Income');
      return;
    }
    if (data.type === 'transfer' && !data.toaccount) {
      toast.error('Target Account is required for Transfer');
      return;
    }

    try {
      await makeRequest({
        url: '/transactions',
        method: 'post',
        data,
      });
      toast.success('Transaction added successfully!');

      reset();
      if (onSuccess) onSuccess();
      else setOpen(false);
    } catch (error) {
      toast.error('Failed to save transaction: ' + (error?.message || ''));
    }
  };

  useEffect(() => {
    if (transData) {
      dispatch(addTransection(transData));
    }
  }, [transData, dispatch]);

  const handleClose = () => {
    setOpen(false);
    reset();
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-md">
        {/* Modal Container */}
        <div
          className="w-full max-w-xl bg-surface-container-highest/85 shadow-2xl shadow-black/60 border border-white/5 overflow-hidden animate-in fade-in zoom-in duration-300 relative rounded-xl"
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {/* Modal Header */}
          <div className="pt-10 pl-10 pr-6 pb-6 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black text-on-surface tracking-tight font-headline">
                Smart Transaction
              </h2>
              <p className="text-sm text-outline mt-1 font-body">
                Input data precisely to update ledgers.
              </p>
            </div>
            <button
              onClick={handleClose}
              type="button"
              className="p-2 hover:bg-white/5 rounded-full text-outline transition-colors outline-none"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                close
              </span>
            </button>
          </div>

          {/* Modal Body / Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="px-10 pb-6 space-y-6"
          >
            {/* Ledger Type Selector (Tabs) */}
            <div className="grid grid-cols-4 bg-surface-container-lowest p-1 rounded-lg gap-1">
              {['expense', 'income', 'transfer', 'debt'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setValue('type', type);
                    setValue('category', '');
                    setValue('toaccount', '');
                  }}
                  className={`py-2 text-xs font-bold rounded-md capitalize transition-colors ${
                    transactionType === type
                      ? 'bg-surface-container-high text-primary shadow-sm'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Amount Field */}
              <div className="col-span-2 sm:col-span-1 space-y-1.5">
                <label className="text-[0.6875rem] font-bold uppercase tracking-[0.15em] text-outline ml-1">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">
                    {currencySymbol}
                  </span>
                  <input
                    {...register('amount')}
                    onInput={(e) => {
                      e.target.value = restrictDecimals(
                        e.target.value,
                        decimalPlaces,
                      );
                    }}
                    className="w-full bg-surface-container-low border-none rounded-lg pl-8 pr-4 py-3 text-lg font-headline font-bold text-on-surface focus:ring-1 focus:ring-primary/40 outline-none tnum appearance-none placeholder:text-surface-variant"
                    placeholder={`0.${'0'.repeat(decimalPlaces)}`}
                    step={1 / Math.pow(10, decimalPlaces)}
                    type="number"
                  />
                </div>
                {errors.amount && (
                  <p className="text-[10px] text-error mt-1 ml-1 font-medium">
                    {errors.amount.message}
                  </p>
                )}
              </div>

              {/* Date Field */}
              <div className="col-span-2 sm:col-span-1 space-y-1.5">
                <label className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-outline ml-1">
                  Process Date
                </label>
                <div className="relative">
                  <input
                    {...register('date')}
                    className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-sm text-on-surface focus:ring-1 focus:ring-primary/40 outline-none"
                    type="date"
                  />
                  <span
                    className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline pointer-events-none text-sm"
                    style={{ fontVariationSettings: "'FILL' 0" }}
                  >
                    calendar_today
                  </span>
                </div>
                {errors.date && (
                  <p className="text-[10px] text-error mt-1 ml-1 font-medium">
                    {errors.date.message}
                  </p>
                )}
              </div>
            </div>

            {/* DYNAMIC FIELDS */}
            <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-2 gap-6">
                {/* From Account */}
                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <label className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-outline ml-1">
                    Source Account
                  </label>
                  <select
                    {...register('account')}
                    className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-sm text-on-surface focus:ring-1 focus:ring-primary/40 outline-none appearance-none cursor-pointer"
                  >
                    <option value="" disabled>
                      Select account
                    </option>
                    {activeAccounts.map((a) => (
                        <option key={a._id || a.id} value={a._id || a.id}>
                          {a.name}{a.isDefault ? ' ⭐' : ''}
                        </option>
                      ))}
                  </select>
                  {errors.account && (
                    <p className="text-[10px] text-error mt-1 ml-1 font-medium">
                      {errors.account.message}
                    </p>
                  )}
                </div>

                {/* Category (Income/Expense) */}
                {['expense', 'income'].includes(transactionType) && (
                  <div className="col-span-2 sm:col-span-1 space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-outline">
                        Classification
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsAddCategoryOpen(true)}
                        className="text-[10px] font-bold text-primary hover:underline"
                      >
                        + New
                      </button>
                    </div>
                    <select
                      {...register('category')}
                      className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-sm text-on-surface focus:ring-1 focus:ring-primary/40 outline-none appearance-none cursor-pointer"
                    >
                      <option value="" disabled>
                        Select category
                      </option>
                      {categories &&
                        categories.map((c) => (
                          <option key={c._id || c.id} value={c._id || c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                    {errors.category && (
                      <p className="text-[10px] text-error mt-1 ml-1 font-medium">
                        {errors.category.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Target Account (Transfer) */}
                {transactionType === 'transfer' && (
                  <div className="col-span-2 sm:col-span-1 space-y-1.5">
                    <label className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-outline ml-1">
                      Target Account
                    </label>
                    <select
                      {...register('toaccount')}
                      className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-sm text-on-surface focus:ring-1 focus:ring-primary/40 outline-none appearance-none cursor-pointer"
                    >
                      <option value="" disabled>
                        Select account
                      </option>
                      {accounts &&
                        accounts.map((a) => (
                          <option key={a._id || a.id} value={a._id || a.id}>
                            {a.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Debt Type & Party (Debt) */}
                {transactionType === 'debt' && (
                  <div className="col-span-2 sm:col-span-1 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-outline ml-1">
                        Debt Direction
                      </label>
                      <select
                        {...register('debttype')}
                        className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-sm text-on-surface focus:ring-1 focus:ring-primary/40 outline-none appearance-none cursor-pointer"
                      >
                        <option value="" disabled>
                          Direction
                        </option>
                        <option value="take">Taken (Inbound)</option>
                        <option value="give">Given (Outbound)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-outline ml-1">
                        Liable Party
                      </label>
                      <select
                        {...register('debtparty')}
                        className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-sm text-on-surface focus:ring-1 focus:ring-primary/40 outline-none appearance-none cursor-pointer"
                      >
                        <option value="" disabled>
                          Select Party
                        </option>
                        {accounts &&
                          accounts
                            .filter((a) => a.type === 'Debt')
                            .map((a) => (
                              <option key={a._id || a.id} value={a._id || a.id}>
                                {a.name}
                              </option>
                            ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-outline ml-1">
                  Internal Reference
                </label>
                <textarea
                  {...register('description')}
                  className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-sm text-on-surface focus:ring-1 focus:ring-primary/40 outline-none resize-none"
                  placeholder="Describe the purpose of this transaction..."
                  rows="2"
                ></textarea>
                {errors.description && (
                  <p className="text-[10px] text-error mt-1 ml-1 font-medium">
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 flex items-center justify-end gap-4">
              <button
                onClick={handleClose}
                className="px-6 py-2.5 text-sm font-bold text-tertiary hover:bg-tertiary/10 rounded-md transition-colors outline-none"
                type="button"
              >
                Cancel
              </button>
              <button
                className="px-8 py-2.5 text-sm font-bold bg-gradient-to-br from-primary to-on-primary-container text-on-primary rounded-md shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all outline-none"
                type="submit"
              >
                Save Transaction
              </button>
            </div>
          </form>

          {/* Subtle Decorative Element */}
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-tertiary/30 to-transparent"></div>
        </div>
      </div>

      <AddCategoryPopup
        open={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        onSave={(id) => setValue('category', id)}
      />
    </>
  );
};

export default TransactionPopup;
