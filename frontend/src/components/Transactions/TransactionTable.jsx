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
      badge: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
      label: 'Unknown'
    };
    const typeName = (t.type || 'expense').toLowerCase();
    
    // Premium Mockup Colors (Dark Mode focused, with Light Mode fallbacks)
    if (typeName === 'income')
      return {
        badge: 'dark:bg-[#14162e] dark:text-[#7d88f4] bg-indigo-50 text-indigo-600 border-indigo-100 dark:border-[#7d88f4]/20 shadow-sm',
        label: 'INCOME'
      };
    if (typeName === 'transfer')
      return {
        badge: 'dark:bg-[#141b25] dark:text-[#5ba1f5] bg-sky-50 text-sky-600 border-sky-100 dark:border-[#5ba1f5]/20 shadow-sm',
        label: 'TRANSFER'
      };
    if (typeName === 'debt') {
      return {
        badge: 'dark:bg-[#251b14] dark:text-[#f5a15b] bg-amber-50 text-amber-700 border-amber-100 dark:border-[#f5a15b]/20 shadow-sm',
        label: 'DEBT'
      };
    }
    return {
      badge: 'dark:bg-[#1e1416] dark:text-[#f1465d] bg-rose-50 text-rose-600 border-rose-100 dark:border-[#f1465d]/20 shadow-sm',
      label: 'EXPENSE'
    };
  };

  const getAmountDisplay = (t) => {
    const base = 'font-mono font-bold text-sm tracking-tighter';
    if (!t) return { cls: `${base} text-muted-foreground`, prefix: '' };
    const typeName = (t.type || 'expense').toLowerCase();
    
    if (typeName === 'income') return { cls: `${base} text-[#7d88f4] dark:text-[#7d88f4]`, prefix: '+' };
    if (typeName === 'transfer') return { cls: `${base} text-slate-600 dark:text-slate-300`, prefix: '' };
    if (typeName === 'debt') {
      const sub = (t.debtType || '').toUpperCase();
      if (sub === 'BORROWED') return { cls: `${base} text-emerald-500`, prefix: '+' };
      return { cls: `${base} text-[#f1465d]`, prefix: '-' };
    }
    return { cls: `${base} text-[#f1465d]`, prefix: '-' };
  };

  return (
    <Card className="border-none shadow-none bg-transparent overflow-visible">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-[#0c1322]/80 backdrop-blur-xl overflow-hidden">
        {/* ── MOBILE VIEW (LIST) ── */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/40">
          {loading && transactions.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Syncing Ledger...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4 text-center p-8">
              <Activity className="w-10 h-10 text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">No Records Found</p>
            </div>
          ) : (
            transactions.filter(Boolean).map((t) => {
              const styles = getTypeStyle(t);
              const amtDisplay = getAmountDisplay(t);
              return (
                <div key={t._id} className="p-4 flex flex-col gap-4 active:bg-slate-50 dark:active:bg-white/5 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-center text-xl shadow-sm">
                        {t.categoryId?.icon || '📦'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1 leading-tight">
                          {t.title || 'Untitled'}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest border",
                            styles.badge
                          )}>
                            {styles.label}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                            {formatDate(t.date)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={cn("text-base font-bold font-mono tracking-tighter", amtDisplay.cls)}>
                        {amtDisplay.prefix}{formatAmount(t.amount)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                        {t.categoryId?.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                      Source: <span className="text-slate-600 dark:text-slate-300">{t.accountId?.name || 'Main'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center shadow-sm"
                        onClick={() => handleEdit(t)}
                        title="Edit Transaction"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                        onClick={() => handleDeleteClick(t._id)}
                        title="Delete Transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── DESKTOP VIEW (TABLE) ── */}
        <div className="hidden md:block overflow-x-auto">
          <Table className="min-w-[1000px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-slate-200 dark:border-slate-800/50 h-16">
                <TableHead className="w-[140px] pl-8 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Flow</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Description & Category</TableHead>
                <TableHead className="w-[180px] text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Source</TableHead>
                <TableHead className="w-[120px] text-center text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</TableHead>
                <TableHead className="w-[140px] text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Amount</TableHead>
                <TableHead className="w-[120px] text-right pr-8 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <p className="text-xs font-medium text-slate-500">Syncing Ledger...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="h-[400px] text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <Activity className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">No Transactions Found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.filter(Boolean).map((t) => {
                  const styles = getTypeStyle(t);
                  const amtDisplay = getAmountDisplay(t);
                  
                  return (
                    <TableRow 
                      key={t._id} 
                      className="group border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors h-20"
                    >
                      {/* Flow (Type Badge) */}
                      <TableCell className="pl-8">
                        <span className={cn(
                          "inline-flex items-center px-3 py-1 rounded-md text-[10px] font-black tracking-widest border transition-all",
                          styles.badge
                        )}>
                          {styles.label}
                        </span>
                      </TableCell>
  
                      {/* Description & Category */}
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform">
                            {t.categoryId?.icon || '📦'}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
                              {t.title || 'Untitled Transaction'}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                              {t.categoryId?.name || 'Unclassified'}
                            </span>
                          </div>
                        </div>
                      </TableCell>
  
                      {/* Source */}
                      <TableCell>
                        <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                          {t.accountId?.name || t.account?.name || 'Main Account'}
                        </div>
                      </TableCell>
  
                      {/* Date */}
                      <TableCell className="text-center text-[13px] font-medium text-slate-600 dark:text-slate-400">
                        {formatDate(t.date)}
                      </TableCell>
  
                      {/* Amount */}
                      <TableCell className="text-right">
                        <span className={cn("text-base font-bold tracking-tight", amtDisplay.cls)}>
                          {amtDisplay.prefix}{formatAmount(t.amount)}
                        </span>
                      </TableCell>
  
                      {/* Actions */}
                      <TableCell className="text-right pr-8">
                        <div className="flex items-center justify-end gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 rounded-lg hover:bg-primary/10 hover:text-primary text-slate-400"
                            onClick={() => handleEdit(t)}
                            title="Edit Transaction"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 text-slate-400"
                            onClick={() => handleDeleteClick(t._id)}
                            title="Delete Transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── PAGINATION FOOTER ── */}
      <div className="flex flex-col md:flex-row justify-between items-center px-8 py-6 bg-slate-50/30 dark:bg-transparent border-t border-slate-100 dark:border-slate-800/50 gap-6">
        {/* Left: Stats */}
        <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider order-2 md:order-1">
          Showing <span className="text-slate-900 dark:text-slate-200 font-bold">{startRecord}-{endRecord}</span> of <span className="text-slate-900 dark:text-slate-200 font-bold">{totalRecords}</span> transactions
        </div>

        {/* Center: Pagination */}
        <div className="flex items-center gap-1 order-1 md:order-2">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-primary transition-colors disabled:opacity-20"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, i, arr) => {
                const showEllipsis = i > 0 && p - arr[i - 1] > 1;
                return (
                  <React.Fragment key={p}>
                    {showEllipsis && <span className="px-2 text-slate-300 dark:text-slate-700 text-[10px]">...</span>}
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-8 h-8 rounded-lg text-[11px] font-bold transition-all duration-300",
                        p === page 
                          ? "bg-primary/10 text-primary dark:bg-primary dark:text-white shadow-[0_0_15px_rgba(var(--primary),0.3)]" 
                          : "text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/5"
                      )}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  </React.Fragment>
                );
              })}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-primary transition-colors disabled:opacity-20"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Right: Per Page (Mockup Style) */}
        <div className="hidden lg:flex items-center gap-3 order-3">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">
            Per Page:
          </span>
          <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-[11px] font-bold text-slate-600 dark:text-slate-300 cursor-default">
            20
          </div>
        </div>
      </div>

    </Card>
  );
}
