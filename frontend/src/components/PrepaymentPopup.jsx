import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { formatAmount } from '@/utils/format';
import api from '@/utils/httpMethods';
import { updateAccount } from '@/redux/accountSlice';

export default function PrepaymentPopup({
  open,
  setOpen,
  loanId,
  loanName,
  outstanding,
  onPaid,
}) {
  const dispatch = useDispatch();
  const { accounts = [] } = useSelector((state) => state.accounts);
  const preferences = useSelector(
    (state) => state.auth.user?.user?.preferences,
  );
  const { currency = 'INR', decimalPlaces = 2 } = preferences || {};

  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [extraAmount, setExtraAmount] = useState('');
  const [simulation, setSimulation] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Debounced simulation
  useEffect(() => {
    if (!open || !loanId || !extraAmount || parseFloat(extraAmount) <= 0) {
      setSimulation(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSimulating(true);
      try {
        const res = await api.post('/formal-loans/simulate-prepayment', {
          loanId,
          extraAmount: parseFloat(extraAmount),
        });
        setSimulation(res.data.data || res.data);
      } catch (err) {
        console.error('Simulation failed');
      } finally {
        setSimulating(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [extraAmount, loanId, open]);

  const handlePrepay = async () => {
    if (!extraAmount || parseFloat(extraAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!selectedAccountId) {
      toast.error('Please select a payment account');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/formal-loans/prepay', {
        loanId,
        amount: parseFloat(extraAmount),
        accountId: selectedAccountId,
        date: new Date(),
      });

      const { updatedAccounts } = res.data.data || res.data;
      if (updatedAccounts) {
        updatedAccounts.forEach((acc) => dispatch(updateAccount(acc)));
      }

      toast.success('Prepayment processed successfully!');
      if (onPaid) onPaid();
      setOpen(false);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || 'Failed to process prepayment',
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
        <div className="modal-title">Prepayment Calculator</div>
        <div className="modal-sub">
          {loanName} · Outstanding{' '}
          {formatAmount(outstanding, currency, decimalPlaces)}
        </div>

        <div className="form-group">
          <label className="form-label">Extra Amount to Pay</label>
          <input
            type="number"
            className="form-input"
            placeholder="₹ 50,000"
            value={extraAmount}
            onChange={(e) => setExtraAmount(e.target.value)}
          />
        </div>

        <div
          style={{
            background: 'var(--accent-glow)',
            border: '1px solid rgba(91,141,239,0.2)',
            borderRadius: 'var(--r)',
            padding: '16px',
            margin: '16px 0',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              color: 'var(--text3)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 600,
              marginBottom: '12px',
            }}
          >
            Prepayment Impact
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
            }}
          >
            <div
              style={{
                textAlign: 'center',
                padding: '12px',
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r2)',
              }}
            >
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  fontFamily: 'var(--mono)',
                  color: 'var(--green)',
                }}
              >
                {simulating ? '...' : simulation?.emisSaved || 0}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: 'var(--text2)',
                  marginTop: '3px',
                }}
              >
                EMIs saved
              </div>
            </div>
            <div
              style={{
                textAlign: 'center',
                padding: '12px',
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r2)',
              }}
            >
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  fontFamily: 'var(--mono)',
                  color: 'var(--green)',
                }}
              >
                {simulating
                  ? '...'
                  : formatAmount(
                      simulation?.interestSaved || 0,
                      currency,
                      decimalPlaces,
                    )}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: 'var(--text2)',
                  marginTop: '3px',
                }}
              >
                Interest saved
              </div>
            </div>
            <div
              style={{
                textAlign: 'center',
                padding: '12px',
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r2)',
              }}
            >
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  fontFamily: 'var(--mono)',
                  color: 'var(--accent)',
                }}
              >
                {simulating
                  ? '...'
                  : formatAmount(
                      simulation?.newOutstanding ||
                        outstanding - (parseFloat(extraAmount) || 0),
                      currency,
                      decimalPlaces,
                    )}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: 'var(--text2)',
                  marginTop: '3px',
                }}
              >
                New outstanding
              </div>
            </div>
            <div
              style={{
                textAlign: 'center',
                padding: '12px',
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r2)',
              }}
            >
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  fontFamily: 'var(--mono)',
                  color: 'var(--amber)',
                }}
              >
                {simulating ? '...' : simulation?.newTenureMonths || '—'}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: 'var(--text2)',
                  marginTop: '3px',
                }}
              >
                EMIs remaining
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

        <div className="modal-actions" style={{ marginTop: '20px' }}>
          <button className="btn-cancel" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button
            className="btn-save"
            onClick={handlePrepay}
            disabled={loading || simulating || !extraAmount}
            style={{ flex: 1 }}
          >
            {loading ? 'Processing...' : 'Confirm Prepayment'}
          </button>
        </div>
      </div>
    </div>
  );
}
