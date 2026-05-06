import { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { 
  TrendingDown, 
  Wallet, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  Edit2, 
  Package,
  ArrowUpRight,
  ChevronRight,
  Lock
} from 'lucide-react';
import useApi from '@/hooks/useApi';
import api from '@/utils/httpMethods';
import AddBudgetPopup from './AddBudgetPopup';
import useFormat from '@/hooks/useFormat';
import { cn } from '@/utils/utils';
import { Button } from '@/components/ui/button';
import PremiumKpiCard from '@/components/ui/PremiumKpiCard';

const Budget = () => {
  const [budgets, setBudgets] = useState([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const { user } = useSelector((state) => state.auth);
  const userObj = user?.user || user;
  const isPro = userObj?.role === 'admin' || userObj?.plan === 'pro';

  const { loading, makeRequest } = useApi();
  const { formatAmount } = useFormat();

  const fetchBudgets = async () => {
    try {
      const res = await makeRequest({
        url: '/budget/performance',
        method: 'get',
      });
      if (res.success) {
        setBudgets(res.data.data || res.data || []);
      }
    } catch (error) {
      toast.error('Failed to load budget data');
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const stats = useMemo(() => {
    const totalBudgeted = budgets.reduce((acc, b) => acc + b.budgetAmount, 0);
    const totalSpent = budgets.reduce((acc, b) => acc + b.spentAmount, 0);
    const remaining = Math.max(0, totalBudgeted - totalSpent);
    const overBudgetCount = budgets.filter(
      (b) => b.spentAmount > b.budgetAmount,
    ).length;

    return { totalBudgeted, totalSpent, remaining, overBudgetCount };
  }, [budgets]);

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setIsPopupOpen(true);
  };

  const handleAddNew = () => {
    if (!isPro && budgets.length >= 1) {
      toast.error(
        'Basic plan limit reached (1 active budget). Upgrade to PRO to add more.',
      );
      return;
    }
    setEditingBudget(null);
    setIsPopupOpen(true);
  };

  const limitReached = !isPro && budgets.length >= 1;

  return (
    <div className="page-body p-4 md:p-6 min-h-screen bg-[var(--bg)] pb-24 md:pb-6">
      {/* KPI Header Grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <PremiumKpiCard
          title="Total Budgeted"
          value={formatAmount(stats.totalBudgeted)}
          icon={Wallet}
          color="blue"
          delay={0}
        />
        <PremiumKpiCard
          title="Total Spent"
          value={formatAmount(stats.totalSpent)}
          icon={TrendingDown}
          color="red"
          delay={100}
        />
        <PremiumKpiCard
          title="Remaining"
          value={formatAmount(stats.remaining)}
          icon={CheckCircle2}
          color="green"
          delay={200}
        />
        <PremiumKpiCard
          title="Status"
          value={stats.overBudgetCount > 0 ? "At Risk" : "Healthy"}
          subtitle={
            stats.overBudgetCount > 0
              ? `${stats.overBudgetCount} ${stats.overBudgetCount === 1 ? 'category' : 'categories'} over budget`
              : 'All within limits'
          }
          icon={AlertCircle}
          color={stats.overBudgetCount > 0 ? "amber" : "green"}
          delay={300}
        />
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text)] md:text-2xl">
            Budget Management
          </h2>
          <p className="text-sm text-[var(--text2)]">
            Set and track spending limits for your expense categories.
          </p>
        </div>
        <Button
          onClick={handleAddNew}
          className="hidden md:flex h-11 items-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:scale-[1.02] hover:opacity-95 active:scale-95"
        >
          {limitReached ? <Lock className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span>Add Budget</span>
        </Button>
      </div>

      {loading && budgets.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-3 border-[var(--accent)] border-t-transparent" />
            <p className="text-sm font-medium text-[var(--text2)]">Loading your budgets...</p>
          </div>
        </div>
      ) : budgets.length === 0 ? (
        <div
          onClick={handleAddNew}
          className="flex h-72 cursor-pointer flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-[var(--border)] bg-[var(--bg2)]/40 backdrop-blur-sm transition-all hover:bg-[var(--bg2)]/60 hover:border-[var(--accent)]/40 group"
        >
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--bg3)] text-[var(--accent)] transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-sm">
            <Package className="h-8 w-8" />
          </div>
          <p className="text-lg font-bold text-[var(--text)]">No budgets defined yet</p>
          <p className="mt-2 text-sm text-[var(--text3)] text-center max-w-[280px]">
            Set spending limits to keep your finances in check and reach your savings goals faster.
          </p>
          <Button variant="outline" className="mt-6 rounded-xl border-[var(--accent)]/30 text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white">
            Create Your First Budget
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget, idx) => (
            <BudgetCard
              key={budget.category?._id || idx}
              budget={budget}
              onEdit={() => handleEdit(budget)}
            />
          ))}

          {/* Inline Add Card - Desktop only */}
          <div
            onClick={handleAddNew}
            className="hidden md:flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-[var(--border)] bg-[var(--bg2)]/40 backdrop-blur-sm transition-all hover:bg-[var(--bg2)]/60 hover:border-[var(--accent)]/40 group"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg3)] text-[var(--text3)] transition-all group-hover:scale-110 group-hover:bg-[var(--accent)]/10 group-hover:text-[var(--accent)]">
              <Plus className="h-6 w-6" />
            </div>
            <div className="text-base font-bold text-[var(--text)]">Add Budget</div>
            <p className="mt-2 text-xs text-[var(--text3)] text-center px-6">
              Set a monthly limit for another category
            </p>
          </div>
        </div>
      )}

      {/* Floating Add Button for Mobile */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleAddNew}
          className="h-14 w-14 rounded-2xl bg-[var(--accent)] text-white shadow-xl shadow-[var(--accent)]/40 transition-transform active:scale-90 flex items-center justify-center p-0"
        >
          <Plus className="h-7 w-7" strokeWidth={2.5} />
        </Button>
      </div>

      <AddBudgetPopup
        open={isPopupOpen}
        setOpen={setIsPopupOpen}
        editBudget={editingBudget}
        onSuccess={fetchBudgets}
      />
    </div>
  );
};

const BudgetCard = ({ budget, onEdit }) => {
  const { formatAmount } = useFormat();
  const percent = budget.percent || 0;
  const isOver = percent >= 100;
  const isWarning = percent >= 80 && percent < 100;

  const statusColor = isOver
    ? 'text-[var(--red)]'
    : isWarning
      ? 'text-[var(--amber)]'
      : 'text-[var(--green)]';

  const progressColor = isOver
    ? 'bg-[var(--red)]'
    : isWarning
      ? 'bg-[var(--amber)]'
      : 'bg-[var(--accent)]';

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-[2rem] border bg-[var(--bg2)]/60 backdrop-blur-md p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-[var(--accent)]/5 hover:-translate-y-1',
        isOver ? 'border-[var(--red)]/30' : 'border-[var(--border)]',
      )}
    >
      {/* Background Decor */}
      <div className={cn(
        "absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl transition-opacity opacity-20 group-hover:opacity-40",
        isOver ? "bg-[var(--red)]" : "bg-[var(--accent)]"
      )} />

      <div className="relative mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg3)] text-2xl shadow-inner transition-transform group-hover:scale-110">
            {budget.category?.icon || '📦'}
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-[var(--text)]">
              {budget.category?.name}
            </h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text3)]">
              Monthly Limit
            </p>
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={onEdit}
          className="h-10 w-10 rounded-xl bg-[var(--bg3)] text-[var(--text3)] transition-all hover:bg-[var(--accent)] hover:text-white md:opacity-0 group-hover:opacity-100"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="mb-4 space-y-1">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-black tracking-tight text-[var(--text)]">
            {formatAmount(budget.spentAmount)}
          </span>
          <span className="text-xs font-medium text-[var(--text3)]">
            of {formatAmount(budget.budgetAmount)}
          </span>
        </div>
        
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-[var(--bg3)]/50">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-1000 ease-out',
              progressColor,
              percent >= 100 && 'animate-pulse'
            )}
            style={{ width: `${Math.min(100, percent)}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className={cn("flex items-center gap-1.5 text-xs font-bold", statusColor)}>
          {isOver ? <AlertCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          {percent}% {isOver ? 'Exceeded' : 'Used'}
        </div>
        <div className={cn("text-xs font-bold", statusColor)}>
          {isOver
            ? `+ ${formatAmount(budget.spentAmount - budget.budgetAmount)} Over`
            : `${formatAmount(budget.remaining)} left`}
        </div>
      </div>
      
      {/* Decorative Arrow */}
      <div className="absolute bottom-4 right-4 translate-x-4 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-20">
        <ArrowUpRight className="h-8 w-8 text-[var(--text)]" />
      </div>
    </div>
  );
};

export default Budget;
