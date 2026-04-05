import { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import useApi from '@/hooks/useApi';
import { setLoans, addLoan, updateLoan } from '@/redux/loanSlice';
import { setAccounts } from '@/redux/accountSlice';
import { formatAmount, restrictDecimals, getCurrencySymbol } from '@/utils/format';

export default function Loans() {
  const dispatch = useDispatch();
  const { loans } = useSelector((state) => state.loans);
  const { accounts } = useSelector((state) => state.accounts);
  const preferences = useSelector((state) => state.auth.user?.user?.preferences);
  const { currency = 'INR', decimalPlaces = 2 } = preferences || {};
  const currencySymbol = getCurrencySymbol(currency);

  const [parties, setParties] = useState([]);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formAmount, setFormAmount] = useState('');
  const [formParty, setFormParty] = useState('');
  const [formAccount, setFormAccount] = useState('');
  const [formType, setFormType] = useState('LENT'); // default: Give
  const [formDueDate, setFormDueDate] = useState('');
  const [formInterestRate, setFormInterestRate] = useState('');

  const loanApi = useApi();
  const partyApi = useApi();
  const accountApi = useApi();
  const createApi = useApi();
  const settleApi = useApi();

  // Fetch on mount
  useEffect(() => {
    loanApi.makeRequest({ url: '/loans', method: 'get' });
    partyApi.makeRequest({ url: '/parties', method: 'get' });
    accountApi.makeRequest({ url: '/account', method: 'get' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loanApi.data) {
      dispatch(setLoans(loanApi.data.data || loanApi.data));
    }
  }, [loanApi.data, dispatch]);

  useEffect(() => {
    if (partyApi.data) {
      setParties(partyApi.data.data || partyApi.data);
    }
  }, [partyApi.data]);

  useEffect(() => {
    if (accountApi.data) {
      dispatch(setAccounts(accountApi.data.data || accountApi.data));
    }
  }, [accountApi.data, dispatch]);

  // Handle create response
  useEffect(() => {
    if (createApi.data) {
      const loan = createApi.data.data || createApi.data;
      dispatch(addLoan(loan));
      toast.success('Loan created successfully!');
      resetForm();
      // Re-fetch accounts to update balances
      accountApi.makeRequest({ url: '/account', method: 'get' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createApi.data, dispatch]);

  useEffect(() => {
    if (createApi.error) toast.error(createApi.error);
  }, [createApi.error]);

  // Handle settle response
  useEffect(() => {
    if (settleApi.data) {
      const settled = settleApi.data.data || settleApi.data;
      dispatch(updateLoan(settled));
      toast.success('Loan settled successfully!');
      accountApi.makeRequest({ url: '/account', method: 'get' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settleApi.data, dispatch]);

  useEffect(() => {
    if (settleApi.error) toast.error(settleApi.error);
  }, [settleApi.error]);

  const resetForm = () => {
    setFormAmount('');
    setFormParty('');
    setFormAccount('');
    setFormType('LENT');
    setFormDueDate('');
    setFormInterestRate('');
    setShowForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formAmount || !formParty || !formAccount) {
      toast.error('Amount, Party, and Account are required');
      return;
    }
    createApi.makeRequest({
      url: '/loans',
      method: 'post',
      data: {
        amount: parseFloat(formAmount),
        party: formParty,
        accountId: formAccount,
        type: formType,
        dueDate: formDueDate || null,
        interestRate: formInterestRate ? parseFloat(formInterestRate) : 0,
      },
    });
  };

  const handleSettle = (loanId) => {
    settleApi.makeRequest({
      url: `/loans/${loanId}/settle`,
      method: 'post',
      data: {},
    });
  };

  // Metrics
  const metrics = useMemo(() => {
    const pending = loans.filter((l) => l.status === 'PENDING');
    const totalLent = pending
      .filter((l) => l.type === 'LENT')
      .reduce((s, l) => s + l.amount, 0);
    const totalBorrowed = pending
      .filter((l) => l.type === 'BORROWED')
      .reduce((s, l) => s + l.amount, 0);
    return {
      totalLent,
      totalBorrowed,
      netExposure: totalLent - totalBorrowed,
      pending: pending.length,
    };
  }, [loans]);

  return (
    <div className="flex-1 p-8 lg:p-12 bg-surface-container-low min-h-screen">
      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-on-surface">
            Debt Ledger
          </h2>
          <p className="text-slate-500 mt-2 font-medium">
            Track money lent and borrowed across counterparties.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-2.5 bg-gradient-to-br from-primary to-on-primary-container text-on-primary text-sm font-bold rounded-md shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2"
        >
          <span
            className="material-symbols-outlined text-sm"
            style={{ fontVariationSettings: "'FILL' 0" }}
          >
            {showForm ? 'close' : 'add'}
          </span>
          {showForm ? 'Close' : 'New Loan'}
        </button>
      </header>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          {
            label: 'Total Lent',
            value: metrics.totalLent,
            icon: 'arrow_upward',
            color: 'text-tertiary',
            bg: 'bg-tertiary/10',
          },
          {
            label: 'Total Borrowed',
            value: metrics.totalBorrowed,
            icon: 'arrow_downward',
            color: 'text-error',
            bg: 'bg-error/10',
          },
          {
            label: 'Net Exposure',
            value: metrics.netExposure,
            icon: 'balance',
            color: metrics.netExposure >= 0 ? 'text-tertiary' : 'text-error',
            bg: 'bg-primary/10',
          },
          {
            label: 'Active Debts',
            value: metrics.pending,
            icon: 'pending_actions',
            color: 'text-primary',
            bg: 'bg-primary/10',
            isCurrency: false,
          },
        ].map((m) => (
          <div
            key={m.label}
            className="bg-surface-container-high rounded-xl p-6 shadow-xl shadow-black/10"
          >
            <div className="flex justify-between items-start mb-3">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                {m.label}
              </p>
              <div
                className={`w-8 h-8 rounded-md ${m.bg} flex items-center justify-center`}
              >
                <span
                  className={`material-symbols-outlined text-sm ${m.color}`}
                  style={{ fontVariationSettings: "'FILL' 0" }}
                >
                  {m.icon}
                </span>
              </div>
            </div>
            <p
              className={`text-2xl font-extrabold font-headline ${m.color} tnum`}
            >
              {m.isCurrency === false
                ? m.value
                : formatAmount(m.value, currency, decimalPlaces)}
            </p>
          </div>
        ))}
      </div>

      {/* Create Loan Form */}
      {showForm && (
        <div className="bg-surface-container-high rounded-xl p-8 mb-10 border-l-2 border-primary shadow-xl shadow-black/10 animate-in slide-in-from-top-2 duration-300">
          <h3 className="text-lg font-bold font-headline text-on-surface mb-6">
            Record New Loan
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Type Toggle */}
              <div className="space-y-2 col-span-full">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                  Direction
                </label>
                <div className="grid grid-cols-2 bg-surface-container-lowest p-1 rounded-lg gap-1 max-w-xs">
                  <button
                    type="button"
                    onClick={() => setFormType('LENT')}
                    className={`py-2.5 text-xs font-bold rounded-md transition-colors ${
                      formType === 'LENT'
                        ? 'bg-tertiary/20 text-tertiary shadow-sm'
                        : 'text-outline hover:text-on-surface'
                    }`}
                  >
                    💸 Give (Lent)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('BORROWED')}
                    className={`py-2.5 text-xs font-bold rounded-md transition-colors ${
                      formType === 'BORROWED'
                        ? 'bg-error/20 text-error shadow-sm'
                        : 'text-outline hover:text-on-surface'
                    }`}
                  >
                    📥 Take (Borrowed)
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-sm">
                    {currencySymbol}
                  </span>
                  <input
                    value={formAmount}
                    onChange={(e) => setFormAmount(restrictDecimals(e.target.value, decimalPlaces))}
                    type="number"
                    step={1 / Math.pow(10, decimalPlaces)}
                    placeholder={`0.${'0'.repeat(decimalPlaces)}`}
                    className="w-full bg-surface-container-low border-none rounded-lg pl-8 pr-4 py-3 text-lg font-headline font-bold text-on-surface focus:ring-1 focus:ring-primary/40 outline-none tnum placeholder:text-surface-variant"
                  />
                </div>
              </div>

              {/* Party */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                  Counterparty
                </label>
                <select
                  value={formParty}
                  onChange={(e) => setFormParty(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-sm text-on-surface focus:ring-1 focus:ring-primary/40 outline-none appearance-none cursor-pointer"
                >
                  <option value="" disabled>
                    Select party
                  </option>
                  {parties.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Account */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                  Account
                </label>
                <select
                  value={formAccount}
                  onChange={(e) => setFormAccount(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-sm text-on-surface focus:ring-1 focus:ring-primary/40 outline-none appearance-none cursor-pointer"
                >
                  <option value="" disabled>
                    Select account
                  </option>
                  {accounts.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Interest Rate */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                  Interest Rate (%)
                </label>
                <input
                  value={formInterestRate}
                  onChange={(e) => setFormInterestRate(e.target.value)}
                  type="number"
                  step="0.01"
                  placeholder="0"
                  className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-sm text-on-surface focus:ring-1 focus:ring-primary/40 outline-none placeholder:text-surface-variant"
                />
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                  Due Date
                </label>
                <input
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  type="date"
                  className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-sm text-on-surface focus:ring-1 focus:ring-primary/40 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end mt-8 gap-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2.5 text-sm font-bold text-outline hover:text-on-surface transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createApi.loading}
                className="px-8 py-2.5 text-sm font-bold bg-gradient-to-br from-primary to-on-primary-container text-on-primary rounded-md shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
              >
                {createApi.loading ? 'Processing...' : 'Record Loan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loans Table */}
      <div className="bg-surface-container-high rounded-xl shadow-xl shadow-black/10 overflow-hidden">
        <div className="px-8 py-6 border-b border-outline-variant/10">
          <h3 className="text-lg font-bold font-headline text-on-surface">
            Active Debts
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            All outstanding and settled loan records.
          </p>
        </div>

        {loanApi.loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Loading debt ledger...
          </div>
        ) : loans.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 text-sm">
              No loans recorded yet. Click "New Loan" to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="border-b border-outline-variant/10">
                <tr className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                  <th className="px-8 py-4">Party</th>
                  <th className="px-4 py-4">Type</th>
                  <th className="px-4 py-4 text-right">Amount</th>
                  <th className="px-4 py-4">Account</th>
                  <th className="px-4 py-4 text-right">Interest</th>
                  <th className="px-4 py-4">Due Date</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-8 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {loans.map((loan) => {
                  const isLent = loan.type === 'LENT';
                  const isPaid = loan.status === 'PAID';
                  const isOverdue =
                    loan.dueDate &&
                    new Date(loan.dueDate) < new Date() &&
                    !isPaid;

                  return (
                    <tr
                      key={loan._id}
                      className={`hover:bg-surface-container-lowest/50 transition-colors ${isPaid ? 'opacity-50' : ''}`}
                    >
                      {/* Party */}
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${isLent ? 'bg-tertiary/10' : 'bg-error/10'}`}
                          >
                            <span
                              className={`material-symbols-outlined text-sm ${isLent ? 'text-tertiary' : 'text-error'}`}
                              style={{ fontVariationSettings: "'FILL' 0" }}
                            >
                              {isLent ? 'arrow_upward' : 'arrow_downward'}
                            </span>
                          </div>
                          <div>
                            <p className="font-bold text-on-surface">
                              {loan.party?.name || 'Unknown'}
                            </p>
                            <p className="text-[10px] text-slate-500 uppercase">
                              {loan.party?.relation}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="px-4 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isLent
                              ? 'bg-tertiary/10 text-tertiary'
                              : 'bg-error/10 text-error'
                          }`}
                        >
                          {isLent ? 'Receivable' : 'Payable'}
                        </span>
                      </td>

                      {/* Amount */}
                      <td
                        className={`px-4 py-4 text-right font-headline font-bold tnum ${isLent ? 'text-tertiary' : 'text-error'}`}
                      >
                        {isLent ? '+' : '-'}
                        {formatAmount(Math.abs(loan.amount), currency, decimalPlaces)}
                      </td>

                      {/* Account */}
                      <td className="px-4 py-4 text-on-surface/70 text-xs">
                        {loan.accountId?.name || '—'}
                      </td>

                      {/* Interest */}
                      <td className="px-4 py-4 text-right text-on-surface/70 tnum">
                        {loan.interestRate}%
                      </td>

                      {/* Due Date */}
                      <td
                        className={`px-4 py-4 text-xs tnum ${isOverdue ? 'text-error font-bold' : 'text-on-surface/70'}`}
                      >
                        {loan.dueDate
                          ? new Date(loan.dueDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                        {isOverdue && (
                          <span className="ml-1 text-[9px]">⚠️</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${isPaid ? 'bg-tertiary' : isOverdue ? 'bg-error animate-pulse' : 'bg-yellow-500'}`}
                          ></span>
                          <span
                            className={`text-xs font-medium ${isPaid ? 'text-tertiary' : isOverdue ? 'text-error' : 'text-yellow-500'}`}
                          >
                            {isPaid
                              ? 'Settled'
                              : isOverdue
                                ? 'Overdue'
                                : 'Pending'}
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-8 py-4 text-right">
                        {!isPaid ? (
                          <button
                            onClick={() => handleSettle(loan._id)}
                            disabled={settleApi.loading}
                            className="px-4 py-1.5 bg-tertiary/10 text-tertiary text-xs font-bold rounded-md hover:bg-tertiary/20 transition-colors disabled:opacity-50"
                          >
                            ✓ Settle
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500">
                            Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
