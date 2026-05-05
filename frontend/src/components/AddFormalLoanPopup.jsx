import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import { z } from 'zod';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  Landmark, 
  Calendar as CalendarIcon, 
  Clock, 
  Calculator, 
  Loader2, 
  Building2,
  ChevronRight,
  Info
} from 'lucide-react';
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
  const isDesktop = useMediaQuery('(min-width: 768px)');
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
  const loanType = watch('loanType');
  const associatedAccountId = watch('associatedAccountId');

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
      const res = await api.post('/formal-loans', data);
      toast.success('Formal loan protocol initiated!');
      if (onSaved) onSaved(res.data.data || res.data);
      setOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add formal loan');
    } finally {
      setLoading(false);
    }
  };

  const FormContent = (
    <form id="add-formal-loan-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
        {/* Bank Name */}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="bankName" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Lender / Bank Name</Label>
          <div className="relative group">
            <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-[var(--accent)] transition-colors" />
            <Input
              id="bankName"
              {...register('bankName')}
              placeholder="e.g. HDFC Bank, SBI, ICICI"
              className="pl-11 h-12 bg-[var(--bg3)] border-[var(--border)] rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[var(--accent)]/20 transition-all placeholder:text-muted-foreground/30"
            />
          </div>
          {errors.bankName && <p className="text-[10px] font-semibold text-destructive ml-1">{errors.bankName.message}</p>}
        </div>

        {/* Loan Type */}
        <div className="space-y-2">
          <Label htmlFor="loanType" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Loan Category</Label>
          <Select 
            onValueChange={(val) => setValue('loanType', val)} 
            value={loanType}
          >
            <SelectTrigger className="h-12 bg-[var(--bg3)] border-[var(--border)] rounded-xl text-sm font-semibold">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[var(--border)] bg-[var(--bg-popup)]">
              <SelectItem value="PERSONAL" className="rounded-lg">💼 Personal Loan</SelectItem>
              <SelectItem value="CAR" className="rounded-lg">🚗 Car Loan</SelectItem>
              <SelectItem value="HOME" className="rounded-lg">🏠 Home Loan</SelectItem>
              <SelectItem value="EDUCATION" className="rounded-lg">🎓 Education Loan</SelectItem>
              <SelectItem value="BUSINESS" className="rounded-lg">🏢 Business Loan</SelectItem>
              <SelectItem value="OTHER" className="rounded-lg">📁 Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Start Date */}
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Start Date</Label>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full h-12 justify-start text-left font-semibold bg-[var(--bg3)] border-[var(--border)] rounded-xl hover:bg-[var(--bg4)] transition-all text-sm group',
                  !startDate && 'text-muted-foreground/40',
                )}
              >
                <CalendarIcon className="mr-3 w-4 h-4 text-[var(--accent)] group-hover:scale-110 transition-transform" />
                {startDate ? format(startDate, 'dd MMM yyyy') : <span>Select date...</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-[var(--border)] bg-[var(--bg-popup)] rounded-2xl shadow-2xl" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(d) => {
                  if (d) {
                    setValue('startDate', d);
                    setIsCalendarOpen(false);
                  }
                }}
                initialFocus
                className="p-3"
              />
            </PopoverContent>
          </Popover>
          {errors.startDate && <p className="text-[10px] font-semibold text-destructive ml-1">{errors.startDate.message}</p>}
        </div>

        {/* Principal */}
        <div className="space-y-2">
          <Label htmlFor="principal" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Principal Amount</Label>
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--accent)] font-black text-lg">₹</span>
            <Input
              id="principal"
              {...register('principal')}
              type="number"
              className="pl-8 h-12 bg-[var(--bg3)] border-[var(--border)] rounded-xl text-lg font-black focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
              placeholder="0.00"
            />
          </div>
          {errors.principal && <p className="text-[10px] font-semibold text-destructive ml-1">{errors.principal.message}</p>}
        </div>

        {/* Interest Rate */}
        <div className="space-y-2">
          <Label htmlFor="interestRate" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Interest Rate (% p.a.)</Label>
          <div className="relative group">
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">%</span>
            <Input
              id="interestRate"
              {...register('interestRate')}
              type="number"
              step="0.01"
              className="h-12 bg-[var(--bg3)] border-[var(--border)] rounded-xl text-lg font-black pr-10 focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
              placeholder="8.5"
            />
          </div>
          {errors.interestRate && <p className="text-[10px] font-semibold text-destructive ml-1">{errors.interestRate.message}</p>}
        </div>

        {/* Tenure */}
        <div className="space-y-2">
          <Label htmlFor="tenureMonths" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Tenure (Months)</Label>
          <div className="relative group">
            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-[var(--accent)] transition-colors" />
            <Input
              id="tenureMonths"
              {...register('tenureMonths')}
              type="number"
              className="pl-11 h-12 bg-[var(--bg3)] border-[var(--border)] rounded-xl text-lg font-black focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
              placeholder="60"
            />
          </div>
          {errors.tenureMonths && <p className="text-[10px] font-semibold text-destructive ml-1">{errors.tenureMonths.message}</p>}
        </div>

        {/* Associated Account */}
        <div className="space-y-2">
          <Label htmlFor="associatedAccountId" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Disbursement Account</Label>
          <Select 
            onValueChange={(val) => setValue('associatedAccountId', val)} 
            value={associatedAccountId}
          >
            <SelectTrigger className="h-12 bg-[var(--bg3)] border-[var(--border)] rounded-xl text-sm font-semibold">
              <SelectValue placeholder="No account (record-only)" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[var(--border)] bg-[var(--bg-popup)]">
              <SelectItem value="none" className="rounded-lg italic">None (Record Only)</SelectItem>
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
        </div>
      </div>

      {/* Summary Card - Refined */}
      <div className="bg-gradient-to-br from-[var(--bg3)] to-[var(--bg2)] rounded-[24px] p-6 border border-[var(--border)] shadow-sm space-y-5 animate-in fade-in slide-in-from-top-2 duration-700 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-[var(--accent)]/10 transition-colors duration-500" />
        
        <div className="flex items-center gap-2.5 relative">
          <div className="w-8 h-8 rounded-full bg-[var(--accent-glow)] flex items-center justify-center border border-[var(--accent)]/10">
            <Calculator className="text-[var(--accent)] w-4 h-4" />
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text)] flex items-center gap-2">
            Amortization Preview
            <Info className="w-3 h-3 text-muted-foreground/40" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
          <div className="space-y-1.5">
            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">Monthly EMI</div>
            <div className="text-2xl font-black text-[var(--accent)] tracking-tighter">
              {formatAmount(calculation.emi, currency, decimalPlaces)}
            </div>
          </div>
          <div className="space-y-1.5 sm:border-x sm:px-6 border-[var(--border)]">
            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">Total Interest</div>
            <div className="text-2xl font-black text-[var(--amber)] tracking-tighter">
              {formatAmount(calculation.totalInterest, currency, decimalPlaces)}
            </div>
          </div>
          <div className="space-y-1.5 sm:text-right">
            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">Total Payable</div>
            <div className="text-2xl font-black text-[var(--text)] tracking-tighter">
              {formatAmount(calculation.totalPayable, currency, decimalPlaces)}
            </div>
          </div>
        </div>
      </div>
    </form>
  );

  const ActionButtons = (
    <div className="flex flex-col sm:flex-row gap-3 w-full">
      <Button 
        variant="ghost" 
        onClick={() => setOpen(false)} 
        disabled={loading} 
        className="flex-1 h-12 rounded-xl font-bold text-muted-foreground order-2 sm:order-1 bg-[var(--bg3)] hover:bg-[var(--bg4)]"
      >
        Cancel
      </Button>
      <Button 
        type="submit" 
        form="add-formal-loan-form"
        disabled={loading}
        className="flex-[2] h-12 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-white font-black px-6 shadow-lg shadow-[var(--accent)]/20 transition-all hover:scale-[1.02] active:scale-[0.98] order-1 sm:order-2"
      >
        {loading ? (
          <span className="flex items-center gap-2">
             <Loader2 className="animate-spin w-4 h-4" />
             Processing...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            Initiate Loan Protocol
            <ChevronRight className="w-4 h-4" />
          </span>
        )}
      </Button>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[640px] p-0 bg-[var(--bg-popup)] border-[var(--border)] rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="px-8 pt-8 pb-4">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--accent-glow)] flex items-center justify-center shadow-inner border border-[var(--accent)]/10">
                  <Building2 className="text-[var(--accent)] w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black tracking-tight">Add Formal Loan</DialogTitle>
                  <DialogDescription className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mt-0.5">
                    Automated EMI protocol tracking
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            {FormContent}
            <div className="mt-6 pb-6">
              {ActionButtons}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent className="bg-[var(--bg-popup)] rounded-t-[2.5rem] border-[var(--border)]">
        <div className="mx-auto w-12 h-1.5 bg-[var(--bg3)] rounded-full mt-3 mb-2" />
        <DrawerHeader className="text-left px-6">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-[var(--accent-glow)] flex items-center justify-center border border-[var(--accent)]/10">
                <Building2 className="text-[var(--accent)] w-6 h-6" />
              </div>
              <div>
                <DrawerTitle className="text-2xl font-black tracking-tight">Add Formal Loan</DrawerTitle>
                <DrawerDescription className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mt-0.5">
                  EMI tracking & amortization
                </DrawerDescription>
              </div>
          </div>
        </DrawerHeader>
        <div className="px-6 overflow-y-auto max-h-[75vh]">
          {FormContent}
        </div>
        <DrawerFooter className="px-6 pt-4 pb-8 border-t border-[var(--border)] mt-4">
          {ActionButtons}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
