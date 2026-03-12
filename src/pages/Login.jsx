import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Loader2, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Added for redirection

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      navigate('/'); // Redirect to Dashboard on success
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 font-sans">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-100">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-indigo-600 tracking-tight">StaffOrbit</h1>
            <p className="text-slate-500 text-sm mt-2">Sign in to manage your workforce</p>
          </div>

          {error && (
            <div className="mb-6 bg-rose-50 text-rose-600 p-4 rounded-xl text-sm flex items-center gap-2 font-medium">
              <AlertCircle size={18} /> {error}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Work Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border-slate-200 border p-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="name@company.com" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border-slate-200 border p-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-indigo-600 py-3.5 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex justify-center items-center gap-2 disabled:opacity-70">
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Sign In to Dashboard"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}