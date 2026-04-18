import { useEffect, useState } from 'react';
import api from '@/utils/httpMethods';
import { formatAmount, getCurrencySymbol } from '@/utils/format';
import { formatDate } from '@/utils/utils';
import { useSelector } from 'react-redux';
import { cn } from '@/utils/utils';

const RecurringHistoryPopup = ({ open, setOpen, task }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const preferences = useSelector((state) => state.auth.user?.user?.preferences || state.auth.user?.preferences);
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
      <div className="relative w-full max-w-[600px] rounded-[24px] border border-white/10 bg-[#0E1220] p-7 shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
        <button
          onClick={() => setOpen(false)}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-[#8892B0] hover:text-white transition-colors"
        >
          ✕
        </button>

        <div className="mb-6 shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#5B8DEF]/10 text-[#5B8DEF] mb-3 text-xl">
            📜
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[#EEF0F8]">Execution History</h2>
          <p className="mt-0.5 text-xs text-[#8892B0]">
            Audit trail for <span className="text-[#EEF0F8] font-bold">{task?.title}</span>
          </p>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
              <div className="w-8 h-8 border-2 border-[#5B8DEF] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-xs text-[#8892B0]">Searching archives…</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-20 bg-white/[0.02] rounded-2xl border border-dashed border-white/5">
              <div className="text-3xl mb-3">🗞️</div>
              <p className="text-sm font-semibold text-[#EEF0F8]">No executions recorded</p>
              <p className="text-[11px] text-[#4A5578] mt-1 text-center px-10">This task has not generated any transactions yet. The first run will appear here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-3 px-3 pb-2 text-[10px] font-bold text-[#4A5578] uppercase tracking-widest">
                <span>Date</span>
                <span>Account</span>
                <span className="text-right">Amount</span>
              </div>
              {history.map((t) => (
                <div key={t._id} className="grid grid-cols-3 items-center p-3.5 bg-[#141928] border border-white/5 rounded-2xl hover:border-[#5B8DEF]/20 transition-all">
                  <div className="text-xs font-medium text-[#EEF0F8]">
                    {formatDate(t.date)}
                  </div>
                  <div className="text-[11px] text-[#8892B0]">
                    {t.accountId?.name || 'Unknown'}
                  </div>
                  <div className={cn(
                    "text-xs font-bold font-mono text-right",
                    t.type === 'income' ? 'text-[#2DD4A0]' : 'text-[#FF6B6B]'
                  )}>
                    {t.type === 'income' ? '+' : '-'}{formatAmount(t.amount, currency)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 pt-5 border-t border-white/5 shrink-0 flex justify-end">
          <button
            onClick={() => setOpen(false)}
            className="px-6 py-2.5 bg-[#141928] hover:bg-[#1C2235] text-[#EEF0F8] text-[13px] font-bold rounded-xl transition-all"
          >
            Close Logs
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecurringHistoryPopup;
