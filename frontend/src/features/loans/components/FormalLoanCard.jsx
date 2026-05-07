import { 
  Banknote, 
  RotateCcw, 
  Percent, 
  Landmark, 
  ArrowRight,
  ShieldCheck,
  Building2,
  Car,
  Home,
  GraduationCap,
  Briefcase,
  FileQuestion
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/utils/utils';

export default function FormalLoanCard({ 
  loan, 
  formatAmount, 
  onPrepay, 
  onSchedule, 
  onPayEMI 
}) {
  const completedPct = ((loan.principal - loan.outstandingBalance) / loan.principal) * 100;
  
  const getLoanIcon = (type) => {
    switch (type) {
      case 'HOME': return Home;
      case 'CAR': return Car;
      case 'EDUCATION': return GraduationCap;
      case 'PERSONAL': return Briefcase;
      case 'BUSINESS': return Building2;
      default: return FileQuestion;
    }
  };

  const Icon = getLoanIcon(loan.loanType);

  return (
    <Card className="overflow-hidden border-border/50 bg-card/40 backdrop-blur-xl hover:bg-card/60 transition-all duration-300 group flex-1 min-w-[320px] max-w-full lg:max-w-[calc(50%-12px)] rounded-[2rem] shadow-sm hover:shadow-xl">
      <CardHeader className="p-7 pb-2">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="secondary" className="gap-2 font-black bg-muted/50 text-foreground border-none px-3.5 py-1 rounded-full uppercase text-[9px] tracking-[0.15em]">
            <div className="p-1 rounded-full bg-accent/10">
              <Icon className="h-3 w-3 text-accent" />
            </div>
            {loan.loanType} Loan
          </Badge>
          <Badge 
            variant="outline"
            className={cn(
              "font-black px-3.5 py-1 rounded-full uppercase text-[9px] tracking-[0.15em] border-none shadow-sm",
              loan.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'
            )}
          >
            {loan.status}
          </Badge>
        </div>
        <CardTitle className="text-2xl font-black text-foreground tracking-tighter group-hover:text-primary transition-colors">
          {loan.bankName}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-7 pt-0 space-y-8">
        <div className="space-y-4">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80">
            <span>Payment Progress</span>
            <span className="text-foreground">{completedPct.toFixed(1)}% Complete</span>
          </div>
          <div className="relative h-2.5 w-full bg-muted/50 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div 
              className="absolute top-0.5 left-0.5 h-[calc(100%-4px)] bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_-3px_rgba(var(--primary),0.4)]"
              style={{ 
                width: `calc(${completedPct}% - 4px)`
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
          <div className="space-y-1.5">
            <p className="text-[9px] font-black text-muted-foreground/70 uppercase tracking-[0.2em]">Outstanding</p>
            <p className="text-lg font-black font-mono tracking-tight text-rose-500">{formatAmount(loan.outstandingBalance)}</p>
          </div>
          <div className="space-y-1.5 text-right">
            <p className="text-[9px] font-black text-muted-foreground/70 uppercase tracking-[0.2em]">Monthly EMI</p>
            <p className="text-lg font-black text-primary font-mono tracking-tight">{formatAmount(loan.emiAmount)}</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-[9px] font-black text-muted-foreground/70 uppercase tracking-[0.2em]">Rate (p.a.)</p>
            <p className="text-lg font-black font-mono tracking-tight text-amber-500">{loan.interestRate}%</p>
          </div>
          <div className="space-y-1.5 text-right">
            <p className="text-[9px] font-black text-muted-foreground/70 uppercase tracking-[0.2em]">Remaining</p>
            <p className="text-lg font-black font-mono tracking-tight text-emerald-500">{loan.tenureMonths} mo.</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 pt-6 border-t border-border/50">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-11 text-[10px] font-black uppercase tracking-[0.15em] flex-1 border-border/60 hover:bg-muted/50 rounded-2xl transition-all"
            onClick={onPrepay}
          >
            Prepay
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-11 text-[10px] font-black uppercase tracking-[0.15em] flex-1 border-border/60 hover:bg-muted/50 rounded-2xl transition-all"
            onClick={onSchedule}
          >
            Schedule
          </Button>
          <Button 
            size="sm" 
            className="h-11 text-[10px] font-black uppercase tracking-[0.15em] flex-[1.5] gap-2.5 bg-primary hover:bg-primary/90 rounded-2xl shadow-lg shadow-primary/20 text-white border-none"
            onClick={onPayEMI}
          >
            Pay EMI <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
