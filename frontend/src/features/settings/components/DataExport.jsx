import { useState } from 'react';
import { toast } from 'sonner';
import api from '@/utils/httpMethods';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileJson, Loader2, ShieldCheck } from 'lucide-react';

export default function DataExport() {
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingJson, setExportingJson] = useState(false);

  const handleExport = async (format) => {
    format === 'csv' ? setExportingCsv(true) : setExportingJson(true);
    try {
      const resData = await api.get(`/user/export?format=${format}`);
      const dateStr = new Date().toISOString().slice(0, 10);
      const mime = format === 'csv' ? 'text/csv' : 'application/json';

      const content =
        typeof resData === 'object' ? JSON.stringify(resData) : resData;
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
    <Card className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold">Data Export</CardTitle>
            <CardDescription className="text-xs">Securely download your financial data</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Secure Vault Export</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Download a complete snapshot of your financial ledger. All exports are encrypted using your session token and provided in universal formats.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2 rounded-xl border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
              onClick={() => handleExport('csv')}
              disabled={exportingCsv}
            >
              <div className="flex items-center gap-3 w-full">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {exportingCsv ? 'Exporting...' : 'Export CSV'}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Spreadsheet format</div>
                </div>
                {exportingCsv && <Loader2 className="ml-auto w-4 h-4 animate-spin text-slate-400" />}
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2 rounded-xl border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
              onClick={() => handleExport('json')}
              disabled={exportingJson}
            >
              <div className="flex items-center gap-3 w-full">
                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                  <FileJson className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {exportingJson ? 'Exporting...' : 'Export JSON'}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Complete data dump</div>
                </div>
                {exportingJson && <Loader2 className="ml-auto w-4 h-4 animate-spin text-slate-400" />}
              </div>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
