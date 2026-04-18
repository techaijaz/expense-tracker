import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import api from '@/utils/httpMethods';
import { updatePreferences } from '@/redux/authSlice';

export default function RegionalSpecs() {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  
  const [currency, setCurrency] = useState('INR');
  const [decimalPlaces, setDecimalPlaces] = useState(2);
  const [fiscalYear, setFiscalYear] = useState('April-March');
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    if (user?.preferences) {
      setCurrency(user.preferences.currency || 'INR');
      setDecimalPlaces(user.preferences.decimalPlaces ?? 2);
      setFiscalYear(user.preferences.fiscalYear || 'April-March');
    } else if (user?.user?.preferences) {
       // Support for nested user object if that's how it's stored
      setCurrency(user.user.preferences.currency || 'INR');
      setDecimalPlaces(user.user.preferences.decimalPlaces ?? 2);
      setFiscalYear(user.user.preferences.fiscalYear || 'April-March');
    }
  }, [user]);

  const handleSavePreferences = async (updates = {}) => {
    setSavingPrefs(true);
    const payload = {
      currency,
      decimalPlaces: Number(decimalPlaces),
      fiscalYear,
      ...updates
    };

    try {
      const resData = await api.put('/user/preferences', payload);
      dispatch(updatePreferences(resData.data.preferences));
      toast.success('Preferences updated!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <div className="settings-card">
      <div className="settings-section-title"><div className="icon">🌍</div>Regional Specs</div>
      
      {/* Base Currency */}
      <div className="settings-row">
        <div>
          <div className="settings-key">Base Currency</div>
          <div className="settings-val">System-wide default for ledger entries</div>
        </div>
        <select 
          value={currency} 
          onChange={e => { setCurrency(e.target.value); handleSavePreferences({ currency: e.target.value }); }} 
          className="filter-input" 
          style={{ width: 'auto' }}
        >
          {[
            ['INR', 'INR (₹)'],
            ['USD', 'USD ($)'],
            ['EUR', 'EUR (€)'],
            ['GBP', 'GBP (£)'],
            ['JPY', 'JPY (¥)'],
            ['AUD', 'AUD (A$)'],
            ['CAD', 'CAD (C$)'],
            ['SGD', 'SGD (S$)']
          ].map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {/* Date Format */}
      <div className="settings-row">
        <div>
          <div className="settings-key">Date Format</div>
          <div className="settings-val">Preferred date display style</div>
        </div>
        <select className="filter-input" style={{ width: 'auto' }}>
          <option>DD/MM/YYYY</option>
          <option>MM/DD/YYYY</option>
          <option>YYYY-MM-DD</option>
        </select>
      </div>

      {/* Decimal Places */}
      <div className="settings-row">
        <div>
          <div className="settings-key">Decimal Places</div>
          <div className="settings-val">Display precision for amounts</div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[0, 1, 2, 3, 4].map(n => {
            const isActive = decimalPlaces === n;
            return (
              <div 
                key={n}
                onClick={() => { setDecimalPlaces(n); handleSavePreferences({ decimalPlaces: n }); }}
                style={{ 
                  width: 28, 
                  height: 28, 
                  borderRadius: 6, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: 12, 
                  fontWeight: isActive ? 700 : 600, 
                  cursor: 'pointer',
                  border: isActive ? '1px solid var(--accent)' : '1px solid var(--border2)',
                  background: isActive ? 'var(--accent-glow)' : 'var(--bg4)',
                  color: isActive ? 'var(--accent)' : 'inherit'
                }}
              >
                {n}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fiscal Year Start */}
      <div className="settings-row">
        <div>
          <div className="settings-key">Fiscal Year Start</div>
          <div className="settings-val">Reporting anchor month</div>
        </div>
        <select 
          value={fiscalYear}
          onChange={e => { setFiscalYear(e.target.value); handleSavePreferences({ fiscalYear: e.target.value }); }}
          className="filter-input" 
          style={{ width: 'auto' }}
        >
          <option value="January-December">January - December</option>
          <option value="April-March">April - March</option>
        </select>
      </div>
    </div>
  );
}
