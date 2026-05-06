import React from 'react';
import { Plus, History } from 'lucide-react';
import useTransactionsManager from '@/hooks/useTransactionsManager';
import TransactionSummary from './Transactions/TransactionSummary';
import TransactionFilters from './Transactions/TransactionFilters';
import TransactionTable from './Transactions/TransactionTable';
import TransactionPopup from './TransactionPopup';
import { DeleteConfirmModal } from './SharedComponents';
import { Button } from '@/components/ui/button';

export default function Transactions() {
  const {
    isPro,
    loading,
    transactionsList,
    categoriesList,
    accounts,
    parties,
    search,
    setSearch,
    dateRange,
    setDateRange,
    type,
    setType,
    account,
    setAccount,
    category,
    setCategory,
    party,
    setParty,
    page,
    setPage,
    overview,
    isEditOpen,
    setIsEditOpen,
    editingTransaction,
    isDeleteOpen,
    setIsDeleteOpen,
    inflow,
    outflow,
    netPrecision,
    totalRecords,
    totalPages,
    startRecord,
    endRecord,
    handleEdit,
    handleNew,
    handleDeleteClick,
    confirmDelete,
    resetFilters,
    fetchTransactions,
  } = useTransactionsManager();

  return (
    <div className="p-4 md:p-8 flex flex-col gap-6 bg-background min-h-full max-w-[1600px] mx-auto w-full animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/30 transition-all duration-700" />
            <div className="relative w-14 h-14 rounded-2xl bg-slate-950 dark:bg-primary flex items-center justify-center border border-white/10 shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
              <History className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 leading-none">
                Transaction <span className="text-primary italic">Ledger</span>
              </h1>
              <div className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-[9px] font-black text-primary uppercase tracking-widest animate-pulse">
                Live
              </div>
            </div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-[0.2em]">
              Smart Financial Tracking & Flow Analysis
            </p>
          </div>
        </div>

        <Button 
          onClick={handleNew}
          className="h-12 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-primary dark:hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-primary/20 transition-all active:scale-95 flex items-center gap-3 group border-none"
        >
          <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
          </div>
          Add New Movement
        </Button>
      </div>

      {/* ── SUMMARY KPI CARDS ── */}
      <TransactionSummary
        inflow={inflow}
        outflow={outflow}
        netPrecision={netPrecision}
        totalRecords={totalRecords}
        overview={overview}
      />

      {/* ── CONTROL CENTER (Filters) ── */}
      <TransactionFilters
        search={search}
        setSearch={setSearch}
        dateRange={dateRange}
        setDateRange={setDateRange}
        type={type}
        setType={setType}
        account={account}
        setAccount={setAccount}
        category={category}
        setCategory={setCategory}
        party={party}
        setParty={setParty}
        accounts={accounts}
        categoriesList={categoriesList}
        parties={parties}
        isPro={isPro}
        resetFilters={resetFilters}
        setPage={setPage}
      />

      {/* ── TRANSACTION LIST ── */}
      <TransactionTable
        transactions={transactionsList}
        loading={loading}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        startRecord={startRecord}
        endRecord={endRecord}
        totalRecords={totalRecords}
        handleEdit={handleEdit}
        handleDeleteClick={handleDeleteClick}
      />

      {/* ── MODALS ── */}
      {isEditOpen && (
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
