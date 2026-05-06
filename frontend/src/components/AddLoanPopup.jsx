import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import { z } from 'zod';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  CircleDollarSign, 
  User, 
  Wallet, 
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  X
} from 'lucide-react';
import { restrictDecimals } from '@/utils/format';
import { updateAccount } from '@/redux/accountSlice';
import {
  addLoan,
  updateLoan as updateLoanAction,
} from '@/redux/loanSlice';
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
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ── Validation Schema ─────────────────────────────────────────────────────────
const loanSchema = z.object({
  type: z.enum(['LENT', 'BORROWED']),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  party: z.string().min(1, 'Party is required'),
  accountId: z.string().min(1, 'Account is required'),
  date: z.date({ required_error: 'Date is required' }),
});

const TAB_CONFIG = {
  LENT: {
    label: '💸 Money Lent',
    activeColor: 'var(--green)',
    bg: 'var(--green-bg)',
    border: 'var(--green-border)',
    glow: 'rgba(34,197,94,0.18)',
    icon: <ArrowUpRight className="w-3 h-3" />,
  },
  BORROWED: {
    label: '🤝 Money Borrowed',
    activeColor: 'var(--red)',
    bg: 'var(--red-bg)',
    border: 'var(--red-border)',
    glow: 'rgba(239,68,68,0.18)',
    icon: <ArrowDownLeft className="w-3 h-3" />,
  },
};

const TAB_KEYS = Object.keys(TAB_CONFIG);

export default function AddLoanPopup({
  open,
  setOpen,
  onSaved,
  editLoan = null,
}) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const dispatch = useDispatch();
  const { accounts = [] } = useSelector((state) => state.accounts);
  const { loans = [] } = useSelector((state) => state.loans);
  const { user } = useSelector((state) => state.auth);
  const userObj = user?.user || user;
  const isPro = userObj?.role === 'admin' || userObj?.plan === 'pro';

  const preferences = useSelector(
    (state) => state.auth.user?.user?.preferences,
  );
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
  const partyId = watch('party');

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
    // Plan limit check: 5 active parties for basic users
    if (!isPro && !editLoan) {
      const pendingLoans = loans.filter((l) => !l.status || l.status === 'PENDING');
      const activePartyIds = new Set(pendingLoans.map(l => l.party?._id || l.party).filter(id => id));
      
      // If adding a loan for a party that isn't already active, check the limit
      if (!activePartyIds.has(data.party) && activePartyIds.size >= 5) {
        toast.error('Basic plan limit reached (5 active parties). Upgrade to PRO to add more parties.');
        return;
      }
    }

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
        err?.response?.data?.message ||
          `Failed to ${editLoan ? 'update' : 'record'} commitment`,
      );
    } finally {
      setLoading(false);
    }
  };

  const activeTabConfig = TAB_CONFIG[loanType];

  const FormContent = (
    <form id="add-loan-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Premium Sliding Tabs */}
      <div 
        className="relative flex p-1 bg-[var(--bg3)] rounded-2xl gap-1 overflow-hidden transition-all duration-500"
        style={{
          border: `1.5px solid ${activeTabConfig.border}`,
        }}
      >
        <div 
          className="absolute inset-y-1 rounded-xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-lg"
          style={{
            left: `calc(${(TAB_KEYS.indexOf(loanType) / TAB_KEYS.length) * 100}% + 4px)`,
            width: `calc(${100 / TAB_KEYS.length}% - 8px)`,
            backgroundColor: activeTabConfig.bg,
            border: `1.5px solid ${activeTabConfig.border}`,
            boxShadow: `0 0 16px 2px ${activeTabConfig.glow}`,
          }}
        />
        {TAB_KEYS.map((key) => {
          const isActive = loanType === key;
          const cfg = TAB_CONFIG[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => setValue('type', key)}
              className={cn(
                "relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] md:text-[11px] font-bold uppercase tracking-wider transition-all duration-300",
                isActive ? "" : "text-[var(--text3)] hover:text-[var(--text)]"
              )}
              style={{ 
                color: isActive ? cfg.activeColor : undefined,
                textShadow: isActive ? `0 0 12px ${cfg.glow}` : 'none',
              }}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-5">
        {/* Amount Section */}
        <div className="space-y-2">
          <Label htmlFor="amount" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text3)] ml-1">Principal Amount</Label>
          <div className={cn(
            "flex items-center gap-3 p-4 bg-[var(--bg3)] border rounded-2xl transition-all group focus-within:ring-2 focus-within:ring-[var(--accent)]/20 focus-within:border-[var(--accent)]/40",
            errors.amount ? "border-red-500/50" : "border-[var(--border)]"
          )}>
            <span className="text-2xl md:text-3xl font-extrabold text-[var(--accent)]">₹</span>
            <Input
              id="amount"
              {...register('amount')}
              onInput={(e) => {
                e.target.value = restrictDecimals(e.target.value, decimalPlaces);
              }}
              type="number"
              step={1 / Math.pow(10, decimalPlaces)}
              className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 text-2xl md:text-3xl font-black text-[var(--text)] placeholder:text-[var(--text3)]/20 w-full tracking-tight p-0 h-auto"
              placeholder={`0.${'0'.repeat(decimalPlaces)}`}
            />
          </div>
          {errors.amount && <p className="text-[11px] font-medium text-red-500 mt-1 ml-1">{errors.amount.message}</p>}
        </div>

        {/* Counterparty & Account Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <Label htmlFor="party" className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text3)]">Counterparty</Label>
              <button
                type="button"
                onClick={() => setIsAddPartyOpen(true)}
                className="text-[10px] text-[var(--accent)] font-black hover:underline uppercase tracking-wider"
              >
                + New
              </button>
            </div>
            <Select 
              onValueChange={(val) => setValue('party', val)} 
              value={partyId}
            >
              <SelectTrigger className={cn(
                "h-12 bg-[var(--bg3)] border-[var(--border)] rounded-xl text-sm font-semibold",
                errors.party && "border-red-500/50"
              )}>
                <SelectValue placeholder="Select party" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-[var(--border)] bg-[var(--bg-popup)] z-[5000]">
                {parties.map((p) => (
                  <SelectItem key={p._id} value={p._id} className="rounded-lg focus:bg-[var(--bg3)]">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.party && <p className="text-[11px] font-medium text-red-500 mt-1 ml-1">{errors.party.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <Label htmlFor="accountId" className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text3)]">
                {loanType === 'LENT' ? 'From' : 'To'} Account
              </Label>
              {selectedAccount && (
                <span className="text-[10px] text-[var(--accent)] font-bold tracking-tight">
                  Bal: ₹{selectedAccount.balance.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <Select 
              onValueChange={(val) => setValue('accountId', val)} 
              value={accountId}
            >
              <SelectTrigger className={cn(
                "h-12 bg-[var(--bg3)] border-[var(--border)] rounded-xl text-sm font-semibold",
                errors.accountId && "border-red-500/50"
              )}>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-[var(--border)] bg-[var(--bg-popup)] z-[5000]">
                {accounts.map((a) => (
                  <SelectItem key={a._id} value={a._id} className="rounded-lg focus:bg-[var(--bg3)]">
                    <div className="flex items-center justify-between w-full min-w-[200px]">
                      <span className="font-medium">{a.name}</span>
                      <span className="text-[10px] opacity-40 ml-2">₹{a.balance.toLocaleString('en-IN')}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.accountId && <p className="text-[11px] font-medium text-red-500 mt-1 ml-1">{errors.accountId.message}</p>}
          </div>
        </div>

        {/* Date Section */}
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text3)] ml-1">
            {loanType === 'LENT' ? 'Date Lent' : 'Date Borrowed'}
          </Label>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full h-12 justify-start text-left font-semibold px-4 bg-[var(--bg3)] border-[var(--border)] rounded-xl hover:bg-[var(--bg4)] transition-all text-sm group',
                  !date && 'text-[var(--text3)]/40',
                  errors.date && 'border-red-500/50'
                )}
              >
                <CalendarIcon className="mr-3 w-[18px] h-[18px] text-[var(--accent)] group-hover:scale-110 transition-transform" />
                {date ? format(date, 'dd MMM yyyy') : <span>Select date...</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-[var(--border)] bg-[var(--bg-popup)] rounded-2xl shadow-2xl z-[5000]" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => {
                  if (d) {
                    setValue('date', d);
                    setIsCalendarOpen(false);
                  }
                }}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          {errors.date && <p className="text-[11px] font-medium text-red-500 mt-1 ml-1">{errors.date.message}</p>}
        </div>
      </div>
    </form>
  );

  const ActionButtons = (
    <div className="flex flex-col md:flex-row gap-3 w-full">
      <Button 
        variant="ghost" 
        onClick={() => setOpen(false)} 
        disabled={loading}
        className="flex-1 h-12 text-[10px] uppercase font-bold tracking-widest bg-[var(--bg3)] border-[var(--border)] rounded-2xl order-2 md:order-1"
      >
        Cancel
      </Button>
      <Button 
        type="submit" 
        form="add-loan-form"
        disabled={loading}
        className={cn(
          "flex-[2] h-12 text-[10px] uppercase tracking-widest font-black text-white order-1 md:order-2 rounded-2xl transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] shadow-lg",
          loanType === 'LENT' 
            ? "bg-gradient-to-r from-[var(--green)] to-[var(--green-border)] shadow-[var(--green)]/20" 
            : "bg-gradient-to-r from-[var(--red)] to-[var(--red-border)] shadow-[var(--red)]/20"
        )}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="animate-spin w-4 h-4" />
            Processing...
          </span>
        ) : (
          <>{editLoan ? 'Update' : 'Save'} Commitment</>
        )}
      </Button>
    </div>
  );

  if (isDesktop) {
    return (
      <>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-[var(--bg-popup)] border-[var(--border)] rounded-[2.5rem] shadow-2xl">
            <div className="px-8 pt-8 pb-4">
              <DialogHeader className="mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--accent-glow)] flex items-center justify-center shadow-inner border border-[var(--accent)]/10">
                    <CircleDollarSign className="w-6 h-6 text-[var(--accent)]" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-black tracking-tight">{editLoan ? 'Update' : 'Record'} Commitment</DialogTitle>
                    <DialogDescription className="text-xs font-bold text-[var(--text3)] uppercase tracking-widest">
                      Personal debt & settlement tracking
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="py-2">
                {FormContent}
              </div>
              <div className="mt-8 pb-4">
                {ActionButtons}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {isAddPartyOpen && (
          <AddPartyPopup
            open={isAddPartyOpen}
            onClose={() => setIsAddPartyOpen(false)}
            onSave={(newParty) => {
              setParties((prev) => [...prev, newParty]);
              setValue('party', newParty._id);
              setIsAddPartyOpen(false);
            }}
            partyCount={parties.length}
          />
        )}
      </>
    );
  }

  return (
    <>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="bg-[var(--bg-popup)] border-[var(--border)] rounded-t-[2.5rem]">
          <div className="mx-auto w-12 h-1.5 bg-[var(--bg3)] rounded-full mt-3 mb-2" />
          <DrawerHeader className="text-left px-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent-glow)] flex items-center justify-center border border-[var(--accent)]/10">
                <CircleDollarSign className="w-6 h-6 text-[var(--accent)]" />
              </div>
              <div>
                <DrawerTitle className="text-2xl font-black tracking-tight">{editLoan ? 'Update' : 'Record'} Commitment</DrawerTitle>
                <DrawerDescription className="text-xs font-bold text-[var(--text3)] uppercase tracking-widest">
                  Personal debt tracking
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>
          <div className="px-6 py-4 overflow-y-auto max-h-[70vh]">
            {FormContent}
          </div>
          <DrawerFooter className="px-6 pt-4 pb-8 border-t border-[var(--border)] mt-4">
            {ActionButtons}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {isAddPartyOpen && (
        <AddPartyPopup
          open={isAddPartyOpen}
          onClose={() => setIsAddPartyOpen(false)}
          onSave={(newParty) => {
            setParties((prev) => [...prev, newParty]);
            setValue('party', newParty._id);
            setIsAddPartyOpen(false);
          }}
          partyCount={parties.length}
        />
      )}
    </>
  );
}
