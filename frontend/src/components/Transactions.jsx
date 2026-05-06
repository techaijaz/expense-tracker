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
import api from '@/utils/httpMethods';

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <Card className="bg-green-500/10 border-green-500/20 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Total Inflow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
              {formatAmount(inflow)}
            </div>
            {overview?.comparison?.incomeChange !== undefined && inflow > 0 && (
              <p className={`text-xs mt-1 ${overview.comparison.incomeChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {overview.comparison.incomeChange >= 0 ? '↑' : '↓'} {Math.abs(overview.comparison.incomeChange)}% vs last month
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/20 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">Total Outflow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">
              {formatAmount(outflow)}
            </div>
            {overview?.comparison?.expenseChange !== undefined && outflow > 0 && (
              <p className={`text-xs mt-1 ${overview.comparison.expenseChange <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {overview.comparison.expenseChange <= 0 ? '↓' : '↑'} {Math.abs(overview.comparison.expenseChange)}% vs last month
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/20 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">Net Precision</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {formatAmount(netPrecision)}
            </div>
            {overview?.comparison?.savingsChange !== undefined && (inflow > 0 || outflow > 0) && (
              <p className={`text-xs mt-1 ${overview.comparison.savingsChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {overview.comparison.savingsChange >= 0 ? '↑' : '↓'} {Math.abs(overview.comparison.savingsChange)}% vs last month
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── FILTER BAR (row 1) ── */}
      <div className="bg-card border border-border rounded-t-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {/* Search */}
        <div className="flex flex-col">
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5">Search</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">🔍</span>
            <Input
              className="pl-9 h-10 bg-background"
              placeholder="Find by description, category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Date Range */}
        <div className="flex flex-col">
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5">Date Range</label>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>

        {/* Flow Type */}
        <div className="flex flex-col">
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5">Flow Type</label>
          <Select
            value={type}
            onValueChange={(val) => {
              setType(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 bg-background">
              <SelectValue placeholder="All Flows" />
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
        <div className="flex flex-col">
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5">Account</label>
          <Select
            value={account}
            onValueChange={(val) => {
              setAccount(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 bg-background">
              <SelectValue placeholder="All Accounts" />
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

      {/* ── FILTER BAR (row 2) ── */}
      <div
        className={`bg-card border border-t-0 border-border rounded-b-xl p-3 px-4 mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 items-end ${!isPro ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <div className="flex flex-col">
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5">Category {!isPro && '🔒'}</label>
          <Select
            value={category}
            onValueChange={(val) => {
              setCategory(val);
              setPage(1);
            }}
            disabled={!isPro}
          >
            <SelectTrigger className="h-10 bg-background">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c._id} value={c._id}>
                  {c.icon} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col">
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5">Party (Debt) {!isPro && '🔒'}</label>
          <Select
            value={party}
            onValueChange={(val) => {
              setParty(val);
              setPage(1);
            }}
            disabled={!isPro}
          >
            <SelectTrigger className="h-10 bg-background">
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

        <div className="flex flex-col">
          <Button
            variant="outline"
            className="w-full h-10 text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors"
            onClick={() => {
              // Clear everything in one go - React 18 will batch these updates
              setSearch('');
              setDebouncedSearch('');
              setCategory('all');
              setAccount('all');
              setType('all');
              setParty('all');
              setDateRange({
                from: new Date(
                  new Date().getFullYear(),
                  new Date().getMonth(),
                  1,
                ),
                to: new Date(),
              });
              setPage(1);
            }}
          >
            ✕ Clear Filters
          </Button>
        </div>
      </div>

      {/* ── TRANSACTION TABLE ── */}
      <Card className="p-0 overflow-hidden shadow-none">
        {/* Table Header - Hidden on Mobile */}
        <div className="hidden md:grid grid-cols-[110px_1fr_130px_90px_160px] gap-3 px-4 py-2 border-b border-border text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
          <div>Type</div>
          <div>Description</div>
          <div>Category</div>
          <div>Date</div>
          <div className="text-right">Amount</div>
        </div>

        {/* Body */}
        {loading && list.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 px-6 text-muted-foreground text-sm">
            <div className="w-9 h-9 border-4 border-border border-t-primary rounded-full animate-spin" />
            <span>Synchronizing Ledger…</span>
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 px-6 text-muted-foreground text-sm">
            <div className="text-3xl mb-3">📭</div>
            <div className="text-sm font-semibold text-foreground">
              No movements found
            </div>
            <div className="text-xs mt-1 text-muted-foreground">
              Try adjusting your filters or add a transaction.
            </div>
          </div>
        ) : (
          <div className={loading ? 'opacity-60 pointer-events-none transition-opacity' : ''}>
            {list.filter(Boolean).map((t) => {
              const badge = getTypeBadge(t);
              const amtDisplay = getAmountDisplay(t);
              const typeName = (t.type || 'expense').toLowerCase();
              const isDebt = typeName === 'debt';
              const isTransfer = typeName === 'transfer';

              return (
                <div key={t._id} className="p-3 md:px-4 md:py-3 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer flex flex-col md:grid md:grid-cols-[110px_1fr_130px_90px_160px] md:gap-3 md:items-center group">
                  {/* Mobile Header Row */}
                <div className="flex items-center justify-between md:hidden mb-2">
                  <span className={badge.cls}>{badge.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={amtDisplay.cls}>
                      {amtDisplay.prefix}
                      {formatAmount(t.amount)}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6 text-[10px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(t);
                        }}
                      >
                        ✏️
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6 text-[10px] text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(t._id);
                        }}
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Desktop: Type (Col 1) */}
                <div className="hidden md:block">
                  <span className={badge.cls}>{badge.label}</span>
                  {isDebt && t.partyId && (
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                      👤 {t.partyId.name}
                    </div>
                  )}
                </div>

                {/* Description + Account (Col 2) */}
                <div>
                  <div className="text-[13px] font-medium text-foreground">
                    {t.title || '— No description —'}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {t.accountId?.name || 'Unknown'}
                    {isTransfer && t.targetAccountId?.name && (
                      <span className="text-primary">
                        {' '}
                        → {t.targetAccountId.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Category (Col 3) */}
                <div className="mt-2 md:mt-0">
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-muted rounded-md text-muted-foreground">
                    {t.categoryId?.icon && <span>{t.categoryId.icon}</span>}
                    {t.categoryId?.name || 'Unclassified'}
                  </span>
                </div>

                {/* Date (Col 4) */}
                <div className="text-xs text-muted-foreground font-mono mt-1 md:mt-0">{formatDate(t.date)}</div>

                {/* Amount + Actions (Col 5) - Desktop Only layout here */}
                <div
                  className="hidden md:flex items-center justify-end gap-1.5"
                >
                  <span className={amtDisplay.cls}>
                    {amtDisplay.prefix}
                    {formatAmount(t.amount)}
                  </span>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7"
                      title="Edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(t);
                      }}
                    >
                      ✏️
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      title="Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(t._id);
                      }}
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
                
                {/* Mobile Only: Party Info if Debt */}
                {isDebt && t.partyId && (
                  <div className="md:hidden mt-1 text-[10px] text-amber-600 dark:text-amber-400">
                    👤 {t.partyId.name}
                  </div>
                )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── PAGINATION FOOTER ── */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center p-3 md:px-4 border-t border-border text-[11px] text-muted-foreground">
          <span className="text-center sm:text-left">
            Showing {startRecord}–{endRecord} of {totalRecords} records
          </span>
          <div className="flex gap-1 justify-center">
            <Button
              variant="outline"
              size="icon"
              className="w-7 h-7 text-[11px]"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >
              ⟨⟨
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-7 h-7 text-[11px]"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ⟨
            </Button>

            {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
              const start = Math.max(1, Math.min(totalPages - 2, page - 1));
              const pageNum = start + i;
              if (pageNum < 1 || pageNum > totalPages) return null;
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? 'default' : 'outline'}
                  size="icon"
                  className="w-7 h-7 text-[11px]"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="icon"
              className="w-7 h-7 text-[11px]"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              ⟩
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-7 h-7 text-[11px]"
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
            >
              ⟩⟩
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
