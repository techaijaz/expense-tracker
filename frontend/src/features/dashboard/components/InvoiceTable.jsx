import { formatDate } from '@/utils/utils';
import { useSelector } from 'react-redux';
import { formatAmount } from '@/utils/format';

export function InvoiceTable({ transactions }) {
  const preferences = useSelector(
    (state) => state.auth.user?.user?.preferences,
  );
  const { currency = 'INR', decimalPlaces = 2 } = preferences || {};
  return (
    <div className="bg-surface-container-low rounded-xl overflow-hidden mt-6 shadow-xl">
      <div className="p-8 flex justify-between items-center">
        <h3 className="text-xl font-bold font-headline">Recent Entries</h3>
        <button className="text-tertiary text-xs font-bold hover:underline">
          Download CSV
        </button>
      </div>
      <div className="overflow-x-auto hide-scrollbar">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-lowest/50 text-outline text-[10px] font-bold uppercase tracking-widest border-none">
              <th className="px-8 py-4">Status</th>
              <th className="px-8 py-4">Transaction</th>
              <th className="px-8 py-4">Category</th>
              <th className="px-8 py-4">Date</th>
              <th className="px-8 py-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {transactions && transactions.length > 0 ? (
              transactions.map((t, idx) => {
                const accountName =
                  t.transactions?.[0]?.accountName || 'System';
                const isCleared = t.ledgerType !== 'PENDING'; // Sample logic

                return (
                  <tr
                    key={t.id || idx}
                    className="hover:bg-surface-container-high transition-colors"
                  >
                    <td className="px-8 py-4">
                      <div
                        className={`flex items-center ${isCleared ? 'text-tertiary' : 'text-primary'}`}
                      >
                        <span
                          className={`material-symbols-outlined text-lg ${!isCleared && 'animate-pulse'}`}
                          style={{
                            fontVariationSettings: isCleared
                              ? "'FILL' 1"
                              : "'FILL' 0",
                          }}
                        >
                          {isCleared ? 'check_circle' : 'schedule'}
                        </span>
                        <span className="ml-2 text-xs font-semibold">
                          {isCleared ? 'Cleared' : 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded bg-surface-variant flex items-center justify-center mr-3">
                          <span
                            className={`material-symbols-outlined text-sm ${t.categoryType === 'INCOME' ? 'text-tertiary' : 'text-primary'}`}
                          >
                            {t.icon ||
                              (t.categoryType === 'INCOME'
                                ? 'account_balance'
                                : 'receipt_long')}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-semibold truncate max-w-[200px]">
                            {t.title}
                          </div>
                          <div className="text-[10px] text-outline truncate max-w-[200px]">
                            {accountName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className="px-2 py-1 bg-surface-container-highest rounded text-[10px] font-bold text-outline">
                        {t.category || 'GENERAL'}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-xs font-medium text-outline">
                      {formatDate(t.date)}
                    </td>
                    <td
                      className={`px-8 py-4 text-right font-headline font-bold ${t.categoryType === 'INCOME' ? 'text-tertiary' : 'text-error'}`}
                    >
                      {t.categoryType === 'INCOME' ? '+' : '-'}
                      {formatAmount(
                        Math.abs(t.amount || 0),
                        currency,
                        decimalPlaces,
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="text-center py-10 text-outline font-medium text-sm"
                >
                  No recent entries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="p-6 bg-surface-container-lowest/30 flex justify-center border-t border-white/5">
        <button className="text-sm font-bold text-outline hover:text-primary transition-colors">
          View All Transactions
        </button>
      </div>
    </div>
  );
}
