import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { formatAmount } from '@/utils/format';
import { format } from 'date-fns';
import api from '@/utils/httpMethods';
import { updateAccount } from '@/redux/accountSlice';

export default function PayEMIPopup({ open, setOpen, loanId, onPaid }) {
  const dispatch = useDispatch();
  const { accounts = [] } = useSelector((state) => state.accounts);
  const preferences = useSelector(
    (state) => state.auth.user?.user?.preferences,
  );
  const { currency = 'INR', decimalPlaces = 2 } = preferences || {};

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [loanData, setLoanData] = useState(null);
  const [nextInstallment, setNextInstallment] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  useEffect(() => {
    if (open && loanId) {
      const fetchData = async () => {
        setFetching(true);
        try {
          const res = await api.get(`/formal-loans/${loanId}`);
          const { loan, schedule } = res.data.data || res.data;
          setLoanData(loan);
          // Find first pending installment
          const next = schedule.find((s) => s.status === 'PENDING');
          setNextInstallment(next);
          setSelectedAccountId(loan.associatedAccountId || '');
        } catch (err) {
          toast.error('Failed to fetch loan details');
          setOpen(false);
        } finally {
          setFetching(false);
        }
      };
      fetchData();
    }
  }, [open, loanId, setOpen]);

  const handlePay = async () => {
    if (!nextInstallment) return;
    if (!selectedAccountId) {
      toast.error('Please select a payment account');
      return;
    }

    setLoading(true);
    try {
      // Backend expects scheduleId. It also expects the loan to have an associatedAccountId,
      // but we might want to override it here if the user changed the dropdown.
      // However, the current payEMI backend logic uses loan.associatedAccountId.
      // I should probably update the backend payEMI to accept an accountId if provided in body.

      const res = await api.post('/formal-loans/pay-emi', {
        scheduleId: nextInstallment._id,
        accountId: selectedAccountId, // Passing this to allow override
      });

      const { updatedAccounts } = res.data.data || res.data;
      if (updatedAccounts) {
        updatedAccounts.forEach((acc) => dispatch(updateAccount(acc)));
      }

      toast.success(`EMI #${nextInstallment.installmentNo} paid successfully!`);
      if (onPaid) onPaid();
      setOpen(false);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || 'Failed to process EMI payment',
      );
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div
        style={{ position: 'absolute', inset: 0 }}
        onClick={() => setOpen(false)}
      ></div>
      <div className="modal modal-sm" style={{ zIndex: 11 }}>
        <div className="modal-close" onClick={() => setOpen(false)}>
          ✕
        </div>
        <div className="modal-title">Pay EMI</div>
        <div className="modal-sub">
          Confirm payment for the current upcoming installment.
        </div>

        {fetching ? (
          <div
            style={{
              padding: '40px',
              textAlign: 'center',
              color: 'var(--text3)',
            }}
          >
            Loading loan details...
          </div>
        ) : loanData && nextInstallment ? (
          <>
            <div
              style={{
                background: 'var(--bg3)',
                borderRadius: 'var(--r)',
                padding: '16px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--text3)',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    Loan
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>
                    {loanData.bankName}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--text3)',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    Inst. #
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>
                    {nextInstallment.installmentNo}
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: '12px',
                  background: 'var(--bg4)',
                  borderRadius: 'var(--r2)',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '4px',
                  }}
                >
                  <span style={{ fontSize: '12px', color: 'var(--text2)' }}>
                    Principal Component
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>
                    {formatAmount(
                      nextInstallment.principalComponent,
                      currency,
                      decimalPlaces,
                    )}
                  </span>
                </div>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <span style={{ fontSize: '12px', color: 'var(--text2)' }}>
                    Interest Component
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>
                    {formatAmount(
                      nextInstallment.interestComponent,
                      currency,
                      decimalPlaces,
                    )}
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--text3)',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    Due Date
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>
                    {format(new Date(nextInstallment.dueDate), 'dd MMM yyyy')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--text3)',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    Total EMI
                  </div>
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: 800,
                      color: 'var(--accent)',
                      fontFamily: 'var(--mono)',
                    }}
                  >
                    {formatAmount(
                      nextInstallment.emiAmount,
                      currency,
                      decimalPlaces,
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Pay From Account</label>
              <select
                className="form-input"
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
              >
                <option value="" disabled>
                  Select account
                </option>
                {accounts.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name} (Bal:{' '}
                    {formatAmount(a.balance, currency, decimalPlaces)})
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-actions" style={{ marginTop: '24px' }}>
              <button className="btn-cancel" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={handlePay}
                disabled={loading}
                style={{ background: 'var(--accent)', width: 'auto', flex: 1 }}
              >
                {loading ? 'Processing...' : 'Confirm EMI Payment →'}
              </button>
            </div>
          </>
        ) : (
          <div
            style={{
              padding: '20px',
              textAlign: 'center',
              color: 'var(--red)',
            }}
          >
            No pending installments found for this loan.
          </div>
        )}
      </div>
    </div>
  );
}
