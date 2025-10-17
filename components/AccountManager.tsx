import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { login, signup, sendPasswordResetEmail, socialLogin } from '../services/auth';
import type { Provider } from '@supabase/supabase-js';
import { ChevronLeftIcon, UserIcon, EmailIcon, PasswordIcon, GoogleIcon, AppleIcon } from './Icons';

// A styled input component for reuse in login/signup forms
const AuthInput: React.FC<{ icon: React.ReactNode; type: string; placeholder: string; id: string; name: string; disabled?: boolean; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ icon, ...props }) => (
    <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white/40">
            {icon}
        </span>
        <input
            {...props}
            autoComplete={props.type === 'password' ? 'current-password' : 'email'}
            className="w-full p-3 pl-10 bg-black/25 border border-white/20 rounded-lg focus:ring-2 focus:ring-[var(--primary-accent)] focus:border-[var(--primary-accent)] outline-none transition-all disabled:opacity-50"
        />
    </div>
);

const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const SocialLogins: React.FC<{ onSocialLogin: (provider: Provider) => void; disabled?: boolean; }> = ({ onSocialLogin, disabled }) => (
    <>
        <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-white/20"></div>
            <span className="flex-shrink mx-4 text-white/50 text-sm">OR</span>
            <div className="flex-grow border-t border-white/20"></div>
        </div>
        <div className="space-y-3">
            <button 
                type="button" 
                onClick={() => onSocialLogin('google')} 
                disabled={disabled}
                className="w-full h-12 flex items-center justify-center gap-3 py-3 bg-black/25 text-white font-bold rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50">
                <GoogleIcon className="h-6 w-6" />
                <span>Continue with Google</span>
            </button>
            <button 
                type="button" 
                onClick={() => onSocialLogin('apple')} 
                disabled={disabled}
                className="w-full h-12 flex items-center justify-center gap-3 py-3 bg-black/25 text-white font-bold rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50">
                <AppleIcon className="h-6 w-6" />
                <span>Continue with Apple</span>
            </button>
        </div>
    </>
);


interface AccountManagerProps {
    onBack: () => void;
}

const AccountManager: React.FC<AccountManagerProps> = ({ onBack }) => {
    const { user, signOut } = useAuth();
    const [view, setView] = useState<'options' | 'login' | 'signup' | 'forgot-password'>(user ? 'options' : 'options');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [credentials, setCredentials] = useState({ email: '', password: '' });

    useEffect(() => {
        if (user) {
            setView('options');
        } else {
            // If user logs out while this component is mounted, switch to options view.
            if(view === 'options' && !user) setView('options');
        }
    }, [user, view]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCredentials(prev => ({ ...prev, [name]: value }));
    };

    const handleViewChange = (newView: 'options' | 'login' | 'signup' | 'forgot-password') => {
        setError(null);
        setMessage(null);
        setCredentials({ email: '', password: '' });
        setView(newView);
    };
    
    const handleSocialLogin = async (provider: Provider) => {
        setIsLoading(true);
        setError(null);
        const { error: socialError } = await socialLogin(provider);
        if (socialError) {
            setError(socialError.message);
            setIsLoading(false);
        }
        // On success, Supabase handles the redirect, so the page will reload.
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setIsLoading(true);

        try {
            if (view === 'forgot-password') {
                const { error: resetError } = await sendPasswordResetEmail(credentials.email);
                if (resetError) {
                    setError(resetError.message);
                } else {
                    setMessage("If an account with that email exists, a password reset link has been sent.");
                }
            } else {
                const action = view === 'login' ? login : signup;
                const { error: authError } = await action(credentials);

                if (authError) {
                    setError(authError.message);
                } else if (view === 'signup') {
                    setMessage("Check your email for a confirmation link!");
                }
                // on success, the AuthContext will handle updating the user object and view will change
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignOut = async () => {
        setIsLoading(true);
        await signOut();
        setIsLoading(false);
    };

    const handleBack = () => {
        if (view === 'login' || view === 'signup') {
            handleViewChange('options');
        } else if (view === 'forgot-password') {
            handleViewChange('login');
        } else {
            onBack();
        }
    };

    const getTitle = () => {
        if (user) return 'My Account';
        switch (view) {
            case 'login': return 'Login';
            case 'signup': return 'Create Account';
            case 'forgot-password': return 'Reset Password';
            case 'options':
            default: return 'Account';
        }
    };

    return (
        <div className="w-full flex flex-col animate-panel">
            <header className="w-full h-10 flex items-center justify-between mb-4">
                <button onClick={handleBack} className="p-2 -m-2 rounded-full hover:bg-white/10 transition-colors" aria-label="Back">
                    <ChevronLeftIcon />
                </button>
                <h2 className="text-xl font-bold">{getTitle()}</h2>
                <div className="w-6" /> {/* Spacer */}
            </header>

            <div className="w-full bg-[var(--container-bg)] backdrop-blur-lg border border-[var(--container-border)] rounded-3xl p-4 flex flex-col">
                {user ? (
                    <div className="space-y-4">
                        <p className="text-center text-white/70 text-sm">
                            Logged in as: <br /> <strong className="text-white break-all">{user.email}</strong>
                        </p>
                        <button 
                            onClick={handleSignOut}
                            disabled={isLoading}
                            className="w-full h-12 flex items-center justify-center bg-black/25 text-white font-bold rounded-xl hover:bg-white/10 transition-colors disabled:opacity-60"
                        >
                            {isLoading ? <LoadingSpinner /> : 'Logout'}
                        </button>
                    </div>
                 ) : view === 'options' ? (
                    <div className="space-y-3">
                        <p className="text-center text-white/70 text-sm mb-4">
                            Sign in to sync your setlists and settings across devices.
                        </p>
                        <button 
                            onClick={() => handleViewChange('login')}
                            className="w-full h-12 flex items-center justify-center bg-[var(--primary-accent)] text-black font-bold rounded-xl hover:bg-[var(--primary-accent-dark)] transition-colors"
                        >
                            Login
                        </button>
                        <button 
                            onClick={() => handleViewChange('signup')}
                            className="w-full h-12 flex items-center justify-center bg-black/25 text-white font-bold rounded-xl hover:bg-white/10 transition-colors"
                        >
                            Sign Up
                        </button>
                    </div>
                ) : view === 'login' ? (
                    <form className="space-y-4" onSubmit={handleFormSubmit}>
                        <AuthInput icon={<EmailIcon />} type="email" placeholder="Email" id="login-email" name="email" disabled={isLoading} value={credentials.email} onChange={handleInputChange} />
                        <AuthInput icon={<PasswordIcon />} type="password" placeholder="Password" id="login-password" name="password" disabled={isLoading} value={credentials.password} onChange={handleInputChange} />
                        
                        {error && <p className="text-red-400 text-sm text-center !mt-3">{error}</p>}

                        <button type="submit" disabled={isLoading} className="w-full h-12 flex items-center justify-center bg-[var(--primary-accent)] text-black font-bold rounded-xl hover:bg-[var(--primary-accent-dark)] transition-colors disabled:opacity-60 disabled:cursor-wait">
                            {isLoading ? <LoadingSpinner /> : 'Login'}
                        </button>

                        <SocialLogins onSocialLogin={handleSocialLogin} disabled={isLoading} />

                        <div className="text-center text-sm">
                            <button type="button" disabled={isLoading} onClick={() => handleViewChange('forgot-password')} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50">
                                Forgot Password?
                            </button>
                        </div>
                        <div className="text-center text-sm">
                            <span className="text-white/70">No account? </span>
                            <button type="button" disabled={isLoading} onClick={() => handleViewChange('signup')} className="font-bold text-[var(--primary-accent)] hover:text-[var(--primary-accent-dark)] transition-colors disabled:opacity-50">
                                Sign Up
                            </button>
                        </div>
                    </form>
                ) : view === 'signup' ? (
                     <form className="space-y-4" onSubmit={handleFormSubmit}>
                        <AuthInput icon={<UserIcon />} type="text" placeholder="Full Name (optional)" id="signup-name" name="name" disabled={true} value="" onChange={() => {}} />
                        <AuthInput icon={<EmailIcon />} type="email" placeholder="Email" id="signup-email" name="email" disabled={isLoading} value={credentials.email} onChange={handleInputChange} />
                        <AuthInput icon={<PasswordIcon />} type="password" placeholder="Password" id="signup-password" name="password" disabled={isLoading} value={credentials.password} onChange={handleInputChange} />
                        
                        {error && <p className="text-red-400 text-sm text-center !mt-3">{error}</p>}
                        {message && <p className="text-green-400 text-sm text-center !mt-3">{message}</p>}

                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 flex items-center justify-center bg-[var(--primary-accent)] text-black font-bold rounded-xl hover:bg-[var(--primary-accent-dark)] transition-colors disabled:opacity-60 disabled:cursor-wait"
                        >
                            {isLoading ? <LoadingSpinner /> : 'Create Account'}
                        </button>

                        <SocialLogins onSocialLogin={handleSocialLogin} disabled={isLoading} />

                        <div className="text-center text-sm">
                            <span className="text-white/70">Already have an account? </span>
                            <button type="button" disabled={isLoading} onClick={() => handleViewChange('login')} className="font-bold text-[var(--primary-accent)] hover:text-[var(--primary-accent-dark)] transition-colors disabled:opacity-50">
                                Login
                            </button>
                        </div>
                    </form>
                ) : ( // forgot-password view
                    <form className="space-y-4" onSubmit={handleFormSubmit}>
                         <p className="text-center text-white/70 text-sm !mb-2">
                            Enter your email and we'll send you a link to reset your password.
                        </p>
                        <AuthInput icon={<EmailIcon />} type="email" placeholder="Email" id="reset-email" name="email" disabled={isLoading || !!message} value={credentials.email} onChange={handleInputChange} />
                        
                        {error && <p className="text-red-400 text-sm text-center !mt-3">{error}</p>}
                        {message && <p className="text-green-400 text-sm text-center !mt-3">{message}</p>}

                        <button 
                            type="submit"
                            disabled={isLoading || !!message}
                            className="w-full h-12 flex items-center justify-center bg-[var(--primary-accent)] text-black font-bold rounded-xl hover:bg-[var(--primary-accent-dark)] transition-colors disabled:opacity-60 disabled:cursor-wait"
                        >
                            {isLoading ? <LoadingSpinner /> : 'Send Reset Link'}
                        </button>

                         <div className="text-center text-sm">
                            <button type="button" disabled={isLoading} onClick={() => handleViewChange('login')} className="font-bold text-[var(--primary-accent)] hover:text-[var(--primary-accent-dark)] transition-colors disabled:opacity-50">
                                Back to Login
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AccountManager;