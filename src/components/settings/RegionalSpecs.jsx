import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import api from '@/utils/httpMethods';
import { updatePreferences } from '@/redux/authSlice';
import { SectionCard, SectionTitle, FieldLabel } from '../SharedComponents';

export default function RegionalSpecs() {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  
  const [currency, setCurrency] = useState(user?.user?.preferences?.currency || 'INR');
  const [decimalPlaces, setDecimalPlaces] = useState(user?.user?.preferences?.decimalPlaces ?? 2);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      const resData = await api.put('/user/preferences', { currency, decimalPlaces: Number(decimalPlaces) });
      dispatch(updatePreferences(resData.data.preferences));
      toast.success('Preferences saved!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save preferences');
    } finally { setSavingPrefs(false); }
  };

  const selectSx = "w-full py-[11px] px-3.5 bg-secondary-container border border-secondary-container rounded-[10px] text-on-surface text-[13px] outline-none font-body appearance-none cursor-pointer";

  return (
    <SectionCard>
      <SectionTitle icon="language">Regional Specs</SectionTitle>
      <div className="flex flex-col gap-4 mb-4.5">
        <div>
          <FieldLabel>Base Currency</FieldLabel>
          <div className="relative">
            <select value={currency} onChange={e => setCurrency(e.target.value)} className={selectSx}>
              {[['INR','₹ INR – Indian Rupee'],['USD','$ USD – US Dollar'],['EUR','€ EUR – Euro'],['GBP','£ GBP – British Pound'],['JPY','¥ JPY – Japanese Yen'],['AUD','A$ AUD – Australian Dollar'],['CAD','C$ CAD – Canadian Dollar'],['SGD','S$ SGD – Singapore Dollar']].map(([v,l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-base text-on-surface-variant pointer-events-none" style={{ fontVariationSettings:"'FILL' 0" }}>unfold_more</span>
          </div>
        </div>
        <div>
          <FieldLabel>Data Precision (Decimal Places)</FieldLabel>
          <div className="grid grid-cols-5 gap-1.5">
            {[0,1,2,3,4].map(n => (
              <button key={n} onClick={() => setDecimalPlaces(n)}
                className={`py-2.5 px-1 rounded-[10px] cursor-pointer border-[1.5px] text-[13px] font-bold ${
                  decimalPlaces === n ? 'bg-surface-variant border-surface-variant text-primary' : 'bg-secondary-container border-secondary-container text-on-surface-variant'
                }`}>
                {n}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-on-surface-variant">Preview: {(1234.5678).toFixed(decimalPlaces)}</p>
        </div>
      </div>
      <button onClick={handleSavePreferences} disabled={savingPrefs}
        className={`w-full p-[11px] bg-primary border-none rounded-[10px] text-background text-[13px] font-bold ${savingPrefs ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
        {savingPrefs ? 'Saving…' : 'Save Preferences'}
      </button>
    </SectionCard>
  );
}
