
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase.ts';
import { Profile } from '../types.ts';
import { TRANSLATIONS } from '../constants.tsx';

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
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
  const [profileLoading, setProfileLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const t = TRANSLATIONS.bn;

  const addLog = (msg: string) => {
    const log = `${new Date().toLocaleTimeString()}: ${msg}`;
    console.log(`[Auth] ${msg}`);
    setDebugInfo(prev => [...prev.slice(-14), log]);
  };

  const fetchProfile = async (userId: string, retryCount = 0): Promise<any> => {
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) return null;
      
      if (!data && retryCount < 3) {
        await new Promise(r => setTimeout(r, 1500));
        return fetchProfile(userId, retryCount + 1);
      }
      
      return data;
    } catch (err) {
      return null;
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSession = async (session: any) => {
    const u = session?.user ?? null;
    setUser(u);
    
    // মেইন লোডিং স্ক্রিন বন্ধ করে দেওয়া হচ্ছে যাতে অ্যাপ হ্যাং না করে
    setLoading(false);
    
    if (u) {
      // প্রোফাইল ব্যাকগ্রাউন্ডে লোড হবে
      const p = await fetchProfile(u.id);
      setProfile(p);
    } else {
      setProfile(null);
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

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) handleSession(session);
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) handleSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setProfile(null);
      setUser(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, profileLoading, t, signOut, refreshProfile, debugInfo }}>
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
