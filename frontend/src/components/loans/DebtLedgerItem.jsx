import useFormat from '@/hooks/useFormat';
import { ChevronRight, Edit3, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/utils';

export default function DebtLedgerItem({
  group,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onAction,
  formatAmount,
}) {
  const { formatDate } = useFormat();
  const partyName = group.party?.name || 'Unknown';
  const pInitial = partyName[0] || '?';
  const isOwed = group.netBalance > 0;
  const isOwe = group.netBalance < 0;
  const isSettled = group.netBalance === 0;

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-500 group rounded-[2rem] border border-border/40',
        isExpanded
          ? 'shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-card/90 scale-[1.02] z-10'
          : 'shadow-sm bg-card/40 backdrop-blur-xl hover:bg-card/60 hover:shadow-xl hover:border-accent/20',
      )}
    >
      <div
        className="p-5 flex items-center gap-5 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div
            className={cn(
              'h-12 w-12 rounded-2xl flex items-center justify-center text-white shrink-0 font-black shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3',
              isOwed
                ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/30'
                : isOwe
                  ? 'bg-gradient-to-br from-rose-400 to-rose-600 shadow-rose-500/30'
                  : 'bg-gradient-to-br from-slate-400 to-slate-600 shadow-slate-500/20',
            )}
          >
            {pInitial}
          </div>
          <div className="min-w-0">
            <h4 className="font-black text-base truncate text-foreground tracking-tight group-hover:text-accent transition-colors">
              {partyName}
            </h4>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black opacity-60">
              {group.party?.relation || 'Contact'}
            </p>
          </div>
        </div>

        <div className="hidden md:block w-32 shrink-0">
          {isSettled ? (
            <Badge
              variant="outline"
              className="opacity-70 border-border text-muted-foreground font-black text-[9px] uppercase tracking-widest rounded-full"
            >
              Settled
            </Badge>
          ) : isOwed ? (
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[9px] uppercase tracking-widest rounded-full px-3"
            >
              Receivable
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-rose-500/10 text-rose-500 border-none font-black text-[9px] uppercase tracking-widest rounded-full px-3"
            >
              Payable
            </Badge>
          )}
        </div>

        <div className="text-right shrink-0">
          <div
            className={cn(
              'font-black text-lg tracking-tighter',
              isOwed
                ? 'text-emerald-500'
                : isOwe
                  ? 'text-rose-500'
                  : 'text-muted-foreground',
            )}
          >
            {isOwe ? '-' : isOwed ? '+' : ''}
            {formatAmount(Math.abs(group.netBalance))}
          </div>
          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
            Net Balance
          </p>
        </div>

        <div className="p-2 rounded-full bg-muted/30 group-hover:bg-accent/10 transition-colors">
          <ChevronRight
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform duration-500 group-hover:text-accent shrink-0',
              isExpanded && 'rotate-90',
            )}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="px-5 pb-5 bg-muted/20 animate-in slide-in-from-top-2 duration-500 border-t border-border/40 dark:border-slate-800">
          <div className="py-4 flex items-center justify-between">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-70">
              Transaction History
            </span>
            {!isSettled && (
              <Button
                variant="secondary"
                size="sm"
                className="h-8 text-[10px] font-black uppercase tracking-widest bg-accent/10 hover:bg-accent/20 text-accent rounded-xl px-4 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction();
                }}
              >
                {isOwed ? 'Collect' : 'Pay'}
              </Button>
            )}
          </div>

          <div className="space-y-2.5">
            {group.loans.map((loan) => (
              <div
                key={loan._id}
                className="flex items-center justify-between p-4 bg-card rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group/item border border-border/40 dark:border-slate-800"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-black text-xs text-foreground tracking-tight">
                    {formatDate(loan.date)}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    {loan.accountId?.name}
                  </span>
                </div>
                <div className="flex items-center gap-5">
                  <div className="text-right">
                    <div
                      className={cn(
                        'font-black text-sm tracking-tight',
                        loan.type === 'LENT'
                          ? 'text-emerald-500'
                          : 'text-rose-500',
                      )}
                    >
                      {loan.type === 'LENT' ? '+' : '-'}
                      {formatAmount(loan.amount)}
                    </div>
                  </div>
                  <div className="flex gap-1.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-accent hover:bg-accent/10 rounded-xl transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(loan);
                      }}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(loan._id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
