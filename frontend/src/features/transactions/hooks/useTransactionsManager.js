import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTransactions, deleteTransaction } from '@/features/transactions/state/transactionSlice';
import { updateAccount } from '@/features/accounts/state/accountSlice';
import useApi from '@/hooks/useApi';
import api from '@/utils/httpMethods';
import { toast } from 'sonner';

export default function useTransactionsManager() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const userObj = user?.user || user;
  const isPro = userObj?.role === 'admin' || userObj?.plan === 'pro';

  const { transactions } = useSelector((state) => state.transactions);
  const { categories: groupedCategories } = useSelector((state) => state.category);
  const { accounts = [] } = useSelector((state) => state.accounts);
  const { data, makeRequest, loading } = useApi();

  // Categories Flattening
  const categoriesList = useMemo(() => {
    const { INCOME = [], EXPENSE = [], TRANSFER = [] } = groupedCategories || {};
    return [...INCOME, ...EXPENSE, ...TRANSFER];
  }, [groupedCategories]);

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

  // Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

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
  }, [page, limit, debouncedSearch, category, account, type, party, dateRange, makeRequest]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Fetch Overview
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

  const transactionsList = useMemo(() => (Array.isArray(transactions) ? transactions : []), [transactions]);

  // Summary Calculations
  const inflow = overview?.currentMonth?.income ?? transactionsList
    .filter((t) => t && ['INCOME', 'income'].includes(t.type || t.categoryType))
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const outflow = overview?.currentMonth?.expense ?? transactionsList
    .filter((t) => t && ['EXPENSE', 'expense'].includes(t.type || t.categoryType))
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const netPrecision = inflow - outflow;

  // Handlers
  const handleEdit = (t) => {
    setEditingTransaction(t);
    setIsEditOpen(true);
  };

  const handleNew = () => {
    setEditingTransaction(null);
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

  const resetFilters = () => {
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
  };

  const totalRecords = data?.pagination?.total || (data?.transactions ? data.transactions.length : transactionsList.length);
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const startRecord = totalRecords > 0 ? (page - 1) * limit + 1 : 0;
  const endRecord = Math.min(page * limit, totalRecords);

  return {
    // State
    isPro,
    loading,
    transactionsList,
    categoriesList,
    accounts,
    parties,
    search,
    setSearch,
    category,
    setCategory,
    account,
    setAccount,
    type,
    setType,
    party,
    setParty,
    dateRange,
    setDateRange,
    page,
    setPage,
    limit,
    overview,
    isEditOpen,
    setIsEditOpen,
    editingTransaction,
    isDeleteOpen,
    setIsDeleteOpen,
    // Summary
    inflow,
    outflow,
    netPrecision,
    totalRecords,
    totalPages,
    startRecord,
    endRecord,
    // Handlers
    handleEdit,
    handleNew,
    handleDeleteClick,
    confirmDelete,
    resetFilters,
    fetchTransactions,
  };
}
