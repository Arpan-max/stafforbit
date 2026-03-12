import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { CalendarDays, UserPlus, Loader2, FileSpreadsheet, Search } from 'lucide-react';
import AddConsultantModal from '../components/AddConsultantModal';
import BulkImport from '../components/BulkImport';
import { useAuth } from '../context/AuthContext';

export default function Consultants() {
  const [consultants, setConsultants] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); // Added Search
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // 🚀 Much cleaner: We get the company_id directly from our updated AuthContext!
  const { profile } = useAuth(); 

  const fetchConsultants = useCallback(async () => {
    if (!profile?.company_id) return;
    setLoading(true);
    
    // RLS (Row Level Security) handles the filtering automatically!
    const { data, error } = await supabase
      .from('consultants')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false });
      
    if (error) console.error("Fetch error:", error);
    else setConsultants(data || []);
    
    setLoading(false);
  }, [profile]);

  useEffect(() => { fetchConsultants(); }, [fetchConsultants]);

  // Search Filter Logic
  const filteredConsultants = consultants.filter(c => 
    c.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getAvailabilityBadge = (availDate) => {
    const today = new Date();
    const available = new Date(availDate);
    today.setHours(0, 0, 0, 0); available.setHours(0, 0, 0, 0);

    if (available <= today) return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase">Available Now</span>;
    const diffDays = Math.ceil(Math.abs(available - today) / (1000 * 60 * 60 * 24));
    return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase flex items-center gap-1"><CalendarDays size={12}/> In {diffDays} Days</span>;
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Resource Directory</h2>
          <p className="text-slate-500 text-sm">Manage your global workforce availability.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* New Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Search by name or skill..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64" />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all whitespace-nowrap">
            <UserPlus size={18}/> Add Staff
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="p-24 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="animate-spin mb-4 text-indigo-500" size={40} />
            <p className="text-sm font-bold uppercase tracking-widest text-center">Syncing Records...</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm min-w-[800px]">
             {/* ... (Keep your existing table headers and rows, but map over 'filteredConsultants' instead of 'consultants') ... */}
             <thead className="bg-slate-50 border-b border-slate-200 text-slate-400">
              <tr>
                <th className="px-8 py-5 font-bold uppercase tracking-wider text-[10px]">Consultant & Expertise</th>
                <th className="px-8 py-5 font-bold uppercase tracking-wider text-[10px]">Exp Level</th>
                <th className="px-8 py-5 font-bold uppercase tracking-wider text-[10px]">Daily Rate (₹)</th>
                <th className="px-8 py-5 font-bold uppercase tracking-wider text-[10px]">Current Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredConsultants.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-8 py-5">
                    <p className="font-bold text-slate-800">{c.profiles?.full_name}</p>
                    <p className="text-[11px] text-slate-400 mt-1 font-bold uppercase tracking-tighter">{c.skills.join(' • ')}</p>
                  </td>
                  <td className="px-8 py-5"><span className="font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded text-xs">{c.experience_level}</span></td>
                  <td className="px-8 py-5 font-bold text-slate-900">₹{c.daily_cost_inr.toLocaleString('en-IN')}</td>
                  <td className="px-8 py-5">{getAvailabilityBadge(c.available_from)}</td>
                </tr>
              ))}
              {filteredConsultants.length === 0 && (
                <tr><td colSpan="4" className="text-center py-10 text-slate-500">No consultants found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="pt-8 mt-12 border-t border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><FileSpreadsheet size={20} /></div>
          <h3 className="text-xl font-bold text-slate-800">Enterprise Onboarding (CSV)</h3>
        </div>
        <BulkImport companyId={profile?.company_id} onRefresh={fetchConsultants} />
      </div>

      <AddConsultantModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onRefresh={fetchConsultants} companyId={profile?.company_id} />
    </div>
  );
}