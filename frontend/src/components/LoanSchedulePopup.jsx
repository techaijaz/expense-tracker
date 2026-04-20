import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { formatAmount } from '@/utils/format';
import { format } from 'date-fns';
import api from '@/utils/httpMethods';

export default function LoanSchedulePopup({ open, setOpen, loanId, loanName }) {
  const preferences = useSelector(
    (state) => state.auth.user?.user?.preferences,
  );
  const { currency = 'INR', decimalPlaces = 2 } = preferences || {};

  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    if (open && loanId) {
      const fetchSchedule = async () => {
        setLoading(true);
        try {
          const res = await api.get(`/formal-loans/${loanId}`);
          const { schedule } = res.data.data || res.data;
          setSchedule(schedule);
        } catch (err) {
          toast.error('Failed to fetch schedule');
          setOpen(false);
        } finally {
          setLoading(false);
        }
      };
      fetchSchedule();
    }
  }, [open, loanId, setOpen]);

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div
        style={{ position: 'absolute', inset: 0 }}
        onClick={() => setOpen(false)}
      ></div>
      <div
        className="modal modal-lg"
        style={{
          zIndex: 11,
          padding: '0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '24px 28px 16px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div className="modal-close" onClick={() => setOpen(false)}>
            ✕
          </div>
          <div className="modal-title">Amortization Schedule</div>
          <div className="modal-sub" style={{ marginBottom: 0 }}>
            {loanName} · Repayment Timeline
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 28px' }}>
          {loading ? (
            <div
              style={{
                padding: '60px',
                textAlign: 'center',
                color: 'var(--text3)',
              }}
            >
              Loading schedule details...
            </div>
          ) : (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                borderSpacing: 0,
              }}
            >
              <thead>
                <tr
                  style={{
                    textAlign: 'left',
                    borderBottom: '1px solid var(--border)',
                    position: 'sticky',
                    top: 0,
                    background: 'var(--bg2)',
                    zIndex: 1,
                  }}
                >
                  <th
                    style={{
                      padding: '12px 8px',
                      fontSize: '10px',
                      color: 'var(--text3)',
                      textTransform: 'uppercase',
                    }}
                  >
                    #
                  </th>
                  <th
                    style={{
                      padding: '12px 8px',
                      fontSize: '10px',
                      color: 'var(--text3)',
                      textTransform: 'uppercase',
                    }}
                  >
                    Due Date
                  </th>
                  <th
                    style={{
                      padding: '12px 8px',
                      fontSize: '10px',
                      color: 'var(--text3)',
                      textTransform: 'uppercase',
                      textAlign: 'right',
                    }}
                  >
                    EMI
                  </th>
                  <th
                    style={{
                      padding: '12px 8px',
                      fontSize: '10px',
                      color: 'var(--text3)',
                      textTransform: 'uppercase',
                      textAlign: 'right',
                    }}
                  >
                    Principal
                  </th>
                  <th
                    style={{
                      padding: '12px 8px',
                      fontSize: '10px',
                      color: 'var(--text3)',
                      textTransform: 'uppercase',
                      textAlign: 'right',
                    }}
                  >
                    Interest
                  </th>
                  <th
                    style={{
                      padding: '12px 8px',
                      fontSize: '10px',
                      color: 'var(--text3)',
                      textTransform: 'uppercase',
                      textAlign: 'right',
                    }}
                  >
                    Balance
                  </th>
                  <th
                    style={{
                      padding: '12px 8px',
                      fontSize: '10px',
                      color: 'var(--text3)',
                      textTransform: 'uppercase',
                      textAlign: 'center',
                    }}
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((item) => {
                  const isPaid = item.status === 'PAID';
                  const isPast = new Date(item.dueDate) < new Date() && !isPaid;

                  return (
                    <tr
                      key={item._id}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        background: isPaid ? 'rgba(45,212,160,0.02)' : 'none',
                      }}
                    >
                      <td
                        style={{
                          padding: '12px 8px',
                          fontSize: '12px',
                          color: 'var(--text3)',
                          fontFamily: 'var(--mono)',
                        }}
                      >
                        {item.installmentNo}
                      </td>
                      <td
                        style={{
                          padding: '12px 8px',
                          fontSize: '12px',
                          fontWeight: 500,
                        }}
                      >
                        {format(new Date(item.dueDate), 'dd MMM yyyy')}
                      </td>
                      <td
                        style={{
                          padding: '12px 8px',
                          fontSize: '12px',
                          textAlign: 'right',
                          fontWeight: 700,
                          fontFamily: 'var(--mono)',
                        }}
                      >
                        {formatAmount(item.emiAmount, currency, decimalPlaces)}
                      </td>
                      <td
                        style={{
                          padding: '12px 8px',
                          fontSize: '12px',
                          textAlign: 'right',
                          color: 'var(--text2)',
                        }}
                      >
                        {formatAmount(
                          item.principalComponent,
                          currency,
                          decimalPlaces,
                        )}
                      </td>
                      <td
                        style={{
                          padding: '12px 8px',
                          fontSize: '12px',
                          textAlign: 'right',
                          color: 'var(--text2)',
                        }}
                      >
                        {formatAmount(
                          item.interestComponent,
                          currency,
                          decimalPlaces,
                        )}
                      </td>
                      <td
                        style={{
                          padding: '12px 8px',
                          fontSize: '12px',
                          textAlign: 'right',
                          fontWeight: 600,
                          color: 'var(--text2)',
                        }}
                      >
                        {formatAmount(
                          item.remainingBalance,
                          currency,
                          decimalPlaces,
                        )}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        {isPaid ? (
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '2px 8px',
                              background: 'var(--green-bg)',
                              color: 'var(--green)',
                              borderRadius: '4px',
                              fontWeight: 700,
                            }}
                          >
                            PAID
                          </span>
                        ) : isPast ? (
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '2px 8px',
                              background: 'var(--red-bg)',
                              color: 'var(--red)',
                              borderRadius: '4px',
                              fontWeight: 700,
                            }}
                          >
                            OVERDUE
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '2px 8px',
                              background: 'var(--bg4)',
                              color: 'var(--text3)',
                              borderRadius: '4px',
                              fontWeight: 700,
                            }}
                          >
                            PENDING
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid var(--border)',
            textAlign: 'right',
          }}
        >
          <button className="btn-cancel" onClick={() => setOpen(false)}>
            Close Schedule
          </button>
        </div>
      </div>
    </div>
  );
}
