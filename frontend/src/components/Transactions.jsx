import { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useOutletContext } from 'react-router-dom';
import useApi from '@/hooks/useApi';
import {
  setTransactions,
  deleteTransaction,
} from '@/redux/transactionSlice';
import { updateAccount } from '@/redux/accountSlice';
import useFormat from '@/hooks/useFormat';
import { DateRangePicker } from './DateRangePicker';
import { DeleteConfirmModal } from './SharedComponents';
import TransactionPopup from './TransactionPopup';
import { toast } from 'sonner';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Activity,
  ArrowRightLeft,
  Search,
  TrendingUp,
  TrendingDown,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar,
  Filter,
} from 'lucide-react';
import PremiumKpiCard from '@/components/ui/PremiumKpiCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import api from '@/utils/httpMethods';
import { cn } from '@/utils/utils';

export default function Transactions() {
  const dispatch = useDispatch();
  const { openTransactionPopup } = useOutletContext();
  const { user } = useSelector((state) => state.auth);
  const userObj = user?.user || user;
  const isPro = userObj?.role === 'admin' || userObj?.plan === 'pro';
  const plan = userObj?.plan || 'basic';

  const { transactions } = useSelector((state) => state.transactions);

  const { categories: groupedCategories } = useSelector(
    (state) => state.category,
  );
  const categories = useMemo(() => {
    const {
      INCOME = [],
      EXPENSE = [],
      TRANSFER = [],
    } = groupedCategories || {};
    return [...INCOME, ...EXPENSE, ...TRANSFER];
  }, [groupedCategories]);
  const { accounts = [] } = useSelector((state) => state.accounts);
  const { data, makeRequest, loading } = useApi();

  // Filter & Pagination State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [account, setAccount] = useState('all');
  const [type, setType] = useState('all');
  const [party, setParty] = useState('all');
  const [parties, setParties] = useState([]);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [overview, setOverview] = useState(null);

  // Fetch Parties
  useEffect(() => {
    const fetchParties = async () => {
      try {
        const res = await api.get('/parties');
        setParties(res.data || []);
      } catch (e) {
        console.error('Failed to fetch parties');
      }
    };
    fetchParties();
  }, []);

  // Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Logic
  const fetchTransactions = useCallback(() => {
    const params = {
      page,
      limit,
      search: debouncedSearch || undefined,
      categoryId: category !== 'all' ? category : undefined,
      accountId: account !== 'all' ? account : undefined,
      type: type !== 'all' ? type : undefined,
      partyId: party !== 'all' ? party : undefined,
      dateFrom: dateRange?.from?.toISOString(),
      dateTo: dateRange?.to?.toISOString(),
    };
    makeRequest({ url: '/transactions', method: 'get', params });
  }, [
    page,
    limit,
    debouncedSearch,
    category,
    account,
    type,
    party,
    dateRange,
    makeRequest,
  ]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Fetch Overview for Trends
  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const params = {
          startDate: dateRange?.from?.toISOString(),
          endDate: dateRange?.to?.toISOString(),
        };
        const res = await api.get('/reports/overview', { params });
        setOverview(res.data.data);
      } catch (e) {
        console.error('Failed to fetch overview');
      }
    };
    fetchOverview();
  }, [dateRange]);

  useEffect(() => {
    if (data) {
      dispatch(setTransactions(data?.data || data?.transactions || data));
    }
  }, [data, dispatch]);

  const list = useMemo(
    () => (Array.isArray(transactions) ? transactions : []),
    [transactions],
  );

  // Summary — use overview API totals (full date-range), fall back to paginated list if not loaded yet
  // The /reports/overview endpoint returns: { currentMonth: { income, expense, savings }, comparison: {...} }
  const inflow = overview?.currentMonth?.income ?? list
    .filter((t) => t && ['INCOME', 'income'].includes(t.type || t.categoryType))
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const outflow = overview?.currentMonth?.expense ?? list
    .filter(
      (t) => t && ['EXPENSE', 'expense'].includes(t.type || t.categoryType),
    )
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const netPrecision = inflow - outflow;

  const { formatAmount, formatDate } = useFormat();

  // Handlers
  const handleEdit = (t) => {
    setEditingTransaction(t);
    setIsEditOpen(true);
  };

  const handleDeleteClick = (id) => {
    setDeletingId(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const res = await api.delete(`/transactions/${deletingId}`);
      dispatch(deleteTransaction(deletingId));
      if (res?.data?.updatedAccounts) {
        res.data.updatedAccounts.forEach((acc) => {
          dispatch(updateAccount(acc));
        });
      }
      toast.success('Transaction deleted');
      window.dispatchEvent(new CustomEvent('refetch-system-metrics'));
      setIsDeleteOpen(false);
    } catch (err) {
      toast.error('Failed to delete transaction');
    }
  };

  // Type badge helper
  const getTypeBadge = (t) => {
    const base = 'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider';
    if (!t) return { cls: `${base} bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20`, label: 'Unknown' };
    const typeName = (t.type || 'expense').toLowerCase();
    if (typeName === 'income')
      return { cls: `${base} bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20`, label: '↓ Income' };
    if (typeName === 'transfer')
      return { cls: `${base} bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20`, label: '⇄ Transfer' };
    if (typeName === 'debt') {
      const sub = (t.debtType || '').toLowerCase();
      if (sub === 'repayment')
        return { cls: `${base} bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20`, label: '↑ Repayment' };
      return { cls: `${base} bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20`, label: '↓ Debt' };
    }
    return { cls: `${base} bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20`, label: '↑ Expense' };
  };

  const getAmountDisplay = (t) => {
    const base = 'font-mono font-semibold text-sm text-right whitespace-nowrap';
    if (!t) return { cls: `${base} text-muted-foreground`, prefix: '' };
    const typeName = (t.type || 'expense').toLowerCase();
    if (typeName === 'income') return { cls: `${base} text-green-600 dark:text-green-400`, prefix: '+' };
    if (typeName === 'transfer') return { cls: `${base} text-muted-foreground`, prefix: '' };
    if (typeName === 'debt') {
      // BORROWED = money received (+), LENT = money paid out (-)
      const sub = (t.debtType || '').toUpperCase();
      if (sub === 'BORROWED') return { cls: `${base} text-green-600 dark:text-green-400`, prefix: '+' };
      return { cls: `${base} text-red-600 dark:text-red-400`, prefix: '-' }; // LENT or unknown
    }
    if (typeName === 'repayment') {
      // REPAYMENT_IN = collecting back (money received, +), REPAYMENT_OUT = paying back (-)
      const sub = (t.debtType || '').toUpperCase();
      if (sub === 'REPAYMENT_IN' || sub === 'REPAY_IN') return { cls: `${base} text-green-600 dark:text-green-400`, prefix: '+' };
      return { cls: `${base} text-red-600 dark:text-red-400`, prefix: '-' };
    }
    return { cls: `${base} text-red-600 dark:text-red-400`, prefix: '-' };
  };

  const totalRecords =
    data?.pagination?.total ||
    (data?.transactions ? data.transactions.length : list.length);
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const startRecord = totalRecords > 0 ? (page - 1) * limit + 1 : 0;
  const endRecord = Math.min(page * limit, totalRecords);

  return (
    <div className="p-4 md:p-6 flex flex-col gap-4 bg-background min-h-full">
      {/* ── SUMMARY KPI CARDS ── */}
      <div className="flex flex-wrap gap-4 mb-2">
        <PremiumKpiCard
          title="Total Inflow"
          value={formatAmount(inflow)}
          subtitle="Money arriving"
          icon={ArrowDownLeft}
          color="green"
          trend={overview?.comparison?.incomeChange !== undefined && inflow > 0 ? {
            value: `${Math.abs(overview.comparison.incomeChange)}%`,
            direction: overview.comparison.incomeChange >= 0 ? 'up' : 'down',
            label: 'vs last month'
          } : null}
          delay={100}
          className="flex-1 min-w-[280px]"
        />
        <PremiumKpiCard
          title="Total Outflow"
          value={formatAmount(outflow)}
          subtitle="Money leaving"
          icon={ArrowUpRight}
          color="red"
          trend={overview?.comparison?.expenseChange !== undefined && outflow > 0 ? {
            value: `${Math.abs(overview.comparison.expenseChange)}%`,
            direction: overview.comparison.expenseChange <= 0 ? 'up' : 'down',
            label: 'vs last month'
          } : null}
          delay={200}
          className="flex-1 min-w-[280px]"
        />
        <PremiumKpiCard
          title="Net Precision"
          value={`${netPrecision >= 0 ? '+' : ''}${formatAmount(netPrecision)}`}
          subtitle="Net flow summary"
          icon={netPrecision >= 0 ? TrendingUp : TrendingDown}
          color={netPrecision >= 0 ? 'green' : 'red'}
          badge={netPrecision !== 0 ? {
            text: netPrecision >= 0 ? 'Surplus' : 'Deficit',
            variant: netPrecision >= 0 ? 'success' : 'error'
          } : null}
          trend={overview?.comparison?.savingsChange !== undefined && (inflow > 0 || outflow > 0) ? {
            value: `${Math.abs(overview.comparison.savingsChange)}%`,
            direction: overview.comparison.savingsChange >= 0 ? 'up' : 'down',
            label: 'vs last month'
          } : null}
          delay={300}
          className="flex-1 min-w-[280px]"
        />
        <PremiumKpiCard
          title="Movements"
          value={totalRecords}
          subtitle="Total recorded activity"
          icon={Activity}
          color="primary"
          delay={400}
          className="flex-1 min-w-[280px]"
        />
      </div>

      {/* ── CONTROL CENTER (Filters) ── */}
      <Card className="border-border/40 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden">
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold ml-1">Search</label>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                className="pl-9 h-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all"
                placeholder="Description, category…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold ml-1">Date Range</label>
            <DateRangePicker value={dateRange} onChange={setDateRange} />
          </div>

          {/* Flow Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold ml-1">Flow Type</label>
            <Select
              value={type}
              onValueChange={(val) => {
                setType(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 bg-background/50 border-border/50 focus:border-primary/50">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                  <SelectValue placeholder="All Flows" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Flows</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
                <SelectItem value="debt">Debt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Account */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold ml-1">Account</label>
            <Select
              value={account}
              onValueChange={(val) => {
                setAccount(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 bg-background/50 border-border/50 focus:border-primary/50">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                  <SelectValue placeholder="All Accounts" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {accounts.filter(a => !a.isDeleted).map((a) => (
                  <SelectItem key={a._id} value={a._id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Secondary Filters Row */}
        <div className={cn(
          "px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end border-t border-border/30 pt-4",
          !isPro && "opacity-60 grayscale-[0.5]"
        )}>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold ml-1 flex items-center gap-1.5">
              Category {!isPro && <span className="text-[8px] bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-full">PRO 🔒</span>}
            </label>
            <Select
              value={category}
              onValueChange={(val) => {
                setCategory(val);
                setPage(1);
              }}
              disabled={!isPro}
            >
              <SelectTrigger className="h-10 bg-background/50 border-border/50">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    <span className="flex items-center gap-2">
                      <span className="text-base">{c.icon}</span>
                      <span>{c.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold ml-1 flex items-center gap-1.5">
              Party {!isPro && <span className="text-[8px] bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-full">PRO 🔒</span>}
            </label>
            <Select
              value={party}
              onValueChange={(val) => {
                setParty(val);
                setPage(1);
              }}
              disabled={!isPro}
            >
              <SelectTrigger className="h-10 bg-background/50 border-border/50">
                <SelectValue placeholder="All Parties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Parties</SelectItem>
                {parties.map((p) => (
                  <SelectItem key={p._id} value={p._id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            className="h-10 border-dashed border-border hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-all flex items-center gap-2 group"
            onClick={() => {
              setSearch('');
              setDebouncedSearch('');
              setCategory('all');
              setAccount('all');
              setType('all');
              setParty('all');
              setDateRange({
                from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                to: new Date(),
              });
              setPage(1);
            }}
          >
            <X className="w-3.5 h-3.5 text-muted-foreground group-hover:text-destructive transition-colors" />
            Reset All Filters
          </Button>
        </div>
      </Card>

      {/* ── TRANSACTION LIST ── */}
      <Card className="border-border/40 shadow-sm overflow-hidden bg-card/40 mt-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent border-b-border/40">
                <TableHead className="w-[120px] text-[10px] font-bold uppercase tracking-widest h-10">Flow</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest h-10">Description & Source</TableHead>
                <TableHead className="w-[140px] text-[10px] font-bold uppercase tracking-widest h-10">Category</TableHead>
                <TableHead className="w-[110px] text-[10px] font-bold uppercase tracking-widest h-10 text-center">Date</TableHead>
                <TableHead className="w-[180px] text-[10px] font-bold uppercase tracking-widest h-10 text-right">Amount & Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <p className="text-sm text-muted-foreground animate-pulse">Syncing Ledger...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-2xl mb-2 opacity-50">📭</div>
                      <p className="text-sm font-semibold">No movements found</p>
                      <p className="text-xs text-muted-foreground">Try adjusting your filters or date range.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                list.filter(Boolean).map((t) => {
                  const badge = getTypeBadge(t);
                  const amtDisplay = getAmountDisplay(t);
                  const typeName = (t.type || 'expense').toLowerCase();
                  const isDebt = typeName === 'debt';
                  const isTransfer = typeName === 'transfer';

                  return (
                    <TableRow key={t._id} className="group hover:bg-muted/30 border-b-border/30 transition-colors">
                      {/* Flow Type */}
                      <TableCell className="py-4">
                        <div className="flex flex-col gap-1">
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter border", badge.cls)}>
                            {badge.label}
                          </span>
                          {isDebt && t.partyId && (
                            <span className="text-[9px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-current" />
                              {t.partyId.name}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Description */}
                      <TableCell className="py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-semibold tracking-tight leading-none group-hover:text-primary transition-colors">
                            {t.title || 'Untitled Transaction'}
                          </span>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
                            <Activity className="w-3 h-3" />
                            {t.accountId?.name || 'Unknown'}
                            {isTransfer && t.targetAccountId?.name && (
                              <span className="flex items-center gap-1 text-primary/80">
                                <ArrowRightLeft className="w-3 h-3" />
                                {t.targetAccountId.name}
                              </span>
                            )}
                          </span>
                        </div>
                      </TableCell>

                      {/* Category */}
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2 px-2 py-1 bg-muted/40 border border-border/40 rounded-lg w-fit">
                          <span className="text-sm leading-none">{t.categoryId?.icon || '📦'}</span>
                          <span className="text-[11px] font-bold text-muted-foreground whitespace-nowrap">
                            {t.categoryId?.name || 'Unclassified'}
                          </span>
                        </div>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="py-4 text-center">
                        <span className="text-[11px] font-mono text-muted-foreground/80 font-medium">
                          {formatDate(t.date)}
                        </span>
                      </TableCell>

                      {/* Amount & Actions */}
                      <TableCell className="py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div className="flex flex-col items-end gap-0.5">
                            <span className={cn("text-sm font-bold tracking-tight", amtDisplay.cls)}>
                              {amtDisplay.prefix}{formatAmount(t.amount)}
                            </span>
                          </div>
                          
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 hover:bg-primary/10 hover:text-primary"
                              onClick={() => handleEdit(t)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDeleteClick(t._id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── PAGINATION FOOTER ── */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center p-4 bg-muted/20 border-t border-border/40 text-[11px] font-medium text-muted-foreground">
          <span className="text-center sm:text-left flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
            Showing <span className="text-foreground font-bold">{startRecord}–{endRecord}</span> of <span className="text-foreground font-bold">{totalRecords}</span> entries
          </span>
          
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8 rounded-lg border-border/50 hover:bg-background shadow-sm disabled:opacity-30"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8 rounded-lg border-border/50 hover:bg-background shadow-sm disabled:opacity-30"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
                const start = Math.max(1, Math.min(totalPages - 2, page - 1));
                const pageNum = start + i;
                if (pageNum < 1 || pageNum > totalPages) return null;
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? 'default' : 'ghost'}
                    size="icon"
                    className={cn(
                      "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                      pageNum === page ? "shadow-md shadow-primary/20" : "hover:bg-background"
                    )}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8 rounded-lg border-border/50 hover:bg-background shadow-sm disabled:opacity-30"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8 rounded-lg border-border/50 hover:bg-background shadow-sm disabled:opacity-30"
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* ── MODALS ── */}
      {isEditOpen && editingTransaction && (
        <TransactionPopup
          open={isEditOpen}
          setOpen={setIsEditOpen}
          editTransaction={editingTransaction}
          onSuccess={() => {
            setIsEditOpen(false);
            fetchTransactions();
          }}
        />
      )}

      {isDeleteOpen && (
        <DeleteConfirmModal
          title="Delete Transaction"
          description="Are you sure you want to permanently remove this transaction? This action cannot be undone."
          onConfirm={confirmDelete}
          onCancel={() => setIsDeleteOpen(false)}
        />
      )}
    </div>
  );
}
