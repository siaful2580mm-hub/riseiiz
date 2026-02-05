import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase.ts';
import { Profile } from '../types.ts';
import { TRANSLATIONS } from '../constants.tsx';

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  t: any;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  debugInfo: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const t = TRANSLATIONS.bn;

  const addLog = (msg: string) => {
    console.log(`[AuthContext] ${msg}`);
    setDebugInfo(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const fetchProfile = async (userId: string) => {
    addLog(`Fetching profile for: ${userId}`);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        addLog(`DB Error: ${error.message}`);
        console.error('Database error fetching profile:', error);
        return null;
      }

      if (!data) {
        addLog(`No profile record found in table for ${userId}`);
        return null;
      }

      addLog(`Profile loaded successfully for ${data.email}`);
      return data;
    } catch (err) {
      addLog(`Critical fetch crash: ${err instanceof Error ? err.message : 'Unknown'}`);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const p = await fetchProfile(user.id);
      setProfile(p);
    }
  };

  useEffect(() => {
    let mounted = true;
    addLog("Initializing Auth Module...");

    const handleSession = async (session: any) => {
      const u = session?.user ?? null;
      addLog(`Session update. User: ${u ? u.email : 'Guest'}`);
      
      if (mounted) setUser(u);
      
      if (u) {
        const p = await fetchProfile(u.id);
        if (mounted) {
          setProfile(p);
          addLog(p ? "Profile state updated" : "Profile state is NULL");
        }
      } else {
        if (mounted) setProfile(null);
      }
      
      if (mounted) {
        setLoading(false);
        addLog("Loading state set to FALSE");
      }
    };

    // Initial session check
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        addLog(`Session Fetch Error: ${error.message}`);
        if (mounted) setLoading(false);
        return;
      }
      addLog("Initial session retrieved");
      if (mounted) handleSession(session);
    }).catch(err => {
      addLog(`Critical Session Crash: ${err.message}`);
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      addLog(`Auth State Change: ${event}`);
      if (mounted) handleSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    addLog("Signing out...");
    setLoading(true);
    await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
    setLoading(false);
    addLog("Signed out completed");
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, t, signOut, refreshProfile, debugInfo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};