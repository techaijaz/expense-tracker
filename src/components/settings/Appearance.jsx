import { useDispatch } from 'react-redux';
import { useTheme } from '@/context/ThemeContext';
import { updatePreferences } from '@/redux/authSlice';
import api from '@/utils/httpMethods';

export default function Appearance() {
  const dispatch = useDispatch();
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();

  const THEMES = [
    { key: 'dark', icon: '🌙', label: 'Dark' },
    { key: 'light', icon: '☀️', label: 'Light' },
    { key: 'system', icon: '💻', label: 'System' },
  ];

  const ACCENTS = [
    { key: 'lightblue', color: '#5B8DEF' }, // Maps to lightblue in context
    { key: 'mint',      color: '#2DD4A0' }, // Maps to mint in context
    { key: 'orange',    color: '#F5A623' }, // Maps to orange
    { key: 'purple',    color: '#A78BFA' }, // Maps to purple (need to ensure this exists in context)
    { key: 'tomato',    color: '#FF6B6B' }, // Maps to tomato
  ];

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    try {
      const resData = await api.put('/user/preferences', { theme: newTheme });
      dispatch(updatePreferences(resData.data.preferences));
    } catch (err) { console.error('Failed to save theme in DB'); }
  };

  const handleAccentChange = async (newAccent) => {
    setAccentColor(newAccent);
    try {
      const resData = await api.put('/user/preferences', { accentColor: newAccent });
      dispatch(updatePreferences(resData.data.preferences));
    } catch (err) { console.error('Failed to save accent in DB'); }
  };

  return (
    <div className="settings-card">
      <div className="settings-section-title"><div className="icon">🎨</div>Appearance</div>
      
      {/* Theme Section */}
      <div className="settings-row">
        <div>
          <div className="settings-key">Theme</div>
        </div>
        <div className="theme-opts">
          {THEMES.map(({ key, icon, label }) => (
            <div 
              key={key} 
              onClick={() => handleThemeChange(key)}
              className={`theme-opt ${theme === key ? 'active' : ''}`}
            >
              {icon} {label}
            </div>
          ))}
        </div>
      </div>

      {/* Accent Color Section */}
      <div className="settings-row">
        <div>
          <div className="settings-key">Accent Color</div>
        </div>
        <div className="accent-opts">
          {ACCENTS.map(({ key, color }) => (
            <div 
              key={key} 
              onClick={() => handleAccentChange(key)}
              className={`accent-opt ${accentColor === key ? 'active' : ''}`}
              style={{ background: color }}
              title={key}
            />
          ))}
        </div>
      </div>

      {/* Language Section */}
      <div className="settings-row">
        <div>
          <div className="settings-key">Language</div>
        </div>
        <select className="filter-input" style={{ width: 'auto' }}>
          <option value="en">English</option>
          <option value="hi">हिंदी</option>
        </select>
      </div>
    </div>
  );
}
