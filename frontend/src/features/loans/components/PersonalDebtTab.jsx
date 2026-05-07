import useFormat from '@/hooks/useFormat';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar as CalendarIcon,
  Search,
  FilterX
} from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/utils/utils';
import LoanKpiCard from './LoanKpiCard';
import DebtLedgerItem from './DebtLedgerItem';

export default function PersonalDebtTab({
  metrics,
  consolidatedLedger,
  parties,
  partyFilter,
  setPartyFilter,
  dateFilter,
  setDateFilter,
  isCalendarOpen,
  setIsCalendarOpen,
  expandedParties,
  toggleExpand,
  onEdit,
  onDelete,
  onAction,
  formatAmount
}) {
  const { formatDate } = useFormat();
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* KPI Section */}
      <div className="flex flex-wrap gap-4">
        <LoanKpiCard
          title="Total Lent"
          value={formatAmount(metrics.totalLent)}
          subtitle="Active receivables"
          icon={ArrowUpRight}
          colorVar="green"
          delay={100}
        />
        <LoanKpiCard
          title="Total Borrowed"
          value={formatAmount(metrics.totalBorrowed)}
          subtitle="Active payables"
          icon={ArrowDownLeft}
          colorVar="red"
          delay={200}
        />
        <LoanKpiCard
          title="Net Position"
          value={`${metrics.netPosition >= 0 ? '+' : '-'}${formatAmount(Math.abs(metrics.netPosition))}`}
          subtitle="Net balance summary"
          badge={metrics.netPosition >= 0 ? 'Surplus' : 'Deficit'}
          badgeVariant={metrics.netPosition >= 0 ? 'success' : 'error'}
          icon={metrics.netPosition >= 0 ? TrendingUp : TrendingDown}
          colorVar={metrics.netPosition >= 0 ? 'green' : 'red'}
          delay={300}
        />
        <LoanKpiCard
          title="Commitments"
          value={metrics.activeCount}
          subtitle="Open records"
          icon={Users}
          colorVar="purple"
          delay={400}
        />
      </div>

      <Card className="border-none shadow-none bg-transparent">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 px-1">
          <CardTitle className="text-xl font-black text-foreground tracking-tighter flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent/10">
              <Users className="h-5 w-5 text-accent" />
            </div>
            Active Ledger
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-[200px]">
              <Select value={partyFilter} onValueChange={setPartyFilter}>
                <SelectTrigger className="h-10 text-xs bg-muted border-border rounded-xl pl-9 focus:ring-accent">
                  <SelectValue placeholder="All Counterparties" />
                </SelectTrigger>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Search className="h-3.5 w-3.5" />
                </div>
                <SelectContent className="bg-popover border-border rounded-xl shadow-2xl">
                  <SelectItem value="ALL">All Counterparties</SelectItem>
                  {parties.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'h-10 justify-start text-left font-medium border-border bg-muted w-full sm:w-auto rounded-xl text-xs hover:bg-muted/80 transition-colors',
                    !dateFilter && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-accent" />
                  {dateFilter ? formatDate(dateFilter) : <span>Filter Date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover border-border rounded-xl shadow-2xl overflow-hidden" align="end">
                <div className="p-2 border-b border-border flex justify-end bg-muted/30">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { setDateFilter(null); setIsCalendarOpen(false); }} 
                    className="text-[10px] h-7 gap-1.5 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg"
                  >
                    <FilterX className="h-3 w-3" />
                    Clear Filter
                  </Button>
                </div>
                <Calendar
                  mode="single"
                  selected={dateFilter}
                  onSelect={(d) => { setDateFilter(d); setIsCalendarOpen(false); }}
                  initialFocus
                  className="rounded-xl"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {consolidatedLedger.length === 0 ? (
          <Card className="p-20 text-center border-dashed border-2 border-border bg-muted/20 rounded-[2.5rem] flex flex-col items-center">
            <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mb-6 shadow-inner">
              <Users className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-2xl font-black text-foreground tracking-tight">Clean Slate</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-[280px] leading-relaxed">
              Your debt ledger is currently empty. Start tracking personal commitments by adding a new record.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {consolidatedLedger.map((group) => (
              <DebtLedgerItem
                key={group._id}
                group={group}
                isExpanded={expandedParties.has(group._id)}
                onToggle={() => toggleExpand(group._id)}
                onEdit={onEdit}
                onDelete={onDelete}
                onAction={onAction}
                formatAmount={formatAmount}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
