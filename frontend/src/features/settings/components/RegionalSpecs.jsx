import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Country } from 'country-state-city';
import { toast } from 'sonner';
import api from '@/utils/httpMethods';
import { updatePreferences } from '@/features/auth/state/authSlice';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Globe, Coins, CalendarDays, Hash, MapPin, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/utils/utils';

export default function RegionalSpecs() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

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
      const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (browserTz) {
        setTimezone(browserTz);
        const allCountries = Country.getAllCountries();
        const matchedCountry = allCountries.find((c) =>
          c.timezones.some((tz) => tz.zoneName === browserTz),
        );
        if (matchedCountry) {
          setCountry(matchedCountry.isoCode);
        }
      }
    }
  }, [user]);

  const handleSavePreferences = async (updates = {}) => {
    setSavingPrefs(true);
    const payload = {
      currency,
      decimalPlaces: Number(decimalPlaces),
      fiscalYear,
      dateFormat,
      country,
      timezone,
      ...updates,
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

  const SectionHeader = ({ icon: Icon, title, description }) => (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[13px] font-bold text-slate-700 dark:text-slate-300 leading-tight">{title}</p>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{description}</p>
      </div>
    </div>
  );

  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold">Regional Specs</CardTitle>
            <CardDescription className="text-xs">Configure localization and regional formatting</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            {/* Base Currency */}
            <div className="space-y-4">
              <SectionHeader 
                icon={Coins} 
                title="Base Currency" 
                description="System-wide default currency" 
              />
              <Select
                value={currency}
                onValueChange={(val) => {
                  setCurrency(val);
                  handleSavePreferences({ currency: val });
                }}
                disabled={savingPrefs}
              >
                <SelectTrigger className="w-full h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-sm">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
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
                    ['CNY', 'CNY (¥)'],
                  ].map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Format */}
            <div className="space-y-4">
              <SectionHeader 
                icon={CalendarDays} 
                title="Date Format" 
                description="Display style for ledger" 
              />
              <Select
                value={dateFormat}
                onValueChange={(val) => {
                  setDateFormat(val);
                  handleSavePreferences({ dateFormat: val });
                }}
                disabled={savingPrefs}
              >
                <SelectTrigger className="w-full h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-sm">
                  <SelectValue placeholder="Select date format" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  <SelectItem value="YYYY/MM/DD">YYYY/MM/DD</SelectItem>
                  <SelectItem value="DD-MM-YYYY">DD-MM-YYYY</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Decimal Places */}
            <div className="space-y-4">
              <SectionHeader 
                icon={Hash} 
                title="Precision" 
                description="Decimal places for amounts" 
              />
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4].map((n) => {
                  const isActive = decimalPlaces === n;
                  return (
                    <button
                      key={n}
                      disabled={savingPrefs}
                      onClick={() => {
                        setDecimalPlaces(n);
                        handleSavePreferences({ decimalPlaces: n });
                      }}
                      className={cn(
                        "w-9 h-9 rounded-xl border transition-all duration-200 flex items-center justify-center text-sm font-bold",
                        isActive 
                          ? "bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                          : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                      )}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fiscal Year Start */}
            <div className="space-y-4">
              <SectionHeader 
                icon={CalendarDays} 
                title="Fiscal Year" 
                description="Reporting anchor period" 
              />
              <Select
                value={fiscalYear}
                onValueChange={(val) => {
                  setFiscalYear(val);
                  handleSavePreferences({ fiscalYear: val });
                }}
                disabled={savingPrefs}
              >
                <SelectTrigger className="w-full h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-sm">
                  <SelectValue placeholder="Select fiscal year" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="January-December">Jan - Dec</SelectItem>
                  <SelectItem value="April-March">Apr - Mar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Country Selection */}
            <div className="space-y-4">
              <SectionHeader 
                icon={MapPin} 
                title="Country" 
                description="Default context and code" 
              />
              <Select
                value={country}
                onValueChange={(val) => {
                  setCountry(val);
                  const countryData = Country.getCountryByCode(val);
                  const firstTz = countryData?.timezones?.[0]?.zoneName || 'UTC';
                  setTimezone(firstTz);
                  handleSavePreferences({ country: val, timezone: firstTz });
                }}
                disabled={savingPrefs}
              >
                <SelectTrigger className="w-full h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-sm">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] rounded-xl">
                  {Country.getAllCountries().map((c) => (
                    <SelectItem key={c.isoCode} value={c.isoCode}>
                      <span className="flex items-center gap-2">
                        <span>{c.flag}</span>
                        <span>{c.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Timezone Selection */}
            <div className="space-y-4">
              <SectionHeader 
                icon={Clock} 
                title="Timezone" 
                description="System calculation anchor" 
              />
              <Select
                value={timezone}
                onValueChange={(val) => {
                  setTimezone(val);
                  handleSavePreferences({ timezone: val });
                }}
                disabled={savingPrefs}
              >
                <SelectTrigger className="w-full h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-sm">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {Country.getCountryByCode(country)?.timezones?.map((tz) => (
                    <SelectItem key={tz.zoneName} value={tz.zoneName}>
                      <span className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">{tz.gmtOffsetName}</span>
                        <span>{tz.zoneName}</span>
                      </span>
                    </SelectItem>
                  )) || []}
                  {timezone && !Country.getCountryByCode(country)?.timezones?.some(
                    (t) => t.zoneName === timezone,
                  ) && <SelectItem value={timezone}>{timezone}</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {savingPrefs && (
          <div className="flex items-center justify-center gap-2 pt-4 text-[10px] text-indigo-500 animate-pulse font-bold uppercase tracking-widest">
            <Loader2 className="w-3 h-3 animate-spin" />
            Updating cloud preferences...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
