import { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import useApi from '@/hooks/useApi';
import api from '@/utils/httpMethods';
import { getCurrencySymbol, formatAmount } from '@/utils/format';
import { cn, formatDate } from '@/utils/utils';
import AddRecurringPopup from './AddRecurringPopup';
import RecurringHistoryPopup from './RecurringHistoryPopup';
import { DeleteConfirmModal } from './SharedComponents';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const Recurring = () => {
  const [tasks, setTasks] = useState([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [search, setSearch] = useState('');

  const { loading, makeRequest } = useApi();

  const preferences = useSelector(
    (state) =>
      state.auth.user?.user?.preferences || state.auth.user?.preferences,
  );
  const { currency = 'INR' } = preferences || {};
  const currencySymbol = getCurrencySymbol(currency);

  const fetchTasks = async () => {
    try {
      const res = await makeRequest({
        url: '/recurring',
        method: 'get',
      });
      if (res) {
        setTasks(res.data || []);
      }
    } catch (error) {
      toast.error('Failed to load standing orders');
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleToggleStatus = async (task) => {
    try {
      const res = await api.patch(`/recurring/${task._id}/toggle`);
      if (res.data) {
        toast.success(
          `Rule ${task.status === 'ACTIVE' ? 'Paused' : 'Resumed'}`,
        );
        fetchTasks();
      }
    } catch (error) {
      toast.error('Toggle failed');
    }
  };

  const handleDelete = async () => {
    if (!selectedTask) return;
    try {
      await api.delete(`/recurring/${selectedTask._id}`);
      toast.success('Standing order terminated');
      fetchTasks();
      setIsDeleteOpen(false);
    } catch (error) {
      toast.error('Termination failed');
    }
  };

  const stats = useMemo(() => {
    const activeTasks = tasks.filter((t) => t.status === 'ACTIVE');
    const monthlyOutflow = activeTasks.reduce((acc, t) => {
      if (t.type !== 'EXPENSE') return acc;
      let factor = 1;
      switch (t.frequency) {
        case 'DAILY':
          factor = 30;
          break;
        case 'WEEKLY':
          factor = 4.3;
          break;
        case 'QUARTERLY':
          factor = 1 / 3;
          break;
        case 'YEARLY':
          factor = 1 / 12;
          break;
      }
      return acc + t.amount * factor;
    }, 0);

    const nextTasks = activeTasks.sort(
      (a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate),
    );
    const nextDue = nextTasks[0]?.nextDueDate;

    return {
      count: activeTasks.length,
      monthlyOutflow,
      nextDue,
      autoCount: activeTasks.filter((t) => t.entryType === 'auto').length,
    };
  }, [tasks]);

  const filteredTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.categoryId?.name?.toLowerCase() || '').includes(search.toLowerCase()),
  );

  const { user } = useSelector((state) => state.auth);
  const plan = user?.user?.plan || user?.plan || 'basic';
  const isPro = plan === 'pro';

  const limitReached = !isPro && tasks.length >= 1;

  const handleAddNew = () => {
    if (limitReached) {
      toast.error(
        'Basic plan limit reached (1 recurring rule). Upgrade to PRO to add more.',
      );
      return;
    }
    setSelectedTask(null);
    setIsPopupOpen(true);
  };

  return (
    <div className="page-body p-6 min-h-screen bg-[#080B12]">
      {/* KPI Header */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Est. Monthly Outflow"
          value={formatAmount(stats.monthlyOutflow, currency)}
          color="red"
          icon="💸"
          subtext="Projected recurring expenses"
        />
        <KpiCard
          label="Active Rules"
          value={stats.count}
          color="blue"
          icon="⚙️"
          subtext={`${stats.autoCount} automation protocols active`}
        />
        <KpiCard
          label="Next Execution"
          value={stats.nextDue ? dayjs(stats.nextDue).format('D MMM') : 'N/A'}
          color="amber"
          icon="🕒"
          subtext={
            stats.nextDue ? dayjs(stats.nextDue).fromNow() : 'No upcoming tasks'
          }
        />
        <KpiCard
          label="Compliance Rate"
          value="100%"
          color="green"
          icon="✅"
          subtext="All standing orders processed"
        />
      </div>

      {/* Header Actions */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#EEF0F8]">
            Standing Orders
          </h2>
          <p className="text-xs text-[#8892B0]">
            Manage autonomous and assisted recurring transactions.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs opacity-40">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search protocols..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 bg-[#0E1220] border border-white/5 rounded-xl px-9 text-xs text-[#EEF0F8] outline-none focus:border-[#5B8DEF]/30"
            />
          </div>
          <button
            onClick={handleAddNew}
            className="flex h-10 items-center gap-2 rounded-xl bg-[#5B8DEF] px-5 text-xs font-bold text-white transition-all hover:bg-[#4070D4] hover:-translate-y-0.5 shadow-lg shadow-[#5B8DEF]/10"
          >
            <span>{limitReached ? '🔒' : '+'}</span> Establish Rule
          </button>
        </div>
      </div>

      {loading && tasks.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center space-y-4 opacity-50">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5B8DEF] border-t-transparent" />
          <p className="text-xs font-mono tracking-tighter text-[#5B8DEF]">
            Synchronizing rules from cloud…
          </p>
        </div>
      ) : tasks.length === 0 ? (
        <div
          onClick={handleAddNew}
          className="flex h-64 cursor-pointer flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-white/5 bg-white/[0.01] transition-all hover:bg-white/[0.03] hover:border-white/10"
        >
          <div className="mb-4 text-5xl opacity-40">
            {limitReached ? '🔒' : '🤖'}
          </div>
          <p className="text-sm font-semibold text-[#EEF0F8]">
            Zero automation rules found
          </p>
          <p className="mt-1 text-xs text-[#4A5578]">
            {limitReached
              ? 'Upgrade to PRO to automate transactions'
              : 'Click to automate your first recurring transaction'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filteredTasks.map((task) => (
            <RecurringCard
              key={task._id}
              task={task}
              currency={currency}
              onEdit={() => {
                setSelectedTask(task);
                setIsPopupOpen(true);
              }}
              onHistory={() => {
                setSelectedTask(task);
                setIsHistoryOpen(true);
              }}
              onDelete={() => {
                setSelectedTask(task);
                setIsDeleteOpen(true);
              }}
              onToggle={() => handleToggleStatus(task)}
            />
          ))}

          <div
            onClick={handleAddNew}
            className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-white/5 bg-white/[0.01] transition-all hover:bg-white/[0.03] group"
          >
            <div className="text-2xl text-[#4A5578] group-hover:text-[#5B8DEF] transition-colors">
              {limitReached ? '🔒' : '+'}
            </div>
            <div className="text-xs font-bold text-[#EEF0F8] mt-2">
              New Protocol
            </div>
            <div className="mt-1 text-[10px] text-[#4A5578]">
              {limitReached ? 'Limit Reached' : 'Deploy automated ledger rule'}
            </div>
          </div>
        </div>
      )}

      {/* Popups */}
      <AddRecurringPopup
        open={isPopupOpen}
        setOpen={setIsPopupOpen}
        editTask={selectedTask}
        onSuccess={fetchTasks}
      />

      <RecurringHistoryPopup
        open={isHistoryOpen}
        setOpen={setIsHistoryOpen}
        task={selectedTask}
      />

      {isDeleteOpen && (
        <DeleteConfirmModal
          title="Terminate Rule?"
          description={`This will permanently delete the automation rule for "${selectedTask?.title}". Existing transactions will not be affected.`}
          onConfirm={handleDelete}
          onCancel={() => setIsDeleteOpen(false)}
        />
      )}
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
        'relative overflow-hidden rounded-[24px] border-b-4 bg-[#0E1220] p-6 border border-white/5 shadow-xl transition-transform hover:scale-[1.02]',
        colorMap[color],
      )}
    >
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.03] text-xl">
        {icon}
      </div>
      <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#4A5578]">
        {label}
      </div>
      <div className="mt-1.5 font-mono text-2xl font-bold tracking-tighter text-[#EEF0F8]">
        {value}
      </div>
      {subtext && (
        <div className="mt-2.5 text-[10px] font-medium text-[#8892B0] opacity-80">
          {subtext}
        </div>
      )}
    </div>
  );
};

const RecurringCard = ({
  task,
  currency,
  onEdit,
  onHistory,
  onDelete,
  onToggle,
}) => {
  const isActive = task.status === 'ACTIVE';

  return (
    <div
      className={cn(
        'group relative rounded-[28px] border bg-[#0E1220] p-6 transition-all hover:shadow-2xl hover:border-white/10',
        isActive
          ? 'border-white/5 shadow-lg shadow-black/20'
          : 'border-white/5 opacity-60 grayscale-[0.5]',
      )}
    >
      {/* Header Info */}
      <div className="mb-5 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#141928] text-2xl border border-white/5 group-hover:scale-110 transition-transform">
            {task.categoryId?.icon || (task.type === 'TRANSFER' ? '⇄' : '📝')}
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#EEF0F8] leading-none mb-1.5">
              {task.title}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#8892B0] uppercase tracking-wide">
                {task.accountId?.name}{' '}
                {task.toAccountId ? `→ ${task.toAccountId?.name}` : ''}
              </span>
              <span className="h-1 w-1 rounded-full bg-[#4A5578]" />
              <span className="text-[10px] font-bold text-[#5B8DEF] uppercase tracking-wide">
                {task.frequency}
              </span>
            </div>
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          onClick={onToggle}
          className={cn(
            'relative h-6 w-11 rounded-full p-1 transition-all duration-300',
            isActive ? 'bg-[#2DD4A0]' : 'bg-[#1C2235]',
          )}
        >
          <div
            className={cn(
              'h-4 w-4 rounded-full bg-white shadow-md transition-transform duration-300',
              isActive ? 'translate-x-5' : 'translate-x-0',
            )}
          />
        </button>
      </div>

      {/* Financials */}
      <div className="mb-5 bg-[#141928] rounded-2xl p-4 flex items-center justify-between border border-white/[0.02]">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#4A5578] mb-1">
            Execution Amount
          </p>
          <p
            className={cn(
              'font-mono text-xl font-black tracking-tight',
              task.type === 'INCOME' ? 'text-[#2DD4A0]' : 'text-[#EEF0F8]',
            )}
          >
            {task.type === 'INCOME' ? '+' : '-'}
            {formatAmount(task.amount, currency)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#4A5578] mb-1">
            Next Settlement
          </p>
          <p className="text-[11px] font-bold text-[#8892B0]">
            {formatDate(task.nextDueDate)}
          </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-colors',
              task.entryType === 'auto'
                ? 'bg-[#5B8DEF]/10 text-[#5B8DEF]'
                : 'bg-[#F5A623]/10 text-[#F5A623]',
            )}
          >
            {task.entryType === 'auto' ? 'Autonomous' : 'Assisted'}
          </div>
          <button
            onClick={onHistory}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 text-[9px] font-bold text-[#8892B0] hover:bg-white/10 hover:text-[#EEF0F8] transition-all"
          >
            <span>📜</span> View Logs
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="h-8 w-8 flex items-center justify-center rounded-xl bg-[#141928] text-[#8892B0] hover:text-[#5B8DEF] hover:bg-[#5B8DEF]/10 transition-all border border-white/5"
            title="Configure Rule"
          >
            <span className="material-symbols-outlined !text-[16px]">
              settings
            </span>
          </button>
          <button
            onClick={onDelete}
            className="h-8 w-8 flex items-center justify-center rounded-xl bg-[#141928] text-[#8892B0] hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/10 transition-all border border-white/5"
            title="Terminate Protocol"
          >
            <span className="material-symbols-outlined !text-[16px]">
              close
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Recurring;
