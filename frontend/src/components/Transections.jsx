import { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useOutletContext } from 'react-router-dom';
import useApi from '@/hooks/useApi';
import {
  setTransections,
  deleteTransection,
} from '@/redux/transectionSlice';
import { updateAccount } from '@/redux/accountSlice';
import useFormat from '@/hooks/useFormat';
import { DateRangePicker } from './DateRangePicker';
import { DeleteConfirmModal } from './SharedComponents';
import TransectionPopup from './TransectionPopup';
import { toast } from 'sonner';
import api from '@/utils/httpMethods';

export default function Transections() {
  const dispatch = useDispatch();
  const { openTransactionPopup } = useOutletContext();
  const { user } = useSelector((state) => state.auth);
  const plan = user?.user?.plan || user?.plan || 'basic';
  const isPro = plan === 'pro';

  const { transections } = useSelector((state) => state.transections);

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

  useEffect(() => {
    if (data) {
      dispatch(setTransections(data?.data || data?.transactions || data));
    }
  }, [data, dispatch]);

  const list = useMemo(
    () => (Array.isArray(transections) ? transections : []),
    [transections],
  );

  // Summary
  const inflow = list
    .filter((t) => t && ['INCOME', 'income'].includes(t.type || t.categoryType))
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const outflow = list
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
      dispatch(deleteTransection(deletingId));
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
    if (!t) return { cls: 'txn-type-badge expense', label: 'Unknown' };
    const typeName = (t.type || 'expense').toLowerCase();
    if (typeName === 'income')
      return { cls: 'txn-type-badge income', label: '↓ Income' };
    if (typeName === 'transfer')
      return { cls: 'txn-type-badge transfer', label: '⇄ Transfer' };
    if (typeName === 'debt') {
      const sub = (t.debtType || '').toLowerCase();
      if (sub === 'repayment')
        return { cls: 'txn-type-badge repayment', label: '↑ Repayment' };
      return { cls: 'txn-type-badge debt', label: '↓ Debt' };
    }
    return { cls: 'txn-type-badge expense', label: '↑ Expense' };
  };

  const getAmountDisplay = (t) => {
    if (!t) return { cls: 'txn-amount', prefix: '' };
    const typeName = (t.type || 'expense').toLowerCase();
    if (typeName === 'income') return { cls: 'txn-amount credit', prefix: '+' };
    if (typeName === 'transfer') return { cls: 'txn-amount', prefix: '' };
    return { cls: 'txn-amount debit', prefix: '-' };
  };

  const totalRecords =
    data?.pagination?.total ||
    (data?.transactions ? data.transactions.length : list.length);
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const startRecord = totalRecords > 0 ? (page - 1) * limit + 1 : 0;
  const endRecord = Math.min(page * limit, totalRecords);

  return (
    <div className="txn-page-wrap">
      {/* ── SUMMARY KPI CARDS ── */}
      <div className="txn-kpi-row">
        <div className="kpi-card green">
          <div className="kpi-label">Total Inflow</div>
          <div className="kpi-val" style={{ fontSize: 20 }}>
            {formatAmount(inflow)}
          </div>
          <div className="kpi-change up">↑ +12% vs last month</div>
        </div>
        <div className="kpi-card red">
          <div className="kpi-label">Total Outflow</div>
          <div className="kpi-val" style={{ fontSize: 20 }}>
            {formatAmount(outflow)}
          </div>
          <div className="kpi-change down">↓ -5% vs last month</div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-label">Net Precision</div>
          <div className="kpi-val" style={{ fontSize: 20 }}>
            {formatAmount(netPrecision)}
          </div>
          <div className="kpi-change up">↑ +2.4% vs last month</div>
        </div>
      </div>

      {/* ── FILTER BAR (row 1) ── */}
      <div className="txn-filter-bar">
        {/* Search */}
        <div
          className="filter-group search-wrap"
          style={{ position: 'relative' }}
        >
          <label>Search</label>
          <div style={{ position: 'relative' }}>
            <span className="search-icon">🔍</span>
            <input
              className="filter-input"
              placeholder="Find by description, category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Date Range */}
        <div className="filter-group">
          <label>Date Range</label>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>

        {/* Flow Type */}
        <div className="filter-group">
          <label>Flow Type</label>
          <select
            className="filter-input"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Flows</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="transfer">Transfer</option>
            <option value="debt">Debt</option>
          </select>
        </div>

        {/* Account */}
        <div className="filter-group">
          <label>Account</label>
          <select
            className="filter-input"
            value={account}
            onChange={(e) => {
              setAccount(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Accounts</option>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── FILTER BAR (row 2) ── */}
      <div
        className="txn-filter-bar2"
        style={{
          opacity: isPro ? 1 : 0.6,
          pointerEvents: isPro ? 'auto' : 'none',
        }}
      >
        <div className="filter-group">
          <label>Category {!isPro && '🔒'}</label>
          <select
            className="filter-input"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            disabled={!isPro}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Party (Debt) {!isPro && '🔒'}</label>
          <select
            className="filter-input"
            value={party}
            onChange={(e) => {
              setParty(e.target.value);
              setPage(1);
            }}
            disabled={!isPro}
          >
            <option value="all">All Parties</option>
            {parties.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div
          className="filter-group"
          style={{ display: 'flex', alignItems: 'flex-end' }}
        >
          <button
            className="txn-clear-btn"
            onClick={() => {
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
          </button>
        </div>
      </div>

      {/* ── TRANSACTION TABLE ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Table Header */}
        <div className="txn-head">
          <div>Type</div>
          <div>Description</div>
          <div>Category</div>
          <div>Date</div>
          <div style={{ textAlign: 'right' }}>Amount</div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="txn-empty-state">
            <div className="txn-spinner" />
            <span>Synchronizing Ledger…</span>
          </div>
        ) : list.length === 0 ? (
          <div className="txn-empty-state">
            <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
            <div
              style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)' }}
            >
              No movements found
            </div>
            <div style={{ fontSize: 12, marginTop: 4, color: 'var(--text3)' }}>
              Try adjusting your filters or add a transaction.
            </div>
          </div>
        ) : (
          list.filter(Boolean).map((t) => {
            const badge = getTypeBadge(t);
            const amtDisplay = getAmountDisplay(t);
            const typeName = (t.type || 'expense').toLowerCase();
            const isDebt = typeName === 'debt';
            const isTransfer = typeName === 'transfer';

            return (
              <div key={t._id} className="txn-row">
                {/* Type */}
                <div>
                  <span className={badge.cls}>{badge.label}</span>
                  {isDebt && t.partyId && (
                    <div
                      style={{
                        fontSize: 10,
                        color: 'var(--amber)',
                        marginTop: 4,
                      }}
                    >
                      👤 {t.partyId.name}
                    </div>
                  )}
                </div>

                {/* Description + Account */}
                <div>
                  <div className="txn-desc">
                    {t.title || '— No description —'}
                  </div>
                  <div className="txn-account">
                    {t.accountId?.name || 'Unknown'}
                    {isTransfer && t.targetAccountId?.name && (
                      <span style={{ color: 'var(--accent)' }}>
                        {' '}
                        → {t.targetAccountId.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <span className="txn-cat">
                    {t.categoryId?.icon && <span>{t.categoryId.icon}</span>}
                    {t.categoryId?.name || 'Unclassified'}
                  </span>
                </div>

                {/* Date */}
                <div className="txn-date">{formatDate(t.date)}</div>

                {/* Amount + Actions */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 6,
                  }}
                >
                  <span className={amtDisplay.cls}>
                    {amtDisplay.prefix}
                    {formatAmount(t.amount)}
                  </span>
                  <div className="txn-row-actions">
                    <button
                      className="icon-btn"
                      style={{ width: 28, height: 28 }}
                      title="Edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(t);
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      className="icon-btn"
                      style={{ width: 28, height: 28, color: 'var(--red)' }}
                      title="Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(t._id);
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* ── PAGINATION FOOTER ── */}
        <div className="txn-pagination">
          <span>
            Showing {startRecord}–{endRecord} of {totalRecords} records
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              className="icon-btn txn-page-btn"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >
              ⟨⟨
            </button>
            <button
              className="icon-btn txn-page-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ⟨
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const start = Math.max(1, Math.min(totalPages - 4, page - 2));
              const pageNum = start + i;
              if (pageNum < 1 || pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={
                    pageNum === page
                      ? 'txn-page-active'
                      : 'icon-btn txn-page-btn'
                  }
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              className="icon-btn txn-page-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              ⟩
            </button>
            <button
              className="icon-btn txn-page-btn"
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
            >
              ⟩⟩
            </button>
          </div>
        </div>
      </div>

      {/* ── SCOPED STYLES ── */}
      <style>{`
        @keyframes txn-spin { to { transform: rotate(360deg); } }

        .txn-page-wrap {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 0;
          background: var(--bg);
          min-height: 100%;
        }

        /* KPI Row */
        .txn-kpi-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 16px;
        }

        /* Filter Bar Row 1 */
        .txn-filter-bar {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: var(--r) var(--r) 0 0;
          padding: 16px;
          display: grid;
          grid-template-columns: 1fr auto auto auto;
          gap: 12px;
          align-items: end;
        }

        /* Filter Bar Row 2 */
        .txn-filter-bar2 {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-top: none;
          border-radius: 0 0 var(--r) var(--r);
          padding: 12px 16px;
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 12px;
          margin-bottom: 16px;
          align-items: end;
        }

        .filter-group label {
          font-size: 10px;
          color: var(--text3);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 600;
          margin-bottom: 5px;
          display: block;
        }
        .filter-input {
          width: 100%;
          height: 40px;
          padding: 8px 12px;
          background: var(--bg3);
          border: 1px solid var(--border2);
          border-radius: var(--r2);
          color: var(--text);
          font-family: var(--font);
          font-size: 13px;
          outline: none;
          transition: border-color .15s;
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
        }
        .filter-input:focus { border-color: var(--accent); }
        .filter-input::placeholder { color: var(--text3); }
        .search-wrap { position: relative; }
        .search-wrap .filter-input { padding-left: 32px; }
        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text3);
          font-size: 14px;
          pointer-events: none;
        }

        .txn-clear-btn {
          width: 100%;
          height: 40px;
          padding: 8px 16px;
          background: transparent;
          border: 1px solid var(--border2);
          border-radius: var(--r2);
          color: var(--text2);
          font-family: var(--font);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all .15s;
          white-space: nowrap;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .txn-clear-btn:hover { border-color: var(--red-border); color: var(--red); }

        /* Table */
        .txn-head {
          display: grid;
          grid-template-columns: 110px 1fr 130px 90px 160px;
          gap: 12px;
          padding: 8px 16px;
          border-bottom: 1px solid var(--border);
          font-size: 10px;
          color: var(--text3);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 600;
        }
        .txn-row {
          display: grid;
          grid-template-columns: 110px 1fr 130px 90px 160px;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          align-items: center;
          transition: background .1s;
          cursor: pointer;
        }
        .txn-row:last-child { border-bottom: none; }
        .txn-row:hover { background: var(--bg3); }
        .txn-row:hover .txn-row-actions { opacity: 1 !important; }

        .txn-row-actions {
          display: flex;
          gap: 2px;
          opacity: 0;
          transition: opacity .15s;
        }

        /* Badges */
        .txn-type-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 8px;
          border-radius: var(--r2);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .txn-type-badge.expense  { background: var(--red-bg);    color: var(--red);    border: 1px solid var(--red-border); }
        .txn-type-badge.income   { background: var(--green-bg);  color: var(--green);  border: 1px solid var(--green-border); }
        .txn-type-badge.transfer { background: var(--accent-glow); color: var(--accent); border: 1px solid rgba(91,141,239,0.2); }
        .txn-type-badge.debt     { background: var(--amber-bg);  color: var(--amber);  border: 1px solid var(--amber-border); }
        .txn-type-badge.repayment{ background: var(--purple-bg); color: var(--purple); border: 1px solid rgba(167,139,250,0.2); }

        .txn-desc    { font-size: 13px; font-weight: 500; color: var(--text); }
        .txn-account { font-size: 11px; color: var(--text2); margin-top: 2px; }
        .txn-cat     { font-size: 11px; padding: 3px 8px; background: var(--bg4); border-radius: var(--r2); color: var(--text2); display: inline-flex; align-items: center; gap: 4px; }
        .txn-date    { font-size: 12px; color: var(--text2); font-family: var(--mono); }
        .txn-amount  { font-family: var(--mono); font-weight: 600; font-size: 14px; text-align: right; color: var(--text2); white-space: nowrap; }
        .txn-amount.credit { color: var(--green); }
        .txn-amount.debit  { color: var(--red); }

        /* Empty / Loading */
        .txn-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 60px 24px;
          color: var(--text3);
          font-size: 13px;
        }
        .txn-spinner {
          width: 36px;
          height: 36px;
          border: 3px solid var(--border2);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: txn-spin 0.8s linear infinite;
        }

        /* Pagination */
        .txn-pagination {
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid var(--border);
          font-size: 11px;
          color: var(--text3);
        }
        .txn-page-btn {
          width: 28px !important;
          height: 28px !important;
          font-size: 11px !important;
        }
        .txn-page-active {
          width: 28px;
          height: 28px;
          border-radius: var(--r2);
          border: none;
          cursor: pointer;
          font-size: 11px;
          background: var(--accent);
          color: #fff;
          font-family: var(--font);
          font-weight: 600;
        }
      `}</style>

      {/* ── MODALS ── */}
      {isEditOpen && editingTransaction && (
        <TransectionPopup
          open={isEditOpen}
          setOpen={setIsEditOpen}
          editTransection={editingTransaction}
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
