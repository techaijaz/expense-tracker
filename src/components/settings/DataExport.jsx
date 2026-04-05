import { useState } from 'react';
import { toast } from 'sonner';
import api from '@/utils/httpMethods';
import { SectionCard, SectionTitle } from '../SharedComponents';

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
      a.download = `expense_tracker_export_${dateStr}.${format}`;
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
    <SectionCard>
      <SectionTitle icon="download">Data Export</SectionTitle>
      <p className="text-[13px] text-on-surface-variant mb-5 leading-[1.7]">
        Download a complete snapshot of your financial data. CSV works in Excel and Google Sheets. JSON provides a full structured dump.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => handleExport('csv')} disabled={exportingCsv}
          className={`p-3.5 bg-[rgba(168,237,202,0.07)] border border-[rgba(168,237,202,0.2)] rounded-xl flex flex-col items-center gap-2.5 transition-all duration-200 ${exportingCsv ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-[#a8edca]'}`}>
          <span className="material-symbols-outlined text-[28px] text-[#a8edca]" style={{ fontVariationSettings: "'FILL' 0" }}>table_chart</span>
          <div>
            <p className="text-[13px] font-bold text-[#a8edca] mb-0.5">{exportingCsv ? 'Exporting…' : 'Export CSV'}</p>
            <p className="text-[11px] text-on-surface-variant">Spreadsheet format</p>
          </div>
        </button>
        <button onClick={() => handleExport('json')} disabled={exportingJson}
          className={`p-3.5 bg-surface-variant border border-surface-variant rounded-xl flex flex-col items-center gap-2.5 transition-all duration-200 ${exportingJson ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-primary'}`}>
          <span className="material-symbols-outlined text-[28px] text-primary" style={{ fontVariationSettings: "'FILL' 0" }}>data_object</span>
          <div>
            <p className="text-[13px] font-bold text-primary mb-0.5">{exportingJson ? 'Exporting…' : 'Export JSON'}</p>
            <p className="text-[11px] text-on-surface-variant">Complete data dump</p>
          </div>
        </button>
      </div>
    </SectionCard>
  );
}
