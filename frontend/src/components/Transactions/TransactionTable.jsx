import React from 'react';
import { Activity, ArrowRightLeft, Pencil, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/utils/utils';
import useFormat from '@/hooks/useFormat';

export default function TransactionTable({
  transactions,
  loading,
  page,
  setPage,
  totalPages,
  startRecord,
  endRecord,
  totalRecords,
  handleEdit,
  handleDeleteClick,
}) {
  const { formatAmount, formatDate } = useFormat();

  const getTypeStyle = (t) => {
    if (!t) return {
      badge: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
      indicatorColor: 'bg-slate-500',
      indicatorGlow: 'shadow-[0_0_15px_rgba(100,116,139,0.5)]',
      label: 'Unknown'
    };
    const typeName = (t.type || 'expense').toLowerCase();
    if (typeName === 'income')
      return {
        badge: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_-4px_rgba(16,185,129,0.3)]',
        indicatorColor: 'bg-emerald-500',
        indicatorGlow: 'shadow-[0_0_15px_rgba(16,185,129,0.5)]',
        label: '↓ Income'
      };
    if (typeName === 'transfer')
      return {
        badge: 'bg-sky-500/20 text-sky-700 dark:text-sky-400 border-sky-500/40 shadow-[0_0_12px_-4px_rgba(14,165,233,0.3)]',
        indicatorColor: 'bg-sky-500',
        indicatorGlow: 'shadow-[0_0_15px_rgba(14,165,233,0.5)]',
        label: '⇄ Transfer'
      };
    if (typeName === 'debt') {
      const sub = (t.debtType || '').toLowerCase();
      if (sub === 'repayment')
        return {
          badge: 'bg-violet-500/20 text-violet-700 dark:text-violet-400 border-violet-500/40 shadow-[0_0_12px_-4px_rgba(139,92,246,0.3)]',
          indicatorColor: 'bg-violet-500',
          indicatorGlow: 'shadow-[0_0_15px_rgba(139,92,246,0.5)]',
          label: '↑ Repayment'
        };
      return {
        badge: 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/40 shadow-[0_0_12px_-4px_rgba(249,115,22,0.3)]',
        indicatorColor: 'bg-orange-500',
        indicatorGlow: 'shadow-[0_0_15px_rgba(249,115,22,0.5)]',
        label: '↓ Debt'
      };
    }
    return {
      badge: 'bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-500/40 shadow-[0_0_12px_-4px_rgba(244,63,94,0.3)]',
      indicatorColor: 'bg-rose-500',
      indicatorGlow: 'shadow-[0_0_15px_rgba(244,63,94,0.5)]',
      label: '↑ Expense'
    };
  };

  const getAmountDisplay = (t) => {
    const base = 'font-mono font-bold text-sm text-right whitespace-nowrap';
    if (!t) return { cls: `${base} text-muted-foreground`, prefix: '' };
    const typeName = (t.type || 'expense').toLowerCase();
    if (typeName === 'income') return { cls: `${base} text-emerald-600 dark:text-emerald-400`, prefix: '+' };
    if (typeName === 'transfer') return { cls: `${base} text-sky-600 dark:text-sky-400`, prefix: '' };
    if (typeName === 'debt') {
      const sub = (t.debtType || '').toUpperCase();
      if (sub === 'BORROWED') return { cls: `${base} text-emerald-600 dark:text-emerald-400`, prefix: '+' };
      return { cls: `${base} text-rose-600 dark:text-rose-400`, prefix: '-' };
    }
    if (typeName === 'repayment') {
      const sub = (t.debtType || '').toUpperCase();
      if (sub === 'REPAYMENT_IN' || sub === 'REPAY_IN') return { cls: `${base} text-emerald-600 dark:text-emerald-400`, prefix: '+' };
      return { cls: `${base} text-rose-600 dark:text-rose-400`, prefix: '-' };
    }
    return { cls: `${base} text-rose-600 dark:text-rose-400`, prefix: '-' };
  };

  return (
    <Card className="border-slate-900 dark:border-slate-800 shadow-2xl overflow-hidden bg-card/80 backdrop-blur-xl mt-6">
      <div className="overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader className="bg-slate-900/5 dark:bg-slate-800/20">
            <TableRow className="hover:bg-transparent border-b-slate-900/20 dark:border-slate-800/50">
              <TableHead className="w-[140px] pl-8 text-[10px] font-black uppercase tracking-widest h-14 text-slate-900 dark:text-slate-100">Flow</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest h-14 text-slate-900 dark:text-slate-100">Description & Source</TableHead>
              <TableHead className="w-[160px] text-[10px] font-black uppercase tracking-widest h-14 text-slate-900 dark:text-slate-100">Category</TableHead>
              <TableHead className="w-[110px] text-[10px] font-black uppercase tracking-widest h-14 text-center text-slate-900 dark:text-slate-100">Date</TableHead>
              <TableHead className="w-[200px] text-[10px] font-black uppercase tracking-widest h-14 text-right text-slate-900 dark:text-slate-100 pr-6">Amount & Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400 animate-pulse">Syncing Ledger...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="h-[400px] text-center border-none">
                  <div className="flex flex-col items-center justify-center gap-6 animate-in fade-in zoom-in duration-500">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full group-hover:bg-primary/20 transition-all duration-700" />
                      <div className="relative w-24 h-24 bg-slate-900/5 dark:bg-slate-100/5 rounded-[2rem] flex items-center justify-center border border-slate-900/10 dark:border-slate-100/10 shadow-2xl backdrop-blur-sm">
                        <Activity className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 max-w-[280px]">
                      <p className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                        No Movements <span className="text-primary italic">Detected</span>
                      </p>
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed uppercase tracking-widest">
                        Your ledger is currently pristine. Try adjusting your filters or time horizon to surface activity.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              transactions.filter(Boolean).map((t) => {
                const styles = getTypeStyle(t);
                const amtDisplay = getAmountDisplay(t);
                const typeName = (t.type || 'expense').toLowerCase();
                const isDebt = typeName === 'debt';
                const isTransfer = typeName === 'transfer';

                return (
                  <TableRow 
                    key={t._id} 
                    className={cn(
                      "group relative hover:bg-slate-900/[0.04] dark:hover:bg-slate-100/[0.04] border-b-slate-900/5 dark:border-slate-800/30 transition-all overflow-hidden",
                    )}
                  >
                    {/* Flow Type */}
                    <TableCell className="py-5 pl-8 w-[140px] relative">
                      {/* Sidebar-style Accent Indicator */}
                      <div className={cn(
                        "absolute left-0 top-[20%] bottom-[20%] w-1 rounded-r-full transition-all duration-300 opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-0 z-20",
                        styles.indicatorColor,
                        styles.indicatorGlow
                      )} />
                      <div className="flex flex-col gap-1.5 relative z-10">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight border shadow-sm w-fit",
                          styles.badge
                        )}>
                          {styles.label}
                        </span>
                        {isDebt && t.partyId && (
                          <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1.5 ml-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                            {t.partyId.name}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Description */}
                    <TableCell className="py-5">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-black tracking-tight leading-none text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
                          {t.title || 'Untitled Transaction'}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 font-bold">
                          <Activity className="w-3.5 h-3.5 text-slate-400" />
                          {t.accountId?.name || 'Unknown Account'}
                          {isTransfer && t.targetAccountId?.name && (
                            <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded-md">
                              <ArrowRightLeft className="w-3 h-3" />
                              {t.targetAccountId.name}
                            </span>
                          )}
                        </span>
                      </div>
                    </TableCell>

                    {/* Category */}
                    <TableCell className="py-5 w-[160px]">
                      <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-900/5 dark:bg-slate-100/5 border border-slate-900/10 dark:border-slate-100/10 rounded-xl w-fit shadow-sm">
                        <span className="text-lg leading-none">{t.categoryId?.icon || '📦'}</span>
                        <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 whitespace-nowrap uppercase tracking-wider">
                          {t.categoryId?.name || 'Unclassified'}
                        </span>
                      </div>
                    </TableCell>

                    {/* Date */}
                    <TableCell className="py-5 text-center w-[110px]">
                      <div className="flex flex-col items-center">
                        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 font-black tracking-tighter">
                          {formatDate(t.date)}
                        </span>
                      </div>
                    </TableCell>

                    {/* Amount & Actions */}
                    <TableCell className="py-5 text-right pr-6 w-[200px]">
                      <div className="flex items-center justify-end gap-4">
                        <div className="flex flex-col items-end">
                          <span className={cn("text-base font-black tracking-tighter drop-shadow-sm", amtDisplay.cls)}>
                            {amtDisplay.prefix}{formatAmount(t.amount)}
                          </span>
                        </div>
                        
                        <div className="flex gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all lg:translate-x-4 lg:group-hover:translate-x-0">
                          <Button
                            variant="secondary"
                            size="icon"
                            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-primary/20 hover:text-primary border border-slate-200 dark:border-slate-700 shadow-sm"
                            onClick={() => handleEdit(t)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/20 hover:text-rose-500 border border-slate-200 dark:border-slate-700 shadow-sm"
                            onClick={() => handleDeleteClick(t._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── PAGINATION FOOTER ── */}
      <div className="flex flex-col sm:flex-row gap-6 justify-between items-center p-5 bg-slate-900/5 dark:bg-slate-800/40 border-t border-slate-900/10 dark:border-slate-800 text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
        <span className="text-center sm:text-left flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
          Showing <span className="text-slate-900 dark:text-slate-100">{startRecord}–{endRecord}</span> of <span className="text-slate-900 dark:text-slate-100">{totalRecords}</span> entries
        </span>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="w-9 h-9 rounded-xl border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 shadow-sm disabled:opacity-30 transition-all active:scale-95"
            onClick={() => setPage(1)}
            disabled={page === 1}
          >
            <ChevronsLeft className="w-4.5 h-4.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-9 h-9 rounded-xl border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 shadow-sm disabled:opacity-30 transition-all active:scale-95"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="w-4.5 h-4.5" />
          </Button>

          <div className="flex items-center gap-1.5 px-2">
            {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
              const start = Math.max(1, Math.min(totalPages - 2, page - 1));
              const pageNum = start + i;
              if (pageNum < 1 || pageNum > totalPages) return null;
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? 'default' : 'ghost'}
                  size="icon"
                  className={cn(
                    "w-9 h-9 rounded-xl text-xs font-black transition-all",
                    pageNum === page 
                      ? "shadow-lg shadow-primary/30 bg-primary text-primary-foreground" 
                      : "hover:bg-white dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900"
                  )}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="w-9 h-9 rounded-xl border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 shadow-sm disabled:opacity-30 transition-all active:scale-95"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            <ChevronRight className="w-4.5 h-4.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-9 h-9 rounded-xl border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 shadow-sm disabled:opacity-30 transition-all active:scale-95"
            onClick={() => setPage(totalPages)}
            disabled={page >= totalPages}
          >
            <ChevronsRight className="w-4.5 h-4.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
