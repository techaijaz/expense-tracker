import React, { useState, useEffect } from 'react';
import api from '@/utils/httpMethods';
import { 
  Settings, 
  CreditCard, 
  Save, 
  RefreshCcw, 
  AlertTriangle, 
  Activity,
  Database,
  Info,
  Banknote,
  Layout,
  Globe,
  Zap,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { toast } from 'sonner';

const AdminSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/settings');
      setSettings(response.data || {});
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load global settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      toast.loading('Synchronizing core parameters...', { id: 'save-settings' });
      await api.patch('/admin/settings', settings);
      toast.success('Configuration Synchronized', { id: 'save-settings' });
    } catch (error) {
      toast.error('Synchronization failed', { id: 'save-settings' });
    } finally {
      setSaving(false);
    }
  };

  const updateManualInfo = (field, value) => {
    setSettings({
      ...settings,
      manualPaymentInfo: {
        ...(settings?.manualPaymentInfo || {}),
        [field]: value
      }
    });
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="loader-mini !w-8 !h-8 mb-4"></div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text3">Accessing System Core...</p>
    </div>
  );

  if (!settings) return (
    <div className="p-8 text-center glass-panel rounded-2xl mx-6 mt-6">
      <AlertTriangle size={48} className="mx-auto text-red opacity-50 mb-4" />
      <h2 className="text-xl font-bold mb-2 text-text">Fault Detected</h2>
      <p className="text-text2">Failed to load system configuration. Core relay unresponsive.</p>
    </div>
  );

  return (
    <div className="page-body space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-blue mb-1">
            <Cpu size={18} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">System BIOS v4.0</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-text">Configuration Override</h1>
          <p className="text-text2 text-sm max-w-xl">Fine-tune global parameters, payment protocols, and system-wide behavior.</p>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={saving}
          className="btn-primary !w-auto !px-8 hover:shadow-[0_0_20px_rgba(91,141,239,0.3)] !m-0"
        >
          {saving ? <RefreshCcw size={18} className="animate-spin" /> : <Save size={18} />}
          <span>Upload Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-20">
        {/* Payment Protocols */}
        <div className="lg:col-span-12">
          <div className="card glass-panel !p-6 space-y-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-2 opacity-10">
                <Globe size={120} />
             </div>
             
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue/10 border border-blue/20 flex items-center justify-center text-blue">
                   <CreditCard size={20} />
                </div>
                <div>
                   <h3 className="text-lg font-black text-text leading-tight">Payment Gateways</h3>
                   <p className="text-text3 text-[10px] uppercase font-bold tracking-widest mt-0.5 italic">Active Transaction Routing</p>
                </div>
             </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { id: 'stripe', desc: 'Global Secure Node', icon: Zap, color: 'blue' },
                { id: 'razorpay', desc: 'Regional High-Speed', icon: Activity, color: 'accent' },
                { id: 'manual', desc: 'Direct Proxy Link', icon: Database, color: 'purple' }
              ].map((gateway) => (
                <button
                  key={gateway.id}
                  onClick={() => setSettings({...settings, activePaymentGateway: gateway.id})}
                  className={`relative p-5 rounded-2xl border transition-all text-left group overflow-hidden ${
                    settings.activePaymentGateway === gateway.id 
                      ? 'bg-bg3 border-accent ring-2 ring-accent/20' 
                      : 'bg-bg2/40 border-border/10 hover:border-accent/40 grayscale opacity-60 hover:opacity-100 hover:grayscale-0'
                  }`}
                >
                  <div className={`absolute -right-4 -bottom-4 opacity-5 group-hover:scale-125 transition-transform ${settings.activePaymentGateway === gateway.id ? 'opacity-10' : ''}`}>
                     <gateway.icon size={80} />
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        settings.activePaymentGateway === gateway.id ? 'bg-accent/20 text-accent' : 'bg-bg4 text-text3'
                     }`}>
                        <gateway.icon size={16} />
                     </div>
                     {settings.activePaymentGateway === gateway.id && (
                        <div className="w-3 h-3 rounded-full bg-accent animate-pulse"></div>
                     )}
                  </div>
                  
                  <div className={`font-black uppercase tracking-widest text-[11px] mb-1 ${
                     settings.activePaymentGateway === gateway.id ? 'text-accent' : 'text-text2'
                  }`}>{gateway.id}</div>
                  <div className="text-[10px] font-bold text-text3 uppercase tracking-tight">
                    {gateway.desc}
                  </div>
                </button>
              ))}
            </div>

            <div className="p-4 bg-amber/5 border border-amber/10 rounded-2xl flex gap-4 text-amber text-[10px] font-bold tracking-tight uppercase leading-relaxed">
              <AlertTriangle className="shrink-0 opacity-60" size={18} />
              <p>
                Crucial: Modifying gateway protocols will redirect all pending checkout requests. 
                Active telemetry nodes (existing subscriptions) will persist on their current relay until reset.
              </p>
            </div>
          </div>
        </div>

        {/* Manual Payment Matrix */}
        <div className="lg:col-span-12">
           <div className="card glass-panel !p-6 space-y-8">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple/10 border border-purple/20 flex items-center justify-center text-purple">
                     <Banknote size={20} />
                  </div>
                  <div>
                     <h3 className="text-lg font-black text-text leading-tight">Manual Proxy Configuration</h3>
                     <p className="text-text3 text-[10px] uppercase font-bold tracking-widest mt-0.5 italic">Human-Verified Financial Handshake</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
                <div className="form-group lg:col-span-1">
                  <label className="form-label !text-[10px]">Bank Institution</label>
                  <input 
                    type="text" 
                    className="form-input !bg-bg2/40 border-dashed"
                    value={settings.manualPaymentInfo?.bankName || ''}
                    onChange={(e) => updateManualInfo('bankName', e.target.value)}
                    placeholder="Enter node name..."
                  />
                </div>
                <div className="form-group lg:col-span-1">
                  <label className="form-label !text-[10px]">Address Index (Account)</label>
                  <input 
                    type="text" 
                    className="form-input !bg-bg2/40 border-dashed"
                    value={settings.manualPaymentInfo?.accountNumber || ''}
                    onChange={(e) => updateManualInfo('accountNumber', e.target.value)}
                    placeholder="Numerical string..."
                  />
                </div>
                <div className="form-group lg:col-span-1">
                  <label className="form-label !text-[10px]">Route Identifier (IFSC)</label>
                  <input 
                    type="text" 
                    className="form-input !bg-bg2/40 border-dashed"
                    value={settings.manualPaymentInfo?.ifsc || ''}
                    onChange={(e) => updateManualInfo('ifsc', e.target.value)}
                    placeholder="Alpha-numeric code..."
                  />
                </div>
                <div className="form-group lg:col-span-1">
                  <label className="form-label !text-[10px]">Unified Protocol (UPI)</label>
                  <input 
                    type="text" 
                    className="form-input !bg-bg2/40 border-dashed shadow-[0_0_15px_rgba(167,139,250,0.05)]"
                    value={settings.manualPaymentInfo?.upiId || ''}
                    onChange={(e) => updateManualInfo('upiId', e.target.value)}
                    placeholder="id@bank"
                  />
                </div>
                
                <div className="md:col-span-2 lg:col-span-4 space-y-3">
                  <label className="form-label !text-[10px] flex items-center justify-between">
                     <span>Deployment Instructions</span>
                     <span className="text-[9px] uppercase opacity-30 italic">Markdown Supported</span>
                  </label>
                  <textarea 
                    className="form-input min-h-[120px] !bg-bg2/40 !border-dashed resize-none font-mono text-xs leading-relaxed"
                    placeholder="Specify the exact verification procedure for manual nodes..."
                    value={settings.manualPaymentInfo?.instructions || ''}
                    onChange={(e) => updateManualInfo('instructions', e.target.value)}
                  />
                </div>
              </div>

              <div className="p-5 bg-purple/10 border border-purple/20 rounded-2xl flex gap-4 text-purple items-center">
                <div className="w-10 h-10 rounded-full bg-purple/20 flex items-center justify-center shrink-0 border border-purple/30">
                   <Info size={20} />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest leading-relaxed opacity-80">
                  Global Alert: These credentials will be visible to all tiered users selecting the "Manual Handshake" protocol during upgrade sequences.
                </div>
              </div>
           </div>
        </div>
        
        {/* Footnote */}
        <div className="lg:col-span-12 pt-8 border-t border-border/10 flex items-center justify-center gap-6 opacity-30">
           <div className="flex items-center gap-2 grayscale">
              <ShieldCheck size={14} />
              <span className="text-[9px] font-black uppercase tracking-[0.4em]">Core Integrity Confirmed</span>
           </div>
           <div className="w-1.5 h-1.5 rounded-full bg-border2"></div>
           <div className="flex items-center gap-2 grayscale">
              <Layout size={14} />
              <span className="text-[9px] font-black uppercase tracking-[0.4em]">Interface v1.0.4-LNC</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
