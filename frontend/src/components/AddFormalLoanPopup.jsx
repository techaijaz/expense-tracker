import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import { z } from 'zod';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { restrictDecimals, formatAmount } from '@/utils/format';
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

// ── Validation Schema ─────────────────────────────────────────────────────────
const formalLoanSchema = z.object({
  bankName: z.string().min(1, 'Lender/Bank name is required'),
  loanType: z.enum([
    'HOME',
    'CAR',
    'PERSONAL',
    'EDUCATION',
    'BUSINESS',
    'OTHER',
  ]),
  principal: z.coerce.number().positive('Principal must be greater than 0'),
  interestRate: z.coerce.number().min(0, 'Interest rate cannot be negative'),
  tenureMonths: z.coerce
    .number()
    .int()
    .positive('Tenure must be at least 1 month'),
  startDate: z.date({ required_error: 'Start date is required' }),
  associatedAccountId: z.string().optional(),
});

export default function AddFormalLoanPopup({ open, setOpen, onSaved }) {
  const dispatch = useDispatch();
  const { accounts = [] } = useSelector((state) => state.accounts);
  const preferences = useSelector(
    (state) => state.auth.user?.user?.preferences,
  );
  const { currency = 'INR', decimalPlaces = 2 } = preferences || {};

  const [loading, setLoading] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(formalLoanSchema),
    defaultValues: {
      bankName: '',
      loanType: 'PERSONAL',
      principal: '',
      interestRate: '',
      tenureMonths: '',
      startDate: new Date(),
      associatedAccountId: '',
    },
  });

  const principal = watch('principal');
  const rate = watch('interestRate');
  const tenure = watch('tenureMonths');
  const startDate = watch('startDate');

  // Real-time EMI Calculation
  const calculation = useMemo(() => {
    const P = parseFloat(principal) || 0;
    const R = (parseFloat(rate) || 0) / (12 * 100);
    const N = parseInt(tenure) || 0;

    if (P <= 0 || N <= 0) return { emi: 0, totalPayable: 0, totalInterest: 0 };

    let emi = 0;
    if (R === 0) {
      emi = P / N;
    } else {
      emi = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
    }

    const totalPayable = emi * N;
    const totalInterest = totalPayable - P;

    return {
      emi: Math.round(emi * 100) / 100,
      totalPayable: Math.round(totalPayable * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
    };
  }, [principal, rate, tenure]);

  useEffect(() => {
    if (open) {
      reset({
        bankName: '',
        loanType: 'PERSONAL',
        principal: '',
        interestRate: '',
        tenureMonths: '',
        startDate: new Date(),
        associatedAccountId: '',
      });
    }
  }, [open, reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // The backend expects emiAmount, totalRepayment, totalInterest which we calculate there too,
      // but we send the raw inputs.
      const res = await api.post('/formal-loans', data);
      toast.success('Formal loan added successfully!');
      if (onSaved) onSaved(res.data.data || res.data);
      setOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add formal loan');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div
        style={{ position: 'absolute', inset: 0 }}
        onClick={() => setOpen(false)}
      ></div>
      <div className="modal" style={{ zIndex: 11, maxWidth: '560px' }}>
        <div className="modal-close" onClick={() => setOpen(false)}>
          ✕
        </div>
        <div className="modal-title">Add Formal Loan</div>
        <div className="modal-sub">
          Calculate EMI and track your formal debt schedule.
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="modal-grid">
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Lender / Bank Name</label>
              <input
                {...register('bankName')}
                className="form-input"
                placeholder="e.g. HDFC Bank, SBI, ICICI"
              />
              {errors.bankName && (
                <p className="error-msg">{errors.bankName.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Loan Type</label>
              <select {...register('loanType')} className="form-input">
                <option value="PERSONAL">💼 Personal Loan</option>
                <option value="CAR">🚗 Car Loan</option>
                <option value="HOME">🏠 Home Loan</option>
                <option value="EDUCATION">🎓 Education Loan</option>
                <option value="BUSINESS">🏢 Business Loan</option>
                <option value="OTHER">📁 Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Principal Amount</label>
              <input
                {...register('principal')}
                type="number"
                className="form-input"
                placeholder="₹ 5,00,000"
              />
              {errors.principal && (
                <p className="error-msg">{errors.principal.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Interest Rate (Annual %)</label>
              <input
                {...register('interestRate')}
                type="number"
                step="0.01"
                className="form-input"
                placeholder="8.5"
              />
              {errors.interestRate && (
                <p className="error-msg">{errors.interestRate.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Tenure (Months)</label>
              <input
                {...register('tenureMonths')}
                type="number"
                className="form-input"
                placeholder="60"
              />
              {errors.tenureMonths && (
                <p className="error-msg">{errors.tenureMonths.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Start Date (First EMI)</label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'form-input',
                      'justify-start text-left font-normal border-none hover:bg-surface-container-high',
                      !startDate && 'text-muted-foreground',
                    )}
                    style={{
                      backgroundColor: 'var(--bg4)',
                      color: !startDate ? 'var(--text3)' : 'var(--text)',
                      height: '38px',
                    }}
                  >
                    <span
                      className="material-symbols-outlined text-lg mr-2"
                      style={{ fontSize: '16px' }}
                    >
                      event
                    </span>
                    {startDate ? (
                      format(startDate, 'PPP')
                    ) : (
                      <span>Select date…</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 z-[1000]"
                  align="start"
                  style={{
                    backgroundColor: 'var(--bg3)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(d) => {
                      setValue('startDate', d);
                      setIsCalendarOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.startDate && (
                <p className="error-msg">{errors.startDate.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Disbursement Account (Optional)
              </label>
              <select
                {...register('associatedAccountId')}
                className="form-input"
              >
                <option value="">No account (record-only)</option>
                {accounts.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r)',
              padding: '16px',
              margin: '20px 0',
            }}
          >
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
              Loan Summary
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text2)',
                    marginBottom: '4px',
                  }}
                >
                  Monthly EMI
                </div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--accent)',
                    fontFamily: 'var(--mono)',
                  }}
                >
                  {formatAmount(calculation.emi, currency, decimalPlaces)}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text2)',
                    marginBottom: '4px',
                  }}
                >
                  Total Interest
                </div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--amber)',
                    fontFamily: 'var(--mono)',
                  }}
                >
                  {formatAmount(
                    calculation.totalInterest,
                    currency,
                    decimalPlaces,
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text2)',
                    marginBottom: '4px',
                  }}
                >
                  Total Payable
                </div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--text)',
                    fontFamily: 'var(--mono)',
                  }}
                >
                  {formatAmount(
                    calculation.totalPayable,
                    currency,
                    decimalPlaces,
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-save"
              disabled={loading}
              style={{ padding: '10px 24px' }}
            >
              {loading ? 'Adding Loan...' : 'Create Loan Protocol →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
