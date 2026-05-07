import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { formatAmount } from '@/utils/format';
import api from '@/utils/httpMethods';
import { updateAccount } from '@/features/accounts/state/accountSlice';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/utils/utils';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Loader2, 
  TrendingDown, 
  Sparkles, 
  Banknote, 
  ShieldCheck, 
  ChevronRight,
  Info,
  CalendarDays
} from 'lucide-react';

export default function PrepaymentPopup({
  open,
  setOpen,
  loanId,
  loanName,
  outstanding,
  onPaid,
}) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const dispatch = useDispatch();
  const { accounts = [] } = useSelector((state) => state.accounts);
  const preferences = useSelector(
    (state) => state.auth.user?.user?.preferences,
  );
  const { currency = 'INR', decimalPlaces = 2 } = preferences || {};

  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [extraAmount, setExtraAmount] = useState('');
  const [simulation, setSimulation] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Debounced simulation
  useEffect(() => {
    if (!open || !loanId || !extraAmount || parseFloat(extraAmount) <= 0) {
      setSimulation(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSimulating(true);
      try {
        const res = await api.post('/formal-loans/simulate-prepayment', {
          loanId,
          extraAmount: parseFloat(extraAmount),
        });
        setSimulation(res.data.data || res.data);
      } catch (err) {
        console.error('Simulation failed');
      } finally {
        setSimulating(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [extraAmount, loanId, open]);

  const handlePrepay = async () => {
    if (!extraAmount || parseFloat(extraAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!selectedAccountId) {
      toast.error('Please select a payment account');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/formal-loans/prepay', {
        loanId,
        amount: parseFloat(extraAmount),
        accountId: selectedAccountId,
        date: new Date(),
      });

      const { updatedAccounts } = res.data.data || res.data;
      if (updatedAccounts) {
        updatedAccounts.forEach((acc) => dispatch(updateAccount(acc)));
      }

      toast.success('Prepayment processed successfully!');
      if (onPaid) onPaid();
      setOpen(false);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || 'Failed to process prepayment',
      );
    } finally {
      setLoading(false);
    }
  };

  const FormContent = (
    <div className="space-y-6 py-2">
      {/* Input Section */}
      <div className="space-y-3">
        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-emerald-500" />
          Extra Payout Amount
        </Label>
        <div className="relative group">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-black text-emerald-500">₹</span>
          <Input
            type="number"
            placeholder="0.00"
            className="h-16 text-3xl font-black pl-10 bg-muted/30 border-border rounded-2xl focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-muted-foreground/20 text-foreground"
            value={extraAmount}
            onChange={(e) => setExtraAmount(e.target.value)}
          />
        </div>
      </div>

      {/* Impact Grid Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Projected Savings Protocol
          </Label>
          {simulating && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 space-y-1.5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/5 rounded-full -mr-6 -mt-6 blur-xl" />
            <p className="text-[9px] font-bold text-emerald-500/70 uppercase tracking-widest relative z-10">Interest Saved</p>
            <p className="text-xl font-black text-emerald-500 relative z-10">
              {simulating ? '...' : formatAmount(simulation?.interestSaved || 0, currency, decimalPlaces)}
            </p>
          </div>
          
          <div className="p-5 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 space-y-1.5 shadow-sm relative overflow-hidden">
            <p className="text-[9px] font-bold text-emerald-500/70 uppercase tracking-widest">EMIs Saved</p>
            <p className="text-xl font-black text-emerald-500">
              {simulating ? '...' : simulation?.emisSaved || 0}
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-muted/30 space-y-1.5 shadow-sm">
            <p className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-widest">New Balance</p>
            <p className="text-xl font-black text-foreground">
              {simulating ? '...' : formatAmount(simulation?.newOutstanding || (outstanding - (parseFloat(extraAmount) || 0)), currency, decimalPlaces)}
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-muted/30 space-y-1.5 shadow-sm">
            <p className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-widest">New Tenure</p>
            <p className="text-xl font-black text-amber-500">
              {simulating ? '...' : `${simulation?.newTenureMonths || '—'} m`}
            </p>
          </div>
        </div>
      </div>

      {/* Source Account Selection */}
      <div className="space-y-3 pt-2">
        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1 flex items-center gap-2">
          <Banknote className="w-4 h-4 text-primary" />
          Funding Source
        </Label>
        <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
          <SelectTrigger className="h-14 bg-muted/30 border-border rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-primary/20 shadow-sm transition-all">
            <SelectValue placeholder="Select payment account" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-border bg-background">
            {accounts.map((acc) => (
              <SelectItem key={acc._id} value={acc._id} className="rounded-xl focus:bg-muted">
                <div className="flex justify-between items-center w-full min-w-[260px] py-1">
                  <span className="font-bold">{acc.name}</span>
                  <span className="text-[11px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md ml-4">
                    {formatAmount(acc.balance, currency, decimalPlaces)}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const ActionButtons = (
    <div className="flex flex-col sm:flex-row gap-3 w-full">
      <Button 
        variant="ghost" 
        onClick={() => setOpen(false)} 
        disabled={loading} 
        className="flex-1 h-14 rounded-2xl font-bold text-muted-foreground order-2 sm:order-1 bg-muted/50 hover:bg-muted"
      >
        Cancel
      </Button>
      <Button 
        onClick={handlePrepay}
        disabled={loading || simulating || !extraAmount}
        className="flex-[2] h-14 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-black px-6 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] order-1 sm:order-2"
      >
        {loading ? (
          <span className="flex items-center gap-2">
             <Loader2 className="animate-spin w-4 h-4" />
             Optimizing...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            Confirm Prepayment
            <ChevronRight className="w-4 h-4" />
          </span>
        )}
      </Button>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px] p-0 bg-background border-border rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="px-8 pt-8 pb-4">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner border border-primary/10">
                  <CalendarDays className="text-primary w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black tracking-tight text-foreground">Prepayment Protocol</DialogTitle>
                  <DialogDescription className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mt-0.5">
                    {loanName} · Outstanding: <span className="text-foreground">{formatAmount(outstanding, currency, decimalPlaces)}</span>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            {FormContent}
            <div className="mt-8 pb-6">
              {ActionButtons}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent className="bg-background rounded-t-[2.5rem] border-border">
        <div className="mx-auto w-12 h-1.5 bg-muted rounded-full mt-3 mb-2" />
        <DrawerHeader className="text-left px-6">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/10">
                <CalendarDays className="text-primary w-6 h-6" />
              </div>
              <div>
                <DrawerTitle className="text-2xl font-black tracking-tight text-foreground">Prepayment</DrawerTitle>
                <DrawerDescription className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mt-0.5">
                  {loanName} optimization
                </DrawerDescription>
              </div>
          </div>
        </DrawerHeader>
        <div className="px-6 pb-6 overflow-y-auto max-h-[75vh]">
          {FormContent}
        </div>
        <DrawerFooter className="px-6 pt-4 pb-10 border-t border-border bg-muted/10">
          {ActionButtons}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
