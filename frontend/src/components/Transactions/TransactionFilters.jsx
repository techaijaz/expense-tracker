import React, { useState } from 'react';
import { Search, Filter, Activity, X, Lock, ChevronDown, ChevronUp, FilterX, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRangePicker } from '../DateRangePicker';
import { cn } from '@/utils/utils';

export default function TransactionFilters({
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
  accounts,
  categoriesList,
  parties,
  isPro,
  resetFilters,
  setPage,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <Card className="border-slate-900/10 dark:border-slate-800 shadow-2xl overflow-hidden bg-card/60 backdrop-blur-xl transition-all duration-500 hover:shadow-primary/5">
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Search */}
        <div className="flex flex-col gap-2">
          <label className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] font-black ml-1 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-primary" />
            Search Records
          </label>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-all duration-300" />
            <Input
              className="pl-10 h-11 bg-white dark:bg-slate-950 border-slate-900/30 dark:border-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-bold text-sm rounded-xl shadow-sm"
              placeholder="Filter by title, category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Date Range */}
        <div className="flex flex-col gap-2">
          <label className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] font-black ml-1 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-primary" />
            Time Horizon
          </label>
          <DateRangePicker 
            value={dateRange} 
            onChange={setDateRange} 
            className="h-11 bg-white dark:bg-slate-950 border-slate-900/30 dark:border-slate-800 rounded-xl shadow-sm font-bold"
          />
        </div>

        {/* Flow Type */}
        <div className="flex flex-col gap-2">
          <label className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] font-black ml-1 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-primary" />
            Movement Type
          </label>
          <Select
            value={type}
            onValueChange={(val) => {
              setType(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-11 bg-white dark:bg-slate-950 border-slate-900/30 dark:border-slate-800 focus:border-primary rounded-xl font-bold shadow-sm">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-primary" />
                <SelectValue placeholder="All Movements" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-900/20 shadow-xl">
              <SelectItem value="all" className="font-bold uppercase text-[10px] tracking-wider">All Movements</SelectItem>
              <SelectItem value="expense" className="font-bold uppercase text-[10px] tracking-wider text-rose-600">↑ Expense</SelectItem>
              <SelectItem value="income" className="font-bold uppercase text-[10px] tracking-wider text-emerald-600">↓ Income</SelectItem>
              <SelectItem value="transfer" className="font-bold uppercase text-[10px] tracking-wider text-sky-600">⇄ Transfer</SelectItem>
              <SelectItem value="debt" className="font-bold uppercase text-[10px] tracking-wider text-orange-600">↓ Debt</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Account */}
        <div className="flex flex-col gap-2">
          <label className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] font-black ml-1 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-primary" />
            Source Account
          </label>
          <Select
            value={account}
            onValueChange={(val) => {
              setAccount(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-11 bg-white dark:bg-slate-950 border-slate-900/30 dark:border-slate-800 focus:border-primary rounded-xl font-bold shadow-sm">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-primary" />
                <SelectValue placeholder="All Sources" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-900/20 shadow-xl">
              <SelectItem value="all" className="font-bold uppercase text-[10px] tracking-wider">All Accounts</SelectItem>
              {accounts.filter(a => !a.isDeleted).map((a) => (
                <SelectItem key={a._id} value={a._id} className="font-bold text-sm">
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Secondary Filters Header */}
      <div className="px-6 py-3 border-t border-slate-900/10 dark:border-slate-800/50 bg-slate-900/[0.03] dark:bg-slate-100/[0.02] flex items-center justify-between">
        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500 flex items-center gap-3">
          <div className="w-8 h-[1px] bg-slate-900/10 dark:bg-slate-100/10" />
          {isPro ? "Advanced Analysis" : "Advanced Analysis"}
          {!isPro && (
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/30 px-2.5 py-1 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.1)] group">
              <Sparkles className="w-2.5 h-2.5 text-amber-500 group-hover:rotate-12 transition-transform" />
              <span className="text-[7px] text-amber-600 font-black tracking-widest">PRO STATUS REQUIRED</span>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            "h-7 px-3 gap-2 transition-all duration-300 active:scale-95 group rounded-full",
            !isPro ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-600" : "hover:bg-primary/5 text-primary"
          )}
        >
          <span className="text-[9px] font-black uppercase tracking-wider">
            {showAdvanced ? "Hide Filters" : isPro ? "Show Filters" : "Preview Pro Filters"}
          </span>
          {showAdvanced ? (
            <ChevronUp className="w-3 h-3" />
          ) : !isPro ? (
            <Lock className="w-3 h-3 text-amber-500 animate-pulse group-hover:animate-none" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </Button>
      </div>

      {showAdvanced && (
        <div className={cn(
          "px-5 pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-end bg-slate-900/[0.03] dark:bg-slate-100/[0.02] animate-in fade-in slide-in-from-top-2 duration-300",
          !isPro && "opacity-60 grayscale-[0.5] relative"
        )}>
          <div className="flex flex-col gap-2">
            <label className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] font-black ml-1 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-primary" />
              Category Taxonomy {!isPro && <span className="text-[8px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-black tracking-normal flex items-center gap-1"><Sparkles className="w-2 h-2" />PRO</span>}
            </label>
            <Select
              value={category}
              onValueChange={(val) => {
                setCategory(val);
                setPage(1);
              }}
              disabled={!isPro}
            >
              <SelectTrigger className="h-11 bg-white dark:bg-slate-950 border-slate-900/30 dark:border-slate-800 rounded-xl font-bold shadow-sm">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-900/20 shadow-xl">
                <SelectItem value="all" className="font-bold uppercase text-[10px] tracking-wider">All Categories</SelectItem>
                {categoriesList.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    <span className="flex items-center gap-3">
                      <span className="text-lg bg-slate-100 dark:bg-slate-800 w-8 h-8 flex items-center justify-center rounded-lg shadow-sm border border-slate-900/5">{c.icon}</span>
                      <span className="font-bold text-sm">{c.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] font-black ml-1 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-primary" />
              Counterparty {!isPro && <span className="text-[8px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-black tracking-normal flex items-center gap-1"><Sparkles className="w-2 h-2" />PRO</span>}
            </label>
            <Select
              value={party}
              onValueChange={(val) => {
                setParty(val);
                setPage(1);
              }}
              disabled={!isPro}
            >
              <SelectTrigger className="h-11 bg-white dark:bg-slate-950 border-slate-900/30 dark:border-slate-800 rounded-xl font-bold shadow-sm">
                <SelectValue placeholder="Select Party" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-900/20 shadow-xl">
                <SelectItem value="all" className="font-bold uppercase text-[10px] tracking-wider">All Parties</SelectItem>
                {parties.map((p) => (
                  <SelectItem key={p._id} value={p._id} className="font-bold text-sm">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative group">
            {!isPro && (
              <div className="absolute -top-3 -right-2 z-10">
                <span className="text-[7px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-black flex items-center gap-1">
                  <Sparkles className="w-2 h-2" />
                  PRO
                </span>
              </div>
            )}
            <Button
              variant="outline"
              className="h-11 border-slate-200 dark:border-slate-800 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all duration-300 flex items-center gap-2 group font-black uppercase text-[10px] tracking-[0.2em] rounded-xl shadow-sm bg-white dark:bg-slate-950 px-6 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full"
              onClick={resetFilters}
              disabled={!isPro}
            >
              {!isPro ? (
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <FilterX className="w-3.5 h-3.5 text-rose-500 group-hover:text-white transition-colors" />
              )}
              <span>{isPro ? "Clear Filters" : "Clear Filters (Pro)"}</span>
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
