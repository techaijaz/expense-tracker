import { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import api from '@/utils/httpMethods';
import { setLoans, updateLoan, removeLoan } from '@/redux/loanSlice';
import { setAccounts, updateAccount } from '@/redux/accountSlice';
import useFormat from '@/hooks/useFormat';
import { format, isPast } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/utils';
import AddLoanPopup from './AddLoanPopup';
import AddFormalLoanPopup from './AddFormalLoanPopup';
import PayEMIPopup from './PayEMIPopup';
import PrepaymentPopup from './PrepaymentPopup';
import LoanSchedulePopup from './LoanSchedulePopup';

export default function Loans() {
  const dispatch = useDispatch();
  const { loans } = useSelector((state) => state.loans);
  const { formatAmount, formatDate, currencySymbol } = useFormat();

  const [activeTab, setActiveTab] = useState('PERSONAL');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editLoan, setEditLoan] = useState(null);
  
  // Formal Loans State
  const [formalLoans, setFormalLoans] = useState([]);
  const [isFormalLoanOpen, setIsFormalLoanOpen] = useState(false);
  const [isPayEMIOpen, setIsPayEMIOpen] = useState(false);
  const [isPrepayOpen, setIsPrepayOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedFormalLoan, setSelectedFormalLoan] = useState(null);

  // Filters
  const [partyFilter, setPartyFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // UI State
  const [expandedParties, setExpandedParties] = useState(new Set());
  const [parties, setParties] = useState([]);

  // Fetch on mount
  const fetchFormalLoans = async () => {
    try {
      const res = await api.get('/formal-loans');
      setFormalLoans(res.data.data || res.data || []);
    } catch (e) {
      console.error('Failed to fetch formal loans');
    }
  };

  useEffect(() => {
    api.get('/loans').then((res) => dispatch(setLoans(res.data.data || res.data))).catch(() => {});
    api.get('/parties').then((res) => setParties(res.data.data || res.data || [])).catch(() => {});
    api.get('/account').then((res) => dispatch(setAccounts(res.data.data || res.data))).catch(() => {});
    fetchFormalLoans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (loanId) => {
    if (!window.confirm('Are you sure you want to delete this record? This will also reverse the balance effect on your account.')) return;
    try {
      await api.delete(`/loans/${loanId}`);
      dispatch(removeLoan(loanId));
      toast.success('Record deleted successfully');
      // Refresh accounts to show balance reversal
      api.get('/account').then((res) => dispatch(setAccounts(res.data.data || res.data)));
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to delete record');
    }
  };

  const toggleExpand = (partyId) => {
    const newExpanded = new Set(expandedParties);
    if (newExpanded.has(partyId)) {
      newExpanded.delete(partyId);
    } else {
      newExpanded.add(partyId);
    }
    setExpandedParties(newExpanded);
  };

  // Metrics (Personal)
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
      netPosition: totalLent - totalBorrowed,
      activeCount: pending.length,
    };
  }, [loans]);

  // Metrics (Formal)
  const formalMetrics = useMemo(() => {
    const active = formalLoans.filter(l => l.status === 'ACTIVE');
    const totalOutstanding = active.reduce((s, l) => s + l.outstandingBalance, 0);
    const monthlyEMI = active.reduce((s, l) => s + l.emiAmount, 0);
    const totalInterestPaid = formalLoans.reduce((s, l) => s + (l.totalInterest - (l.currentPendingInterest || 0)), 0); 
    // Simplified interest paid if tracked, otherwise 0 for now
    return {
      totalOutstanding,
      monthlyEMI,
      totalInterestPaid: 0, // Need backend support/tracking for accurate historical interest paid
      activeCount: active.length
    };
  }, [formalLoans]);

  // Grouped and Filtered Loans (Consolidated by Party)
  const consolidatedLedger = useMemo(() => {
    // 1. Group by party
    const partyGroups = loans.reduce((acc, loan) => {
      const partyId = loan.party?._id || 'unknown';
      
      // Apply filters early to loans within group
      const matchesParty = partyFilter === 'ALL' || partyId === partyFilter;
      const matchesDate = !dateFilter || format(new Date(loan.date), 'yyyy-MM-dd') === format(dateFilter, 'yyyy-MM-dd');
      
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
      
      const amt = loan.amount || 0;
      if (loan.type === 'LENT') {
        acc[partyId].netBalance += amt;
        acc[partyId].totalLent += amt;
      } else {
        acc[partyId].netBalance -= amt;
        acc[partyId].totalBorrowed += amt;
      }

      acc[partyId].loans.push(loan);
      
      const loanDate = loan.date || loan.createdAt;
      if (new Date(loanDate) > new Date(acc[partyId].lastActivity)) {
        acc[partyId].lastActivity = loanDate;
      }

      return acc;
    }, {});

    return Object.values(partyGroups).sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
  }, [loans, partyFilter, dateFilter]);

  const { user } = useSelector((state) => state.auth);
  const plan = user?.user?.plan || user?.plan || 'basic';
  const isPro = plan === 'pro';

  const personalLimitReached = !isPro && loans.filter(l => l.status === 'PENDING').length >= 1;
  const formalLimitReached = !isPro && formalLoans.filter(l => l.status === 'ACTIVE').length >= 1;

  const handleAddPersonal = () => {
    if (personalLimitReached) {
      toast.error('Basic plan limit reached (1 active personal debt). Upgrade to PRO to add more.');
      return;
    }
    setIsDialogOpen(true);
  };

  const handleAddFormal = () => {
    if (formalLimitReached) {
      toast.error('Basic plan limit reached (1 active formal loan). Upgrade to PRO to add more.');
      return;
    }
    setIsFormalLoanOpen(true);
  };

  return (
    <>

      <div className="page-body">
        
        {/* Header Action Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div className="loan-tabs" style={{ marginBottom: 0 }}>
            <div
              className={`loan-tab ${activeTab === 'PERSONAL' ? 'active' : ''}`}
              onClick={() => setActiveTab('PERSONAL')}
            >
              👥 Personal Debt
            </div>
            <div
              className={`loan-tab ${activeTab === 'FORMAL' ? 'active' : ''}`}
              onClick={() => setActiveTab('FORMAL')}
            >
              🏦 Formal Loans
            </div>
          </div>

          <div>
             {activeTab === 'FORMAL' ? (
              <button className="btn-new" onClick={handleAddFormal}>
                {formalLimitReached ? '🔒' : '+'} Add Formal Loan
              </button>
            ) : (
              <button className="btn-new" onClick={handleAddPersonal}>
                {personalLimitReached ? '🔒' : '+'} Record Commitment
              </button>
            )}
          </div>
        </div>


        {activeTab === 'PERSONAL' && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              <div className="kpi-card green">
                <div className="kpi-label">Total Lent</div>
                <div className="kpi-val" style={{ fontSize: '18px' }}>
                  {formatAmount(metrics.totalLent)}
                </div>
                <div className="kpi-change neutral">Active receivables</div>
              </div>
              <div className="kpi-card red">
                <div className="kpi-label">Total Borrowed</div>
                <div className="kpi-val" style={{ fontSize: '18px' }}>
                  {formatAmount(metrics.totalBorrowed)}
                </div>
                <div className="kpi-change neutral">Active payables</div>
              </div>
              <div className="kpi-card blue">
                <div className="kpi-label">Net Position</div>
                <div className="kpi-val" style={{ fontSize: '18px' }}>
                  {metrics.netPosition >= 0 ? '+' : '-'}
                  {formatAmount(Math.abs(metrics.netPosition))}
                </div>
                <div
                  className={`kpi-change ${metrics.netPosition >= 0 ? 'up' : 'down'}`}
                >
                  {metrics.netPosition >= 0
                    ? 'You are owed more'
                    : 'You owe more'}
                </div>
              </div>
              <div className="kpi-card purple">
                <div className="kpi-label">Active Debts</div>
                <div className="kpi-val" style={{ fontSize: '18px' }}>
                  {metrics.activeCount}
                </div>
                <div className="kpi-change neutral">Open records</div>
              </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div className="card-title" style={{ whiteSpace: 'nowrap' }}>Active Ledger</div>
                
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                  {/* Party Dropdown */}
                  <select 
                    value={partyFilter} 
                    onChange={(e) => setPartyFilter(e.target.value)}
                    className="form-input"
                    style={{ width: '160px', height: '32px', fontSize: '11px', padding: '0 8px', marginBottom: 0 }}
                  >
                    <option value="ALL">All Counterparties</option>
                    {parties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>

                  {/* Date Filter */}
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'justify-start text-left font-normal border-none hover:bg-surface-container-high',
                          !dateFilter && 'text-muted-foreground'
                        )}
                        style={{
                          backgroundColor: 'var(--bg4)', 
                          color: !dateFilter ? 'var(--text3)' : 'var(--text)',
                          height: '32px',
                          fontSize: '11px',
                          padding: '0 10px'
                        }}
                      >
                        <span className="material-symbols-outlined mr-2" style={{ fontSize: '14px' }}>event</span>
                        {dateFilter ? format(dateFilter, 'PP') : <span>Date filter…</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[100]" align="end" style={{ backgroundColor: 'var(--bg3)', border: '1px solid var(--border)' }}>
                      <div style={{ padding: '8px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => { setDateFilter(null); setIsCalendarOpen(false); }}
                          style={{ fontSize: '10px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          Clear Date
                        </button>
                      </div>
                      <Calendar
                        mode="single"
                        selected={dateFilter}
                        onSelect={(d) => {
                          setDateFilter(d);
                          setIsCalendarOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="debt-head" style={{ gridTemplateColumns: '40px 1fr 120px 140px 140px 100px' }}>
                <div />
                <div>Party</div>
                <div>Net Direction</div>
                <div>Total Principal</div>
                <div>Net Balance</div>
                <div>Action</div>
              </div>
              {consolidatedLedger.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text3)' }}>
                  No debt records found.
                </div>
              ) : (
                consolidatedLedger.map((group) => {
                  const partyName = group.party?.name || 'Unknown';
                  const pInitial = partyName[0] || '?';
                  const isExpanded = expandedParties.has(group._id);

                  const isOwed = group.netBalance > 0;
                  const isOwe = group.netBalance < 0;
                  const isSettled = group.netBalance === 0;

                  const avatarColor = isOwed ? 'var(--green)' : isOwe ? 'var(--red)' : 'var(--text3)';

                  return (
                    <div key={group._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <div className="debt-row" style={{ gridTemplateColumns: '40px 1fr 120px 140px 140px 100px', cursor: 'pointer' }} onClick={() => toggleExpand(group._id)}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--text3)', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'none' }}>
                            chevron_right
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div className="party-avatar" style={{ background: avatarColor, width: '32px', height: '32px', fontSize: '12px' }}>
                            {pInitial}
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600 }}>{partyName}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{group.party?.relation || 'Contact'}</div>
                          </div>
                        </div>

                        <div>
                          {isSettled ? (
                            <span className="direction-badge settled">Settled</span>
                          ) : isOwed ? (
                            <span className="direction-badge lent">Receivable</span>
                          ) : (
                            <span className="direction-badge borrowed">Payable</span>
                          )}
                        </div>

                        <div style={{ fontFamily: 'var(--mono)', fontSize: '12px' }}>
                           <span style={{ color: 'var(--green)' }}>+{formatAmount(group.totalLent)}</span>
                           <br />
                           <span style={{ color: 'var(--red)' }}>-{formatAmount(group.totalBorrowed)}</span>
                        </div>

                        <div style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: isSettled ? 'var(--green)' : isOwed ? 'var(--green)' : 'var(--red)' }}>
                          {isOwe ? '-' : ''}{formatAmount(Math.abs(group.netBalance))}
                        </div>

                        <div>
                          {!isSettled && (
                            <button
                              className="btn-outline"
                              onClick={(e) => {
                                 e.stopPropagation();
                                 setIsDialogOpen(true);
                                 // We could pre-select the party here if AddLoanPopup supported a defaultPartyId
                              }}
                              style={{ fontSize: '11px', padding: '5px 10px' }}
                            >
                              {isOwed ? 'Collect' : 'Pay'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expanded Transaction List */}
                      {isExpanded && (
                        <div style={{ background: 'var(--bg4)', padding: '12px 16px 12px 56px', borderTop: '1px solid var(--border)' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text3)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Transaction History
                          </div>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '6px 0', fontSize: '10px', color: 'var(--text3)' }}>Date</th>
                                <th style={{ padding: '6px 0', fontSize: '10px', color: 'var(--text3)' }}>Type</th>
                                <th style={{ padding: '6px 0', fontSize: '10px', color: 'var(--text3)' }}>Account</th>
                                <th style={{ padding: '6px 0', fontSize: '10px', color: 'var(--text3)', textAlign: 'right' }}>Amount</th>
                                <th style={{ padding: '6px 0', fontSize: '10px', color: 'var(--text3)', textAlign: 'right', width: '80px' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.loans.map((loan) => (
                                <tr key={loan._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                  <td style={{ padding: '8px 0', fontSize: '12px' }}>{format(new Date(loan.date), 'dd MMM yyyy')}</td>
                                  <td style={{ padding: '8px 0', fontSize: '12px' }}>
                                    <span style={{ color: loan.type === 'LENT' ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>
                                      {loan.type}
                                    </span>
                                  </td>
                                  <td style={{ padding: '8px 0', fontSize: '12px', color: 'var(--text2)' }}>{loan.accountId?.name || 'Account'}</td>
                                  <td style={{ padding: '8px 0', fontSize: '12px', textAlign: 'right', fontWeight: 600 }}>
                                    {formatAmount(loan.amount)}
                                  </td>
                                  <td style={{ padding: '8px 0', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                      <span 
                                        className="material-symbols-outlined" 
                                        style={{ fontSize: '18px', color: 'var(--accent)', cursor: 'pointer', opacity: 0.8 }}
                                        onClick={(e) => { e.stopPropagation(); setEditLoan(loan); setIsDialogOpen(true); }}
                                      >
                                        edit_square
                                      </span>
                                      <span 
                                        className="material-symbols-outlined" 
                                        style={{ fontSize: '18px', color: 'var(--red)', cursor: 'pointer', opacity: 0.8 }}
                                        onClick={(e) => { e.stopPropagation(); handleDelete(loan._id); }}
                                      >
                                        delete
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
        {activeTab === 'FORMAL' && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              <div className="kpi-card red">
                <div className="kpi-label">Total Outstanding</div>
                <div className="kpi-val" style={{ fontSize: '18px' }}>
                  {formatAmount(formalMetrics.totalOutstanding)}
                </div>
              </div>
              <div className="kpi-card amber">
                <div className="kpi-label">Monthly EMI</div>
                <div className="kpi-val" style={{ fontSize: '18px' }}>
                  {formatAmount(formalMetrics.monthlyEMI)}
                </div>
              </div>
              <div className="kpi-card blue">
                <div className="kpi-label">Interest Paid</div>
                <div className="kpi-val" style={{ fontSize: '18px' }}>
                  {formatAmount(formalMetrics.totalInterestPaid)}
                </div>
              </div>
              <div className="kpi-card purple">
                <div className="kpi-label">Active Loans</div>
                <div className="kpi-val" style={{ fontSize: '18px' }}>
                  {formalMetrics.activeCount}
                </div>
              </div>
            </div>

            {formalLoans.length === 0 ? (
               <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)' }}>
                  No formal loans recorded. Click "+ Add Formal Loan" to get started.
               </div>
            ) : (
              formalLoans.map(loan => {
                const completedPct = ((loan.principal - loan.outstandingBalance) / loan.principal) * 100;
                
                return (
                  <div key={loan._id} className="formal-loan-card">
                    <div className="loan-card-header">
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '4px',
                          }}
                        >
                          <span className={`loan-type-badge ${loan.loanType.toLowerCase()}`}>
                            {loan.loanType === 'CAR' ? '🚗' : loan.loanType === 'HOME' ? '🏠' : '💼'} {loan.loanType} Loan
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
                            {loan.bankName}
                          </span>
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '700' }}>
                          {loan.loanType} Loan — {loan.bankName}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn-outline" 
                          style={{ fontSize: '12px' }}
                          onClick={() => { setSelectedFormalLoan(loan); setIsPrepayOpen(true); }}
                        >
                          Prepay Calc
                        </button>
                        <button 
                          className="btn-new" 
                          style={{ fontSize: '12px' }}
                          onClick={() => { setSelectedFormalLoan(loan); setIsPayEMIOpen(true); }}
                        >
                          Pay EMI →
                        </button>
                      </div>
                    </div>
                    <div className="loan-progress-wrap">
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '12px',
                          color: 'var(--text2)',
                          marginBottom: '6px',
                        }}
                      >
                        {/* We don't track paid count directly yet, but can estimate from outstanding */}
                        <span>{completedPct.toFixed(1)}% complete</span>
                        <span>{loan.status}</span>
                      </div>
                      <div className="loan-progress-bar">
                        <div
                          className="loan-progress-fill"
                          style={{ width: `${completedPct}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="loan-stats">
                      <div className="loan-stat">
                        <div
                          className="loan-stat-val"
                          style={{ color: 'var(--red)' }}
                        >
                          {formatAmount(loan.outstandingBalance)}
                        </div>
                        <div className="loan-stat-label">Outstanding</div>
                      </div>
                      <div className="loan-stat">
                        <div
                          className="loan-stat-val"
                          style={{ color: 'var(--accent)' }}
                        >
                          {formatAmount(loan.emiAmount)}
                        </div>
                        <div className="loan-stat-label">Monthly EMI</div>
                      </div>
                      <div className="loan-stat">
                        <div
                          className="loan-stat-val"
                          style={{ color: 'var(--amber)' }}
                        >
                          {loan.interestRate}%
                        </div>
                        <div className="loan-stat-label">Interest Rate</div>
                      </div>
                      <div className="loan-stat">
                        <div
                          className="loan-stat-val"
                          style={{ color: 'var(--green)' }}
                        >
                           {loan.tenureMonths} mo.
                        </div>
                        <div className="loan-stat-label">Total Tenure</div>
                      </div>
                    </div>
                    <div
                      style={{
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: '1px solid var(--border)',
                        display: 'flex',
                        gap: '16px',
                        fontSize: '12px',
                        color: 'var(--text2)',
                      }}
                    >
                      <span>Principal: {formatAmount(loan.principal)}</span>
                      <span>Next Due: {formatDate(loan.startDate)}</span>
                      <span style={{ marginLeft: 'auto' }}>
                        <span
                          className="form-link"
                          style={{ cursor: 'pointer' }}
                          onClick={() => { setSelectedFormalLoan(loan); setIsScheduleOpen(true); }}
                        >
                          View Schedule →
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      <AddLoanPopup 
        open={isDialogOpen} 
        setOpen={(val) => {
          setIsDialogOpen(val);
          if (!val) setEditLoan(null); // Reset editLoan when closing
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
    </>
  );
}
