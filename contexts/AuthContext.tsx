
/**
 * @file AuthContext.tsx
 * @description Provides a global authentication context for the entire application.
 * This context is the single source of truth for the user's session state.
 * It listens to auth changes from Supabase and makes the user object available
 * to all components, allowing for conditional rendering based on auth status.
 */
import React, { createContext, useState, useEffect, useContext, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { logout as authLogout } from '../services/auth';
import { type Session, type User } from '@supabase/supabase-js';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    signOut: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // If Supabase isn't configured, stop loading and do nothing.
        if (!supabase) {
            setLoading(false);
            return;
        }

        // Check for an active session when the provider mounts.
        const fetchSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setLoading(false);
        };

        fetchSession();

        // Listen for changes in authentication state (e.g., login, logout).
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        // Cleanup the subscription when the component unmounts.
        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const value = {
        session,
        user: session?.user ?? null,
        signOut: async () => {
            // The actual sign-out logic is handled in the auth service.
            await authLogout();
        },
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
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
