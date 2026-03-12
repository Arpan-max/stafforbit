import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import ManagerLayout from './components/ManagerLayout';
import Dashboard from './pages/Dashboard';
import Consultants from './pages/Consultants';
import Projects from './pages/Projects';
import { Loader2 } from 'lucide-react';

const Logout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    logout().then(() => navigate('/login', { replace: true }));
  }, [logout, navigate]);

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
    </div>
  );
};

const RoleGuard = ({ children, allowedRole, currentRole }) => {
  if (currentRole === null || currentRole === undefined) {
    return (
      <div className="flex flex-col h-screen items-center justify-center space-y-4 bg-slate-50">
        <p className="text-rose-600 font-bold">Account Setup Incomplete</p>
        <p className="text-slate-500 text-sm">We could not verify your role in the system.</p>
        <button onClick={() => window.location.replace('/logout')} className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors">
          Sign Out & Try Again
        </button>
      </div>
    );
  }
  
  if (currentRole !== allowedRole) {
    if (currentRole === 'consultant') return <Navigate to="/consultant-portal" replace />;
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default function App() {
  // Fix: Extract 'profile' instead of 'role' to match our new AuthContext
  const { user, profile, loading } = useAuth();
  
  // Safely grab the role from the profile
  const role = profile?.role; 

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-slate-50 text-slate-500">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
        <p className="font-bold text-sm tracking-widest uppercase">Securing Session...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/logout" element={<Logout />} />
        
        {/* If logged in, send them to the root. Otherwise, show Login */}
        <Route path="/login" element={(user && role) ? <Navigate to="/" replace /> : <Login />} />
        
        {/* Placeholder for future Consultant Portal */}
        <Route path="/consultant-portal" element={
           !user ? <Navigate to="/login" replace /> : 
           <RoleGuard allowedRole="consultant" currentRole={role}>
             <div className="p-8 text-slate-800"><h1>Consultant Portal (Coming Soon)</h1></div>
           </RoleGuard>
        } />

        {/* Manager Routes */}
        <Route path="/" element={
          !user ? <Navigate to="/login" replace /> : 
          <RoleGuard allowedRole="manager" currentRole={role}>
            <ManagerLayout />
          </RoleGuard>
        }>
          <Route index element={<Dashboard />} />
          <Route path="consultants" element={<Consultants />} />
          <Route path="projects" element={<Projects />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}