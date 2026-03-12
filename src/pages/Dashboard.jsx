import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { IndianRupee, TrendingUp, AlertCircle, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Dashboard() {
  const [metrics, setMetrics] = useState({ 
    totalConsultants: 0,
    activeLeakage: 0, 
    utilPercent: 0, 
    upcomingRisk: 0,
    chartData: []
  });

  useEffect(() => {
    async function fetchAnalytics() {
      const { data: consultants } = await supabase.from('consultants').select('*');

      if (consultants) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let activeLeakage = 0;
        let deployedCost = 0;
        let upcomingRisk = 0;
        let benchedCount = 0;

        consultants.forEach(c => {
          const availDate = new Date(c.available_from);
          availDate.setHours(0, 0, 0, 0);

          if (availDate <= today) {
            activeLeakage += c.daily_cost_inr;
            benchedCount++;
          } else {
            deployedCost += c.daily_cost_inr;
            const diffTime = Math.abs(availDate - today);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays <= 15) upcomingRisk += c.daily_cost_inr;
          }
        });

        const totalConsultants = consultants.length;
        const utilization = totalConsultants === 0 ? 0 : Math.round(((totalConsultants - benchedCount) / totalConsultants) * 100);
        
        const chartData = [
          { name: 'Deployed (Safe)', value: deployedCost, fill: '#10b981' },
          { name: 'On Bench (Leakage)', value: activeLeakage, fill: '#e11d48' }
        ];

        setMetrics({
          totalConsultants, activeLeakage, utilPercent: utilization, upcomingRisk, chartData
        });
      }
    }
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Financial Overview</h2>
        <p className="text-slate-500 mt-1 text-sm font-medium">Real-time revenue leakage and deployment metrics.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-2"><IndianRupee size={16}/> Daily Bench Leakage</p>
          <h3 className="text-3xl font-bold text-rose-600">₹{metrics.activeLeakage.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-rose-500 mt-2 font-semibold">Money lost today</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-2"><TrendingUp size={16}/> Utilization Rate</p>
          <h3 className="text-3xl font-bold text-emerald-600">{metrics.utilPercent}%</h3>
          <p className="text-xs text-emerald-600 mt-2 font-semibold">Optimal is &gt; 85%</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-2"><AlertCircle size={16}/> 15-Day Risk</p>
          <h3 className="text-3xl font-bold text-amber-500">₹{metrics.upcomingRisk.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-amber-600 mt-2 font-semibold">Hitting bench soon</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-2"><Users size={16}/> Consultants</p>
          <h3 className="text-3xl font-bold text-indigo-600">{metrics.totalConsultants}</h3>
          <p className="text-xs text-indigo-500 mt-2 font-semibold">Total Workforce</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Daily Cost Distribution</h3>
        <div className="h-72 w-full min-h-[288px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `₹${val/1000}k`} />
              <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Cost']} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}