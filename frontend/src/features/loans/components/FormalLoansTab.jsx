import { 
  Banknote, 
  RotateCcw, 
  Percent, 
  Landmark,
  ShieldCheck
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import LoanKpiCard from './LoanKpiCard';
import FormalLoanCard from './FormalLoanCard';

export default function FormalLoansTab({
  formalMetrics,
  formalLoans,
  formatAmount,
  onPrepay,
  onSchedule,
  onPayEMI
}) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* KPI Section */}
      <div className="flex flex-wrap gap-4">
        <LoanKpiCard
          title="Outstanding"
          value={formatAmount(formalMetrics.totalOutstanding)}
          subtitle="Principal + Interest"
          icon={Banknote}
          colorVar="red"
          delay={100}
        />
        <LoanKpiCard
          title="Monthly EMI"
          value={formatAmount(formalMetrics.monthlyEMI)}
          subtitle="Fixed monthly outflow"
          icon={RotateCcw}
          colorVar="amber"
          delay={200}
        />
        <LoanKpiCard
          title="Avg. Interest"
          value={`${formalLoans.length > 0 ? (formalLoans.reduce((s,l) => s+l.interestRate,0)/formalLoans.length).toFixed(1) : 0}%`}
          subtitle="Weighted average"
          icon={Percent}
          colorVar="accent"
          delay={300}
        />
        <LoanKpiCard
          title="Active Loans"
          value={formalMetrics.activeCount}
          subtitle="Bank accounts linked"
          icon={Landmark}
          colorVar="purple"
          delay={400}
        />
      </div>

      {formalLoans.length === 0 ? (
      <Card className="p-20 text-center border-dashed border-2 border-border bg-muted/20 rounded-[2.5rem] flex flex-col items-center">
        <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mb-6 shadow-inner">
          <Landmark className="h-10 w-10 text-muted-foreground/30" />
        </div>
        <h3 className="text-2xl font-black text-foreground tracking-tight">No Active Protocols</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-[320px] leading-relaxed mx-auto">
          Start tracking your bank loans and EMI schedules by initializing a new formal loan protocol.
        </p>
      </Card>
      ) : (
        <div className="flex flex-wrap gap-6">
          {formalLoans.map((loan) => (
            <FormalLoanCard
              key={loan._id}
              loan={loan}
              formatAmount={formatAmount}
              onPrepay={() => onPrepay(loan)}
              onSchedule={() => onSchedule(loan)}
              onPayEMI={() => onPayEMI(loan)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
