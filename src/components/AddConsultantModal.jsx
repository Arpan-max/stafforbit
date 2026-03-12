import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { X, UserPlus, Loader2, AlertCircle } from 'lucide-react';

export default function AddConsultantModal({ isOpen, onClose, onRefresh, companyId }) {
  // Added email to state and cleared default skills
  const [formData, setFormData] = useState({ fullName: '', email: '', level: 'Junior', cost: '', skills: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!companyId) return setErrorMsg("Company ID not found. Try refreshing.");
    setLoading(true);

    try {
      // 1. Create Profile with EMAIL for the invitation flow
      const { data: newProfile, error: pError } = await supabase.from('profiles').insert([{
        full_name: formData.fullName,
        email: formData.email, // Crucial for linking auth later!
        role: 'consultant',
        company_id: companyId
      }]).select().single();

      if (pError) throw pError;

      // 2. Create Consultant entry
      const { error: cError } = await supabase.from('consultants').insert([{
        id: newProfile.id,
        company_id: companyId,
        experience_level: formData.level,
        daily_cost_inr: parseInt(formData.cost),
        skills: formData.skills.split(',').map(s => s.trim()),
        available_from: new Date().toISOString().split('T')[0]
      }]);

      if (cError) throw cError;

      onRefresh(); 
      onClose();   
    } catch (err) {
      setErrorMsg(err.message || "An error occurred during creation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2"><UserPlus size={18}/> Add Team Member</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {errorMsg}
            </div>
          )}

          <input required placeholder="Full Name (e.g. Rajesh Kumar)" className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
            onChange={e => setFormData({...formData, fullName: e.target.value})} />
          
          {/* New Email Input */}
          <input required type="email" placeholder="Email Address (For Invitation)" className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
            onChange={e => setFormData({...formData, email: e.target.value})} />
          
          <div className="flex gap-4">
            <select className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white" 
              onChange={e => setFormData({...formData, level: e.target.value})}>
              <option value="Junior">Junior</option>
              <option value="Mid">Mid</option>
              <option value="Senior">Senior</option>
            </select>
            <input required type="number" placeholder="Daily Cost (₹)" className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
              onChange={e => setFormData({...formData, cost: e.target.value})} />
          </div>

          <input placeholder="Skills (comma separated: React, AWS)" className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
            onChange={e => setFormData({...formData, skills: e.target.value})} />

          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-70">
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Add to Workforce"}
          </button>
        </form>
      </div>
    </div>
  );
}