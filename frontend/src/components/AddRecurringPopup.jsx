import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useSelector, useDispatch } from 'react-redux';
import { format } from 'date-fns';
import useApi from '@/hooks/useApi';
import api from '@/utils/httpMethods';
import {
  getCurrencySymbol,
  restrictDecimals,
  formatAmount,
} from '@/utils/format';
import { cn } from '@/utils/utils';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import AddCategoryPopup from './AddCategoryPopup';

const recurringSchema = z
  .object({
    title: z.string().min(3, 'Description must be at least 3 characters'),
    amount: z.coerce.number().positive('Amount must be positive'),
    type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']).default('EXPENSE'),
    frequency: z
      .enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'])
      .default('MONTHLY'),
    startDate: z.date({
      required_error: 'Start date is required',
    }),
    categoryId: z.string().min(1, 'Category is required'),
    accountId: z.string().min(1, 'Account is required'),
    toAccountId: z.string().optional().nullable(),
    entryType: z.enum(['auto', 'manual']).default('auto'),
    notes: z.string().max(250, 'Notes cannot exceed 250 characters').optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'TRANSFER' && !data.toAccountId) return false;
      return true;
    },
    {
      message: 'Target account is required for transfers',
      path: ['toAccountId'],
    },
  );

const AddRecurringPopup = ({ open, setOpen, onSuccess, editTask = null }) => {
  const { categories: groupedCategories } = useSelector(
    (state) => state.category,
  );
  const { accounts = [] } = useSelector((state) => state.accounts);
  const { makeRequest, loading } = useApi();

  const [dateOpen, setDateOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const preferences = useSelector(
    (state) =>
      state.auth.user?.user?.preferences || state.auth.user?.preferences,
  );
  const { currency = 'INR', decimalPlaces = 2 } = preferences || {};
  const currencySymbol = getCurrencySymbol(currency);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      title: '',
      amount: '',
      type: 'EXPENSE',
      frequency: 'MONTHLY',
      startDate: new Date(),
      categoryId: '',
      accountId: '',
      toAccountId: '',
      entryType: 'auto',
      notes: '',
    },
  });

  const selectedType = watch('type');
  const entryType = watch('entryType');

  useEffect(() => {
    if (open) {
      if (editTask) {
        reset({
          title: editTask.title,
          amount: editTask.amount,
          type: editTask.type,
          frequency: editTask.frequency,
          startDate: editTask.startDate
            ? new Date(editTask.startDate)
            : new Date(),
          categoryId: editTask.categoryId?._id || editTask.categoryId || '',
          accountId: editTask.accountId?._id || editTask.accountId || '',
          toAccountId: editTask.toAccountId?._id || editTask.toAccountId || '',
          entryType: editTask.entryType || 'auto',
          notes: editTask.notes || '',
        });
      } else {
        reset({
          title: '',
          amount: '',
          type: 'EXPENSE',
          frequency: 'MONTHLY',
          startDate: new Date(),
          categoryId: '',
          accountId: accounts.find((a) => a.isDefault)?._id || '',
          toAccountId: '',
          entryType: 'auto',
          notes: '',
        });
      }
    }
  }, [open, editTask, reset, accounts]);

  const selectedAccountId = watch('accountId');
  const selectedAccount = accounts.find(
    (a) => (a._id || a.id) === selectedAccountId,
  );
  const accountBalance = selectedAccount
    ? Number(selectedAccount.balance || 0)
    : 0;

  const onSubmit = async (data) => {
    // Balance Validation
    if (
      (data.type === 'EXPENSE' || data.type === 'TRANSFER') &&
      data.amount > accountBalance
    ) {
      toast.error(
        `Insufficient balance. Available: ${formatAmount(accountBalance, currency)}`,
      );
      return;
    }

    if (data.type === 'TRANSFER' && data.accountId === data.toAccountId) {
      toast.error('Source and Target account cannot be same');
      return;
    }

    try {
      const url = editTask ? `/recurring/${editTask._id}` : '/recurring';
      const method = editTask ? 'put' : 'post';

      const res = await makeRequest({
        url,
        method,
        data,
      });

      if (res) {
        toast.success(
          editTask
            ? 'Recurring instruction updated'
            : 'Standing order established',
        );
        if (onSuccess) onSuccess();
        setOpen(false);
      }
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const onCategorySave = (newCategoryId) => {
    setValue('categoryId', newCategoryId);
    setCatOpen(false);
  };

  if (!open) return null;

  const categoriesToDistplay = groupedCategories[selectedType] || [];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
      <div className="relative w-full max-w-[520px] rounded-[24px] border border-white/10 bg-[#0E1220] p-7 shadow-2xl overflow-y-auto max-h-[90vh] hide-scrollbar">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#5B8DEF]/10 text-[#5B8DEF] text-xl">
              {selectedType === 'INCOME'
                ? '📈'
                : selectedType === 'TRANSFER'
                  ? '⇄'
                  : '📉'}
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#EEF0F8]">
                {editTask ? 'Refine Recurring Task' : 'New Recurring Setup'}
              </h2>
              <p className="text-[10px] text-[#8892B0]">
                Automate your financial lifecycle with precision rules.
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-[#8892B0] hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Type Tabs */}
        <div className="flex bg-[#141928] border border-white/5 rounded-2xl p-1 mb-6 gap-1">
          {['EXPENSE', 'INCOME', 'TRANSFER'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setValue('type', t);
                setValue('categoryId', '');
              }}
              className={cn(
                'flex-1 py-2 text-[11px] font-bold rounded-xl transition-all',
                selectedType === t
                  ? 'bg-[#5B8DEF] text-white shadow-lg'
                  : 'text-[#8892B0] hover:bg-white/5',
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Amount Field */}
          <div className="relative flex items-center gap-4 rounded-2xl border border-white/10 bg-[#141928] p-5 focus-within:border-[#5B8DEF]/50 transition-all">
            <span className="font-mono text-3xl font-bold text-[#4A5578]">
              {currencySymbol}
            </span>
            <input
              {...register('amount')}
              type="text"
              inputMode="decimal"
              placeholder={`0.${'0'.repeat(decimalPlaces)}`}
              onInput={(e) => {
                const nextValue = e.target.value.replace(/[^0-9.]/g, '');
                e.target.value = restrictDecimals(nextValue, decimalPlaces);
              }}
              onKeyDown={(e) => {
                if (e.key === '.' && e.currentTarget.value.includes('.'))
                  e.preventDefault();
                if (
                  !/[0-9.]/.test(e.key) &&
                  ![
                    'Backspace',
                    'ArrowLeft',
                    'ArrowRight',
                    'Delete',
                    'Tab',
                    'Enter',
                  ].includes(e.key)
                ) {
                  e.preventDefault();
                }
              }}
              className="w-full bg-transparent font-mono text-3xl font-bold text-[#EEF0F8] outline-none placeholder:text-[#1C2235]"
            />
          </div>
          {errors.amount && (
            <p className="text-[11px] text-[#FF6B6B] mt-1 ml-2">
              {errors.amount.message}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Title */}
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-[#4A5578] uppercase tracking-[0.1em] mb-2 ml-1">
                Instruction Name
              </label>
              <input
                {...register('title')}
                placeholder="e.g., Monthly Rent, SIP Investment..."
                className="w-full h-11 bg-[#141928] border border-white/10 rounded-xl px-4 text-sm text-[#EEF0F8] outline-none focus:border-[#5B8DEF]/50"
              />
              {errors.title && (
                <p className="text-[11px] text-[#FF6B6B] mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Account Selection */}
            {/* Initialization Date */}
            <div>
              <label className="block text-[10px] font-bold text-[#4A5578] uppercase tracking-[0.1em] mb-2 ml-1">
                Initialization Date
              </label>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <Popover open={dateOpen} onOpenChange={setDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          'w-full h-11 bg-[#141928] border border-white/10 rounded-xl px-4 text-sm text-left font-normal',
                          !field.value && 'text-muted-foreground',
                        )}
                        style={{
                          color: field.value ? '#EEF0F8' : '#4A5578',
                        }}
                      >
                        {field.value instanceof Date && !isNaN(field.value)
                          ? format(field.value, 'dd MMM yyyy')
                          : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 bg-[#0E1220] border-white/10"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          if (date) {
                            field.onChange(date);
                            setDateOpen(false);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.startDate && (
                <p className="text-[11px] text-[#FF6B6B] mt-1">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <div className="flex items-center justify-between mb-2 ml-1">
                <label className="block text-[10px] font-bold text-[#4A5578] uppercase tracking-[0.1em]">
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => setCatOpen(true)}
                  className="text-[9px] font-extrabold text-[#5B8DEF] hover:text-[#4070D4] uppercase tracking-tighter flex items-center gap-1 transition-colors"
                >
                  <span className="text-xs">+</span> New
                </button>
              </div>
              <select
                {...register('categoryId')}
                className="w-full h-11 bg-[#141928] border border-white/10 rounded-xl px-3 text-sm text-[#EEF0F8] outline-none focus:border-[#5B8DEF]/50 cursor-pointer"
              >
                <option value="" disabled>
                  Select category…
                </option>
                {categoriesToDistplay.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-[11px] text-[#FF6B6B] mt-1">
                  {errors.categoryId.message}
                </p>
              )}
            </div>

            {/* Source Account */}
            <div>
              <label className="block text-[10px] font-bold text-[#4A5578] uppercase tracking-[0.1em] mb-2 ml-1">
                {selectedType === 'TRANSFER'
                  ? 'Source Account'
                  : selectedType === 'INCOME'
                    ? 'Credit Account'
                    : 'Debit Account'}
              </label>
              <select
                {...register('accountId')}
                className="w-full h-11 bg-[#141928] border border-white/10 rounded-xl px-3 text-sm text-[#EEF0F8] outline-none focus:border-[#5B8DEF]/50 cursor-pointer"
              >
                <option value="" disabled>
                  Select account…
                </option>
                {accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.name} ({currencySymbol}
                    {acc.balance.toLocaleString()})
                  </option>
                ))}
              </select>
              {errors.accountId && (
                <p className="text-[11px] text-[#FF6B6B] mt-1">
                  {errors.accountId.message}
                </p>
              )}
            </div>

            {/* Target Account (Transfer only) */}
            {selectedType === 'TRANSFER' && (
              <div>
                <label className="block text-[10px] font-bold text-[#4A5578] uppercase tracking-[0.1em] mb-2 ml-1">
                  Target Account
                </label>
                <select
                  {...register('toAccountId')}
                  className="w-full h-11 bg-[#141928] border border-white/10 rounded-xl px-3 text-sm text-[#EEF0F8] outline-none focus:border-[#5B8DEF]/50 cursor-pointer"
                >
                  <option value="" disabled>
                    Select target…
                  </option>
                  {accounts
                    .filter((acc) => acc._id !== selectedAccountId)
                    .map((acc) => (
                      <option key={acc._id} value={acc._id}>
                        {acc.name}
                      </option>
                    ))}
                </select>
                {errors.toAccountId && (
                  <p className="text-[11px] text-[#FF6B6B] mt-1">
                    {errors.toAccountId.message}
                  </p>
                )}
              </div>
            )}

            {/* Frequency */}
            <div
              className={cn(
                selectedType !== 'TRANSFER' ? 'col-span-1' : 'col-span-2',
              )}
            >
              <label className="block text-[10px] font-bold text-[#4A5578] uppercase tracking-[0.1em] mb-2 ml-1">
                Cycle Frequency
              </label>
              <select
                {...register('frequency')}
                className="w-full h-11 bg-[#141928] border border-white/10 rounded-xl px-3 text-sm text-[#EEF0F8] outline-none focus:border-[#5B8DEF]/50 cursor-pointer"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold text-[#4A5578] uppercase tracking-[0.1em] mb-2 ml-1">
              Remark / Note{' '}
              <span className="float-right lowercase font-normal opacity-50">
                {watch('notes')?.length || 0}/250
              </span>
            </label>
            <textarea
              {...register('notes')}
              maxLength={250}
              placeholder="Add extra context for this instruction..."
              className="w-full h-20 bg-[#141928] border border-white/10 rounded-xl p-3 text-sm text-[#EEF0F8] outline-none focus:border-[#5B8DEF]/50 resize-none"
            />
            {errors.notes && (
              <p className="text-[11px] text-[#FF6B6B] mt-1">
                {errors.notes.message}
              </p>
            )}
          </div>

          {/* Entry Type Toggle */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">
                {entryType === 'auto' ? '🤖' : '🔔'}
              </span>
              <div>
                <h4 className="text-[12px] font-bold text-[#EEF0F8]">
                  {entryType === 'auto' ? 'Autonomous Mode' : 'Assisted Mode'}
                </h4>
                <p className="text-[9px] text-[#4A5578]">
                  {entryType === 'auto'
                    ? 'System will record entries automatically.'
                    : 'System will notify for manual verification.'}
                </p>
              </div>
            </div>
            <div className="flex bg-[#0E1220] rounded-xl p-1 gap-1 border border-white/5">
              {['auto', 'manual'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setValue('entryType', m)}
                  className={cn(
                    'px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-tighter rounded-lg transition-all',
                    entryType === m
                      ? 'bg-[#5B8DEF] text-white'
                      : 'text-[#4A5578]',
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#5B8DEF] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#5B8DEF]/10 hover:bg-[#4070D4] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? 'Synchronizing…'
                : editTask
                  ? 'Update Recurring Rule'
                  : 'Commit Standing Order'}
            </button>
          </div>
        </form>
      </div>

      <AddCategoryPopup
        open={catOpen}
        onClose={() => setCatOpen(false)}
        onSave={onCategorySave}
        defaultType={selectedType}
      />
    </div>
  );
};

export default AddRecurringPopup;
