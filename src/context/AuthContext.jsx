import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // The Supabase Auth User
  const [profile, setProfile] = useState(null); // The Database Profile (role, company_id, etc.)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check active session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileData(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3. Fetch the full user profile securely
  const fetchProfileData = async (authUserId) => {
    try {
      // Note the change to 'auth_id' matching our Batch 7 SQL script!
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, company_id, status, full_name, email')
        .eq('auth_id', authUserId)
        .single();

      if (error) {
        console.error("Profile fetch error:", error.message);
        // If the profile isn't found, we shouldn't block the app forever, 
        // but we might need to route them to an onboarding screen later.
        setProfile(null); 
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error("Unexpected error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  // 4. Centralized logout function (Optional, but good for clean code)
  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    // We now provide the whole 'profile' object, plus the logout helper
    <AuthContext.Provider value={{ user, profile, loading, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);