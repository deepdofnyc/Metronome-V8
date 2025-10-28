/**
 * @file auth.ts
 * @description Authentication service for interacting with Supabase.
 * This file centralizes all authentication logic (login, logout, signup)
 * to provide a clear API layer for the UI components. This is the primary
 * point of contact between the frontend and the Supabase auth backend.
 */
import { supabase } from '../lib/supabase';
import { type Credentials } from '../types/types';
import { type AuthError, type Provider } from '@supabase/supabase-js';

/**
 * Signs in a user with their email and password.
 * @param credentials - The user's email and password.
 * @returns The result of the Supabase signInWithPassword call.
 */
export const login = async ({ email, password }: Credentials) => {
    if (!supabase) throw new Error("Supabase client is not initialized.");
    return await supabase.auth.signInWithPassword({ email, password });
};

/**
 * Signs up a new user.
 * @param credentials - The new user's email and password.
 * @returns The result of the Supabase signUp call.
 */
export const signup = async ({ email, password }: Credentials) => {
    if (!supabase) throw new Error("Supabase client is not initialized.");
    return await supabase.auth.signUp({ email, password });
};

/**
 * Signs out the current user.
 * @returns The result of the Supabase signOut call.
 */
export const logout = async () => {
    if (!supabase) throw new Error("Supabase client is not initialized.");
    return await supabase.auth.signOut();
};

/**
 * Sends a password reset link to the user's email.
 * @param email - The user's email address.
 * @returns The result of the Supabase resetPasswordForEmail call.
 */
export const sendPasswordResetEmail = async (email: string) => {
    if (!supabase) throw new Error("Supabase client is not initialized.");
    return await supabase.auth.resetPasswordForEmail(email);
};

/**
 * Signs in a user using an OAuth provider.
 * @param provider - The OAuth provider to use (e.g., 'google', 'apple').
 * @returns The result of the Supabase signInWithOAuth call.
 */
export const socialLogin = async (provider: Provider) => {
    if (!supabase) throw new Error("Supabase client is not initialized.");
    return await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: window.location.origin, // Redirect back to the app
        },
    });
};


// --- MFA (2FA) Functions ---

/**
 * Starts the MFA enrollment process for a TOTP factor.
 * @returns The result from Supabase, including a QR code for authenticator apps.
 */
export const enrollMfa = async () => {
    if (!supabase) throw new Error("Supabase client is not initialized.");
    return await supabase.auth.mfa.enroll({
        factorType: 'totp',
    });
};

/**
 * Verifies a TOTP code to finish enrollment or to sign in.
 * This function first creates a challenge and then immediately tries to verify it.
 * @param factorId - The ID of the factor being verified.
 * @param code - The 6-digit code from the authenticator app.
 * @returns The result of the verification.
 */
export const challengeAndVerifyMfa = async (factorId: string, code: string) => {
    if (!supabase) throw new Error("Supabase client is not initialized.");
    
    // 1. Create a challenge
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) return { data: null, error: challengeError };

    const challengeId = challengeData.id;

    // 2. Verify the challenge with the code provided by the user
    return await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code,
    });
};

/**
 * Disables a specific MFA factor.
 * @param factorId - The ID of the factor to unenroll.
 * @returns The result of the unenrollment.
 */
export const unenrollMfa = async (factorId: string) => {
    if (!supabase) throw new Error("Supabase client is not initialized.");
    return await supabase.auth.mfa.unenroll({ factorId });
};

/**
 * Checks the user's current Authentication Assurance Level (AAL).
 * This tells us if they have signed in with MFA in the current session.
 * @returns The AAL status from Supabase.
 */
export const getAuthenticatorAssuranceLevel = async () => {
    if (!supabase) throw new Error("Supabase client is not initialized.");
    return await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
};

/**
 * A helper type for the list of factors.
 */
export type MfaFactor = {
    id: string;
    friendlyName: string;
    factorType: 'totp';
    status: 'verified' | 'unverified';
};

/**
 * Lists all MFA factors enrolled by the current user.
 * @returns A list of the user's enrolled factors or an error.
 */
export const listFactors = async (): Promise<{ factors: MfaFactor[] | null; error: AuthError | null }> => {
    if (!supabase) throw new Error("Supabase client is not initialized.");
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
        return { factors: null, error };
    }
    // The 'data' object has a 'totp' property which is an array of factors.
    const factors = (data?.totp ?? []).map((f: any) => ({
        id: f.id,
        friendlyName: f.friendly_name ?? '',
        factorType: (f.factor_type ?? 'totp') as 'totp',
        status: f.status as 'verified' | 'unverified',
    }));
    return { factors, error: null };
};
