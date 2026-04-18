import { useState } from 'react';
import { toast } from 'sonner';
import api from '@/utils/httpMethods';

export default function DataExport() {
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingJson, setExportingJson] = useState(false);

  const handleExport = async (format) => {
    format === 'csv' ? setExportingCsv(true) : setExportingJson(true);
    try {
      const resData = await api.get(`/user/export?format=${format}`);
      const dateStr = new Date().toISOString().slice(0, 10);
      const mime = format === 'csv' ? 'text/csv' : 'application/json';
      
      const content = typeof resData === 'object' ? JSON.stringify(resData) : resData;
      const blob = new Blob([content], { type: mime });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ledger_export_${dateStr}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error('Export failed. Please try again.');
    } finally {
      format === 'csv' ? setExportingCsv(false) : setExportingJson(false);
    }
  };

  return (
    <div className="settings-card">
      <div className="settings-section-title"><div className="icon">📥</div>Data Export</div>
      <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16, lineHeight: 1.6 }}>
        Download a complete snapshot of your financial ledger. All exports are encrypted using your session token.
      </p>
      
      <div className="export-btns">
        <div 
          className={`export-btn ${exportingCsv ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => !exportingCsv && handleExport('csv')}
        >
          <div className="export-btn-icon">📊</div>
          <div className="export-btn-label">{exportingCsv ? 'Exporting...' : 'Export CSV'}</div>
          <div className="export-btn-sub">Spreadsheet format</div>
        </div>
        
        <div 
          className={`export-btn ${exportingJson ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => !exportingJson && handleExport('json')}
        >
          <div className="export-btn-icon">{"{}"}</div>
          <div className="export-btn-label">{exportingJson ? 'Exporting...' : 'Export JSON'}</div>
          <div className="export-btn-sub">Complete data dump</div>
        </div>
      </div>
    </div>
  );
}
