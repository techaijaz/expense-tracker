import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Country } from 'country-state-city';
import { toast } from 'sonner';
import api from '@/utils/httpMethods';
import { updatePreferences } from '@/redux/authSlice';

export default function RegionalSpecs() {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  
  const [currency, setCurrency] = useState('INR');
  const [decimalPlaces, setDecimalPlaces] = useState(2);
  const [fiscalYear, setFiscalYear] = useState('April-March');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [timezone, setTimezone] = useState('UTC');
  const [country, setCountry] = useState('IN');
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    const prefs = user?.user?.preferences || user?.preferences;
    if (prefs) {
      setCurrency(prefs.currency || 'INR');
      setDecimalPlaces(prefs.decimalPlaces ?? 2);
      setFiscalYear(prefs.fiscalYear || 'April-March');
      setDateFormat(prefs.dateFormat || 'DD/MM/YYYY');
      setCountry(prefs.country || 'IN');
      setTimezone(prefs.timezone || 'UTC');
    } else {
        // Auto-detect browser timezone
        const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (browserTz) {
            setTimezone(browserTz);
            // Attempt to find country by timezone
            const allCountries = Country.getAllCountries();
            const matchedCountry = allCountries.find(c => 
                c.timezones.some(tz => tz.zoneName === browserTz)
            );
            if (matchedCountry) {
                setCountry(matchedCountry.isoCode);
            }
        }
    }
  }, [user]);

  const handleSavePreferences = async (updates = {}) => {
    setSavingPrefs(true);
    
    // Combine current state with the specific update being made
    const payload = {
      currency,
      decimalPlaces: Number(decimalPlaces),
      fiscalYear,
      dateFormat,
      country,
      timezone,
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
          onChange={e => { 
            const val = e.target.value;
            setCurrency(val); 
            handleSavePreferences({ currency: val }); 
          }} 
          className="filter-input" 
          style={{ width: 'auto' }}
          disabled={savingPrefs}
        >
          {[
            ['INR', 'INR (₹)'],
            ['USD', 'USD ($)'],
            ['EUR', 'EUR (€)'],
            ['GBP', 'GBP (£)'],
            ['JPY', 'JPY (¥)'],
            ['AUD', 'AUD (A$)'],
            ['CAD', 'CAD (C$)'],
            ['SGD', 'SGD (S$)'],
            ['AED', 'AED (د.إ)'],
            ['CNY', 'CNY (¥)']
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
        <select 
          className="filter-input" 
          style={{ width: 'auto' }}
          value={dateFormat}
          onChange={e => {
            const val = e.target.value;
            setDateFormat(val);
            handleSavePreferences({ dateFormat: val });
          }}
          disabled={savingPrefs}
        >
          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          <option value="YYYY/MM/DD">YYYY/MM/DD</option>
          <option value="DD-MM-YYYY">DD-MM-YYYY</option>
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
                onClick={() => { 
                  if (savingPrefs) return;
                  setDecimalPlaces(n); 
                  handleSavePreferences({ decimalPlaces: n }); 
                }}
                style={{ 
                  width: 28, 
                  height: 28, 
                  borderRadius: 6, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: 12, 
                  fontWeight: isActive ? 700 : 600, 
                  cursor: savingPrefs ? 'not-allowed' : 'pointer',
                  border: isActive ? '1px solid var(--accent)' : '1px solid var(--border2)',
                  background: isActive ? 'var(--accent-glow)' : 'var(--bg4)',
                  color: isActive ? 'var(--accent)' : 'inherit',
                  opacity: savingPrefs && !isActive ? 0.5 : 1
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
          onChange={e => { 
            const val = e.target.value;
            setFiscalYear(val); 
            handleSavePreferences({ fiscalYear: val }); 
          }}
          className="filter-input" 
          style={{ width: 'auto' }}
          disabled={savingPrefs}
        >
          <option value="January-December">January - December</option>
          <option value="April-March">April - March</option>
        </select>
      </div>

      <div style={{ margin: '20px 0', height: '1px', background: 'var(--border2)', opacity: 0.5 }} />

      {/* Country Selection */}
      <div className="settings-row">
        <div>
          <div className="settings-key">Primary Country</div>
          <div className="settings-val">Sets default calling code and currency context</div>
        </div>
        <select 
          value={country} 
          onChange={e => { 
            const val = e.target.value;
            setCountry(val);
            // also update timezone to the first one available for this country
            const countryData = Country.getCountryByCode(val);
            const firstTz = countryData?.timezones?.[0]?.zoneName || 'UTC';
            setTimezone(firstTz);
            handleSavePreferences({ country: val, timezone: firstTz }); 
          }} 
          className="filter-input" 
          style={{ width: '180px' }}
          disabled={savingPrefs}
        >
          {Country.getAllCountries().map(c => (
            <option key={c.isoCode} value={c.isoCode}>
              {c.flag} {c.name} (+{c.phonecode})
            </option>
          ))}
        </select>
      </div>

      {/* Timezone Selection */}
      <div className="settings-row">
        <div>
          <div className="settings-key">Timezone</div>
          <div className="settings-val">Anchor for all period calculations</div>
        </div>
        <select 
          value={timezone} 
          onChange={e => { 
            const val = e.target.value;
            setTimezone(val); 
            handleSavePreferences({ timezone: val }); 
          }} 
          className="filter-input" 
          style={{ width: '180px' }}
          disabled={savingPrefs}
        >
          {Country.getCountryByCode(country)?.timezones.map(tz => (
            <option key={tz.zoneName} value={tz.zoneName}>
              ({tz.gmtOffsetName}) {tz.zoneName}
            </option>
          ))}
          {!Country.getCountryByCode(country)?.timezones.some(t => t.zoneName === timezone) && (
             <option value={timezone}>{timezone}</option>
          )}
        </select>
      </div>
    </div>
  );
}

