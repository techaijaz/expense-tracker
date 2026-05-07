import { useEffect, useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import api from '@/utils/httpMethods';
import {
  setLoans,
  updateLoan,
  removeLoan,
} from '@/features/loans/state/loanSlice';
import {
  setAccounts,
  updateAccount,
} from '@/features/accounts/state/accountSlice';
import useFormat from '@/hooks/useFormat';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Landmark, Users, Lock } from 'lucide-react';
import { cn } from '@/utils/utils';

// Sub-components
import PersonalDebtTab from './PersonalDebtTab';
import FormalLoansTab from './FormalLoansTab';

// Popups
import AddLoanPopup from '@/features/loans/components/AddLoanPopup';
import AddFormalLoanPopup from '@/features/loans/components/AddFormalLoanPopup';
import PayEMIPopup from '@/features/loans/components/PayEMIPopup';
import PrepaymentPopup from '@/features/loans/components/PrepaymentPopup';
import LoanSchedulePopup from '@/features/loans/components/LoanSchedulePopup';

export default function Loans() {
  const dispatch = useDispatch();
  const { loans } = useSelector((state) => state.loans);
  const { user } = useSelector((state) => state.auth);
  const { formatAmount } = useFormat();

  // Tab & Popup States
  const [activeTab, setActiveTab] = useState('PERSONAL');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editLoan, setEditLoan] = useState(null);
  const [formalLoans, setFormalLoans] = useState([]);
  const [isFormalLoanOpen, setIsFormalLoanOpen] = useState(false);
  const [isPayEMIOpen, setIsPayEMIOpen] = useState(false);
  const [isPrepayOpen, setIsPrepayOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedFormalLoan, setSelectedFormalLoan] = useState(null);

  // Filter States
  const [partyFilter, setPartyFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [parties, setParties] = useState([]);
  const [expandedParties, setExpandedParties] = useState(new Set());

  // Plan logic
  const userObj = user?.user || user;
  const isPro = userObj?.plan === 'pro' || userObj?.role === 'admin';

  const activePersonalParties = useMemo(() => {
    const pending = loans.filter((l) => !l.status || l.status === 'PENDING');
    const uniqueParties = new Set(
      pending.map((l) => l.party?._id).filter((id) => id),
    );
    return uniqueParties.size;
  }, [loans]);

  const personalLimitReached = !isPro && activePersonalParties >= 5;
  const formalLimitReached =
    !isPro && formalLoans.filter((l) => l.status === 'ACTIVE').length >= 1;

  // Data Fetching
  const fetchFormalLoans = async () => {
    try {
      const res = await api.get('/formal-loans');
      setFormalLoans(res.data.data || res.data || []);
    } catch (e) {
      console.error('Failed to fetch formal loans');
    }
  };

  const fetchAllLoansData = () => {
    api
      .get('/loans')
      .then((res) => dispatch(setLoans(res.data.data || res.data)))
      .catch(() => {});
    api
      .get('/parties')
      .then((res) => setParties(res.data.data || res.data || []))
      .catch(() => {});
    api
      .get('/account')
      .then((res) => dispatch(setAccounts(res.data.data || res.data)))
      .catch(() => {});
    fetchFormalLoans();
  };

  useEffect(() => {
    fetchAllLoansData();
    window.addEventListener('refetch-system-metrics', fetchAllLoansData);
    return () =>
      window.removeEventListener('refetch-system-metrics', fetchAllLoansData);
  }, []);

  // Handlers
  const handleDelete = async (loanId) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this record? This will also reverse the balance effect on your account.',
      )
    )
      return;
    try {
      await api.delete(`/loans/${loanId}`);
      dispatch(removeLoan(loanId));
      toast.success('Record deleted successfully');
      api
        .get('/account')
        .then((res) => dispatch(setAccounts(res.data.data || res.data)));
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to delete record');
    }
  };

  const toggleExpand = (partyId) => {
    const newExpanded = new Set(expandedParties);
    if (newExpanded.has(partyId)) newExpanded.delete(partyId);
    else newExpanded.add(partyId);
    setExpandedParties(newExpanded);
  };

  // Metrics Calculations
  const metrics = useMemo(() => {
    const pending = loans.filter((l) => !l.status || l.status === 'PENDING');
    const totalLent = pending
      .filter((l) => l.type === 'LENT')
      .reduce((s, l) => s + l.amount, 0);
    const totalBorrowed = pending
      .filter((l) => l.type === 'BORROWED')
      .reduce((s, l) => s + l.amount, 0);
    return {
      totalLent,
      totalBorrowed,
      netPosition: totalLent - totalBorrowed,
      activeCount: pending.length,
    };
  }, [loans]);

  const formalMetrics = useMemo(() => {
    const active = formalLoans.filter((l) => l.status === 'ACTIVE');
    const totalOutstanding = active.reduce(
      (s, l) => s + l.outstandingBalance,
      0,
    );
    const monthlyEMI = active.reduce((s, l) => s + l.emiAmount, 0);
    return {
      totalOutstanding,
      monthlyEMI,
      activeCount: active.length,
    };
  }, [formalLoans]);

  const consolidatedLedger = useMemo(() => {
    const partyGroups = loans.reduce((acc, loan) => {
      const partyId = loan.party?._id || 'unknown';
      const matchesParty = partyFilter === 'ALL' || partyId === partyFilter;
      const matchesDate =
        !dateFilter ||
        dayjs(loan.date || loan.createdAt).format('YYYY-MM-DD') ===
          dayjs(dateFilter).format('YYYY-MM-DD');

      if (!matchesParty || !matchesDate) return acc;

      if (!acc[partyId]) {
        acc[partyId] = {
          _id: partyId,
          party: loan.party,
          netBalance: 0,
          totalLent: 0,
          totalBorrowed: 0,
          lastActivity: loan.date || loan.createdAt,
          loans: [],
        };
      }

      const amt = Number(loan.amount) || 0;
      if (loan.type === 'LENT') {
        acc[partyId].netBalance += amt;
        acc[partyId].totalLent += amt;
      } else {
        acc[partyId].netBalance -= amt;
        acc[partyId].totalBorrowed += amt;
      }

      acc[partyId].loans.push(loan);
      const loanDate = loan.date || loan.createdAt;
      if (new Date(loanDate) > new Date(acc[partyId].lastActivity))
        acc[partyId].lastActivity = loanDate;

      return acc;
    }, {});

    return Object.values(partyGroups).sort(
      (a, b) => new Date(b.lastActivity) - new Date(a.lastActivity),
    );
  }, [loans, partyFilter, dateFilter]);

  return (
    <div className="page-body bg-[var(--bg)] min-h-screen pb-24 md:pb-12">
      <div className="max-w-[1400px] mx-auto w-full">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10 px-1">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-4xl font-black text-foreground tracking-tight flex items-center gap-3 text-balance">
              Debt{' '}
              <span className="text-accent drop-shadow-[0_0_20px_rgba(var(--accent-glow),0.5)]">
                Center
              </span>
            </h1>
            <p className="text-[13px] md:text-sm text-muted-foreground font-medium max-w-sm leading-relaxed opacity-80">
              Orchestrate personal commitments and formal protocols in one
              command center.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-5">
            {/* Premium Sliding Tabs */}
            <div className="relative flex p-1 bg-muted/20 backdrop-blur-xl border border-border/40 rounded-[22px] w-full sm:w-auto overflow-hidden shadow-inner group">
              <div
                className="absolute inset-y-1 rounded-[18px] bg-accent shadow-[0_0_20px_rgba(var(--accent-glow),0.3)] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] border border-white/10"
                style={{
                  left: '4px',
                  width: 'calc(50% - 6px)',
                  transform:
                    activeTab === 'PERSONAL'
                      ? 'translateX(0)'
                      : 'translateX(calc(100% + 4px))',
                }}
              />
              <button
                onClick={() => setActiveTab('PERSONAL')}
                className={cn(
                  'relative z-10 flex-1 sm:w-44 py-3.5 rounded-[18px] flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500',
                  activeTab === 'PERSONAL'
                    ? 'text-white'
                    : 'text-muted-foreground/60 hover:text-foreground',
                )}
              >
                <Users
                  className={cn(
                    'h-4 w-4 transition-transform duration-500',
                    activeTab === 'PERSONAL' && 'scale-110',
                  )}
                />
                Personal
              </button>
              <button
                onClick={() => {
                  if (!isPro) {
                    toast.error('Pro subscription required');
                    return;
                  }
                  setActiveTab('FORMAL');
                }}
                className={cn(
                  'relative z-10 flex-1 sm:w-44 py-3.5 rounded-[18px] flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500',
                  activeTab === 'FORMAL'
                    ? 'text-white'
                    : 'text-muted-foreground/60 hover:text-foreground',
                  !isPro && 'opacity-90',
                )}
              >
                {!isPro && (
                  <Lock className="h-4 w-4 text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.4)] animate-pulse" />
                )}
                <Landmark
                  className={cn(
                    'h-4 w-4 transition-transform duration-500',
                    activeTab === 'FORMAL' && 'scale-110',
                  )}
                />
                Formal
              </button>
            </div>

            <div className="hidden sm:block">
              {activeTab === 'FORMAL' ? (
                <Button
                  onClick={() =>
                    formalLimitReached
                      ? toast.error(
                          'Basic plan limit reached (1 active formal loan). Upgrade to PRO.',
                        )
                      : setIsFormalLoanOpen(true)
                  }
                  className="h-14 px-10 gap-3 bg-gradient-to-r from-accent to-accent/80 hover:opacity-90 rounded-[22px] shadow-2xl shadow-accent/20 text-white font-black text-[11px] uppercase tracking-widest transition-all hover:scale-[1.03] active:scale-[0.97] border-none group"
                >
                  {formalLimitReached ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                  )}
                  New Protocol
                </Button>
              ) : (
                <Button
                  onClick={() =>
                    personalLimitReached
                      ? toast.error(
                          'Basic plan limit reached (5 active parties). Upgrade to PRO.',
                        )
                      : setIsDialogOpen(true)
                  }
                  className="h-14 px-10 gap-3 bg-gradient-to-r from-accent to-accent/80 hover:opacity-90 rounded-[22px] shadow-2xl shadow-accent/20 text-white font-black text-[11px] uppercase tracking-widest transition-all hover:scale-[1.03] active:scale-[0.97] border-none group"
                >
                  {personalLimitReached ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                  )}
                  New Commitment
                </Button>
              )}
            </div>
          </div>
        </div>

        {activeTab === 'PERSONAL' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <PersonalDebtTab
              metrics={metrics}
              consolidatedLedger={consolidatedLedger}
              parties={parties}
              partyFilter={partyFilter}
              setPartyFilter={setPartyFilter}
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              isCalendarOpen={isCalendarOpen}
              setIsCalendarOpen={setIsCalendarOpen}
              expandedParties={expandedParties}
              toggleExpand={toggleExpand}
              onEdit={(l) => {
                setEditLoan(l);
                setIsDialogOpen(true);
              }}
              onDelete={handleDelete}
              onAction={() => setIsDialogOpen(true)}
              formatAmount={formatAmount}
            />
          </div>
        )}

        {activeTab === 'FORMAL' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <FormalLoansTab
              formalMetrics={formalMetrics}
              formalLoans={formalLoans}
              formatAmount={formatAmount}
              onPrepay={(l) => {
                setSelectedFormalLoan(l);
                setIsPrepayOpen(true);
              }}
              onSchedule={(l) => {
                setSelectedFormalLoan(l);
                setIsScheduleOpen(true);
              }}
              onPayEMI={(l) => {
                setSelectedFormalLoan(l);
                setIsPayEMIOpen(true);
              }}
            />
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      <div className="fixed bottom-8 right-8 z-50 sm:hidden">
        <Button
          size="icon"
          className="h-16 w-16 rounded-full shadow-2xl animate-in zoom-in duration-500 bg-accent hover:opacity-90 text-white shadow-accent/40 border-none"
          onClick={() =>
            activeTab === 'FORMAL'
              ? formalLimitReached
                ? toast.error('Limit reached')
                : setIsFormalLoanOpen(true)
              : personalLimitReached
                ? toast.error('Limit reached')
                : setIsDialogOpen(true)
          }
        >
          {activeTab === 'FORMAL' ? (
            formalLimitReached ? (
              <Lock className="h-6 w-6" />
            ) : (
              <Plus className="h-6 w-6" />
            )
          ) : personalLimitReached ? (
            <Lock className="h-6 w-6" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Popups */}
      <AddLoanPopup
        open={isDialogOpen}
        setOpen={(v) => {
          setIsDialogOpen(v);
          if (!v) setEditLoan(null);
        }}
        editLoan={editLoan}
      />
      <AddFormalLoanPopup
        open={isFormalLoanOpen}
        setOpen={setIsFormalLoanOpen}
        onSaved={fetchFormalLoans}
      />
      {selectedFormalLoan && (
        <>
          <PayEMIPopup
            open={isPayEMIOpen}
            setOpen={setIsPayEMIOpen}
            loanId={selectedFormalLoan._id}
            onPaid={fetchFormalLoans}
          />
          <PrepaymentPopup
            open={isPrepayOpen}
            setOpen={setIsPrepayOpen}
            loanId={selectedFormalLoan._id}
            loanName={selectedFormalLoan.bankName}
            outstanding={selectedFormalLoan.outstandingBalance}
            onPaid={fetchFormalLoans}
          />
          <LoanSchedulePopup
            open={isScheduleOpen}
            setOpen={setIsScheduleOpen}
            loanId={selectedFormalLoan._id}
            loanName={selectedFormalLoan.bankName}
          />
        </>
      )}
    </div>
  );
}
