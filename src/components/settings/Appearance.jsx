import { useDispatch } from 'react-redux';
import { useTheme } from '@/context/ThemeContext';
import { updatePreferences } from '@/redux/authSlice';
import api from '@/utils/httpMethods';
import { SectionCard, SectionTitle, FieldLabel } from '../SharedComponents';

export default function Appearance() {
  const dispatch = useDispatch();
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();

  const THEMES = [
    { key:'dark',   icon:'dark_mode',        label:'Dark'   },
    { key:'light',  icon:'light_mode',       label:'Light'  },
    { key:'system', icon:'brightness_auto',  label:'System' },
  ];

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    try {
      const resData = await api.put('/user/preferences', { theme: newTheme });
      dispatch(updatePreferences(resData.data.preferences));
    } catch(err) { console.error('Failed to save theme in DB'); }
  };

  const handleAccentChange = async (newAccent) => {
    setAccentColor(newAccent);
    try {
      const resData = await api.put('/user/preferences', { accentColor: newAccent });
      dispatch(updatePreferences(resData.data.preferences));
    } catch(err) { console.error('Failed to save accent in DB'); }
  };

  return (
    <SectionCard>
      <SectionTitle icon="palette">Appearance</SectionTitle>
      
      <FieldLabel>Color Theme</FieldLabel>
      <div className="grid grid-cols-3 gap-2 mb-5">
        {THEMES.map(({ key, icon, label }) => (
          <button key={key} onClick={() => handleThemeChange(key)}
            className={`p-3 rounded-xl cursor-pointer border-[1.5px] flex flex-col items-center gap-1.5 transition-all duration-200 ${
              theme === key ? 'border-surface-variant bg-surface-variant' : 'border-secondary-container bg-secondary-container'
            }`}>
            <span className={`material-symbols-outlined text-[22px] ${theme === key ? 'text-primary' : 'text-on-surface-variant'}`} style={{ fontVariationSettings: "'FILL' 0" }}>{icon}</span>
            <span className={`text-[11px] font-bold ${theme === key ? 'text-primary' : 'text-on-surface-variant'}`}>{label}</span>
          </button>
        ))}
      </div>
      
      <FieldLabel>Accent Color</FieldLabel>
      <div className="flex gap-3">
        {[
          { name: 'lightblue', color: 'var(--accent-color)' },
          { name: 'tomato', color: '#ff6347' },
          { name: 'orange', color: '#ffa500' },
          { name: 'mint', color: '#4ade80' },
          { name: 'brown', color: '#a52a2a' },
        ].map(({ name, color }) => (
          <button key={name} onClick={() => handleAccentChange(name)}
            className="w-9 h-9 rounded-full cursor-pointer transition-all duration-200"
            style={{ 
              background: color, 
              border: accentColor === name ? '3px solid var(--text-primary)' : '3px solid transparent', 
              outline: accentColor === name ? `1px solid ${color}` : 'none', 
              boxShadow: accentColor === name ? `0 0 10px ${color}` : 'none' 
            }}
            title={name}
          />
        ))}
      </div>
    </SectionCard>
  );
}
