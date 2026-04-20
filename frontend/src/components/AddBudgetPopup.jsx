import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import useApi from '@/hooks/useApi';
import api from '@/utils/httpMethods';
import { getCurrencySymbol } from '@/utils/format';
import { cn } from '@/utils/utils';

const budgetSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  amount: z.coerce
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be positive')
    .max(100000000, 'Amount cannot exceed 100,000,000'),
  period: z
    .enum(['Weekly', 'Monthly', 'Quarterly', 'Yearly'])
    .default('Monthly'),
  alertThreshold: z.coerce.number().min(1).max(100).default(80),
  rollover: z.boolean().default(false),
  notes: z
    .string()
    .max(250, 'Notes must be less than 250 characters')
    .optional(),
});

const AddBudgetPopup = ({ open, setOpen, onSuccess, editBudget = null }) => {
  const { categories = [] } = useSelector((state) => state.category);
  const { makeRequest } = useApi();
  const preferences = useSelector(
    (state) => state.auth.user?.user?.preferences,
  );
  const { currency = 'INR' } = preferences || {};
  const currencySymbol = getCurrencySymbol(currency);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      categoryId: '',
      amount: '',
      period: 'Monthly',
      alertThreshold: 80,
      rollover: false,
      notes: '',
    },
  });

  const selectedThreshold = watch('alertThreshold');
  const isRollover = watch('rollover');

  useEffect(() => {
    if (open) {
      if (editBudget) {
        reset({
          categoryId: editBudget.category?._id || editBudget.category || '',
          amount: editBudget.budgetAmount,
          period: editBudget.period || 'Monthly',
          alertThreshold: editBudget.alertThreshold || 80,
          rollover: !!editBudget.rollover,
          notes: editBudget.notes || '',
        });
      } else {
        reset({
          categoryId: '',
          amount: '',
          period: 'Monthly',
          alertThreshold: 80,
          rollover: false,
          notes: '',
        });
      }
    }
  }, [open, editBudget, reset]);

  const onSubmit = async (data) => {
    try {
      const res = await makeRequest({
        url: '/budget',
        method: 'post',
        data,
      });

      if (res.success) {
        toast.success(
          editBudget
            ? 'Budget metrics updated!'
            : 'Financial budget established!',
        );
        if (onSuccess) onSuccess();
        setOpen(false);
      } else {
        toast.error(res.message || 'Action failed');
      }
    } catch (error) {
      toast.error('Failed to save budget');
    }
  };

  const handleDelete = async () => {
    if (!editBudget?._id) return;
    if (
      !window.confirm(
        'Executing this will permanently purge this budget record. Proceed?',
      )
    )
      return;

    try {
      const res = await api.delete(`/budget/${editBudget._id}`);
      if (res.data.success) {
        toast.success('Budget module deactivated');
        if (onSuccess) onSuccess();
        setOpen(false);
      }
    } catch (error) {
      toast.error('Failed to delete budget');
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
      style={{ animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      <div className="relative w-full max-w-[500px] rounded-[24px] border border-white/10 bg-[#0E1220] p-6 shadow-2xl hide-scrollbar overflow-y-auto">
        <button
          onClick={() => setOpen(false)}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-[#8892B0] transition-colors hover:bg-white/10 hover:text-white"
        >
          ✕
        </button>

        <div className="mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#5B8DEF]/10 text-[#5B8DEF] mb-3 text-xl">
            💰
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[#EEF0F8]">
            Add Budget
          </h2>
          <p className="mt-0.5 text-xs text-[#8892B0]">
            Set a spending limit for a category.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#4A5578]">
                Budget Categorization
              </label>
              <select
                {...register('categoryId')}
                className="w-full h-[38px] rounded-xl border border-white/10 bg-[#141928] px-3.5 text-sm text-[#EEF0F8] outline-none transition-all focus:border-[#5B8DEF] focus:ring-1 focus:ring-[#5B8DEF]/20"
              >
                <option value="" disabled>
                  Select target category…
                </option>
                {categories.EXPENSE?.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="mt-1 text-[11px] font-medium text-[#FF6B6B]">
                  {errors.categoryId.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#4A5578]">
                Financial Limit
              </label>
              <div className="relative flex items-center gap-3 rounded-2xl border border-white/10 bg-[#141928] p-4 transition-all focus-within:border-[#5B8DEF] focus-within:ring-1 focus-within:ring-[#5B8DEF]/20">
                <span className="font-mono text-2xl font-bold text-[#4A5578]">
                  {currencySymbol}
                </span>
                <input
                  {...register('amount')}
                  type="number"
                  placeholder="0.00"
                  onInput={(e) => {
                    if (e.target.value > 100000000) e.target.value = 100000000;
                  }}
                  className="w-full bg-transparent font-mono text-2xl font-bold text-[#EEF0F8] outline-none placeholder:text-[#232A3E] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-[11px] font-medium text-[#FF6B6B]">
                  {errors.amount.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#4A5578]">
                Cycle Period
              </label>
              <select
                {...register('period')}
                className="w-full h-[38px] rounded-xl border border-white/10 bg-[#141928] px-3.5 text-sm text-[#EEF0F8] outline-none transition-all focus:border-[#5B8DEF]"
              >
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#4A5578]">
                Notification Threshold
              </label>
              <div className="flex h-[38px] rounded-xl border border-white/10 bg-[#141928] overflow-hidden">
                {[50, 80, 90, 100].map((t) => (
                  <div
                    key={t}
                    onClick={() => setValue('alertThreshold', t)}
                    className={cn(
                      'flex-1 flex items-center justify-center text-[11px] font-extrabold cursor-pointer transition-all border-r border-white/5 last:border-r-0',
                      selectedThreshold === t
                        ? 'bg-[#5B8DEF] text-white'
                        : 'text-[#8892B0] hover:bg-white/[0.05]',
                    )}
                  >
                    {t}%
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-white/[0.02] p-3 border border-white/5">
            <div className="flex items-center gap-3">
              <span className="text-lg">🔄</span>
              <div>
                <div className="text-[11px] font-bold text-[#EEF0F8]">
                  Rollover Balance
                </div>
                <div className="text-[9px] text-[#4A5578]">
                  Carry unused funds to next cycle
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setValue('rollover', !isRollover)}
              className={cn(
                'relative h-5 w-10 rounded-full p-1 transition-colors duration-200',
                isRollover ? 'bg-[#2DD4A0]' : 'bg-[#1C2235]',
              )}
            >
              <div
                className={cn(
                  'h-3 w-3 rounded-full bg-white transition-transform duration-200 shadow-sm',
                  isRollover ? 'translate-x-5' : 'translate-x-0',
                )}
              />
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#4A5578]">
              Internal Notes
            </label>
            <textarea
              {...register('notes')}
              rows="2"
              maxLength={250}
              placeholder="Operational context..."
              className="w-full rounded-xl border border-white/10 bg-[#141928] p-3 text-sm text-[#EEF0F8] outline-none transition-all focus:border-[#5B8DEF] resize-none"
            />
            {errors.notes && (
              <p className="mt-1 text-[11px] text-[#FF6B6B]">
                {errors.notes.message}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            {editBudget && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 rounded-2xl border border-[#FF6B6B]/20 bg-[#FF6B6B]/5 py-3 text-sm font-bold text-[#FF6B6B] transition-all hover:bg-[#FF6B6B]/10 active:scale-95"
              >
                Delete
              </button>
            )}
            <button
              type="submit"
              className="flex-[2] rounded-2xl bg-[#5B8DEF] py-3 text-sm font-bold text-white shadow-lg shadow-[#5B8DEF]/20 transition-all hover:bg-[#4070D4] hover:-translate-y-1 active:translate-y-0 active:scale-95"
            >
              {editBudget ? 'Save Parameters' : 'Establish Protocol →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBudgetPopup;
