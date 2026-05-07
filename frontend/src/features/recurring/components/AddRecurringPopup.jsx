import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import useFormat from '@/hooks/useFormat';
import useApi from '@/hooks/useApi';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
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
import { useMediaQuery } from '@/hooks/use-media-query';
import AddCategoryPopup from '@/features/categories/components/AddCategoryPopup';

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
  const isDesktop = useMediaQuery('(min-width: 768px)');
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
  const { formatDate } = useFormat();
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
  const selectedAccountId = watch('accountId');

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

  const selectedAccount = accounts.find(
    (a) => (a._id || a.id) === selectedAccountId,
  );
  const accountBalance = selectedAccount
    ? Number(selectedAccount.balance || 0)
    : 0;

  const onSubmit = async (data) => {
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

  const categoriesToDisplay = groupedCategories[selectedType] || [];

  const FormContent = (
    <div className="space-y-4 px-1 pb-4 md:pb-0">
      {/* Type Selector Tabs */}
      <div className="relative flex bg-bg3 p-1.5 rounded-2xl border border-border overflow-hidden">
        {/* Sliding Pill */}
        <div
          className="absolute h-[calc(100%-12px)] top-[6px] rounded-xl bg-accent shadow-lg shadow-accent/25 transition-all duration-300 ease-out z-0"
          style={{
            width: 'calc(33.33% - 8px)',
            left:
              selectedType === 'EXPENSE'
                ? '6px'
                : selectedType === 'INCOME'
                  ? '33.33%'
                  : '66.66%',
          }}
        />
        {['EXPENSE', 'INCOME', 'TRANSFER'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setValue('type', t);
              setValue('categoryId', '');
            }}
            className={cn(
              'relative flex-1 py-2 text-[11px] font-black tracking-widest uppercase transition-colors duration-300 z-10',
              selectedType === t ? 'text-white' : 'text-text3 hover:text-text',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Amount Input */}
      <div className="space-y-2">
        <Label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-text3 ml-1">
          Instruction Amount
        </Label>
        <div
          className={cn(
            'flex items-center gap-3 p-4 bg-bg3 border rounded-2xl transition-all group focus-within:ring-2 focus-within:ring-accent/20 focus-within:border-accent/40',
            errors.amount ? 'border-red/50' : 'border-border',
          )}
        >
          <span className="text-2xl md:text-3xl font-extrabold text-accent">
            {currencySymbol}
          </span>
          <input
            {...register('amount')}
            placeholder={`0.${'0'.repeat(decimalPlaces)}`}
            type="text"
            inputMode="decimal"
            onInput={(e) => {
              const nextValue = e.target.value.replace(/[^0-9.]/g, '');
              e.target.value = restrictDecimals(nextValue, decimalPlaces);
            }}
            className="flex-1 bg-transparent border-none outline-none text-2xl md:text-3xl font-black text-text placeholder:text-text3/20 w-full tracking-tight"
          />
        </div>
        {errors.amount && (
          <p className="text-[11px] font-medium text-red mt-1 ml-1">
            {errors.amount.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title */}
        <div className="md:col-span-2 space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-text3 ml-1">
            Instruction Name
          </Label>
          <Input
            {...register('title')}
            placeholder="e.g., Monthly Rent, SIP Investment..."
            className="h-12 bg-bg3 border-border rounded-2xl px-5 text-sm font-semibold text-text focus-visible:ring-accent/20 focus-visible:border-accent/40 transition-all"
          />
          {errors.title && (
            <p className="text-[11px] font-bold text-red mt-1 ml-1">
              {errors.title.message}
            </p>
          )}
        </div>

        {/* Date Picker */}
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-text3 ml-1">
            Start Date
          </Label>
          <Controller
            name="startDate"
            control={control}
            render={({ field }) => (
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full h-12 bg-bg3 border-border rounded-2xl px-5 text-sm font-semibold justify-start text-left hover:bg-bg4 hover:border-accent/40 transition-all',
                      !field.value && 'text-text3/50',
                    )}
                  >
                    <span className="mr-3 opacity-50">📅</span>
                    {field.value instanceof Date && !isNaN(field.value)
                      ? formatDate(field.value)
                      : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-bg2 border-border"
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
        </div>

        {/* Category Select */}
        <div className="space-y-2">
          <div className="flex items-center justify-between ml-1">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-text3">
              Category
            </Label>
            <button
              type="button"
              onClick={() => setCatOpen(true)}
              className="text-[9px] font-black text-accent hover:text-accent/80 uppercase tracking-widest transition-colors flex items-center gap-1"
            >
              <span className="text-sm">+</span> NEW
            </button>
          </div>
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="h-12 bg-bg3 border-border rounded-2xl px-5 text-sm font-semibold text-text hover:border-accent/40 transition-all">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent className="bg-bg2 border-border">
                  {categoriesToDisplay.map((cat) => (
                    <SelectItem
                      key={cat._id}
                      value={cat._id}
                      className="focus:bg-accent focus:text-white"
                    >
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
        </div>

        {/* Account Select */}
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-text3 ml-1">
            {selectedType === 'TRANSFER'
              ? 'Source Account'
              : selectedType === 'INCOME'
                ? 'Credit Account'
                : 'Debit Account'}
          </Label>
          <Controller
            name="accountId"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="h-12 bg-bg3 border-border rounded-2xl px-5 text-sm font-semibold text-text hover:border-accent/40 transition-all">
                  <SelectValue placeholder="Select account..." />
                </SelectTrigger>
                <SelectContent className="bg-bg2 border-border">
                  {accounts.map((acc) => (
                    <SelectItem
                      key={acc._id}
                      value={acc._id}
                      className="focus:bg-accent focus:text-white"
                    >
                      <div className="flex items-center justify-between w-full gap-4">
                        <span>{acc.name}</span>
                        <span className="opacity-50 text-[10px] font-mono">
                          {getCurrencySymbol(currency)}
                          {acc.balance.toLocaleString()}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Target Account (Transfer) */}
        {selectedType === 'TRANSFER' ? (
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-text3 ml-1">
              Target Account
            </Label>
            <Controller
              name="toAccountId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-12 bg-bg3 border-border rounded-2xl px-5 text-sm font-semibold text-text hover:border-accent/40 transition-all">
                    <SelectValue placeholder="Select target..." />
                  </SelectTrigger>
                  <SelectContent className="bg-bg2 border-border">
                    {accounts
                      .filter((acc) => acc._id !== selectedAccountId)
                      .map((acc) => (
                        <SelectItem
                          key={acc._id}
                          value={acc._id}
                          className="focus:bg-accent focus:text-white"
                        >
                          <span>{acc.name}</span>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        ) : (
          /* Frequency - when not transfer, it goes next to account */
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-text3 ml-1">
              Frequency
            </Label>
            <Controller
              name="frequency"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-12 bg-bg3 border-border rounded-2xl px-5 text-sm font-semibold text-text hover:border-accent/40 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-bg2 border-border">
                    {['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'].map(
                      (f) => (
                        <SelectItem
                          key={f}
                          value={f}
                          className="focus:bg-accent focus:text-white"
                        >
                          {f.charAt(0) + f.slice(1).toLowerCase()}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        )}

        {/* Frequency - Full width if transfer */}
        {selectedType === 'TRANSFER' && (
          <div className="col-span-2 space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-text3 ml-1">
              Frequency
            </Label>
            <Controller
              name="frequency"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-12 bg-bg3 border-border rounded-2xl px-5 text-sm font-semibold text-text hover:border-accent/40 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-bg2 border-border">
                    {['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'].map(
                      (f) => (
                        <SelectItem
                          key={f}
                          value={f}
                          className="focus:bg-accent focus:text-white"
                        >
                          {f.charAt(0) + f.slice(1).toLowerCase()}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        )}
      </div>

      {/* Entry Mode & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-2 bg-bg3 border border-border rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-accent/10 text-xl">
              {entryType === 'auto' ? '🤖' : '🔔'}
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-text">
                {entryType === 'auto' ? 'Autonomous' : 'Assisted'}
              </p>
              <p className="text-[9px] font-medium text-text3 leading-tight">
                {entryType === 'auto'
                  ? 'Automated entries'
                  : 'Manual verification'}
              </p>
            </div>
          </div>
          <div className="flex bg-bg2 rounded-xl p-1 gap-1 border border-border">
            {['auto', 'manual'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setValue('entryType', m)}
                className={cn(
                  'flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all duration-300',
                  entryType === m
                    ? 'bg-accent text-white shadow-md'
                    : 'text-text3 hover:text-text',
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-3 space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-text3 ml-1 flex justify-between">
            Notes / Remarks
            <span className="opacity-40 normal-case font-medium">
              {watch('notes')?.length || 0}/250
            </span>
          </Label>
          <Textarea
            {...register('notes')}
            placeholder="Add context for this instruction..."
            className="h-[108px] bg-bg3 border-border rounded-2xl p-4 text-sm font-medium text-text focus-visible:ring-accent/20 focus-visible:border-accent/40 resize-none transition-all"
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isDesktop ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-[580px] bg-bg2 border-border p-6 md:p-7 rounded-[40px] shadow-2xl max-h-[92vh] overflow-hidden flex flex-col">
            <DialogHeader className="mb-4 shrink-0 space-y-1">
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 flex items-center justify-center rounded-2xl bg-accent/10 text-xl">
                  {selectedType === 'INCOME'
                    ? '📈'
                    : selectedType === 'TRANSFER'
                      ? '⇄'
                      : '📉'}
                </div>
                <div>
                  <DialogTitle className="text-xl font-black tracking-tight text-text">
                    {editTask ? 'Refine Recurring Task' : 'New Recurring Setup'}
                  </DialogTitle>
                  <DialogDescription className="text-[11px] text-text3 font-medium">
                    Automate your financial lifecycle with precision rules.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <div className="flex-1 overflow-y-auto pr-2 hide-scrollbar">
                {FormContent}
              </div>
              <div className="pt-4 shrink-0">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-gradient-to-r from-accent to-accent2 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-accent/20 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : editTask ? (
                    'Update Protocol'
                  ) : (
                    'Establish Rule'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="bg-bg2 border-border rounded-t-[40px] px-6 pb-8 max-h-[96vh] flex flex-col">
            <DrawerHeader className="px-0 pt-6 pb-4 space-y-1 shrink-0">
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 flex items-center justify-center rounded-2xl bg-accent/10 text-xl">
                  {selectedType === 'INCOME'
                    ? '📈'
                    : selectedType === 'TRANSFER'
                      ? '⇄'
                      : '📉'}
                </div>
                <div className="text-left">
                  <DrawerTitle className="text-xl font-black tracking-tight text-text">
                    {editTask ? 'Refine Task' : 'New Setup'}
                  </DrawerTitle>
                  <DrawerDescription className="text-[11px] text-text3 font-medium">
                    Automate your financial lifecycle.
                  </DrawerDescription>
                </div>
              </div>
            </DrawerHeader>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <div className="flex-1 overflow-y-auto hide-scrollbar -mx-1 px-1">
                {FormContent}
              </div>
              <div className="mt-6 shrink-0 space-y-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-gradient-to-r from-accent to-accent2 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-accent/20 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : editTask ? (
                    'Update Protocol'
                  ) : (
                    'Establish Rule'
                  )}
                </Button>
                <DrawerClose asChild>
                  <Button
                    variant="ghost"
                    className="w-full h-10 text-text3 font-bold uppercase tracking-widest text-[9px] hover:bg-transparent"
                  >
                    Dismiss
                  </Button>
                </DrawerClose>
              </div>
            </form>
          </DrawerContent>
        </Drawer>
      )}

      <AddCategoryPopup
        open={catOpen}
        onClose={() => setCatOpen(false)}
        onSave={onCategorySave}
        defaultType={selectedType}
      />
    </>
  );
};

export default AddRecurringPopup;
