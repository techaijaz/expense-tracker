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
import { useMediaQuery } from '@/hooks/use-media-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

dayjs.extend(relativeTime);

const Recurring = () => {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isMobile = useMediaQuery('(max-width: 640px)');
  
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
  const userObj = user?.user || user;
  const isPro = userObj?.role === 'admin' || userObj?.plan === 'pro';

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
    <div className="page-body p-4 sm:p-6 md:p-8 min-h-screen bg-bg pb-32 sm:pb-8">
      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-text">
            Standing Orders
          </h1>
          <p className="text-sm text-text3 font-medium">
            Manage autonomous and assisted recurring transactions.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative group flex-1 sm:w-64 md:w-80">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg opacity-40 group-focus-within:opacity-100 group-focus-within:text-accent transition-all z-10">
              🔍
            </span>
            <Input
              type="text"
              placeholder="Search protocols..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 bg-bg2 border border-border/60 rounded-2xl pl-12 pr-4 text-sm text-text font-medium outline-none focus-visible:ring-4 focus-visible:ring-accent/5 focus-visible:border-accent/40 transition-all placeholder:text-text3/30"
            />
          </div>
          {!isMobile && (
            <Button
              onClick={handleAddNew}
              className="h-12 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-accent to-accent2 px-6 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-accent/20 transition-all hover:scale-[1.02] active:scale-[0.98] border-none"
            >
              <span className="text-sm">{limitReached ? '🔒' : '+'}</span> Establish Rule
            </Button>
          )}
        </div>
      </div>

      {/* KPI Overview */}
      <div className="mb-10 flex flex-wrap gap-4">
        <KpiCard
          label="Est. Monthly Outflow"
          value={formatAmount(stats.monthlyOutflow, currency)}
          type="expense"
          icon="💸"
          subtext="Projected recurring expenses"
        />
        <KpiCard
          label="Active Protocols"
          value={stats.count}
          type="accent"
          icon="⚙️"
          subtext={`${stats.autoCount} automation rules active`}
        />
        <KpiCard
          label="Next Execution"
          value={stats.nextDue ? dayjs(stats.nextDue).format('D MMM') : 'N/A'}
          type="warning"
          icon="🕒"
          subtext={
            stats.nextDue ? dayjs(stats.nextDue).fromNow() : 'No upcoming tasks'
          }
        />
        <KpiCard
          label="System Health"
          value="100%"
          type="income"
          icon="✅"
          subtext="All standing orders processed"
        />
      </div>

      {/* Grid List */}
      {loading && tasks.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center space-y-6">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent shadow-lg shadow-accent/10" />
          <p className="text-xs font-black uppercase tracking-widest text-accent animate-pulse">
            Synchronizing rules…
          </p>
        </div>
      ) : tasks.length === 0 ? (
        <div
          onClick={handleAddNew}
          className="flex h-80 cursor-pointer flex-col items-center justify-center rounded-[40px] border-2 border-dashed border-border/40 bg-bg2/30 transition-all hover:bg-bg2/50 hover:border-accent/40 group"
        >
          <div className="mb-6 text-6xl group-hover:scale-110 transition-transform duration-500 grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100">
            {limitReached ? '🔒' : '🤖'}
          </div>
          <p className="text-lg font-black text-text tracking-tight">
            Zero automation rules found
          </p>
          <p className="mt-2 text-sm text-text3 font-medium max-w-[280px] text-center px-4">
            {limitReached
              ? 'Upgrade to PRO to unlock advanced automation protocols.'
              : 'Deploy your first recurring protocol to automate your financial life.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-6">
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

          {!limitReached && (
            <div
              onClick={handleAddNew}
              className="flex min-h-[220px] w-full sm:w-[calc(50%-12px)] xl:w-[calc(33.33%-16px)] cursor-pointer flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-border/40 bg-bg2/20 transition-all hover:bg-bg2/40 hover:border-accent/40 group"
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-bg3 text-2xl text-text3 group-hover:bg-accent group-hover:text-white transition-all duration-300 shadow-sm">
                +
              </div>
              <div className="text-[11px] font-black uppercase tracking-widest text-text mt-4">
                New Protocol
              </div>
              <div className="mt-1 text-[10px] font-medium text-text3">
                Deploy automated ledger rule
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile FAB */}
      {isMobile && !limitReached && !isPopupOpen && !isHistoryOpen && !isDeleteOpen && (
        <div className="fixed right-6 bottom-24 z-[99999] isolate">
          <Button
            size="icon"
            onClick={handleAddNew}
            className="h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent2 text-white shadow-[0_20px_50px_rgba(0,0,0,0.3),0_0_20px_var(--accent-glow)] active:scale-95 transition-all animate-in fade-in zoom-in duration-300 backdrop-blur-md border border-white/20 hover:opacity-90"
          >
            <span className="text-3xl font-light">+</span>
          </Button>
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

const KpiCard = ({ label, value, type, icon, subtext }) => {
  const typeStyles = {
    accent: 'border-b-accent shadow-accent/5',
    income: 'border-b-green shadow-green/5',
    expense: 'border-b-red shadow-red/5',
    warning: 'border-b-amber shadow-amber/5',
  };

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-[32px] border-b-[6px] bg-bg2 p-7 border border-border/40 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]',
        'w-full sm:w-[calc(50%-8px)] lg:w-[calc(25%-12px)]',
        typeStyles[type] || typeStyles.accent,
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-bg3/50 text-2xl group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div className="h-1 w-12 rounded-full bg-border/40" />
      </div>
      <div className="space-y-1">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-text3">
          {label}
        </div>
        <div className="font-mono text-3xl font-black tracking-tighter text-text">
          {value}
        </div>
        {subtext && (
          <div className="text-[10px] font-medium text-text3 opacity-70">
            {subtext}
          </div>
        )}
      </div>
      
      {/* Decorative Glow */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-accent/5 blur-3xl rounded-full" />
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
        'group relative rounded-[36px] border bg-bg2 p-7 transition-all duration-300 hover:shadow-2xl hover:translate-y-[-4px]',
        'w-full sm:w-[calc(50%-12px)] xl:w-[calc(33.33%-16px)]',
        isActive
          ? 'border-border/60 shadow-lg shadow-black/10'
          : 'border-border/40 opacity-60 grayscale-[0.5]',
      )}
    >
      {/* Header Info */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bg3/50 text-3xl border border-border/40 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
            {task.categoryId?.icon || (task.type === 'TRANSFER' ? '⇄' : '📝')}
          </div>
          <div>
            <h3 className="text-base font-black text-text tracking-tight mb-1">
              {task.title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[10px] font-black text-text3 uppercase tracking-widest">
                {task.accountId?.name}
              </span>
              {task.toAccountId && (
                <>
                  <span className="text-text3/30">→</span>
                  <span className="text-[10px] font-black text-accent uppercase tracking-widest">
                    {task.toAccountId?.name}
                  </span>
                </>
              )}
              <div className="h-1 w-1 rounded-full bg-border/60 mx-1" />
              <span className="text-[10px] font-black text-accent uppercase tracking-widest">
                {task.frequency}
              </span>
            </div>
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          onClick={onToggle}
          className={cn(
            'relative h-7 w-12 rounded-full p-1.5 transition-all duration-500 ease-in-out border border-black/5',
            isActive ? 'bg-green' : 'bg-bg4',
          )}
        >
          <div
            className={cn(
              'h-4 w-4 rounded-full bg-white shadow-lg transition-transform duration-500 ease-in-out',
              isActive ? 'translate-x-5' : 'translate-x-0',
            )}
          />
        </button>
      </div>

      {/* Financials Section */}
      <div className="mb-6 bg-bg3/30 rounded-3xl p-5 flex items-center justify-between border border-border/20 backdrop-blur-sm">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-text3 mb-1.5">
            Protocol Amount
          </p>
          <p
            className={cn(
              'font-mono text-2xl font-black tracking-tighter',
              task.type === 'INCOME' ? 'text-green' : 'text-text',
            )}
          >
            {task.type === 'INCOME' ? '+' : '-'}
            {formatAmount(task.amount, currency)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black uppercase tracking-widest text-text3 mb-1.5">
            Next Settlement
          </p>
          <p className="text-xs font-black text-text tracking-tight">
            {dayjs(task.nextDueDate).format('DD MMM, YYYY')}
          </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors',
              task.entryType === 'auto'
                ? 'bg-accent/10 text-accent'
                : 'bg-warning/10 text-warning',
            )}
          >
            {task.entryType === 'auto' ? 'Autonomous' : 'Assisted'}
          </div>
          <Button
            variant="ghost"
            onClick={onHistory}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg3 text-[9px] font-black uppercase tracking-widest text-text3 hover:bg-bg4 hover:text-text transition-all h-auto"
          >
            <span>📜</span> Logs
          </Button>
        </div>

        <div className="flex gap-2.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-10 w-10 flex items-center justify-center rounded-2xl bg-bg3 text-text3 hover:text-accent hover:bg-accent/10 transition-all border border-border/40 hover:border-accent/40"
            title="Configure Rule"
          >
            <span className="material-symbols-outlined !text-[18px]">
              settings
            </span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-10 w-10 flex items-center justify-center rounded-2xl bg-bg3 text-text3 hover:text-red hover:bg-red/10 transition-all border border-border/40 hover:border-red/40"
            title="Terminate Protocol"
          >
            <span className="material-symbols-outlined !text-[18px]">
              close
            </span>
          </Button>
        </div>
      </div>

      {/* Hover Gradient Overlay */}
      <div className="absolute inset-0 rounded-[36px] bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500" />
    </div>
  );
};

export default Recurring;
