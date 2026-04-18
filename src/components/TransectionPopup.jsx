import { useEffect, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { z } from 'zod';
import { format } from 'date-fns';
import useApi from '@/hooks/useApi';
import { addTransection, updateTransection } from '@/redux/transectionSlice';
import AddCategoryPopup from './AddCategoryPopup';
import AddPartyPopup from './AddPartyPopup';
import {
  getCurrencySymbol,
  restrictDecimals,
  formatAmount,
} from '@/utils/format';
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

const transectionSchema = z
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
    category: z.string().optional(),
    toaccount: z.string().optional(),
    debttype: z.string().optional(),
    partyId: z.string().optional(),
    loanId: z.string().optional(),
    dueDate: z.date().optional().nullable(),
    interestRate: z.coerce.number().min(0).optional().default(0),
  })
  .superRefine((data, ctx) => {
    // Expense/Income require Classification
    if (['expense', 'income'].includes(data.type) && (!data.category || data.category === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Classification is required',
        path: ['category'],
      });
    }
    // Transfer requires Target Account
    if (data.type === 'transfer' && !data.toaccount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Target account is required',
        path: ['toaccount'],
      });
    }
    // Debt requires Party
    if (data.type === 'debt' && !data.partyId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Party is required',
        path: ['partyId'],
      });
    }
    // Repayment requires Loan Selection
    if (data.type === 'debt' && data.debttype === 'repay' && !data.loanId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please select a loan to settle',
        path: ['loanId'],
      });
    }
  });

/* ── Tab config ─────────────────────────────────────────── */
const TAB_CONFIG = {
  expense:  { label: '💸 Expense',  activeColor: 'var(--red)',    textClass: 'tab-expense'  },
  income:   { label: '💵 Income',   activeColor: 'var(--green)',  textClass: 'tab-income'   },
  transfer: { label: '⇄ Transfer',  activeColor: 'var(--accent)', textClass: 'tab-transfer' },
  debt:     { label: '🤝 Debt',     activeColor: 'var(--amber)',  textClass: 'tab-debt'     },
};

const TransactionPopup = ({
  open,
  setOpen,
  onSuccess,
  editTransection = null,
}) => {
  const dispatch = useDispatch();
  const { accounts = [] } = useSelector((state) => state.accounts);
  const { categories = [] } = useSelector((state) => state.category);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddPartyOpen, setIsAddPartyOpen] = useState(false);
  const [parties, setParties] = useState([]);
  const [allLoans, setAllLoans] = useState([]);
  const [activeLoans, setActiveLoans] = useState([]);
  const [dateOpen, setDateOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const { data: transData, loading, makeRequest } = useApi();

  const preferences = useSelector(
    (state) => state.auth.user?.user?.preferences,
  );
  const { currency = 'INR', decimalPlaces = 2 } = preferences || {};
  const currencySymbol = getCurrencySymbol(currency);

  const activeAccounts = accounts.filter((a) => a.isActive !== false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
    setValue,
    control,
  } = useForm({
    resolver: zodResolver(transectionSchema),
    mode: 'onChange',
    defaultValues: {
      type: 'expense',
      date: new Date(),
      amount: '',
      account: '',
      description: '',
      category: '',
      toaccount: '',
      debttype: '',
      partyId: '',
      dueDate: null,
      interestRate: '',
    },
  });

  const transactionType = watch('type');
  const selectedAccountId = watch('account');
  const transactionDate = watch('date');
  const debtType = watch('debttype');
  const selectedPartyId = watch('partyId');
  const dueDate = watch('dueDate');
  const isTransfer = transactionType === 'transfer';
  const isRepayment = transactionType === 'debt' && debtType === 'repay';

  const filteredCategories = useMemo(() => {
    const type = transactionType?.toUpperCase();
    return categories[type] || [];
  }, [categories, transactionType]);

  const filteredParties = useMemo(() => {
    if (transactionType !== 'debt') return parties;
    const partyIdsWithLoans = new Set(
      allLoans.filter((l) => l.status === 'PENDING').map((l) => l.party?._id || l.party),
    );
    return parties.filter((p) => partyIdsWithLoans.has(p._id));
  }, [parties, allLoans, transactionType]);

  const isRestrictedEdit = useMemo(() => {
    if (!editTransection) return false;
    return false;
  }, [editTransection]);

  const selectedAccount = activeAccounts.find(
    (a) => (a._id || a.id) === selectedAccountId,
  );
  const accountBalance = selectedAccount
    ? Number(selectedAccount.balance || 0)
    : 0;

  const targetAccountOptions = accounts.filter(
    (a) => a.isActive !== false && (a._id || a.id) !== selectedAccountId,
  );

  useEffect(() => {
    if (open) {
      if (editTransection) {
        reset({
          type: editTransection.type?.toLowerCase() || 'expense',
          date: editTransection.date ? new Date(editTransection.date) : new Date(),
          amount: editTransection.amount,
          account: editTransection.accountId?._id || editTransection.accountId || '',
          description: editTransection.title || editTransection.notes || '',
          category: editTransection.categoryId?._id || editTransection.categoryId || '',
          toaccount: editTransection.targetAccountId?._id || editTransection.targetAccountId || '',
          debttype: editTransection.debtType || '',
          partyId: editTransection.partyId?._id || editTransection.partyId || '',
          dueDate: editTransection.dueDate ? new Date(editTransection.dueDate) : null,
          interestRate: editTransection.interestRate || '',
        });
      } else {
        const defaultAccount = activeAccounts.find((a) => a.isDefault);
        reset({
          type: 'expense',
          date: new Date(),
          amount: '',
          account: defaultAccount ? defaultAccount._id || defaultAccount.id : '',
          description: '',
          category: '',
          toaccount: '',
          debttype: '',
          partyId: '',
          dueDate: null,
          interestRate: '',
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editTransection]);

  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        try {
          const [partyRes, loanRes] = await Promise.all([
            api.get('/parties'),
            api.get('/loans'),
          ]);
          setParties(partyRes.data.data || partyRes.data || []);
          setAllLoans(loanRes.data.data || loanRes.data || []);
        } catch (e) {
          console.error('Failed to fetch parties/loans');
        }
      };
      fetchData();
    }
  }, [open]);

  useEffect(() => {
    if (open && transactionType === 'debt' && selectedPartyId) {
      const filtered = allLoans.filter(
        (l) =>
          (l.party?._id || l.party) === selectedPartyId &&
          l.status === 'PENDING',
      );
      setActiveLoans(filtered);
    }
  }, [open, transactionType, selectedPartyId, allLoans]);

  const onSubmit = async (data) => {
    if (data.type === 'expense' && data.amount > accountBalance) {
      toast.error(`Insufficient balance. Available: ${formatAmount(accountBalance, currency)}`);
      return;
    }
    if (data.type === 'transfer' && data.account === data.toaccount) {
      toast.error('Source and Target Account cannot be same');
      return;
    }
    if (data.type === 'debt' && data.loanId) {
      const selectedLoan = activeLoans.find((l) => l._id === data.loanId);
      if (selectedLoan && data.amount > selectedLoan.amount) {
        toast.error(`Repayment cannot exceed outstanding balance (${formatAmount(selectedLoan.amount, currency)})`);
        return;
      }
    }

    try {
      const url = editTransection ? `/transactions/${editTransection._id}` : '/transactions';
      const method = editTransection ? 'put' : 'post';

      const payload = {
        date: data.date,
        accountId: data.account,
        type: data.type === 'debt' && data.debttype === 'repay' ? 'repayment' : data.type,
        amount: data.amount,
        title: data.description,
        categoryId: data.category || null,
        notes: data.description,
      };

      // Add context-specific fields
      if (payload.type === 'transfer') {
        payload.targetAccountId = data.toaccount || null;
      }

      if (['debt', 'repayment'].includes(payload.type)) {
        payload.partyId = data.partyId || null;
        payload.debtType = data.debttype === 'repay' ? 'REPAY_IN' : data.debttype?.toUpperCase();
        payload.loanId = data.loanId || null;

        // Only for actual new debt (not repayment)
        if (payload.type === 'debt') {
          payload.interestRate = data.interestRate || 0;
          payload.dueDate = data.dueDate || null;
        }
      }

      const res = await makeRequest({ url, method, data: payload });

      if (!res) throw new Error('No response from server');

      toast.success(`Transaction ${editTransection ? 'updated' : 'added'} successfully!`);

      const transactionData = res.data?.transaction || res.data?.data;
      if (editTransection) {
        dispatch(updateTransection(transactionData));
      } else {
        dispatch(addTransection(transactionData));
      }

      if (res.data?.updatedAccounts) {
        res.data.updatedAccounts.forEach((acc) => dispatch(updateAccount(acc)));
      }
      if (res.success) {
        toast.success(editTransection ? 'Updated successfully!' : 'Transaction saved!');

        // Dispatch events for global UI updates
        window.dispatchEvent(new CustomEvent('refetch-system-metrics'));

        reset({
          type: data.type,
          date: new Date(),
          amount: '',
          account: data.account,
          description: '',
          category: '',
          toaccount: '',
          debttype: '',
          partyId: '',
          dueDate: null,
          interestRate: '',
        });
        if (onSuccess) onSuccess(res.data.data || res.data);
        setOpen(false);
      } else {
        toast.error(res.data.message || 'Action failed');
      }
    } catch (error) {
      toast.error(
        `Failed to ${editTransection ? 'update' : 'save'} transaction: ` +
          (error?.response?.data?.message || error?.message || ''),
      );
    }
  };

  const handleClose = () => setOpen(false);

  if (!open) return null;

  /* ── Active tab glow colour ─────── */
  const activeTabColor = TAB_CONFIG[transactionType]?.activeColor || 'var(--accent)';

  return (
    <>
      {/* ── Overlay ── */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* ── Modal ── */}
        <div
          style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border2)',
            borderRadius: 'var(--r4)',
            padding: '28px',
            width: '100%',
            maxWidth: '540px',
            position: 'relative',
            maxHeight: '90vh',
            overflowY: 'auto',
            animation: 'txnModalIn 0.2s ease',
          }}
        >
          {/* ── Close Button ── */}
          <button
            onClick={handleClose}
            type="button"
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'var(--bg4)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              color: 'var(--text2)',
              lineHeight: 1,
            }}
          >
            ✕
          </button>

          {/* ── Header ── */}
          <div style={{ marginBottom: '4px', paddingRight: '40px' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--text)' }}>
              {editTransection ? 'Edit Transaction' : 'Smart Transaction'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>
              Input data precisely to update ledgers.
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* ── Type Tabs ── */}
            <div
              style={{
                display: 'flex',
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r)',
                padding: '3px',
                margin: '20px 0',
                gap: '2px',
              }}
            >
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
                      if (type === 'debt') setValue('debttype', 'repay');
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      textAlign: 'center',
                      borderRadius: 'var(--r2)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      transition: 'all .15s',
                      background: isActive ? 'var(--bg2)' : 'transparent',
                      color: isActive ? cfg.activeColor : 'var(--text2)',
                      boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                      fontFamily: 'var(--font)',
                    }}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>

            {/* ── Amount Input ── */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px',
                background: 'var(--bg3)',
                border: errors.amount ? '1px solid var(--red)' : '1px solid var(--border2)',
                borderRadius: 'var(--r)',
                marginBottom: '14px',
                transition: 'all 0.2s ease',
                boxShadow: errors.amount ? '0 0 0 1px var(--red-bg)' : 'none',
              }}
            >
              <span
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: errors.amount ? 'var(--red)' : 'var(--text3)',
                  fontFamily: 'var(--mono)',
                  flexShrink: 0,
                }}
              >
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
                onKeyDown={(e) => {
                  if (e.key === '.' && e.currentTarget.value.includes('.')) e.preventDefault();
                  if (
                    !/[0-9.]/.test(e.key) &&
                    !['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete', 'Tab', 'Enter'].includes(e.key)
                  ) {
                    e.preventDefault();
                  }
                }}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '28px',
                  fontWeight: 700,
                  fontFamily: 'var(--mono)',
                  color: 'var(--text)',
                  letterSpacing: '-0.5px',
                  width: '100%',
                }}
              />
            </div>
            {errors.amount && (
              <p className="error-msg" style={{ marginBottom: '10px', marginLeft: '2px' }}>
                {errors.amount.message}
              </p>
            )}

            {/* ── Row 1: Process Date + Category / Liable Party ── */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px',
                marginBottom: '14px',
              }}
            >
              {/* Process Date */}
              <div>
                <label style={labelStyle}>Process Date</label>
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
                            'justify-start text-left font-normal h-auto py-[10px] px-[12px]',
                            !field.value && 'text-muted-foreground',
                          )}
                          style={{
                            width: '100%',
                            background: 'var(--bg3)',
                            border: errors.date ? '1px solid var(--red)' : '1px solid var(--border2)',
                            borderRadius: 'var(--r2)',
                            color: field.value ? 'var(--text)' : 'var(--text2)',
                            fontFamily: 'var(--font)',
                            fontSize: '13px',
                          }}
                        >
                          <span className="material-symbols-outlined mr-2 !text-[16px] opacity-70">calendar_today</span>
                          {field.value instanceof Date && !isNaN(field.value) ? format(field.value, 'dd MMM yyyy') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
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
                {errors.date && <p className="error-msg">{errors.date.message}</p>}
              </div>

              {/* Category (Expense / Income / Transfer) OR Liable Party (Debt) */}
              {transactionType === 'debt' ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>Liable Party</label>
                    <button
                      type="button"
                      onClick={() => setIsAddPartyOpen(true)}
                      style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)' }}
                    >
                      + New
                    </button>
                  </div>
                  <select
                    {...register('partyId')}
                    style={{
                      ...inputStyle,
                      border: errors.partyId ? '1px solid var(--red)' : '1px solid var(--border2)',
                    }}
                  >
                    <option value="" disabled>Select Party</option>
                    {filteredParties && filteredParties.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.relation})
                      </option>
                    ))}
                  </select>
                  {errors.partyId && <p className="error-msg">{errors.partyId.message}</p>}
                </div>
              ) : ['expense', 'income', 'transfer'].includes(transactionType) ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>
                      Classification{' '}
                      {['expense', 'income'].includes(transactionType) && (
                        <span style={{ color: 'var(--red)' }}>*</span>
                      )}
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddCategoryOpen(true)}
                      style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)' }}
                    >
                      + New
                    </button>
                  </div>
                  <select
                    {...register('category')}
                    style={{
                      ...inputStyle,
                      border: errors.category ? '1px solid var(--red)' : '1px solid var(--border2)',
                    }}
                  >
                    <option value="" disabled>Select category…</option>
                    {filteredCategories && filteredCategories.map((c) => (
                      <option key={c._id || c.id} value={c._id || c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && <p className="error-msg">{errors.category.message}</p>}
                </div>
              ) : (
                <div />
              )}
            </div>

            {/* ── Row 2: Source Account + Target Account / Select Loan to Settle ── */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px',
                marginBottom: '14px',
              }}
            >
              {/* Source Account */}
              <div>
                <label style={labelStyle}>
                  Source Account{' '}
                  {selectedAccount && (
                    <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '10px', textTransform: 'none', letterSpacing: 0 }}>
                      Bal: {formatAmount(accountBalance, currency)}
                    </span>
                  )}
                </label>
                <select
                  {...register('account')}
                  style={{
                    ...inputStyle,
                    border: errors.account ? '1px solid var(--red)' : '1px solid var(--border2)',
                  }}
                >
                  <option value="" disabled>Select account</option>
                  {activeAccounts.map((a) => (
                    <option key={a._id || a.id} value={a._id || a.id}>
                      {a.name}{a.isDefault ? ' ★' : ''}
                    </option>
                  ))}
                </select>
                {errors.account && <p className="error-msg">{errors.account.message}</p>}
              </div>

              {/* Target Account (Transfer) OR Select Loan to Settle (Debt repay) */}
              {transactionType === 'transfer' ? (
                <div>
                  <label style={labelStyle}>Target Account</label>
                  <select
                    {...register('toaccount')}
                    disabled={!isTransfer}
                    style={{
                      ...inputStyle,
                      border: errors.toaccount ? '1px solid var(--red)' : '1px solid var(--border2)',
                    }}
                  >
                    <option value="" disabled>Select account</option>
                    {targetAccountOptions.map((a) => (
                      <option key={a._id || a.id} value={a._id || a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                  {errors.toaccount && <p className="error-msg">{errors.toaccount.message}</p>}
                </div>
              ) : isRepayment ? (
                <div>
                  <label style={labelStyle}>Select Loan to Settle</label>
                  <select
                    {...register('loanId')}
                    onChange={(e) => {
                      const loan = activeLoans.find((l) => l._id === e.target.value);
                      if (loan) {
                        setValue('amount', loan.amount);
                        setValue('description', `Repayment of ${loan.type === 'LENT' ? 'receivable' : 'payable'} from ${loan.party?.name}`);
                      }
                    }}
                    style={{
                      ...inputStyle,
                      border: errors.loanId ? '1px solid var(--red)' : '1px solid rgba(91,141,239,0.25)',
                    }}
                  >
                    <option value="">Choose a pending loan</option>
                    {activeLoans.map((l) => (
                      <option key={l._id} value={l._id}>
                        {l.type === 'LENT' ? 'Repay to me' : 'Repay by me'}:{' '}
                        {formatAmount(l.amount, currency)} ({new Date(l.createdAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                  {errors.loanId && <p className="error-msg">{errors.loanId.message}</p>}
                  {activeLoans.length === 0 && selectedPartyId && (
                    <p style={{ fontSize: '10px', color: 'var(--red)', marginTop: '4px', fontWeight: 700 }}>
                      No active loans found for this party.
                    </p>
                  )}
                </div>
              ) : (
                <div />
              )}
            </div>

            {/* ── Debt Extra Fields: Due Date + Interest (new loan only) ── */}
            {transactionType === 'debt' && !isRepayment && (
              <div
                style={{
                  background: 'var(--bg3)',
                  border: '1px solid var(--border2)',
                  borderRadius: 'var(--r)',
                  padding: '16px',
                  marginBottom: '14px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {isRestrictedEdit && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(8,11,18,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>Editing Take/Give debt is restricted.</p>
                      <p style={{ fontSize: '11px', color: 'var(--text2)' }}>You can only edit repayment transactions here.</p>
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {/* Due Date */}
                  <div>
                    <label style={labelStyle}>Due Date (Deadline)</label>
                    <Controller
                      name="dueDate"
                      control={control}
                      render={({ field }) => (
                        <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(
                                'justify-start text-left font-normal h-auto py-[10px] px-[12px]',
                                !field.value && 'text-muted-foreground',
                              )}
                              style={{
                                width: '100%',
                                background: 'var(--bg3)',
                                border: errors.dueDate ? '1px solid var(--red)' : '1px solid var(--border2)',
                                borderRadius: 'var(--r2)',
                                color: field.value ? 'var(--text)' : 'var(--text2)',
                                fontFamily: 'var(--font)',
                                fontSize: '13px',
                              }}
                            >
                              <span className="material-symbols-outlined mr-2 !text-[16px] opacity-70">event</span>
                              {field.value instanceof Date && !isNaN(field.value) ? format(field.value, 'dd MMM yyyy') : 'Set Deadline'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(date) => {
                                if (date) {
                                  field.onChange(date);
                                  setDueDateOpen(false);
                                }
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                    {errors.dueDate && <p className="error-msg">{errors.dueDate.message}</p>}
                  </div>

                  {/* Interest Rate */}
                  <div>
                    <label style={labelStyle}>Interest Rate (%)</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        {...register('interestRate')}
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        style={{ ...inputStyle, paddingRight: '32px' }}
                      />
                      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: '13px', fontWeight: 700 }}>
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Internal Reference (description) ── */}
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Internal Reference</label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Describe the purpose of this transaction…"
                style={{
                  ...inputStyle,
                  border: errors.description ? '1px solid var(--red)' : '1px solid var(--border2)',
                  resize: 'none',
                  lineHeight: 1.5,
                }}
              />
              {errors.description && <p className="error-msg">{errors.description.message}</p>}
            </div>

            {/* ── Actions ── */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  padding: '9px 18px',
                  background: 'transparent',
                  border: '1px solid var(--border2)',
                  borderRadius: 'var(--r2)',
                  color: 'var(--text2)',
                  fontFamily: 'var(--font)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '9px 24px',
                  background: loading ? 'var(--bg4)' : 'var(--accent)',
                  border: 'none',
                  borderRadius: 'var(--r2)',
                  color: '#fff',
                  fontFamily: 'var(--font)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  minWidth: '148px',
                  opacity: loading ? 0.6 : 1,
                  transition: 'all .15s',
                }}
              >
                {loading
                  ? 'Processing…'
                  : editTransection
                  ? 'Update Entry'
                  : 'Save Transaction'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Sub-popups ── */}
      <AddCategoryPopup
        open={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        onSave={(id) => {
          setIsAddCategoryOpen(false);
          setValue('category', id);
        }}
        defaultType={transactionType?.toUpperCase() || 'EXPENSE'}
      />

      {isAddPartyOpen && (
        <AddPartyPopup
          open={isAddPartyOpen}
          onClose={() => setIsAddPartyOpen(false)}
          onSave={(party) => {
            setParties((prev) => [party, ...prev]);
            setValue('partyId', party._id);
            setIsAddPartyOpen(false);
          }}
        />
      )}

      <style>{`
        @keyframes txnModalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </>
  );
};

/* ── Shared inline styles ── */
const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--text3)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '6px',
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  background: 'var(--bg3)',
  border: '1px solid var(--border2)',
  borderRadius: 'var(--r2)',
  color: 'var(--text)',
  fontFamily: 'var(--font)',
  fontSize: '13px',
  outline: 'none',
};

export default TransactionPopup;
