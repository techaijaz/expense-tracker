import { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import api from '@/utils/httpMethods';
import { setLoans, updateLoan, removeLoan } from '@/redux/loanSlice';
import { setAccounts, updateAccount } from '@/redux/accountSlice';
import { formatAmount, getCurrencySymbol } from '@/utils/format';
import { format } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/utils';
import AddLoanPopup from './AddLoanPopup';

export default function Loans() {
  const dispatch = useDispatch();
  const { loans } = useSelector((state) => state.loans);
  const preferences = useSelector(
    (state) => state.auth.user?.user?.preferences,
  );
  const { currency = 'INR', decimalPlaces = 2 } = preferences || {};
  const currencySymbol = getCurrencySymbol(currency);

  const [activeTab, setActiveTab] = useState('PERSONAL');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editLoan, setEditLoan] = useState(null);
  
  // Filters
  const [partyFilter, setPartyFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // UI State
  const [expandedParties, setExpandedParties] = useState(new Set());
  const [parties, setParties] = useState([]);

  // Fetch on mount
  useEffect(() => {
    api.get('/loans').then((res) => dispatch(setLoans(res.data.data || res.data))).catch(() => {});
    api.get('/parties').then((res) => setParties(res.data.data || res.data || [])).catch(() => {});
    api.get('/account').then((res) => dispatch(setAccounts(res.data.data || res.data))).catch(() => {});
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
      netPosition: totalLent - totalBorrowed,
      activeCount: pending.length,
    };
  }, [loans]);

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
              <button className="btn-new" onClick={() => toast.info('Formal Loan modal coming soon!')}>
                + Add Formal Loan
              </button>
            ) : (
              <button className="btn-new" onClick={() => setIsDialogOpen(true)}>
                + Record Commitment
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
                  {formatAmount(metrics.totalLent, currency, decimalPlaces)}
                </div>
                <div className="kpi-change neutral">Active receivables</div>
              </div>
              <div className="kpi-card red">
                <div className="kpi-label">Total Borrowed</div>
                <div className="kpi-val" style={{ fontSize: '18px' }}>
                  {formatAmount(metrics.totalBorrowed, currency, decimalPlaces)}
                </div>
                <div className="kpi-change neutral">Active payables</div>
              </div>
              <div className="kpi-card blue">
                <div className="kpi-label">Net Position</div>
                <div className="kpi-val" style={{ fontSize: '18px' }}>
                  {metrics.netPosition >= 0 ? '+' : '-'}
                  {formatAmount(
                    Math.abs(metrics.netPosition),
                    currency,
                    decimalPlaces,
                  )}
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
                           <span style={{ color: 'var(--green)' }}>+{formatAmount(group.totalLent, currency, decimalPlaces)}</span>
                           <br />
                           <span style={{ color: 'var(--red)' }}>-{formatAmount(group.totalBorrowed, currency, decimalPlaces)}</span>
                        </div>

                        <div style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: isSettled ? 'var(--green)' : isOwed ? 'var(--green)' : 'var(--red)' }}>
                          {isOwe ? '-' : ''}{formatAmount(Math.abs(group.netBalance), currency, decimalPlaces)}
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
                                    {formatAmount(loan.amount, currency, decimalPlaces)}
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
                  {currencySymbol}11,20,000
                </div>
              </div>
              <div className="kpi-card amber">
                <div className="kpi-label">Monthly EMI</div>
                <div className="kpi-val" style={{ fontSize: '18px' }}>
                  {currencySymbol}57,831
                </div>
              </div>
              <div className="kpi-card blue">
                <div className="kpi-label">Interest Paid</div>
                <div className="kpi-val" style={{ fontSize: '18px' }}>
                  {currencySymbol}89,420
                </div>
              </div>
              <div className="kpi-card purple">
                <div className="kpi-label">Active Loans</div>
                <div className="kpi-val" style={{ fontSize: '18px' }}>
                  2
                </div>
              </div>
            </div>

            <div className="formal-loan-card">
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
                    <span className="loan-type-badge">🚗 Car Loan</span>
                    <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
                      HDFC Bank
                    </span>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '700' }}>
                    Car Loan — Maruti Suzuki
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-outline" style={{ fontSize: '12px' }}>
                    Prepay Calc
                  </button>
                  <button className="btn-new" style={{ fontSize: '12px' }}>
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
                  <span>23 EMIs paid of 60</span>
                  <span>38.3% complete</span>
                </div>
                <div className="loan-progress-bar">
                  <div
                    className="loan-progress-fill"
                    style={{ width: '38%' }}
                  ></div>
                </div>
              </div>
              <div className="loan-stats">
                <div className="loan-stat">
                  <div
                    className="loan-stat-val"
                    style={{ color: 'var(--red)' }}
                  >
                    {currencySymbol}4,23,600
                  </div>
                  <div className="loan-stat-label">Outstanding</div>
                </div>
                <div className="loan-stat">
                  <div
                    className="loan-stat-val"
                    style={{ color: 'var(--accent)' }}
                  >
                    {currencySymbol}14,385
                  </div>
                  <div className="loan-stat-label">Monthly EMI</div>
                </div>
                <div className="loan-stat">
                  <div
                    className="loan-stat-val"
                    style={{ color: 'var(--amber)' }}
                  >
                    8.5%
                  </div>
                  <div className="loan-stat-label">Interest Rate</div>
                </div>
                <div className="loan-stat">
                  <div
                    className="loan-stat-val"
                    style={{ color: 'var(--green)' }}
                  >
                    37 left
                  </div>
                  <div className="loan-stat-label">EMIs Remaining</div>
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
                <span>Principal: {currencySymbol}7,00,000</span>
                <span>Interest paid: {currencySymbol}56,820</span>
                <span>Next EMI: 01 May 2026</span>
                <span style={{ marginLeft: 'auto' }}>
                  <span
                    className="form-link"
                    style={{ cursor: 'pointer' }}
                  >
                    View Schedule →
                  </span>
                </span>
              </div>
            </div>

            <div className="formal-loan-card">
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
                    <span
                      className="loan-type-badge"
                      style={{
                        background: 'var(--purple-bg)',
                        color: 'var(--purple)',
                      }}
                    >
                      💼 Personal Loan
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
                      SBI Bank
                    </span>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '700' }}>
                    Personal Loan
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-outline" style={{ fontSize: '12px' }}>
                    Prepay Calc
                  </button>
                  <button className="btn-new" style={{ fontSize: '12px' }}>
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
                  <span>3 EMIs paid of 12</span>
                  <span>25% complete</span>
                </div>
                <div className="loan-progress-bar">
                  <div
                    className="loan-progress-fill"
                    style={{ width: '25%', background: 'var(--purple)' }}
                  ></div>
                </div>
              </div>
              <div className="loan-stats">
                <div className="loan-stat">
                  <div
                    className="loan-stat-val"
                    style={{ color: 'var(--red)' }}
                  >
                    {currencySymbol}3,37,500
                  </div>
                  <div className="loan-stat-label">Outstanding</div>
                </div>
                <div className="loan-stat">
                  <div
                    className="loan-stat-val"
                    style={{ color: 'var(--accent)' }}
                  >
                    {currencySymbol}43,446
                  </div>
                  <div className="loan-stat-label">Monthly EMI</div>
                </div>
                <div className="loan-stat">
                  <div
                    className="loan-stat-val"
                    style={{ color: 'var(--amber)' }}
                  >
                    13%
                  </div>
                  <div className="loan-stat-label">Interest Rate</div>
                </div>
                <div className="loan-stat">
                  <div
                    className="loan-stat-val"
                    style={{ color: 'var(--green)' }}
                  >
                    9 left
                  </div>
                  <div className="loan-stat-label">EMIs Remaining</div>
                </div>
              </div>
            </div>
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
    </>
  );
}
