import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FolderKanban, LogOut, Menu, X } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function ManagerLayout() {
  const location = useLocation();
  const navigate = useNavigate(); // Better routing
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login'); // Navigate instead of full page reload
  };

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Consultants', path: '/consultants', icon: Users },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-slate-200 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-indigo-600 tracking-tight">StaffOrbit</h1>
        {/* Mobile close button */}
        <button className="md:hidden text-slate-500" onClick={() => setIsMobileMenuOpen(false)}>
          <X size={24} />
        </button>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link key={link.name} to={link.path} onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-100'
              }`}>
              <Icon size={20} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
              {link.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-200">
        <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-3 text-slate-600 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors">
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      
      {/* Mobile Header */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center px-4 z-20">
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-600 p-2">
          <Menu size={24} />
        </button>
        <h1 className="text-xl font-bold text-indigo-600 ml-2">StaffOrbit</h1>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900/50 z-30" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar (Responsive) */}
      <aside className={`fixed md:relative z-40 h-full w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto p-4 md:p-8 mt-16 md:mt-0">
        <Outlet />
      </main>
    </div>
  );
}