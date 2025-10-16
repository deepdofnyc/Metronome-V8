
/**
 * @file auth.ts
 * @description Authentication service for interacting with Supabase.
 * This file centralizes all authentication logic (login, logout, signup)
 * to provide a clear API layer for the UI components. This is the primary
 * point of contact between the frontend and the Supabase auth backend.
 */
import { supabase } from '../lib/supabase';
import { type Credentials } from '../types';

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
