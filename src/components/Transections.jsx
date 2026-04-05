import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useOutletContext } from 'react-router-dom';
import useApi from '@/hooks/useApi';
import { setTransections } from '@/redux/transectionSlice';
import { formatDate } from '@/utils/utils';

export default function Transections() {
  const dispatch = useDispatch();
  const { openTransactionPopup } = useOutletContext();
  const { transections } = useSelector((state) => state.transections);
  const { data, makeRequest } = useApi();

  useEffect(() => {
    // Attempting to fetch transactions, fallback to 'transactions/all' if needed based on prior version
    makeRequest({ url: '/transactions', method: 'get' });
  }, [makeRequest]);

  useEffect(() => {
    if (data)
      dispatch(setTransections(data?.data || data?.transactions || data));
  }, [data, dispatch]);

  const handleSuccess = () => {
    setIsOpen(false);
    makeRequest({ url: '/transactions', method: 'get' });
  };

  const list = Array.isArray(transections) ? transections : [];

  // Calculate running stats (using available transaction data)
  const inflow = list
    .filter((t) => ['INCOME', 'income'].includes(t.type || t.categoryType))
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const outflow = list
    .filter((t) => ['EXPENSE', 'expense'].includes(t.type || t.categoryType))
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const netPrecision = inflow - outflow;

  return (
    <div className="flex-1 p-6 lg:p-10 space-y-8 bg-surface-dim w-full max-w-[1600px] mx-auto">
      {/* Header Section */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface font-headline">
            Transaction Ledger
          </h1>
          <p className="text-slate-400 font-medium">
            Precision tracking for your financial ecosystem.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-surface-container-high text-on-surface px-4 py-2.5 rounded-md text-sm font-semibold flex items-center gap-2 hover:bg-surface-variant transition-colors border border-outline-variant/10">
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: "'FILL' 0" }}
            >
              file_download
            </span>
            Export CSV
          </button>
          <button
            onClick={openTransactionPopup}
            className="bg-gradient-to-br from-primary to-on-primary-container text-on-primary px-6 py-2.5 rounded-md text-sm font-bold shadow-lg shadow-primary/10 hover:opacity-90 transition-all active:scale-95 flex items-center gap-2 border-none"
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: "'FILL' 0" }}
            >
              add
            </span>
            New Transaction
          </button>
        </div>
      </header>

      {/* Advanced Filters */}
      <section className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/5 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-1">
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1.5 ml-1">
              Search Label
            </label>
            <div className="relative">
              <input
                className="w-full bg-surface-container-highest border-none rounded-lg py-2.5 pl-3 pr-10 text-sm focus:ring-1 focus:ring-primary/40 text-on-surface placeholder:text-slate-500 outline-none"
                placeholder="Filter by title..."
                type="text"
              />
              <span
                className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                search
              </span>
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1.5 ml-1">
              Date Range
            </label>
            <div className="relative">
              <input
                className="w-full bg-surface-container-highest border-none rounded-lg py-2.5 pl-3 pr-10 text-sm focus:ring-1 focus:ring-primary/40 text-on-surface outline-none"
                type="text"
                defaultValue="Oct 01 - Oct 31, 2023"
              />
              <span
                className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                calendar_month
              </span>
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1.5 ml-1">
              Category
            </label>
            <select className="w-full bg-surface-container-highest border-none rounded-lg py-2.5 px-3 text-sm focus:ring-1 focus:ring-primary/40 text-on-surface appearance-none outline-none">
              <option>All Categories</option>
              <option>Operational</option>
              <option>Marketing</option>
              <option>Salaries</option>
              <option>Infrastructure</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1.5 ml-1">
              Account
            </label>
            <select className="w-full bg-surface-container-highest border-none rounded-lg py-2.5 px-3 text-sm focus:ring-1 focus:ring-primary/40 text-on-surface appearance-none outline-none">
              <option>All Accounts</option>
              <option>Main Treasury</option>
              <option>OpEx Savings</option>
              <option>Crypto Wallet</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1.5 ml-1">
              Ledger Type
            </label>
            <select className="w-full bg-surface-container-highest border-none rounded-lg py-2.5 px-3 text-sm focus:ring-1 focus:ring-primary/40 text-on-surface appearance-none outline-none">
              <option>All Types</option>
              <option>Expense</option>
              <option>Income</option>
              <option>Transfer</option>
              <option>Debt</option>
            </select>
          </div>
        </div>
      </section>

      {/* Data Table */}
      <section className="bg-surface-container-low rounded-xl overflow-hidden shadow-2xl shadow-black/20 border border-outline-variant/5">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-highest/50 border-b border-outline-variant/10">
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Status
                </th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Transaction Details
                </th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Category
                </th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Date
                </th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Account
                </th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-right">
                  Amount
                </th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {list.length > 0 ? (
                list.map((t, idx) => {
                  const title = t.title || t.description || 'Transaction';
                  const accountName =
                    t.account?.name ||
                    t.accountName ||
                    t.transactions?.[0]?.accountName ||
                    'System';
                  const catName = t.category?.name || t.category || 'General';
                  const isIncome = ['INCOME', 'income'].includes(
                    t.type || t.categoryType,
                  );
                  const isExpense = ['EXPENSE', 'expense'].includes(
                    t.type || t.categoryType,
                  );
                  const isCleared =
                    t.status !== 'pending' && t.ledgerType !== 'PENDING';

                  return (
                    <tr
                      key={t._id || t.id || idx}
                      className="group hover:bg-surface-container-high/40 transition-colors"
                    >
                      <td className="px-6 py-5">
                        {isCleared ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-tertiary/10 text-tertiary uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary shadow-[0_0_8px_rgba(39,224,169,0.8)]"></span>
                            Cleared
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-secondary-container/30 text-secondary uppercase border border-secondary/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center border border-outline-variant/10 min-w-[40px]">
                            <span
                              className={`material-symbols-outlined text-xl ${isIncome ? 'text-tertiary' : 'text-primary'}`}
                              style={{ fontVariationSettings: "'FILL' 0" }}
                            >
                              {t.icon ||
                                (isIncome ? 'payments' : 'receipt_long')}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <div className="text-sm font-semibold text-on-surface truncate max-w-[200px]">
                              {title}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                              {t._id ? `ID #${t._id.substring(0, 8)}` : 'Entry'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm text-slate-300 capitalize">
                          {catName}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm text-slate-300 font-variant-numeric: tabular-nums">
                          {formatDate(t.date)}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${isIncome ? 'bg-tertiary' : 'bg-primary'}`}
                          ></div>
                          <span className="text-sm text-slate-300 truncate max-w-[150px]">
                            {accountName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right flex-col justify-center h-full">
                        <span
                          className={`text-sm font-bold tnum block ${isIncome ? 'text-tertiary' : 'text-error'}`}
                        >
                          {isIncome ? '+ ' : isExpense ? '- ' : ''}$
                          {Number(t.amount || 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded transition-colors"
                            title="View Details"
                          >
                            <span
                              className="material-symbols-outlined text-lg"
                              style={{ fontVariationSettings: "'FILL' 0" }}
                            >
                              visibility
                            </span>
                          </button>
                          <button
                            className="p-1.5 text-slate-400 hover:text-error hover:bg-error/10 rounded transition-colors"
                            title="Delete"
                          >
                            <span
                              className="material-symbols-outlined text-lg"
                              style={{ fontVariationSettings: "'FILL' 0" }}
                            >
                              delete
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-16 text-center text-outline font-medium"
                  >
                    No transactions found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <footer className="px-6 py-4 bg-surface-container-highest/20 flex flex-col md:flex-row items-center justify-between border-t border-outline-variant/5 gap-4">
          <div className="text-xs text-slate-500">
            Showing{' '}
            <span className="text-on-surface font-bold">
              1-{Math.min(10, list.length)}
            </span>{' '}
            of <span className="text-on-surface font-bold">{list.length}</span>{' '}
            records
          </div>
          <div className="flex items-center gap-2 hidden lg:flex">
            <button
              className="p-1.5 text-slate-500 hover:text-primary transition-colors disabled:opacity-30"
              disabled
            >
              <span
                className="material-symbols-outlined text-xl"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                first_page
              </span>
            </button>
            <button
              className="p-1.5 text-slate-500 hover:text-primary transition-colors disabled:opacity-30"
              disabled
            >
              <span
                className="material-symbols-outlined text-xl"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                chevron_left
              </span>
            </button>
            <div className="flex items-center gap-1 px-2">
              <button className="w-8 h-8 rounded text-xs font-bold bg-primary text-on-primary shadow-lg shadow-primary/20">
                1
              </button>
            </div>
            <button
              className="p-1.5 text-slate-500 hover:text-primary transition-colors disabled:opacity-30"
              disabled
            >
              <span
                className="material-symbols-outlined text-xl"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                chevron_right
              </span>
            </button>
            <button
              className="p-1.5 text-slate-500 hover:text-primary transition-colors disabled:opacity-30"
              disabled
            >
              <span
                className="material-symbols-outlined text-xl"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                last_page
              </span>
            </button>
          </div>
        </footer>
      </section>

      {/* Bottom Contextual Stats (Bento Style) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-tertiary"></div>
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              Total Inflow
            </p>
            <span
              className="material-symbols-outlined text-tertiary text-lg group-hover:scale-110 transition-transform"
              style={{ fontVariationSettings: "'FILL' 0" }}
            >
              trending_up
            </span>
          </div>
          <h3 className="text-2xl font-bold text-on-surface tnum">
            ${inflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h3>
        </div>

        <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-error"></div>
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              Total Outflow
            </p>
            <span
              className="material-symbols-outlined text-error text-lg group-hover:scale-110 transition-transform"
              style={{ fontVariationSettings: "'FILL' 0" }}
            >
              trending_down
            </span>
          </div>
          <h3 className="text-2xl font-bold text-on-surface tnum">
            ${outflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h3>
        </div>

        <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              Net Precision
            </p>
            <span
              className="material-symbols-outlined text-primary text-lg group-hover:scale-110 transition-transform"
              style={{ fontVariationSettings: "'FILL' 0" }}
            >
              account_balance_wallet
            </span>
          </div>
          <h3 className="text-2xl font-bold text-on-surface tnum">
            $
            {netPrecision.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </h3>
        </div>
      </section>
    </div>
  );
}
