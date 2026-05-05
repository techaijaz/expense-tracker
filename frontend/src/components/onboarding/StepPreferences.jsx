import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const StepPreferences = ({ data, updateData, onNext, onBack }) => {
  const { t } = useTranslation();
  const { accentColor, setAccentColor } = useTheme();
  const { language, currency, dateFormat, decimalPlaces, theme, fiscalYear } = data;

  const ACCENTS = [
    { key: 'lightblue', color: '#5B8DEF' },
    { key: 'mint', color: '#2DD4A0' },
    { key: 'orange', color: '#F5A623' },
    { key: 'purple', color: '#A78BFA' },
    { key: 'tomato', color: '#FF6B6B' },
  ];

  return (
    <div className="onboard-card p-6 md:p-12 relative animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="onboard-progress flex items-center gap-2 mb-8 md:mb-10">
        <div className="prog-step done"></div>
        <div className="prog-step active"></div>
        <div className="prog-step"></div>
      </div>
      
      <div className="flex items-center gap-4 mb-6 md:mb-8">
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-[14px] bg-accent/15 border border-accent/20 flex items-center justify-center text-xl md:text-2xl shrink-0">
          🌐
        </div>
        <div>
          <h1 className="text-xl md:text-[26px] font-bold tracking-[-0.4px] leading-tight">
            Set your preferences
          </h1>
          <p className="text-xs md:text-sm text-text2 leading-relaxed">
            These can be changed anytime from Settings.
          </p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3 mb-6 md:mb-8">
        {/* Language */}
        <div className="w-full md:w-[calc(50%-6px)] p-[14px] border border-border bg-bg3 rounded-[12px] hover:border-accent/40 transition-colors">
          <label className="text-[10px] font-semibold text-text3 uppercase tracking-[0.08em] mb-2 block">Language</label>
          <Select value={language} onValueChange={(val) => updateData({ language: val })}>
            <SelectTrigger className="w-full bg-bg4 border-border text-text h-10">
              <SelectValue placeholder="Select Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">हिंदी</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Currency */}
        <div className="w-full md:w-[calc(50%-6px)] p-[14px] border border-border bg-bg3 rounded-[12px] hover:border-accent/40 transition-colors">
          <label className="text-[10px] font-semibold text-text3 uppercase tracking-[0.08em] mb-2 block">Currency</label>
          <Select value={currency} onValueChange={(val) => updateData({ currency: val })}>
            <SelectTrigger className="w-full bg-bg4 border-border text-text h-10">
              <SelectValue placeholder="Select Currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INR">₹ INR — Indian Rupee</SelectItem>
              <SelectItem value="USD">$ USD — US Dollar</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Date Format */}
        <div className="w-full md:w-[calc(50%-6px)] p-[14px] border border-border bg-bg3 rounded-[12px] hover:border-accent/40 transition-colors">
          <label className="text-[10px] font-semibold text-text3 uppercase tracking-[0.08em] mb-2 block">Date Format</label>
          <Select value={dateFormat} onValueChange={(val) => updateData({ dateFormat: val })}>
            <SelectTrigger className="w-full bg-bg4 border-border text-text h-10">
              <SelectValue placeholder="Select Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
              <SelectItem value="YYYY/MM/DD">YYYY/MM/DD</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Decimal Places */}
        <div className="w-full md:w-[calc(50%-6px)] p-[14px] border border-border bg-bg3 rounded-[12px] hover:border-accent/40 transition-colors">
          <label className="text-[10px] font-semibold text-text3 uppercase tracking-[0.08em] mb-2 block">Decimal Places</label>
          <Select value={decimalPlaces.toString()} onValueChange={(val) => updateData({ decimalPlaces: parseInt(val) })}>
            <SelectTrigger className="w-full bg-bg4 border-border text-text h-10">
              <SelectValue placeholder="Select Decimals" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 (1,234.56)</SelectItem>
              <SelectItem value="0">0 (1,235)</SelectItem>
              <SelectItem value="3">3 (1,234.567)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Theme */}
        <div className="w-full md:w-[calc(50%-6px)] p-[14px] border border-border bg-bg3 rounded-[12px] hover:border-accent/40 transition-colors">
          <label className="text-[10px] font-semibold text-text3 uppercase tracking-[0.08em] mb-2 block">Theme</label>
          <Select value={theme} onValueChange={(val) => updateData({ theme: val })}>
            <SelectTrigger className="w-full bg-bg4 border-border text-text h-10">
              <SelectValue placeholder="Select Theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Accent Color */}
        <div className="w-full md:w-[calc(50%-6px)] p-[14px] border border-border bg-bg3 rounded-[12px] hover:border-accent/40 transition-colors">
          <label className="text-[10px] font-semibold text-text3 uppercase tracking-[0.08em] mb-3 block">Accent Color</label>
          <div className="flex gap-2">
            {ACCENTS.map((acc) => (
              <div 
                key={acc.key}
                onClick={() => {
                  setAccentColor(acc.key);
                  updateData({ accentColor: acc.key });
                }}
                className={`w-6 h-6 rounded-full cursor-pointer border-2 transition-all ${accentColor === acc.key ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                style={{ background: acc.color }}
              />
            ))}
          </div>
        </div>
        
        {/* Fiscal Year */}
        <div className="w-full md:w-[calc(50%-6px)] p-[14px] border border-border bg-bg3 rounded-[12px] hover:border-accent/40 transition-colors">
          <label className="text-[10px] font-semibold text-text3 uppercase tracking-[0.08em] mb-2 block">Fiscal Year</label>
          <Select value={fiscalYear} onValueChange={(val) => updateData({ fiscalYear: val })}>
            <SelectTrigger className="w-full bg-bg4 border-border text-text h-10">
              <SelectValue placeholder="Select Fiscal Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="April – March">April – March</SelectItem>
              <SelectItem value="January – December">January – December</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-3 mb-2">
        <button 
          className="w-full md:w-20 py-2.5 md:py-[11px] bg-transparent border border-border hover:border-border2 text-text2 hover:text-text rounded-[10px] text-[13px] font-medium transition-all"
          onClick={onBack}
        >
          Back
        </button>
        <button 
          className="w-full md:flex-1 py-2.5 md:py-[11px] bg-accent hover:bg-accent2 text-white rounded-[10px] font-semibold text-[13px] transition-all flex items-center justify-center gap-1.5"
          onClick={onNext}
        >
          Save & Continue →
        </button>
      </div>
    </div>
  );
};

export default StepPreferences;
