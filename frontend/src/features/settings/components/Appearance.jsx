import { useDispatch } from 'react-redux';
import { useTheme } from '@/context/ThemeContext';
import { updatePreferences } from '@/features/auth/state/authSlice';
import api from '@/utils/httpMethods';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Palette, Moon, Sun, Monitor, Check } from 'lucide-react';
import { cn } from '@/utils/utils';

export default function Appearance() {
  const dispatch = useDispatch();
  const {
    theme,
    setTheme,
    accentColor,
    setAccentColor,
    language,
    setLanguage,
  } = useTheme();

  const THEMES = [
    { key: 'dark', icon: <Moon className="w-4 h-4" />, label: 'Dark' },
    { key: 'light', icon: <Sun className="w-4 h-4" />, label: 'Light' },
    { key: 'system', icon: <Monitor className="w-4 h-4" />, label: 'System' },
  ];

  const ACCENTS = [
    { key: 'lightblue', color: '#5B8DEF', name: 'Sky Blue' },
    { key: 'mint', color: '#2DD4A0', name: 'Mint' },
    { key: 'orange', color: '#F5A623', name: 'Amber' },
    { key: 'purple', color: '#A78BFA', name: 'Violet' },
    { key: 'tomato', color: '#FF6B6B', name: 'Tomato' },
  ];

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    try {
      const resData = await api.put('/user/preferences', { theme: newTheme });
      dispatch(updatePreferences(resData.data.preferences));
    } catch (err) {
      console.error('Failed to save theme in DB');
    }
  };

  const handleAccentChange = async (newAccent) => {
    setAccentColor(newAccent);
    try {
      const resData = await api.put('/user/preferences', {
        accentColor: newAccent,
      });
      dispatch(updatePreferences(resData.data.preferences));
    } catch (err) {
      console.error('Failed to save accent in DB');
    }
  };

  const handleLanguageChange = async (newLang) => {
    setLanguage(newLang);
    try {
      const resData = await api.put('/user/preferences', { language: newLang });
      dispatch(updatePreferences(resData.data.preferences));
    } catch (err) {
      console.error('Failed to save language in DB');
    }
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold">Appearance</CardTitle>
            <CardDescription className="text-xs">Customize how the application looks and feels</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Main Customization Box */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
          {/* Theme Section */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Interface Theme</Label>
            <div className="grid grid-cols-3 gap-3">
              {THEMES.map(({ key, icon, label }) => (
                <button
                  key={key}
                  onClick={() => handleThemeChange(key)}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200 text-sm font-medium",
                    theme === key 
                      ? "bg-indigo-500/10 border-indigo-500 text-indigo-500 shadow-sm shadow-indigo-500/20" 
                      : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                  )}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color Section */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Accent Color</Label>
            <div className="flex flex-wrap gap-4">
              {ACCENTS.map(({ key, color, name }) => (
                <button
                  key={key}
                  onClick={() => handleAccentChange(key)}
                  className={cn(
                    "group relative w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center",
                    accentColor === key ? "ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-900" : "hover:scale-110"
                  )}
                  style={{ backgroundColor: color }}
                  title={name}
                >
                  {accentColor === key && (
                    <Check className="w-5 h-5 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Language Section - External to the box for hierarchy */}
        <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          <div>
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">System Language</Label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Select display language</p>
          </div>
          <Select
            value={language}
            onValueChange={(val) => handleLanguageChange(val)}
          >
            <SelectTrigger className="w-[140px] h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
              <SelectItem value="en">English (US)</SelectItem>
              <SelectItem value="hi">हिंदी (India)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
