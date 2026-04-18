import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import api from '@/utils/httpMethods';

export default function SystemMetrics() {
  const { user } = useSelector(s => s.auth);
  const currentUser = user?.user;
  
  // Real-time counts from Redux
  const { categories } = useSelector(s => s.category);
  const { accounts } = useSelector(s => s.accounts);

  const catCount = Object.values(categories || {}).reduce((acc, list) => acc + (list?.length || 0), 0);
  const accCount = accounts?.length || 0;

  const [storageStats, setStorageStats] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const statsRes = await api.get('/user/storage-stats');
      setStorageStats(statsRes?.data || null);
    } catch (e) {
      console.error('Failed to fetch storage stats');
    }
  }, []);

  useEffect(() => {
    fetchStats();
    window.addEventListener('refetch-system-metrics', fetchStats);
    return () => window.removeEventListener('refetch-system-metrics', fetchStats);
  }, [fetchStats]);

  const formatLargeNum = (num) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num;
  };

  return (
    <div className="settings-card">
      <div className="settings-section-title"><div className="icon">📊</div>System Metrics</div>
      
      {/* Storage Usage Progress */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>Storage Usage</span>
          <span style={{ fontSize: 12, fontWeight: 700 }}>{storageStats?.usagePercent ?? 0}%</span>
        </div>
        <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 10, overflow: 'hidden' }}>
          <div 
            style={{ 
              height: '100%', 
              background: 'var(--accent)', 
              width: `${storageStats?.usagePercent ?? 0}%`,
              transition: 'width 1s ease-in-out'
            }} 
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        {[
          { label: 'Transactions', val: formatLargeNum(storageStats?.transactions || 0), color: 'var(--accent)', key: 'TXNS' },
          { label: 'Accounts',     val: accCount,                  color: 'var(--green)',  key: 'ACCOUNTS' },
          { label: 'Categories',   val: catCount,                  color: 'var(--amber)',  key: 'CATS' },
          { label: 'Parties',      val: storageStats?.parties || 0, color: 'var(--purple)', key: 'PARTIES' },
        ].map(m => (
          <div key={m.key} className="metric-box">
            <div className="metric-val" style={{ color: m.color }}>{m.val}</div>
            <div className="metric-label">{m.key}</div>
          </div>
        ))}
      </div>

      {/* Sync Status */}
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>Last Synchronized</div>
        <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--accent)', fontWeight: 600 }}>
          {currentUser?.lastLoginAt
            ? new Date(currentUser.lastLoginAt).toISOString().replace('T',' ').substring(0,19) + ' UTC'
            : 'No sync data available'}
        </div>
      </div>
    </div>
  );
}
