import React, { useState } from 'react';
import { type AppSettings } from '../hooks/hooks';
import { ChevronLeftIcon } from './Icons';
import { MIN_BPM, MAX_BPM } from '../constants/constants';
import SettingsSlider from './SettingsSlider';
import AccountManager from './AccountManager';

interface ToggleSwitchProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, checked, onChange, disabled = false }) => {
    return (
        <label className={`flex items-center justify-between cursor-pointer w-full py-3 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <span className="text-base text-white/90">{label}</span>
            <div className="relative">
                <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={checked} 
                    onChange={e => onChange(e.target.checked)}
                    disabled={disabled} 
                />
                <div className={`block w-14 h-8 rounded-full transition-colors ${checked ? 'bg-[var(--primary-accent)]' : 'bg-black/25'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${checked ? 'transform translate-x-6' : ''}`}></div>
            </div>
        </label>
    );
};


interface SettingsPageProps {
    onClose: () => void;
    settings: AppSettings;
    updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
    factoryReset: () => void;
    addDemoSetlist: () => void;
    onOpenManual: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onClose, settings, updateSetting, factoryReset, addDemoSetlist, onOpenManual }) => {
    const [page, setPage] = useState<'main' | 'account'>('main');

    const handleBpmRangeChange = (key: 'minBpm' | 'maxBpm', value: number) => {
        if (key === 'minBpm') {
            updateSetting('minBpm', Math.min(value, settings.maxBpm - 1));
        } else { // key === 'maxBpm'
            updateSetting('maxBpm', Math.max(value, settings.minBpm + 1));
        }
    };

    return (
        <main className="flex-1 w-full overflow-y-auto animate-panel">
            <div className="w-full max-w-[380px] mx-auto flex flex-col gap-4 px-[15px] py-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)'}}>
                
                {page === 'main' ? (
                    <>
                        <header className="w-full h-10 flex items-center justify-between">
                            <button onClick={onClose} className="p-2 -m-2 rounded-full hover:bg-white/10 transition-colors" aria-label="Back to metronome">
                                <ChevronLeftIcon />
                            </button>
                            <h2 className="text-xl font-bold">Settings</h2>
                            <div className="w-6" /> {/* Spacer for centering title */}
                        </header>

                        <div className="w-full bg-[var(--container-bg)] backdrop-blur-lg border border-[var(--container-border)] rounded-3xl p-4 flex flex-col">
                            <div className="space-y-4">
                                <section>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Account</h3>
                                    <div className="flex flex-col gap-2">
                                        <button onClick={() => setPage('account')} className="w-full text-left bg-black/20 hover:bg-white/10 transition-colors p-3 rounded-xl">My Account</button>
                                    </div>
                                </section>

                                <div className="w-full h-px bg-white/10"></div>

                                <section>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Display Components</h3>
                                    <ToggleSwitch label="BPM Slider Control" checked={settings.showBpmControl} onChange={(v) => updateSetting('showBpmControl', v)} />
                                    <ToggleSwitch label="Tap Tempo Tool" checked={settings.showTapButton} onChange={(v) => updateSetting('showTapButton', v)} />
                                    <ToggleSwitch label="Setlists" checked={settings.showSetlists} onChange={(v) => updateSetting('showSetlists', v)} />
                                    <ToggleSwitch label="Sequencer" checked={settings.showSequencer} onChange={(v) => updateSetting('showSequencer', v)} />
                                    <ToggleSwitch label="Quick Songs" checked={settings.showQuickSongs} onChange={(v) => updateSetting('showQuickSongs', v)} />
                                </section>

                                <div className="w-full h-px bg-white/10"></div>

                                <section>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">BPM Range Editor</h3>
                                    <div className="flex items-center gap-4 pt-2">
                                        <SettingsSlider
                                            label="Min BPM"
                                            value={settings.minBpm}
                                            min={MIN_BPM}
                                            max={MAX_BPM}
                                            onChange={(v) => handleBpmRangeChange('minBpm', v)}
                                            color="var(--secondary-accent)"
                                        />
                                        <SettingsSlider
                                            label="Max BPM"
                                            value={settings.maxBpm}
                                            min={MIN_BPM}
                                            max={MAX_BPM}
                                            onChange={(v) => handleBpmRangeChange('maxBpm', v)}
                                            color="var(--tertiary-accent)"
                                        />
                                    </div>
                                </section>

                                <div className="w-full h-px bg-white/10"></div>
                                
                                <section>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Help</h3>
                                    <div className="flex flex-col gap-2">
                                        <a href="https://www.deepdof.com" target="_blank" rel="noopener noreferrer" className="w-full text-left bg-black/20 hover:bg-white/10 transition-colors p-3 rounded-xl">Tutorials</a>
                                        <button 
                                            onClick={onOpenManual}
                                            className="w-full text-left bg-black/20 hover:bg-white/10 transition-colors p-3 rounded-xl"
                                        >
                                            Manual
                                        </button>
                                        <button 
                                            onClick={addDemoSetlist}
                                            className="w-full text-left bg-black/20 hover:bg-white/10 transition-colors p-3 rounded-xl"
                                        >
                                            Setlist Demo | Download
                                        </button>
                                    </div>
                                </section>

                                <div className="w-full h-px bg-white/10"></div>
                                
                                <section>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-red-400 mb-2">Danger Zone</h3>
                                    <p className="text-sm text-white/70 mb-3">Reset the application to its original state. This action is irreversible and will delete all your data.</p>
                                    <button 
                                        onClick={factoryReset}
                                        className="w-full text-center bg-black/20 border border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-500/80 hover:text-red-300 transition-colors p-3 rounded-xl font-bold"
                                    >
                                        Factory Reset
                                    </button>
                                </section>
                            </div>
                        </div>
                    </>
                ) : (
                    <AccountManager onBack={() => setPage('main')} />
                )}
            </div>
        </main>
    );
};

export default SettingsPage;