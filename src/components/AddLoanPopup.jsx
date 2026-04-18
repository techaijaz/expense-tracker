import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import { z } from 'zod';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { restrictDecimals } from '@/utils/format';
import { updateAccount } from '@/redux/accountSlice';
import { addLoan, updateLoan as updateLoanAction } from '@/redux/loanSlice';
import api from '@/utils/httpMethods';
import AddPartyPopup from './AddPartyPopup';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/utils';

// ── Validation Schema ─────────────────────────────────────────────────────────
const loanSchema = z.object({
  type: z.enum(['LENT', 'BORROWED']),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  party: z.string().min(1, 'Party is required'),
  accountId: z.string().min(1, 'Account is required'),
  date: z.date({ required_error: 'Date is required' }),
});

export default function AddLoanPopup({ open, setOpen, onSaved, editLoan = null }) {
  const dispatch = useDispatch();
  const { accounts = [] } = useSelector((state) => state.accounts);
  const preferences = useSelector((state) => state.auth.user?.user?.preferences);
  const { decimalPlaces = 2 } = preferences || {};

  const [loading, setLoading] = useState(false);
  const [parties, setParties] = useState([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isAddPartyOpen, setIsAddPartyOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      type: 'LENT',
      amount: '',
      party: '',
      accountId: '',
      date: new Date(),
    },
  });

  const loanType = watch('type');
  const date = watch('date');
  const accountId = watch('accountId');
  const amount = watch('amount');

  const selectedAccount = accounts.find((a) => a._id === accountId);

  // Fetch parties on mount
  useEffect(() => {
    if (open) {
      const fetchParties = async () => {
        try {
          const res = await api.get('/parties');
          setParties(res.data.data || res.data || []);
        } catch (e) {
          console.error('Failed to fetch parties');
        }
      };
      fetchParties();
    }
  }, [open]);

  // Reset form when opening or changing editLoan
  useEffect(() => {
    if (open) {
      if (editLoan) {
        reset({
          type: editLoan.type,
          amount: editLoan.amount,
          party: editLoan.party?._id || editLoan.party,
          accountId: editLoan.accountId?._id || editLoan.accountId,
          date: new Date(editLoan.date),
        });
      } else {
        reset({
          type: 'LENT',
          amount: '',
          party: '',
          accountId: '',
          date: new Date(),
        });
      }
    }
  }, [open, reset, editLoan]);

  const onSubmit = async (data) => {
    // Balance validation for LENT
    if (data.type === 'LENT') {
      const account = accounts.find((a) => a._id === data.accountId);
      if (account && data.amount > account.balance) {
        toast.error(`Insufficient balance in ${account.name}`);
        return;
      }
    }

    setLoading(true);
    try {
      const url = editLoan ? `/loans/${editLoan._id}` : '/loans';
      const method = editLoan ? 'patch' : 'post';
      
      const res = await api[method](url, data);
      const { loan, updatedAccounts } = res.data;

      if (editLoan) {
        dispatch(updateLoanAction(loan));
      } else {
        dispatch(addLoan(loan));
      }

      if (updatedAccounts) {
        updatedAccounts.forEach((acc) => dispatch(updateAccount(acc)));
      }

      toast.success(editLoan ? 'Commitment updated!' : 'Commitment recorded!');
      if (onSaved) onSaved(loan);
      setOpen(false);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || `Failed to ${editLoan ? 'update' : 'record'} commitment`
      );
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
      {/* Click outside to close (optional background layer) */}
      <div style={{ position: 'absolute', inset: 0 }} onClick={() => setOpen(false)}></div>
      
      <div className="modal modal-sm" style={{ zIndex: 11 }}>
        <div className="modal-close" onClick={() => setOpen(false)}>✕</div>
        <div className="modal-title">{editLoan ? 'Update' : 'Record'} Commitment</div>
        <div className="modal-sub">
          {editLoan ? 'Modify existing lending/borrowing details.' : 'Track personal lending & borrowing.'}
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="modal-tabs">
            <div 
              className={`modal-tab ${loanType === 'LENT' ? 'active' : ''}`}
              style={{ color: loanType === 'LENT' ? 'var(--green)' : undefined }}
              onClick={() => setValue('type', 'LENT')}
            >
              💸 Money Lent
            </div>
            <div 
              className={`modal-tab ${loanType === 'BORROWED' ? 'active' : ''}`}
              style={{ color: loanType === 'BORROWED' ? 'var(--red)' : undefined }}
              onClick={() => setValue('type', 'BORROWED')}
            >
              💰 Money Borrowed
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Principal Amount</label>
            <input 
              {...register('amount')}
              onInput={(e) => {
                e.target.value = restrictDecimals(e.target.value, decimalPlaces);
              }}
              type="number"
              step={1 / Math.pow(10, decimalPlaces)}
              className="form-input" 
              placeholder={`₹ 0.${'0'.repeat(decimalPlaces)}`}
            />
            {errors.amount && <p style={{ color: 'var(--red)', fontSize: '11px', marginTop: '4px' }}>{errors.amount.message}</p>}
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Counterparty</label>
              <button 
                type="button" 
                onClick={() => setIsAddPartyOpen(true)}
                style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                + New
              </button>
            </div>
            <select {...register('party')} className="form-input">
              <option value="" disabled>Select counterparty</option>
              {parties.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
            {errors.party && <p style={{ color: 'var(--red)', fontSize: '11px', marginTop: '4px' }}>{errors.party.message}</p>}
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">
                {loanType === 'LENT' ? 'Funding Account' : 'Deposit Account'}
              </label>
              {selectedAccount && (
                <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
                  Balance: ₹ {selectedAccount.balance.toLocaleString('en-IN', { minimumFractionDigits: decimalPlaces })}
                </span>
              )}
            </div>
            <select {...register('accountId')} className="form-input">
              <option value="" disabled>Select account</option>
              {accounts.map((a) => (
                <option key={a._id} value={a._id}>{a.name}</option>
              ))}
            </select>
            {errors.accountId && <p style={{ color: 'var(--red)', fontSize: '11px', marginTop: '4px' }}>{errors.accountId.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">
              {loanType === 'LENT' ? 'Date Lent' : 'Date Borrowed'}
            </label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'form-input',
                    'justify-start text-left font-normal border-none hover:bg-surface-container-high',
                    !date && 'text-muted-foreground'
                  )}
                  style={{
                    backgroundColor: 'var(--bg4)', 
                    color: !date ? 'var(--text3)' : 'var(--text)'
                  }}
                >
                  <span className="material-symbols-outlined text-lg mr-2" style={{ fontSize: '16px' }}>event</span>
                  {date ? format(date, 'PPP') : <span>Select date…</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[100]" align="start" style={{ backgroundColor: 'var(--bg3)', border: '1px solid var(--border)', zIndex: 9999 }}>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    setValue('date', d);
                    setIsCalendarOpen(false);
                  }}
                  initialFocus
                  style={{ color: 'var(--text)' }}
                />
              </PopoverContent>
            </Popover>
            {errors.date && <p style={{ color: 'var(--red)', fontSize: '11px', marginTop: '4px' }}>{errors.date.message}</p>}
          </div>


          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={() => setOpen(false)}>Cancel</button>
            <button 
              type="submit" 
              className="btn-save" 
              style={{ background: loanType === 'LENT' ? 'var(--green)' : 'var(--red)' }}
              disabled={loading}
            >
              {loading ? 'Processing...' : editLoan ? 'Update Commitment' : 'Record Commitment'}
            </button>
          </div>
        </form>
      </div>

      {isAddPartyOpen && (
        <AddPartyPopup 
          onClose={() => setIsAddPartyOpen(false)}
          onSave={(newParty) => {
            setParties(prev => [...prev, newParty]);
            setValue('party', newParty._id);
            setIsAddPartyOpen(false);
          }}
        />
      )}
    </div>
  );
}
