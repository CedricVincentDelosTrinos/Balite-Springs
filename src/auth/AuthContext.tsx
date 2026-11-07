
import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthContextType {
    user: User | null;
    isAdmin: boolean;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<string | null>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    const [authLoading, setAuthLoading] = useState(true);
    const [adminLoading, setAdminLoading] = useState(false);

    // Track the current Supabase authentication session.
    useEffect(() => {
        let mounted = true;

        async function initializeAuth() {
            const { data, error } = await supabase.auth.getSession();

            if (!mounted) return;

            if (error) {
                console.error("Session initialization failed:", error.message);
            }

            setUser(data.session?.user ?? null);
            setAuthLoading(false);
        }

        initializeAuth();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // Check whether the authenticated user is registered as an admin.
    useEffect(() => {
        let active = true;

        async function checkAdminStatus() {
            if (!user) {
                setIsAdmin(false);
                setAdminLoading(false);
                return;
            }

            setAdminLoading(true);

            const { data, error } = await supabase
                .from("admin_users")
                .select("user_id")
                .eq("user_id", user.id)
                .maybeSingle();

            if (!active) return;

            if (error) {
                console.error("Admin verification failed:", error.message);
            }

            setIsAdmin(!error && !!data);
            setAdminLoading(false);
        }

        checkAdminStatus();

        return () => {
            active = false;
        };
    }, [user]);

    async function signIn(
        email: string,
        password: string
    ): Promise<string | null> {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        return error?.message ?? null;
    }

    async function signOut() {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error("Sign out failed:", error.message);
        }
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                isAdmin,
                loading: authLoading || adminLoading,
                signIn,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside an AuthProvider.");
    }

    return context;
}
