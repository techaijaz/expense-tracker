import { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import useApi from '@/hooks/useApi';
import api from '@/utils/httpMethods';
import AddBudgetPopup from './AddBudgetPopup';
import useFormat from '@/hooks/useFormat';
import { cn } from '@/utils/utils';

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
      {/* KPI Header Grid - Using Flexbox for wrapping responsiveness */}
      <div className="mb-6 flex flex-wrap gap-3 md:gap-4">
        <KpiCard
          label="Total Budgeted"
          value={formatAmount(stats.totalBudgeted)}
          color="blue"
          icon="💰"
          className="flex-1 min-w-[160px] md:min-w-[220px]"
        />
        <KpiCard
          label="Total Spent"
          value={formatAmount(stats.totalSpent)}
          color="red"
          icon="🛍️"
          className="flex-1 min-w-[160px] md:min-w-[220px]"
        />
        <KpiCard
          label="Remaining"
          value={formatAmount(stats.remaining)}
          color="green"
          icon="🔋"
          className="flex-1 min-w-[160px] md:min-w-[220px]"
        />
        <KpiCard
          label="Over Budget"
          value={`${stats.overBudgetCount} ${stats.overBudgetCount === 1 ? 'item' : 'items'}`}
          color="amber"
          icon="⚠️"
          subtext={
            stats.overBudgetCount > 0
              ? 'Review high-spend areas'
              : 'All within limits'
          }
          className="flex-1 min-w-[160px] md:min-w-[220px]"
        />
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text)]">
            Monthly Budgets
          </h2>
          <p className="text-xs text-[var(--text2)]">
            Track spending across your active categories.
          </p>
        </div>
        {/* Hide default button on mobile, show floating one instead */}
        <button
          onClick={handleAddNew}
          className="hidden md:flex h-10 items-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-white transition-all hover:opacity-90 hover:-translate-y-0.5 active:scale-95"
        >
          <span>{limitReached ? '🔒' : '+'}</span> Add Budget
        </button>
      </div>

      {loading && budgets.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
        </div>
      ) : budgets.length === 0 ? (
        <div
          onClick={handleAddNew}
          className="flex h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--bg2)]/50 transition-all hover:bg-[var(--bg3)]/50 hover:border-[var(--accent)]/30 group"
        >
          <div className="mb-4 text-4xl group-hover:scale-110 transition-transform">💰</div>
          <p className="text-sm font-semibold text-[var(--text)]">
            No budgets defined yet
          </p>
          <p className="mt-1 text-xs text-[var(--text2)]">
            Click to set your first spending limit
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            className="hidden md:flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--bg2)]/50 transition-all hover:bg-[var(--bg3)]/50 hover:border-[var(--accent)]/30 group"
          >
            <div className="text-2xl text-[var(--text3)] group-hover:scale-125 transition-transform">+</div>
            <div className="text-sm font-bold text-[var(--text)]">Add Budget</div>
            <div className="mt-1 text-[10px] text-[var(--text3)] text-center px-4">
              Set a new category limit
            </div>
          </div>
        </div>
      )}

      {/* Floating Add Button for Mobile */}
      <button
        onClick={handleAddNew}
        className="md:hidden fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/30 active:scale-90 transition-transform"
      >
        <span className="material-symbols-outlined !text-3xl">add</span>
      </button>

      <AddBudgetPopup
        open={isPopupOpen}
        setOpen={setIsPopupOpen}
        editBudget={editingBudget}
        onSuccess={fetchBudgets}
      />
    </div>
  );
};

const KpiCard = ({ label, value, color, icon, subtext, className }) => {
  const colorMap = {
    blue: 'border-b-[var(--accent)]',
    red: 'border-b-[var(--red)]',
    green: 'border-b-[var(--green)]',
    amber: 'border-b-[var(--amber)]',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border-b-2 bg-[var(--bg2)] p-4 md:p-5 border border-[var(--border)] shadow-md transition-all hover:shadow-lg',
        colorMap[color],
        className,
      )}
    >
      <div className="mb-3 flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg bg-[var(--bg3)] text-lg">
        {icon}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text3)]">
        {label}
      </div>
      <div className="mt-1 font-mono text-xl md:text-2xl font-bold tracking-tight text-[var(--text)]">
        {value}
      </div>
      {subtext && (
        <div className="mt-2 text-[10px] text-[var(--text2)]">{subtext}</div>
      )}
    </div>
  );
};

const BudgetCard = ({ budget, onEdit }) => {
  const { formatAmount } = useFormat();
  const percent = budget.percent || 0;
  const isOver = percent >= 100;
  const isWarning = percent >= 80 && percent < 100;

  const barColor = isOver
    ? 'bg-[var(--red)]'
    : isWarning
      ? 'bg-[var(--amber)]'
      : 'bg-[var(--green)]';
  const textColor = isOver
    ? 'text-[var(--red)]'
    : isWarning
      ? 'text-[var(--amber)]'
      : 'text-[var(--green)]';

  return (
    <div
      className={cn(
        'group relative rounded-2xl border bg-[var(--bg2)] p-4 md:p-5 transition-all hover:shadow-xl',
        isOver ? 'border-[var(--red)]/30 shadow-[var(--red)]/5' : 'border-[var(--border)]',
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--bg3)] text-xl">
            {budget.category?.icon || '📦'}
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text)]">
              {budget.category?.name}
            </h3>
            <p
              className={cn(
                'text-[10px] uppercase font-bold tracking-wider',
                isOver ? 'text-[var(--red)]' : 'text-[var(--text2)]',
              )}
            >
              {isOver ? '⚡ Budget Exceeded!' : 'Monthly Limit'}
            </p>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg3)] text-[var(--text2)] transition-all hover:bg-[var(--accent)] hover:text-white md:opacity-0 group-hover:opacity-100"
        >
          <span className="material-symbols-outlined !text-lg">edit</span>
        </button>
      </div>

      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-mono text-xl font-bold text-[var(--text)]">
          {formatAmount(budget.spentAmount)}
        </span>
        <span className="text-xs text-[var(--text2)]">
          of {formatAmount(budget.budgetAmount)}
        </span>
      </div>

      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-[var(--bg3)]">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            barColor,
          )}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] font-semibold">
        <span className={cn(textColor)}>{percent}% used</span>
        <span className={cn(textColor)}>
          {isOver
            ? `🚨 Over by ${formatAmount(budget.spentAmount - budget.budgetAmount)}`
            : `${percent >= 80 ? '⚠' : '✓'} ${formatAmount(budget.remaining)} left`}
        </span>
      </div>
    </div>
  );
};

export default Budget;
