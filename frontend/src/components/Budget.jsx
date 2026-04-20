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
  const plan = user?.user?.plan || user?.plan || 'basic';
  const isPro = plan === 'pro';

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
    <div className="page-body p-6">
      {/* KPI Header Grid */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Budgeted"
          value={formatAmount(stats.totalBudgeted)}
          color="blue"
          icon="💰"
        />
        <KpiCard
          label="Total Spent"
          value={formatAmount(stats.totalSpent)}
          color="red"
          icon="🛍️"
        />
        <KpiCard
          label="Remaining"
          value={formatAmount(stats.remaining)}
          color="green"
          icon="🔋"
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
        />
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#EEF0F8]">
            Monthly Budgets
          </h2>
          <p className="text-xs text-[#8892B0]">
            Track spending across your active categories.
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex h-10 items-center gap-2 rounded-lg bg-[#5B8DEF] px-4 text-sm font-semibold text-white transition-all hover:bg-[#4070D4] hover:-translate-y-0.5"
        >
          <span>{limitReached ? '🔒' : '+'}</span> Add Budget
        </button>
      </div>

      {loading && budgets.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5B8DEF] border-t-transparent" />
        </div>
      ) : budgets.length === 0 ? (
        <div
          onClick={handleAddNew}
          className="flex h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.02] transition-all hover:bg-white/[0.04] hover:border-white/10"
        >
          <div className="mb-4 text-4xl">💰</div>
          <p className="text-sm font-semibold text-[#EEF0F8]">
            No budgets defined yet
          </p>
          <p className="mt-1 text-xs text-[#8892B0]">
            Click to set your first spending limit
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget, idx) => (
            <BudgetCard
              key={budget.category?._id || idx}
              budget={budget}
              onEdit={() => handleEdit(budget)}
            />
          ))}

          <div
            onClick={handleAddNew}
            className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.02] transition-all hover:bg-white/[0.04] hover:border-white/10"
          >
            <div className="text-2xl text-[#4A5578]">+</div>
            <div className="text-sm font-bold text-[#EEF0F8]">Add Budget</div>
            <div className="mt-1 text-[10px] text-[#4A5578]">
              Set a new category limit
            </div>
          </div>
        </div>
      )}

      <AddBudgetPopup
        open={isPopupOpen}
        setOpen={setIsPopupOpen}
        editBudget={editingBudget}
        onSuccess={fetchBudgets}
      />
    </div>
  );
};

const KpiCard = ({ label, value, color, icon, subtext }) => {
  const colorMap = {
    blue: 'border-b-[#5B8DEF]',
    red: 'border-b-[#FF6B6B]',
    green: 'border-b-[#2DD4A0]',
    amber: 'border-b-[#F5A623]',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border-b-2 bg-[#0E1220] p-5 border border-white/5 shadow-lg',
        colorMap[color],
      )}
    >
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.03] text-lg">
        {icon}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-[#4A5578]">
        {label}
      </div>
      <div className="mt-1 font-mono text-2xl font-bold tracking-tight text-[#EEF0F8]">
        {value}
      </div>
      {subtext && (
        <div className="mt-2 text-[10px] text-[#8892B0]">{subtext}</div>
      )}
    </div>
  );
};

const BudgetCard = ({ budget, onEdit }) => {
  const { formatAmount } = useFormat();
  const percent = budget.percent || 0;
  const isOver = percent >= 100;
  const isWarning = percent >= 80 && percent < 100;

  const statusColor = isOver ? 'red' : isWarning ? 'amber' : 'green';
  const barColor = isOver
    ? 'bg-[#FF6B6B]'
    : isWarning
      ? 'bg-[#F5A623]'
      : 'bg-[#2DD4A0]';
  const textColor = isOver
    ? 'text-[#FF6B6B]'
    : isWarning
      ? 'text-[#F5A623]'
      : 'text-[#2DD4A0]';

  return (
    <div
      className={cn(
        'group relative rounded-2xl border bg-[#0E1220] p-5 transition-all hover:shadow-xl hover:border-white/10',
        isOver ? 'border-[#FF6B6B]/20 shadow-[#FF6B6B]/5' : 'border-white/5',
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.03] text-xl">
            {budget.category?.icon || '📦'}
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#EEF0F8]">
              {budget.category?.name}
            </h3>
            <p
              className={cn(
                'text-[10px] uppercase font-bold tracking-wider',
                isOver ? 'text-[#FF6B6B]' : 'text-[#8892B0]',
              )}
            >
              {isOver ? '⚡ Budget Exceeded!' : 'Monthly Limit'}
            </p>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-[#8892B0] opacity-0 transition-opacity hover:bg-white/10 hover:text-white group-hover:opacity-100"
        >
          <span className="material-symbols-outlined !text-lg">edit</span>
        </button>
      </div>

      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-mono text-xl font-bold text-[#EEF0F8]">
          {formatAmount(budget.spentAmount)}
        </span>
        <span className="text-xs text-[#8892B0]">
          of {formatAmount(budget.budgetAmount)}
        </span>
      </div>

      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-white/[0.03]">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            barColor,
          )}
          style={{ width: `${percent}%` }}
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
