import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { formatAmount } from '@/utils/format';
import { format } from 'date-fns';
import api from '@/utils/httpMethods';
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
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  CalendarDays,
  ArrowDownLeft,
  Receipt,
  Timer,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Landmark,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export default function LoanSchedulePopup({ open, setOpen, loanId, loanName }) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const preferences = useSelector(
    (state) => state.auth.user?.user?.preferences,
  );
  const { currency = 'INR', decimalPlaces = 2 } = preferences || {};

  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    if (open && loanId) {
      const fetchSchedule = async () => {
        setLoading(true);
        try {
          const res = await api.get(`/formal-loans/${loanId}`);
          const { schedule } = res.data.data || res.data;
          setSchedule(schedule);
        } catch (err) {
          toast.error('Failed to fetch schedule');
          setOpen(false);
        } finally {
          setLoading(false);
        }
      };
      fetchSchedule();
    }
  }, [open, loanId, setOpen]);

  const StatusBadge = ({ item }) => {
    const isPaid = item.status === 'PAID';
    const isPast = new Date(item.dueDate) < new Date() && !isPaid;

    if (isPaid) {
      return (
        <Badge
          variant="outline"
          className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1.5 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full"
        >
          <CheckCircle2 className="w-3 h-3" /> PAID
        </Badge>
      );
    }
    if (isPast) {
      return (
        <Badge
          variant="outline"
          className="bg-rose-500/10 text-rose-500 border-rose-500/20 gap-1.5 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full"
        >
          <AlertCircle className="w-3 h-3" /> OVERDUE
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="bg-muted text-muted-foreground border-border gap-1.5 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full"
      >
        <Timer className="w-3 h-3" /> PENDING
      </Badge>
    );
  };

  const ScheduleContent = (
    <div className="space-y-4">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Synchronizing Timeline...</p>
        </div>
      ) : schedule.length === 0 ? (
        <div className="py-20 text-center bg-muted/30 rounded-[2rem] border border-border">
          <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <p className="text-sm font-bold text-muted-foreground">No schedule data available.</p>
        </div>
      ) : isDesktop ? (
        <div className="w-full overflow-hidden rounded-[1.5rem] border border-border bg-muted/10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 w-16">#</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Due Date</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 text-right">EMI Amount</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 text-right">Principal</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 text-right">Interest</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((item) => (
                <tr
                  key={item._id}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors group"
                >
                  <td className="py-4 px-6 text-xs font-black text-muted-foreground/40">{item.installmentNo}</td>
                  <td className="py-4 px-6 text-xs font-bold tracking-tight">
                    {format(new Date(item.dueDate), 'dd MMM yyyy')}
                  </td>
                  <td className="py-4 px-6 text-sm font-black text-right text-primary tracking-tighter">
                    {formatAmount(item.emiAmount, currency, decimalPlaces)}
                  </td>
                  <td className="py-4 px-6 text-xs font-bold text-right text-muted-foreground">
                    {formatAmount(item.principalComponent, currency, decimalPlaces)}
                  </td>
                  <td className="py-4 px-6 text-xs font-bold text-right text-amber-500">
                    {formatAmount(item.interestComponent, currency, decimalPlaces)}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <StatusBadge item={item} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-3 pb-8">
          {schedule.map((item) => (
            <div
              key={item._id}
              className="p-5 rounded-[1.5rem] border border-border bg-card/50 space-y-4 relative overflow-hidden group active:scale-[0.98] transition-transform"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary border border-primary/10 shadow-inner">
                    {item.installmentNo}
                  </div>
                  <div>
                    <p className="text-sm font-black tracking-tight leading-none mb-1.5">
                      {format(new Date(item.dueDate), 'dd MMM yyyy')}
                    </p>
                    <StatusBadge item={item} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest mb-1">EMI Amount</p>
                  <p className="text-base font-black text-primary tracking-tighter leading-none">
                    {formatAmount(item.emiAmount, currency, decimalPlaces)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-emerald-500" /> Principal
                  </p>
                  <p className="text-xs font-black tracking-tight">
                    {formatAmount(item.principalComponent, currency, decimalPlaces)}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-wider flex items-center gap-1.5 justify-end">
                    Interest <Timer className="w-3 h-3 text-amber-500" />
                  </p>
                  <p className="text-xs font-black tracking-tight text-amber-500">
                    {formatAmount(item.interestComponent, currency, decimalPlaces)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl p-0 bg-background border-border rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="px-8 pt-8 pb-4">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner border border-primary/20">
                  <Receipt className="text-primary w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black tracking-tight">Amortization Schedule</DialogTitle>
                  <DialogDescription className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mt-0.5">
                    {loanName} · Timeline and breakdown
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <ScrollArea className="h-[60vh] pr-4">
              {ScheduleContent}
            </ScrollArea>
            <div className="mt-6 pb-6 flex justify-end">
              <Button
                onClick={() => setOpen(false)}
                className="h-12 px-10 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-black text-xs uppercase tracking-widest border border-border"
              >
                Close Timeline
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent className="bg-background rounded-t-[2.5rem] border-border h-[92vh]">
        <div className="mx-auto w-12 h-1.5 bg-muted rounded-full mt-3 mb-2" />
        <DrawerHeader className="text-left px-6">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Receipt className="text-primary w-6 h-6" />
              </div>
              <div>
                <DrawerTitle className="text-2xl font-black tracking-tight">Payment Schedule</DrawerTitle>
                <DrawerDescription className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mt-0.5">
                  {loanName} · Repayment timeline
                </DrawerDescription>
              </div>
          </div>
        </DrawerHeader>
        <ScrollArea className="flex-1 px-6 mt-4">
          {ScheduleContent}
        </ScrollArea>
        <DrawerFooter className="px-6 pt-4 pb-10 border-t border-border">
          <Button 
            variant="ghost" 
            onClick={() => setOpen(false)} 
            className="w-full h-14 rounded-2xl font-bold text-muted-foreground bg-muted hover:bg-muted/80"
          >
            Close Schedule
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
