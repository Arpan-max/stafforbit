import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { runGeneticAlgorithm } from '../utils/geneticAlgorithm';
import { Settings, CheckCircle, Calendar, Users, AlertCircle } from 'lucide-react';

export default function Projects() {
  const [allConsultants, setAllConsultants] = useState([]);
  const [projects, setProjects] = useState([]); 
  const [selectedProject, setSelectedProject] = useState(null);
  const [optimizedTeam, setOptimizedTeam] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function fetchData() {
      // Fetch consultants with profile relations
      const { data: cData, error: cErr } = await supabase.from('consultants').select('*, profiles(full_name)');
      if (cData) setAllConsultants(cData);
      if (cErr) console.error("Consultant fetch error:", cErr);

      // Fetch active projects
      const { data: pData } = await supabase.from('projects').select('*').eq('is_active', true);
      if (pData) {
        setProjects(pData);
        if (pData.length > 0) setSelectedProject(pData[0]); 
      }
    }
    fetchData();
  }, []);

  const handleRunOptimizer = () => {
    if (!selectedProject) return;
    setIsProcessing(true);
    setOptimizedTeam(null);
    
    setTimeout(() => {
      // We assume the project starts today for testing purposes
      const team = runGeneticAlgorithm(
        allConsultants, 
        selectedProject.required_skills, 
        selectedProject.max_daily_budget_inr, 
        new Date().toISOString() 
      );
      
      console.log("🚀 OPTIMIZER PASSED THIS TO UI:", team); // The proof!
      setOptimizedTeam(team);
      setIsProcessing(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <h2 className="text-3xl font-bold text-slate-800">Deployment Optimizer</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-xl font-bold mb-4 text-slate-800">Select Project</h3>
          
          <select 
            className="w-full mb-6 border border-slate-300 p-3 rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
            onChange={(e) => setSelectedProject(projects.find(p => p.id === e.target.value))}
            value={selectedProject?.id || ''}
          >
            {projects.length === 0 && <option value="">No active projects found...</option>}
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>

          {selectedProject && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Required Skills</p>
                <div className="flex gap-2 mt-1">
                  {selectedProject.required_skills.map(skill => (
                    <span key={skill} className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-xs font-bold">{skill}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Max Budget</p>
                <p className="font-semibold text-rose-600">₹{selectedProject.max_daily_budget_inr.toLocaleString('en-IN')}/day</p>
              </div>
              <button onClick={handleRunOptimizer} disabled={isProcessing} className="w-full mt-4 flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50">
                <Settings className={isProcessing ? "animate-spin" : ""} size={20} />
                {isProcessing ? "Optimizing..." : "Generate Optimal Team"}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[400px]">
          <h3 className="text-xl font-bold mb-4 text-slate-800">Algorithm Result</h3>
          
          {!optimizedTeam && !isProcessing && (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <Settings size={40} className="mb-2 opacity-20" />
              <p className="text-sm font-medium">Ready to optimize workforce</p>
            </div>
          )}

          {isProcessing && (
             <div className="h-64 flex flex-col items-center justify-center text-indigo-500">
               <Settings size={40} className="animate-spin mb-2" />
               <p className="text-sm font-bold uppercase tracking-widest">Running Generations...</p>
             </div>
          )}

          {optimizedTeam && !isProcessing && (
            <div className="space-y-4 animate-in slide-in-from-bottom-2">
              {optimizedTeam.length > 0 ? (
                <>
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg flex items-start gap-3">
                    <CheckCircle className="text-emerald-600 mt-0.5" size={20} />
                    <div>
                      <h4 className="font-bold text-emerald-900 text-sm">Optimal Selection Found</h4>
                      <p className="text-xs text-emerald-700 font-medium">
                        Total Cost: ₹{optimizedTeam.reduce((sum, c) => sum + (c.daily_cost_inr || 0), 0).toLocaleString('en-IN')}/day
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {optimizedTeam.map(c => (
                      <div key={c.id} className="p-4 border border-slate-100 bg-slate-50 rounded-lg flex justify-between items-center text-sm shadow-sm">
                        <div>
                          {/* Safely using optional chaining in case profile data lags */}
                          <p className="font-bold text-slate-800 flex items-center gap-2">
                            <Users size={14} className="text-slate-400"/>
                            {c.profiles?.full_name || 'Unnamed Consultant'}
                          </p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                            Skills: {c.skills.join(', ')}
                          </p>
                        </div>
                        <p className="font-bold text-slate-900 bg-white px-3 py-1 rounded border border-slate-200">
                          ₹{(c.daily_cost_inr || 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-3 text-rose-800">
                  <AlertCircle size={20} className="mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">No valid team found</h4>
                    <p className="text-xs mt-1">No combination of available consultants matched the required skills within the budget and timeline.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}