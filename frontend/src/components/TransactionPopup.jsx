import { useEffect, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { z } from 'zod';
import { format } from 'date-fns';
import useApi from '@/hooks/useApi';
import {
  addTransaction,
  updateTransaction,
} from '@/redux/transactionSlice';
import useFormat from '@/hooks/useFormat';
import AddCategoryPopup from './AddCategoryPopup';
import { updateAccount } from '@/redux/accountSlice';
import api from '@/utils/httpMethods';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
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
import { restrictDecimals } from '@/utils/format';
import AddPartyPopup from './AddPartyPopup';

const transactionSchema = z
  .object({
    type: z.enum(['expense', 'income', 'transfer', 'debt']),
    account: z.string().min(1, 'Account is required'),
    date: z.date({
      required_error: 'Date is required',
    }),
    amount: z.coerce
      .number({ invalid_type_error: 'Amount must be a number' })
      .positive('Amount must be positive'),
    description: z.string().min(3, 'Min 3 chars required'),
    notes: z.string().optional(),
    tags: z.string().optional(),
    pendingStatus: z.boolean().optional().default(false),
    category: z.string().optional(),
    toaccount: z.string().optional(),
    debttype: z.string().optional(),
    partyId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      ['expense', 'income'].includes(data.type) &&
      (!data.category || data.category === '')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Classification is required',
        path: ['category'],
      });
    }
    if (data.type === 'transfer' && !data.toaccount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Target account is required',
        path: ['toaccount'],
      });
    }
    if (data.type === 'debt' && !data.partyId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Party is required',
        path: ['partyId'],
      });
    }
    if (data.type === 'debt' && !data.debttype) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please select Lent or Borrowed',
        path: ['debttype'],
      });
    }
  });


const TAB_CONFIG = {
  expense: {
    label: '💸 Expense',
    activeColor: 'var(--red)',
    bg: 'var(--red-bg)',
    border: 'var(--red-border)',
    glow: 'rgba(239,68,68,0.18)',
  },
  income: {
    label: '💵 Income',
    activeColor: 'var(--green)',
    bg: 'var(--green-bg)',
    border: 'var(--green-border)',
    glow: 'rgba(34,197,94,0.18)',
  },
  transfer: {
    label: '⇄ Transfer',
    activeColor: 'var(--accent)',
    bg: 'var(--accent-glow)',
    border: 'rgba(91,141,239,0.25)',
    glow: 'rgba(91,141,239,0.18)',
  },
  debt: {
    label: '🤝 Debt',
    activeColor: 'var(--amber)',
    bg: 'var(--amber-bg)',
    border: 'var(--amber-border)',
    glow: 'rgba(245,158,11,0.18)',
  },
};

const TAB_KEYS = Object.keys(TAB_CONFIG);

const TransactionPopup = ({
  open,
  setOpen,
  onSuccess,
  editTransaction = null,
}) => {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const dispatch = useDispatch();
  const { accounts = [] } = useSelector((state) => state.accounts);
  const { categories = [] } = useSelector((state) => state.category);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddPartyOpen, setIsAddPartyOpen] = useState(false);
  const [parties, setParties] = useState([]);
  const [dateOpen, setDateOpen] = useState(false);
  const { data: transData, loading, makeRequest } = useApi();

  const { formatAmount, currencySymbol, decimalPlaces } = useFormat();

  const activeAccounts = accounts.filter((a) => a.isActive !== false && !a.isDeleted);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
    setValue,
    control,
  } = useForm({
    resolver: zodResolver(transactionSchema),
    mode: 'onChange',
    defaultValues: {
      type: 'expense',
      date: new Date(),
      amount: '',
      account: '',
      description: '',
      notes: '',
      tags: '',
      pendingStatus: false,
      category: '',
      toaccount: '',
      debttype: '',
      partyId: '',
    },
  });

  const pendingStatus = watch('pendingStatus');

  const transactionType = watch('type');
  const selectedAccountId = watch('account');
  const debtType = watch('debttype');
  const selectedPartyId = watch('partyId');
  const isTransfer = transactionType === 'transfer';
  const isDebt = transactionType === 'debt';

  const selectedParty = useMemo(
    () => parties.find((p) => String(p._id) === String(selectedPartyId)),
    [parties, selectedPartyId],
  );

  const filteredCategories = useMemo(() => {
    const type = transactionType?.toUpperCase();
    return categories[type] || [];
  }, [categories, transactionType]);

  const filteredParties = useMemo(() => parties, [parties]);

  const selectedAccount = activeAccounts.find(
    (a) => String(a._id || a.id) === String(selectedAccountId),
  );
  const accountBalance = selectedAccount
    ? Number(selectedAccount.balance || 0)
    : 0;

  const targetAccountOptions = accounts.filter(
    (a) => a.isActive !== false && String(a._id || a.id) !== String(selectedAccountId),
  );

  useEffect(() => {
    if (open) {
      if (editTransaction) {
        reset({
          type: editTransaction.type?.toLowerCase() || 'expense',
          date: editTransaction.date
            ? new Date(editTransaction.date)
            : new Date(),
          amount: editTransaction.amount,
          account: String(editTransaction.accountId?._id || editTransaction.accountId || ''),
          description: editTransaction.title || '',
          notes: editTransaction.notes || '',
          tags: (editTransaction.tags || []).join(', '),
          pendingStatus: editTransaction.pendingStatus || false,
          category: String(editTransaction.categoryId?._id || editTransaction.categoryId || ''),
          toaccount: String(editTransaction.targetAccountId?._id || editTransaction.targetAccountId || ''),
          // Normalize: repayment transactions from DB have REPAYMENT_IN/OUT — map back to 'repay' for the form
          debttype: editTransaction.debtType || '',
          partyId: String(editTransaction.partyId?._id || editTransaction.partyId || ''),
        });
      } else {
        const defaultAccount = activeAccounts.find((a) => a.isDefault);
        reset({
          type: 'expense',
          date: new Date(),
          amount: '',
          account: defaultAccount
            ? String(defaultAccount._id || defaultAccount.id)
            : '',
          description: '',
          notes: '',
          tags: '',
          pendingStatus: false,
          category: '',
          toaccount: '',
          debttype: '',
          partyId: '',
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editTransaction]);

  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        try {
          const partyRes = await api.get('/parties');
          setParties(partyRes.data.data || partyRes.data || []);
        } catch (e) {
          console.error('Failed to fetch parties');
        }
      };
      fetchData();
    }
  }, [open]);

  const onSubmit = async (data) => {
    if (data.type === 'expense' && data.amount > accountBalance) {
      toast.error(
        `Insufficient balance. Available: ${formatAmount(accountBalance)}`,
      );
      return;
    }
    if (data.type === 'transfer' && String(data.account) === String(data.toaccount)) {
      toast.error('Source and Target Account cannot be same');
      return;
    }

    try {
      const url = editTransaction
        ? `/transactions/${editTransaction._id}`
        : '/transactions';
      const method = editTransaction ? 'put' : 'post';

      const payload = {
        date: data.date,
        accountId: data.account,
        type: data.type,
        amount: data.amount,
        title: data.description,
        categoryId: data.category || null,
        notes: data.notes || '',
        tags: data.tags
          ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
        pendingStatus: data.pendingStatus || false,
      };

      if (payload.type === 'transfer') {
        payload.targetAccountId = data.toaccount || null;
      }

      if (payload.type === 'debt') {
        payload.partyId = data.partyId || null;
        payload.debtType = data.debttype?.toUpperCase() || null;
      }

      const res = await makeRequest({ url, method, data: payload });

      const transactionData = res?.data?.transaction || res?.data?.data;
      if (editTransaction) {
        dispatch(updateTransaction(transactionData));
      } else {
        dispatch(addTransaction(transactionData));
      }

      if (res?.data?.updatedAccounts) {
        res.data.updatedAccounts.forEach((acc) => dispatch(updateAccount(acc)));
      }

      toast.success(
        editTransaction ? 'Updated successfully!' : 'Transaction saved!',
      );
      window.dispatchEvent(new CustomEvent('refetch-system-metrics'));
      setOpen(false);
    } catch (error) {
      toast.error(
        `Failed to ${editTransaction ? 'update' : 'save'} transaction: ` +
          (error?.response?.data?.message || error?.message || 'Unknown error'),
      );
    }
  };

  const handleClose = () => setOpen(false);

  const formContent = (
    <form id="txn-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* ── Type Tabs ── */}
      {(() => {
        const activeIdx = TAB_KEYS.indexOf(transactionType);
        const safeIdx = activeIdx === -1 ? 0 : activeIdx;
        const activeCfg = TAB_CONFIG[transactionType] || TAB_CONFIG.expense;
        return (
          <div
            className="relative flex bg-bg3 p-1 rounded-2xl gap-1 overflow-hidden"
            style={{
              border: `1.5px solid ${activeCfg.border}`,
              transition: 'border-color 0.35s ease',
            }}
          >
            {/* Sliding Colored Pill */}
            <div
              style={{
                position: 'absolute',
                top: 4,
                bottom: 4,
                left: `calc(${safeIdx * 25}% + 4px)`,
                width: 'calc(25% - 8px)',
                background: activeCfg.bg,
                border: `1.5px solid ${activeCfg.border}`,
                boxShadow: `0 0 16px 2px ${activeCfg.glow}`,
                borderRadius: 10,
                transition: 'left 0.35s cubic-bezier(0.34,1.56,0.64,1), background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
              }}
            />
            {Object.entries(TAB_CONFIG).map(([type, cfg]) => {
              const isActive = transactionType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setValue('type', type);
                    setValue('category', '');
                    setValue('toaccount', '');
                    if (type === 'debt') setValue('debttype', 'LENT');
                  }}
                  className="relative z-10 flex-1 py-2 md:py-2.5 px-1 min-w-[70px] text-[10px] md:text-[11px] font-bold uppercase tracking-wider rounded-[10px]"
                  style={{
                    color: isActive ? cfg.activeColor : 'var(--text3)',
                    transition: 'color 0.25s ease',
                    textShadow: isActive ? `0 0 12px ${cfg.glow}` : 'none',
                  }}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        );
      })()}

      {/* ── Amount Input ── */}
      <div className="space-y-2">
        <Label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-text3 ml-1">
          Amount to Process
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
        {/* Process Date */}
        <div className="space-y-2">
          <Label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-text3 ml-1">
            Process Date
          </Label>
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-semibold h-12 px-4 bg-bg3 border-border rounded-xl hover:bg-bg4 transition-all text-sm group',
                      !field.value && 'text-text3/40',
                      errors.date && 'border-red/50',
                    )}
                  >
                    <span className="material-symbols-outlined mr-3 !text-[18px] text-accent group-hover:scale-110 transition-transform">
                      calendar_today
                    </span>
                    {field.value instanceof Date && !isNaN(field.value)
                      ? format(field.value, 'dd MMM yyyy')
                      : 'Select Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[4000]" align="start">
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
          {errors.date && (
            <p className="text-[11px] font-medium text-red">{errors.date.message}</p>
          )}
        </div>

        {/* Classification / Party */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <Label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-text3">
              {isDebt ? 'Liable Party' : 'Classification'}
            </Label>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                isDebt ? setIsAddPartyOpen(true) : setIsAddCategoryOpen(true);
              }}
              className="text-[10px] text-accent font-black hover:underline uppercase tracking-wider"
            >
              + New
            </button>
          </div>
          {isDebt ? (
            <Controller
              name="partyId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={String(field.value)}>
                  <SelectTrigger
                    className={cn(
                      'h-12 bg-bg3 border-border rounded-xl text-sm font-semibold',
                      errors.partyId && 'border-red/50',
                    )}
                  >
                    <SelectValue placeholder="Select Party" />
                  </SelectTrigger>
                  <SelectContent className="z-[4000]">
                    {filteredParties.map((p) => (
                      <SelectItem key={p._id} value={String(p._id)}>
                        {p.name} ({p.relation})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          ) : (
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={String(field.value)}>
                  <SelectTrigger
                    className={cn(
                      'h-12 bg-bg3 border-border rounded-xl text-sm font-semibold',
                      errors.category && 'border-red/50',
                    )}
                  >
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="z-[4000]">
                    {filteredCategories.map((c) => (
                      <SelectItem key={String(c._id || c.id)} value={String(c._id || c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
          {(errors.partyId || errors.category) && (
            <p className="text-[11px] font-medium text-red">
              {errors.partyId?.message || errors.category?.message}
            </p>
          )}
        </div>

        {/* Source Account */}
        <div className="space-y-2">
          <Label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-text3 ml-1 flex justify-between">
            Source Account
            {selectedAccount && (
              <span className="text-accent normal-case font-bold tracking-tight">
                Bal: {formatAmount(accountBalance)}
              </span>
            )}
          </Label>
          <Controller
            name="account"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={String(field.value)}>
                <SelectTrigger
                  className={cn(
                    'h-12 bg-bg3 border-border rounded-xl text-sm font-semibold',
                    errors.account && 'border-red/50',
                  )}
                >
                  <SelectValue placeholder="Select Account" />
                </SelectTrigger>
                <SelectContent className="z-[4000]">
                  {activeAccounts.map((a) => (
                    <SelectItem key={String(a._id || a.id)} value={String(a._id || a.id)}>
                      {a.name}
                      {a.isDefault ? ' ★' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.account && (
            <p className="text-[11px] font-medium text-red">
              {errors.account.message}
            </p>
          )}
        </div>

        {/* Target Account (Transfer only) */}
        {isTransfer && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <Label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-text3 ml-1">
              Target Account
            </Label>
            <Controller
              name="toaccount"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={String(field.value)}>
                  <SelectTrigger
                    className={cn(
                      'h-12 bg-bg3 border-border rounded-xl text-sm font-semibold',
                      errors.toaccount && 'border-red/50',
                    )}
                  >
                    <SelectValue placeholder="Select Target" />
                  </SelectTrigger>
                  <SelectContent className="z-[4000]">
                    {targetAccountOptions.map((a) => (
                      <SelectItem key={String(a._id || a.id)} value={String(a._id || a.id)}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.toaccount && (
              <p className="text-[11px] font-medium text-red">
                {errors.toaccount?.message}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Debt Direction: LENT / BORROWED ── */}
      {isDebt && (
        <div className="space-y-2">
          <Label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-text3 ml-1">
            Direction
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'LENT',     label: '💸 Maine Diya',   hint: 'Unhe paisa diya' },
              { value: 'BORROWED', label: '🤝 Maine Liya',   hint: 'Un se paisa liya' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setValue('debttype', opt.value)}
                className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl border text-center transition-all duration-200"
                style={{
                  background: debtType === opt.value ? 'var(--amber-bg)' : 'var(--bg3)',
                  borderColor: debtType === opt.value ? 'var(--amber-border)' : 'var(--border)',
                  color: debtType === opt.value ? 'var(--amber)' : 'var(--text3)',
                  fontWeight: debtType === opt.value ? 700 : 500,
                }}
              >
                <span className="text-[13px] font-bold">{opt.label}</span>
                <span className="text-[9px] opacity-70">{opt.hint}</span>
              </button>
            ))}
          </div>
          {errors.debttype && (
            <p className="text-[11px] font-medium text-red ml-1">{errors.debttype.message}</p>
          )}
        </div>
      )}

      {/* ── Party Net Balance Info Card ── */}
      {isDebt && selectedParty && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl border animate-in fade-in slide-in-from-top-2 duration-300"
          style={{
            background: (selectedParty.netDebt || 0) >= 0 ? 'var(--green-bg)' : 'var(--red-bg)',
            borderColor: (selectedParty.netDebt || 0) >= 0 ? 'var(--green-border)' : 'var(--red-border)',
          }}
        >
          <span className="text-xl">
            {(selectedParty.netDebt || 0) === 0 ? '✅' : (selectedParty.netDebt || 0) > 0 ? '📥' : '📤'}
          </span>
          <div className="flex-1">
            <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
              style={{ color: (selectedParty.netDebt || 0) >= 0 ? 'var(--green)' : 'var(--red)' }}
            >
              {selectedParty.name} ke saath hisaab
            </div>
            <div className="text-sm font-black"
              style={{ color: (selectedParty.netDebt || 0) >= 0 ? 'var(--green)' : 'var(--red)' }}
            >
              {(selectedParty.netDebt || 0) === 0
                ? 'Koi baaki nahi'
                : (selectedParty.netDebt || 0) > 0
                  ? `+${formatAmount(selectedParty.netDebt)} — ${selectedParty.name} tumhara dena hai`
                  : `${formatAmount(selectedParty.netDebt)} — Tum ${selectedParty.name} ka dena ho`
              }
            </div>
          </div>
        </div>
      )}

      {/* ── Title / Description ── */}
      <div className="space-y-2">
        <Label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-text3 ml-1">
          Title
        </Label>
        <Input
          {...register('description')}
          placeholder="Transaction title…"
          className={cn(
            'h-11 bg-bg3 border-border rounded-xl text-sm font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all placeholder:text-text3/20',
            errors.description && 'border-red/50',
          )}
        />
        {errors.description && (
          <p className="text-[11px] font-medium text-red ml-1">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* ── Notes ── */}
      <div className="space-y-2">
        <Label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-text3 ml-1">
          Notes
        </Label>
        <Textarea
          {...register('notes')}
          placeholder="Additional remarks or context…"
          className="bg-bg3 border-border rounded-2xl resize-none h-16 text-sm font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all placeholder:text-text3/20"
        />
      </div>

      {/* ── Tags + Pending Status Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-text3 ml-1">
            Tags
          </Label>
          <Input
            {...register('tags')}
            placeholder="food, travel, rent…"
            className="h-11 bg-bg3 border-border rounded-xl text-sm font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all placeholder:text-text3/20"
          />
          <p className="text-[10px] text-text3 ml-1">Comma-separated labels</p>
        </div>
        <div className="space-y-2">
          <Label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-text3 ml-1">
            Status
          </Label>
          <button
            type="button"
            onClick={() => setValue('pendingStatus', !pendingStatus)}
            className={cn(
              'relative flex items-center gap-3 w-full h-11 px-4 rounded-xl border text-sm font-semibold transition-all duration-300',
              pendingStatus
                ? 'bg-amber-bg border-amber-border text-amber'
                : 'bg-bg3 border-border text-text3 hover:text-text hover:border-border/80',
            )}
            style={pendingStatus ? { color: 'var(--amber)', borderColor: 'var(--amber-border)', background: 'var(--amber-bg)' } : {}}
          >
            <span
              className="material-symbols-outlined !text-[18px] transition-all"
              style={{ color: pendingStatus ? 'var(--amber)' : 'var(--text3)' }}
            >
              {pendingStatus ? 'schedule' : 'check_circle'}
            </span>
            {pendingStatus ? 'Pending' : 'Completed'}
            {/* toggle pill */}
            <span
              className="ml-auto w-9 h-5 rounded-full flex items-center px-0.5 transition-all duration-300"
              style={{
                background: pendingStatus ? 'var(--amber)' : 'var(--border)',
              }}
            >
              <span
                className="w-4 h-4 rounded-full bg-white shadow transition-transform duration-300"
                style={{ transform: pendingStatus ? 'translateX(16px)' : 'translateX(0)' }}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Action Buttons for Mobile */}
      {!isDesktop && (
        <div className="flex gap-3 pt-2">
          <DrawerClose asChild>
            <Button variant="outline" className="flex-1 h-12 rounded-2xl text-[10px] uppercase font-bold tracking-widest bg-bg3 border-border">
              Cancel
            </Button>
          </DrawerClose>
          <Button
            type="submit"
            disabled={loading}
            className="flex-[2] h-12 rounded-2xl bg-gradient-to-r from-accent to-accent2 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-accent/20"
          >
            {loading ? 'Processing…' : editTransaction ? 'Update Record' : 'Save Entry'}
          </Button>
        </div>
      )}
    </form>
  );

  const desktopFooter = (
    <div className="flex gap-4 mt-8 justify-end">
      <Button
        variant="outline"
        onClick={handleClose}
        className="h-11 px-8 rounded-xl bg-bg3 border-border text-[10px] font-bold uppercase tracking-widest text-text3 hover:text-text hover:bg-bg4 transition-all"
      >
        Cancel
      </Button>
      <Button
        form="txn-form"
        type="submit"
        disabled={loading}
        className="h-11 px-10 rounded-xl bg-gradient-to-r from-accent to-accent2 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all min-w-[180px]"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : editTransaction ? 'Update Transaction' : 'Confirm Transaction'}
      </Button>
    </div>
  );

  return (
    <>
      {isDesktop ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-[580px] p-8 gap-0 bg-bg2 border-border rounded-3xl shadow-2xl backdrop-blur-sm z-[1001]">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 rounded-xl bg-accent-glow">
                    <span className="material-symbols-outlined text-accent text-xl font-bold">
                       {editTransaction ? 'edit_note' : 'account_balance_wallet'}
                    </span>
                 </div>
                 <DialogTitle className="text-2xl font-black tracking-tighter text-text">
                    {editTransaction ? 'Edit Transaction' : 'Smart Transaction'}
                 </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-text3 font-medium">
                Precise financial record entry for your firm's ledger.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[65vh] overflow-y-auto px-1 hide-scrollbar">
              {formContent}
            </div>
            {desktopFooter}
            <AddCategoryPopup
              open={isAddCategoryOpen}
              onClose={() => setIsAddCategoryOpen(false)}
              onSave={(id) => {
                setIsAddCategoryOpen(false);
                setValue('category', String(id));
              }}
              defaultType={transactionType?.toUpperCase() || 'EXPENSE'}
            />

            <AddPartyPopup
              open={isAddPartyOpen}
              onClose={() => setIsAddPartyOpen(false)}
              onSave={(party) => {
                setParties((prev) => [party, ...prev]);
                setValue('partyId', String(party._id));
                setIsAddPartyOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="px-6 pb-8 max-h-[92vh] bg-bg2 border-border rounded-t-[32px] z-[1001]">
            <DrawerHeader className="px-0 mb-4 text-left">
              <div className="flex items-center gap-3">
                 <div className="p-1.5 rounded-lg bg-accent-glow">
                    <span className="material-symbols-outlined text-accent text-lg font-bold">
                       {editTransaction ? 'edit_note' : 'add_card'}
                    </span>
                 </div>
                 <DrawerTitle className="text-xl font-extrabold tracking-tight text-text">
                    {editTransaction ? 'Edit Record' : 'New Transaction'}
                 </DrawerTitle>
              </div>
              <DrawerDescription className="text-[11px] text-text3 font-medium mt-1">
                Design your financial record below.
              </DrawerDescription>
            </DrawerHeader>
            <div className="overflow-y-auto pr-1 -mr-1 hide-scrollbar">
              {formContent}
            </div>
            <AddCategoryPopup
              open={isAddCategoryOpen}
              onClose={() => setIsAddCategoryOpen(false)}
              onSave={(id) => {
                setIsAddCategoryOpen(false);
                setValue('category', String(id));
              }}
              defaultType={transactionType?.toUpperCase() || 'EXPENSE'}
            />

            <AddPartyPopup
              open={isAddPartyOpen}
              onClose={() => setIsAddPartyOpen(false)}
              onSave={(party) => {
                setParties((prev) => [party, ...prev]);
                setValue('partyId', String(party._id));
                setIsAddPartyOpen(false);
              }}
            />
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
};

export default TransactionPopup;
