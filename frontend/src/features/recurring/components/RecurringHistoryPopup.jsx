import { useEffect, useState } from 'react';
import api from '@/utils/httpMethods';
import { formatAmount, getCurrencySymbol } from '@/utils/format';
import { formatDate } from '@/utils/utils';
import { useSelector } from 'react-redux';
import { cn } from '@/utils/utils';
import { useMediaQuery } from '@/hooks/use-media-query';
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
import { Button } from '@/components/ui/button';

const RecurringHistoryPopup = ({ open, setOpen, task }) => {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const preferences = useSelector(
    (state) =>
      state.auth.user?.user?.preferences || state.auth.user?.preferences,
  );
  const { currency = 'INR' } = preferences || {};
  const currencySymbol = getCurrencySymbol(currency);

  useEffect(() => {
    if (open && task) {
      const fetchHistory = async () => {
        setLoading(true);
        try {
          const res = await api.get(`/recurring/${task._id}/history`);
          setHistory(res.data || []);
        } catch (error) {
          console.error('Failed to fetch history');
        } finally {
          setLoading(false);
        }
      };
      fetchHistory();
    }
  }, [open, task]);

  const HistoryContent = (
    <div className="flex flex-col h-full max-h-[70vh] md:max-h-[600px]">
      <div className="flex-1 overflow-y-auto pr-1 hide-scrollbar space-y-3 pb-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50 space-y-4">
            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-text3 animate-pulse">
              Searching archives…
            </p>
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-bg3/20 rounded-[32px] border border-dashed border-border/40">
            <div className="text-5xl mb-4 grayscale opacity-30">🗞️</div>
            <p className="text-sm font-black text-text tracking-tight">
              No executions recorded
            </p>
            <p className="text-[10px] font-medium text-text3 mt-1 text-center px-10 leading-relaxed">
              This protocol has not generated any transactions yet. The first run will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="grid grid-cols-3 px-5 pb-1 text-[9px] font-black text-text3 uppercase tracking-[0.2em]">
              <span>Execution Date</span>
              <span>Account</span>
              <span className="text-right">Settlement</span>
            </div>
            {history.map((t) => (
              <div
                key={t._id}
                className="grid grid-cols-3 items-center p-4 bg-bg3/30 border border-border/20 rounded-2xl hover:border-accent/40 hover:bg-bg3/50 transition-all group"
              >
                <div className="text-xs font-black text-text tracking-tight group-hover:text-accent transition-colors">
                  {formatDate(t.date)}
                </div>
                <div className="text-[10px] font-bold text-text3 uppercase tracking-widest">
                  {t.accountId?.name || 'Unknown'}
                </div>
                <div
                  className={cn(
                    'text-xs font-black font-mono text-right',
                    t.type === 'income' ? 'text-green' : 'text-text',
                  )}
                >
                  {t.type === 'income' ? '+' : '-'}
                  {formatAmount(t.amount, currency)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-border/40 shrink-0">
        <Button
          onClick={() => setOpen(false)}
          variant="outline"
          className="w-full h-12 bg-bg3/50 border-border/40 hover:bg-bg3 hover:border-accent/40 rounded-2xl text-[10px] font-black uppercase tracking-widest text-text3 hover:text-text transition-all"
        >
          Dismiss Logs
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {isDesktop ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-[600px] bg-bg2 border-border p-8 rounded-[40px] shadow-2xl overflow-hidden">
            <DialogHeader className="mb-6 space-y-1">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-accent/10 text-2xl shadow-inner">
                  📜
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black tracking-tight text-text">
                    Execution History
                  </DialogTitle>
                  <DialogDescription className="text-xs text-text3 font-medium">
                    Audit trail for <span className="text-text font-black">{task?.title}</span>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            {HistoryContent}
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="bg-bg2 border-border rounded-t-[40px] px-6 pb-8 max-h-[90%] overflow-hidden">
            <DrawerHeader className="px-0 pt-8 pb-6 space-y-1">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-accent/10 text-2xl">
                  📜
                </div>
                <div className="text-left">
                  <DrawerTitle className="text-2xl font-black tracking-tight text-text">
                    Execution History
                  </DrawerTitle>
                  <DrawerDescription className="text-xs text-text3 font-medium">
                    Audit trail for <span className="text-text font-black">{task?.title}</span>
                  </DrawerDescription>
                </div>
              </div>
            </DrawerHeader>
            <div className="mt-2">{HistoryContent}</div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
};

export default RecurringHistoryPopup;
