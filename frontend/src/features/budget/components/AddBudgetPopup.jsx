import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import useApi from '@/hooks/useApi';
import api from '@/utils/httpMethods';
import { getCurrencySymbol } from '@/utils/format';
import { cn } from '@/utils/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/hooks/use-media-query';

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
  const { makeRequest, loading } = useApi();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const preferences = useSelector(
    (state) => state.auth.user?.user?.preferences,
  );
  const { currency = 'INR' } = preferences || {};
  const currencySymbol = getCurrencySymbol(currency);

  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
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
        url: editBudget ? `/budget/${editBudget._id}` : '/budget',
        method: editBudget ? 'patch' : 'post',
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

  const formContent = (
    <form id="budget-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-text3">
            Budget Categorization
          </Label>
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full h-11 bg-bg3 border-border rounded-xl text-sm text-text focus:ring-1 focus:ring-accent/20">
                  <SelectValue placeholder="Select target category…" />
                </SelectTrigger>
                <SelectContent className="bg-bg2 border-border rounded-xl shadow-2xl">
                  {categories.EXPENSE?.map((cat) => (
                    <SelectItem key={cat._id} value={cat._id} className="text-sm focus:bg-bg3 focus:text-accent">
                      <div className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.categoryId && (
            <p className="text-[11px] font-medium text-red-500">
              {errors.categoryId.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-text3">
            Financial Limit
          </Label>
          <div className="relative flex items-center gap-3 rounded-2xl border border-border bg-bg3 p-4 transition-all focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/20">
            <span className="font-mono text-2xl font-bold text-text3">
              {currencySymbol}
            </span>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="number"
                  placeholder="0.00"
                  className="w-full bg-transparent border-none p-0 h-auto font-mono text-2xl font-bold text-text focus-visible:ring-0 placeholder:text-text3/30"
                />
              )}
            />
          </div>
          {errors.amount && (
            <p className="text-[11px] font-medium text-red-500">
              {errors.amount.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-text3">
              Cycle Period
            </Label>
            <Controller
              name="period"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full h-11 bg-bg3 border-border rounded-xl text-sm text-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-bg2 border-border rounded-xl shadow-2xl">
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-text3">
              Threshold
            </Label>
            <div className="flex h-11 rounded-xl border border-border bg-bg3 overflow-hidden">
              {[50, 80, 90, 100].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setValue('alertThreshold', t)}
                  className={cn(
                    'flex-1 flex items-center justify-center text-[10px] font-bold transition-all border-r border-border last:border-r-0',
                    selectedThreshold === t
                      ? 'bg-accent text-white'
                      : 'text-text3 hover:bg-bg4',
                  )}
                >
                  {t}%
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-bg3 p-4 border border-border group cursor-pointer" onClick={() => setValue('rollover', !isRollover)}>
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-2.5 rounded-xl transition-colors",
              isRollover ? "bg-accent/10 text-accent" : "bg-bg4 text-text3"
            )}>
              <span className="material-symbols-outlined text-xl">sync</span>
            </div>
            <div>
              <div className="text-xs font-bold text-text">Rollover Balance</div>
              <div className="text-[10px] text-text3">Carry unused funds to next cycle</div>
            </div>
          </div>
          <button
            type="button"
            className={cn(
              'relative h-6 w-11 rounded-full p-1 transition-colors duration-200',
              isRollover ? 'bg-accent' : 'bg-bg4',
            )}
          >
            <div
              className={cn(
                'h-4 w-4 rounded-full bg-white transition-transform duration-200 shadow-sm',
                isRollover ? 'translate-x-5' : 'translate-x-0',
              )}
            />
          </button>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-text3">
            Internal Notes
          </Label>
          <Textarea
            {...control.register('notes')}
            placeholder="Operational context..."
            className="w-full h-24 bg-bg3 border-border rounded-xl text-sm text-text resize-none focus:ring-1 focus:ring-accent/20"
          />
        </div>
      </div>

      {!isDesktop && (
        <div className="flex flex-col gap-3 pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-accent hover:bg-accent2 text-white font-bold rounded-2xl transition-all shadow-lg shadow-accent/20"
          >
            {loading ? 'Processing…' : editBudget ? 'Save Changes' : 'Establish Protocol →'}
          </Button>
          {editBudget && (
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              className="w-full h-12 border-red-500/20 bg-red-500/5 text-red-500 font-bold rounded-2xl hover:bg-red-500/10"
            >
              Purge Budget Module
            </Button>
          )}
        </div>
      )}
    </form>
  );

  const footerContent = (
    <div className="flex gap-4 mt-8 justify-end">
      {editBudget && (
        <Button
          type="button"
          variant="outline"
          onClick={handleDelete}
          className="h-11 px-6 rounded-xl border-red-500/20 bg-red-500/5 text-red-500 font-bold text-[10px] uppercase tracking-widest hover:bg-red-500/10 transition-all"
        >
          Purge
        </Button>
      )}
      <Button
        variant="outline"
        onClick={() => setOpen(false)}
        className="h-11 px-8 rounded-xl bg-bg3 border-border text-[10px] font-bold uppercase tracking-widest text-text3 hover:text-text hover:bg-bg4 transition-all"
      >
        Cancel
      </Button>
      <Button
        form="budget-form"
        type="submit"
        disabled={loading}
        className="h-11 px-10 rounded-xl bg-accent text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
      >
        {loading ? '...' : editBudget ? 'Update Budget' : 'Establish Protocol'}
      </Button>
    </div>
  );

  return (
    <>
      {isDesktop ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-[500px] p-8 gap-0 bg-bg2 border-border rounded-3xl shadow-2xl backdrop-blur-sm z-[1001]">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 rounded-xl bg-accent/10">
                    <span className="material-symbols-outlined text-accent text-xl font-bold">
                       {editBudget ? 'edit_square' : 'account_balance_wallet'}
                    </span>
                 </div>
                 <DialogTitle className="text-2xl font-black tracking-tighter text-text">
                    {editBudget ? 'Update Budget' : 'Add Budget'}
                 </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-text3 font-medium">
                Set a spending limit for a specific category to maintain fiscal discipline.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto px-1 hide-scrollbar">
              {formContent}
            </div>
            {footerContent}
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="px-6 pb-8 max-h-[92vh] bg-bg2 border-border rounded-t-[32px] z-[1001]">
            <DrawerHeader className="px-0 mb-4 text-left">
              <div className="flex items-center gap-3">
                 <div className="p-1.5 rounded-lg bg-accent/10">
                    <span className="material-symbols-outlined text-accent text-lg font-bold">
                       {editBudget ? 'edit_square' : 'payments'}
                    </span>
                 </div>
                 <DrawerTitle className="text-xl font-extrabold tracking-tight text-text">
                    {editBudget ? 'Update Budget' : 'New Budget'}
                 </DrawerTitle>
              </div>
              <DrawerDescription className="text-[11px] text-text3 font-medium mt-1">
                Configure your category-based financial boundary.
              </DrawerDescription>
            </DrawerHeader>
            <div className="overflow-y-auto pr-1 -mr-1 hide-scrollbar">
              {formContent}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
};

export default AddBudgetPopup;
