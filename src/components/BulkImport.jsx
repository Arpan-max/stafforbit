import { useState } from 'react';
import Papa from 'papaparse';
import { supabase } from '../supabaseClient';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function BulkImport({ companyId, onRefresh }) {
  const [isUploading, setIsUploading] = useState(false);
  const [stats, setStats] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setStats(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        let successCount = 0;
        let errorCount = 0;

        for (const row of results.data) {
          try {
            // Require Email for the new DB schema
            if (!row.Email && !row.email) throw new Error("Missing Email");

            const { data: profile, error: pError } = await supabase.from('profiles').insert([{
              full_name: row.Name || row.full_name,
              email: row.Email || row.email, // Added Email mapping
              role: 'consultant',
              company_id: companyId
            }]).select().single();

            if (pError) throw pError;

            const { error: cError } = await supabase.from('consultants').insert([{
              id: profile.id,
              company_id: companyId,
              experience_level: row.Level || 'Mid',
              daily_cost_inr: parseInt(row.Cost || row.daily_cost || 0),
              skills: (row.Skills || '').split(',').map(s => s.trim()),
              available_from: new Date().toISOString().split('T')[0]
            }]);

            if (cError) throw cError;
            successCount++;
          } catch (err) {
            console.error("Row Import Failed:", err);
            errorCount++;
          }
        }

        setStats({ success: successCount, errors: errorCount });
        setIsUploading(false);
        onRefresh();
      }
    });
  };

  return (
    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center mt-4">
      {!isUploading && !stats && (
        <div className="flex flex-col items-center">
          <div className="bg-white p-4 rounded-full shadow-sm mb-4 text-indigo-600">
            <Upload size={32} />
          </div>
          <h4 className="font-bold text-slate-800">Bulk Import via CSV</h4>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
            Upload a .csv file with headers: <span className="font-mono bg-slate-200 px-1 rounded text-slate-700">Name, Email, Level, Cost, Skills</span>
          </p>
          <label className="cursor-pointer bg-white border border-slate-300 px-6 py-2.5 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
            Choose File
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      )}

      {isUploading && (
        <div className="py-8 flex flex-col items-center">
          <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
          <p className="font-bold text-slate-700">Processing Workforce Data...</p>
        </div>
      )}

      {stats && (
        <div className="animate-in zoom-in-95 duration-200">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${stats.errors === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
            {stats.errors === 0 ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          </div>
          <h4 className="font-bold text-slate-800">Import Summary</h4>
          <p className="text-sm text-slate-600 mt-1">
            Successfully added <span className="font-bold text-emerald-600">{stats.success}</span> consultants.
            {stats.errors > 0 && <span className="text-rose-600"> {stats.errors} rows failed (check emails).</span>}
          </p>
          <button onClick={() => setStats(null)} className="mt-6 text-indigo-600 font-bold text-sm hover:underline">
            Upload another file
          </button>
        </div>
      )}
    </div>
  );
}