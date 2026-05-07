import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { formatAmount } from '@/utils/format';
import useFormat from '@/hooks/useFormat';
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
import { 
  Loader2, 
  Calendar as CalendarIcon, 
  Banknote, 
  Landmark, 
  ChevronRight,
  ShieldCheck,
  Info,
  CreditCard,
  History
} from 'lucide-react';

export default function PayEMIPopup({ open, setOpen, loanId, onPaid }) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const dispatch = useDispatch();
  const { accounts = [] } = useSelector((state) => state.accounts);
  const preferences = useSelector(
    (state) => state.auth.user?.user?.preferences,
  );
  const { currency = 'INR', decimalPlaces = 2 } = preferences || {};
  const { formatDate } = useFormat();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [loanData, setLoanData] = useState(null);
  const [nextInstallment, setNextInstallment] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  useEffect(() => {
    if (open && loanId) {
      const fetchData = async () => {
        setFetching(true);
        try {
          const res = await api.get(`/formal-loans/${loanId}`);
          const { loan, schedule } = res.data.data || res.data;
          setLoanData(loan);
          // Find first pending installment
          const next = schedule.find((s) => s.status === 'PENDING');
          setNextInstallment(next);
          setSelectedAccountId(loan.associatedAccountId || '');
        } catch (err) {
          toast.error('Failed to fetch loan details');
          setOpen(false);
        } finally {
          setFetching(false);
        }
      };
      fetchData();
    }
  }, [open, loanId, setOpen]);

  const handlePay = async () => {
    if (!nextInstallment) return;
    if (!selectedAccountId) {
      toast.error('Please select a payment account');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/formal-loans/pay-emi', {
        scheduleId: nextInstallment._id,
        accountId: selectedAccountId,
      });

      const { updatedAccounts } = res.data.data || res.data;
      if (updatedAccounts) {
        updatedAccounts.forEach((acc) => dispatch(updateAccount(acc)));
      }

      toast.success(`EMI #${nextInstallment.installmentNo} paid successfully!`);
      if (onPaid) onPaid();
      setOpen(false);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || 'Failed to process EMI payment',
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedAccount = accounts.find(a => a._id === selectedAccountId);

  const FormContent = (
    <div className="space-y-6 py-2">
      {fetching ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Retrieving Protocol Data...</p>
        </div>
      ) : !loanData || !nextInstallment ? (
        <div className="py-12 text-center bg-destructive/5 rounded-3xl border border-destructive/10">
          <Info className="w-10 h-10 text-destructive mx-auto mb-3 opacity-40" />
          <p className="text-sm font-bold text-destructive px-6">
            No pending installments found for this loan protocol.
          </p>
        </div>
      ) : (
        <>
          {/* Premium EMI Card */}
          <div className="bg-gradient-to-br from-card/80 to-muted/20 rounded-[2rem] p-6 border border-border shadow-xl space-y-6 relative overflow-hidden group">
            {/* Animated Glow Effect */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-primary/20 transition-all duration-700" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full -ml-16 -mb-16 blur-2xl group-hover:bg-primary/10 transition-all duration-700" />
            
            <div className="flex justify-between items-start relative">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                  Lender Protocol
                </Label>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner group-hover:scale-105 transition-transform duration-500">
                    <Landmark className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <span className="text-base font-black tracking-tight block leading-none text-foreground">{loanData.bankName}</span>
                    <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">{loanData.loanType} Protocol</span>
                  </div>
                </div>
              </div>
              <div className="text-right space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mr-1">
                  Installment
                </Label>
                <div className="text-xs font-black bg-primary/10 px-4 py-1.5 rounded-full text-primary border border-primary/10 inline-block shadow-sm">
                  #{nextInstallment.installmentNo}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-5 bg-background/60 backdrop-blur-md rounded-2xl border border-border shadow-inner">
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                   <CreditCard className="w-3 h-3 text-primary opacity-50" /> Principal
                </p>
                <p className="text-sm font-black tracking-tight text-foreground">
                  {formatAmount(nextInstallment.principalComponent, currency, decimalPlaces)}
                </p>
              </div>
              <div className="space-y-1 text-right border-l border-border pl-4">
                <p className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider flex items-center gap-1.5 justify-end">
                   Interest <History className="w-3 h-3 text-amber-500 opacity-50" />
                </p>
                <p className="text-sm font-black tracking-tight text-amber-500">
                  {formatAmount(nextInstallment.interestComponent, currency, decimalPlaces)}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-end relative pt-2">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                  Payment Due
                </Label>
                <div className="flex items-center gap-2.5 text-xs font-black text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-xl border border-border">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  {formatDate(nextInstallment.dueDate)}
                </div>
              </div>
              <div className="text-right">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mr-1">
                  EMI Amount
                </Label>
                <div className="text-4xl font-black text-foreground tracking-tighter mt-1 leading-none drop-shadow-sm">
                  {formatAmount(nextInstallment.emiAmount, currency, decimalPlaces)}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Account Selection */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                <Banknote className="w-4 h-4 text-primary" />
                Source Account
              </Label>
              {selectedAccount && (
                <span className="text-[10px] font-black text-primary tracking-tight">
                   Bal: {formatAmount(selectedAccount.balance, currency, decimalPlaces)}
                </span>
              )}
            </div>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger className="h-16 bg-muted/30 border-border rounded-2xl text-base font-bold focus:ring-2 focus:ring-primary/20 transition-all shadow-sm hover:border-primary/40 group">
                <SelectValue placeholder="Select payment account" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border bg-background shadow-2xl z-[5000]">
                {accounts.map((acc) => (
                  <SelectItem key={acc._id} value={acc._id} className="rounded-xl focus:bg-muted py-3">
                    <div className="flex justify-between items-center w-full min-w-[300px]">
                      <div className="flex flex-col">
                        <span className="font-black text-sm">{acc.name}</span>
                        <span className="text-[10px] font-bold text-muted-foreground opacity-60 uppercase tracking-wider">{acc.type}</span>
                      </div>
                      <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1 rounded-lg ml-4">
                        {formatAmount(acc.balance, currency, decimalPlaces)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </div>
  );

  const ActionButtons = (
    <div className="flex flex-col sm:flex-row gap-3 w-full">
      <Button 
        variant="ghost" 
        onClick={() => setOpen(false)} 
        disabled={loading} 
        className="flex-1 h-14 rounded-2xl font-bold text-muted-foreground order-2 sm:order-1 bg-muted/50 hover:bg-muted border border-border uppercase tracking-widest text-[10px]"
      >
        Dismiss
      </Button>
      <Button 
        onClick={handlePay}
        disabled={loading || fetching || !nextInstallment}
        className="flex-[2] h-14 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-black px-6 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] order-1 sm:order-2 uppercase tracking-widest text-[10px]"
      >
        {loading ? (
          <span className="flex items-center gap-2">
             <Loader2 className="animate-spin w-4 h-4" />
             Authorizing...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            Confirm EMI Payment
            <ChevronRight className="w-5 h-5" />
          </span>
        )}
      </Button>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 bg-background border-border rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="px-8 pt-8 pb-4">
            <DialogHeader className="mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-[1.25rem] bg-primary/10 flex items-center justify-center shadow-inner border border-primary/20">
                  <ShieldCheck className="text-primary w-7 h-7" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black tracking-tight text-foreground">EMI Payment</DialogTitle>
                  <DialogDescription className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1 opacity-60">
                    Authorized disbursement protocol
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            {FormContent}
            <div className="mt-10 pb-6">
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
        <DrawerHeader className="text-left px-6 mb-2">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/10">
                <ShieldCheck className="text-primary w-6 h-6" />
              </div>
              <div>
                <DrawerTitle className="text-2xl font-black tracking-tight text-foreground">EMI Payment</DrawerTitle>
                <DrawerDescription className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-0.5">
                  Confirm installment payout
                </DrawerDescription>
              </div>
          </div>
        </DrawerHeader>
        <div className="px-6 pb-6 overflow-y-auto max-h-[75vh]">
          {FormContent}
        </div>
        <DrawerFooter className="px-6 pt-4 pb-12 border-t border-border bg-muted/10">
          {ActionButtons}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
