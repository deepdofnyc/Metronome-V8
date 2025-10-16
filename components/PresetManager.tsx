import React, { useState } from 'react';
import { ChevronLeftIcon, UserIcon, EmailIcon, PasswordIcon } from './Icons';

// A styled input component for reuse in login/signup forms
const AuthInput: React.FC<{ icon: React.ReactNode; type: string; placeholder: string; id: string; name: string; disabled?: boolean; }> = ({ icon, ...props }) => (
    <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white/40">
            {icon}
        </span>
        <input
            {...props}
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


interface AccountManagerProps {
    onBack: () => void;
}

const AccountManager: React.FC<AccountManagerProps> = ({ onBack }) => {
    const [view, setView] = useState<'options' | 'login' | 'signup'>('options');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleViewChange = (newView: 'options' | 'login' | 'signup') => {
        setError(null); // Clear errors when switching views
        setView(newView);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        // Placeholder for future authentication logic.
        // We'll simulate a network request with a timeout.
        setTimeout(() => {
            if (view === 'login') {
                setError("Invalid email or password. Please try again.");
            } else {
                setError("An account with this email already exists.");
            }
            setIsLoading(false);
        }, 1500);
    };

    const handleBack = () => {
        if (view === 'login' || view === 'signup') {
            handleViewChange('options');
        } else {
            onBack();
        }
    };

    const getTitle = () => {
        switch (view) {
            case 'login': return 'Login';
            case 'signup': return 'Create Account';
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
                {view === 'options' && (
                    <div className="space-y-3">
                        <p className="text-center text-white/70 text-sm mb-4">
                            Sign in to sync your setlists and settings across devices.
                        </p>
                        <button 
                            onClick={() => handleViewChange('login')}
                            className="w-full py-3 bg-[var(--primary-accent)] text-black font-bold rounded-xl hover:bg-[var(--primary-accent-dark)] transition-colors"
                        >
                            Login
                        </button>
                        <button 
                            onClick={() => handleViewChange('signup')}
                            className="w-full py-3 bg-black/25 text-white font-bold rounded-xl hover:bg-white/10 transition-colors"
                        >
                            Sign Up
                        </button>
                    </div>
                )}

                {view === 'login' && (
                    <form className="space-y-4" onSubmit={handleFormSubmit}>
                        <AuthInput icon={<EmailIcon />} type="email" placeholder="Email" id="login-email" name="email" disabled={isLoading} />
                        <AuthInput icon={<PasswordIcon />} type="password" placeholder="Password" id="login-password" name="password" disabled={isLoading} />
                        
                        {error && <p className="text-red-400 text-sm text-center !mt-3">{error}</p>}

                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 flex items-center justify-center bg-[var(--primary-accent)] text-black font-bold rounded-xl hover:bg-[var(--primary-accent-dark)] transition-colors disabled:opacity-60 disabled:cursor-wait"
                        >
                            {isLoading ? <LoadingSpinner /> : 'Login'}
                        </button>

                        <div className="text-center text-sm">
                            <button type="button" disabled={isLoading} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50">
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
                )}
                
                {view === 'signup' && (
                     <form className="space-y-4" onSubmit={handleFormSubmit}>
                        <AuthInput icon={<UserIcon />} type="text" placeholder="Full Name" id="signup-name" name="name" disabled={isLoading} />
                        <AuthInput icon={<EmailIcon />} type="email" placeholder="Email" id="signup-email" name="email" disabled={isLoading} />
                        <AuthInput icon={<PasswordIcon />} type="password" placeholder="Password" id="signup-password" name="password" disabled={isLoading} />
                        
                        {error && <p className="text-red-400 text-sm text-center !mt-3">{error}</p>}

                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 flex items-center justify-center bg-[var(--primary-accent)] text-black font-bold rounded-xl hover:bg-[var(--primary-accent-dark)] transition-colors disabled:opacity-60 disabled:cursor-wait"
                        >
                            {isLoading ? <LoadingSpinner /> : 'Create Account'}
                        </button>

                        <div className="text-center text-sm">
                            <span className="text-white/70">Already have an account? </span>
                            <button type="button" disabled={isLoading} onClick={() => handleViewChange('login')} className="font-bold text-[var(--primary-accent)] hover:text-[var(--primary-accent-dark)] transition-colors disabled:opacity-50">
                                Login
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AccountManager;