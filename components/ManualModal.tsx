
import React from 'react';
import { ChevronLeftIcon } from './Icons';

interface ManualModalProps {
    onClose: () => void;
}

const IllustrationWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="my-4 p-4 rounded-xl bg-black/20 flex items-center justify-center">
        {children}
    </div>
);

const IllustrationMainControls = () => (
    <svg width="240" height="120" viewBox="0 0 240 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="10" width="200" height="60" rx="12" fill="rgba(255,255,255,0.1)"/>
        <text x="120" y="48" fontFamily="monospace" fontSize="24" fill="white" textAnchor="middle">120</text>
        <path d="M25 40L20 45L25 50" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M215 40L220 45L215 50" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="10" y="80" width="100" height="20" rx="8" fill="rgba(255,255,255,0.1)"/>
        <rect x="10" y="80" width="40" height="20" rx="8" fill="var(--strong-beat-accent)"/>
        <rect x="130" y="80" width="100" height="20" rx="8" fill="rgba(255,255,255,0.1)"/>
        <rect x="130" y="80" width="60" height="20" rx="8" fill="var(--secondary-accent)"/>
    </svg>
);

const IllustrationSequencer = () => (
    <svg width="240" height="120" viewBox="0 0 240 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g>
            <circle cx="50" cy="40" r="10" fill="var(--strong-beat-accent)"/>
            <circle cx="80" cy="40" r="10" fill="rgba(255,255,255,0.1)"/>
            <circle cx="50" cy="70" r="10" fill="var(--secondary-accent)"/>
            <circle cx="80" cy="70" r="10" fill="rgba(255,255,255,0.1)"/>
        </g>
        <path d="M115 65C135 85 155 85 175 65" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M170 60L175 65L170 70" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <g>
            <rect x="150" y="30" width="60" height="12" rx="4" fill="rgba(255,255,255,0.1)"/>
            <rect x="150" y="50" width="60" height="12" rx="4" fill="rgba(255,255,255,0.1)"/>
            <rect x="150" y="70" width="40" height="12" rx="4" fill="rgba(255,255,255,0.1)"/>
        </g>
    </svg>
);

const IllustrationSetlists = () => (
    <svg width="240" height="120" viewBox="0 0 240 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="10" width="200" height="30" rx="8" fill="rgba(255,255,255,0.15)"/>
        <path d="M195 20L205 25L195 30V20Z" fill="var(--primary-accent)"/>
        <rect x="30" y="20" width="80" height="10" rx="3" fill="rgba(255,255,255,0.4)"/>
        <rect x="20" y="45" width="200" height="30" rx="8" fill="rgba(255,255,255,0.1)"/>
        <path d="M195 55L205 60L195 65V55Z" fill="white" fillOpacity="0.5"/>
        <rect x="30" y="55" width="100" height="10" rx="3" fill="rgba(255,255,255,0.3)"/>
        <rect x="20" y="80" width="200" height="30" rx="8" fill="rgba(255,255,255,0.1)"/>
        <path d="M195 90L205 95L195 100V90Z" fill="white" fillOpacity="0.5"/>
        <rect x="30" y="90" width="60" height="10" rx="3" fill="rgba(255,255,255,0.3)"/>
    </svg>
);

const IllustrationQuickSongs = () => (
    <svg width="240" height="60" viewBox="0 0 240 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="30" r="20" fill="rgba(255,255,255,0.1)"/>
        <text x="30" y="35" fontFamily="monospace" fontSize="12" fill="white" textAnchor="middle">4/4</text>
        <circle cx="90" cy="30" r="20" fill="rgba(255,255,255,0.1)"/>
        <text x="90" y="35" fontFamily="monospace" fontSize="12" fill="white" textAnchor="middle">3/4</text>
        <circle cx="150" cy="30" r="20" fill="rgba(255,255,255,0.1)"/>
        <text x="150" y="35" fontFamily="monospace" fontSize="12" fill="white" textAnchor="middle">7/8</text>
        <circle cx="210" cy="30" r="20" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="4 4"/>
        <path d="M205 30H215" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"/>
        <path d="M210 25V35" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

const IllustrationMixer = () => (
    <svg width="240" height="80" viewBox="0 0 240 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="10" width="40" height="60" rx="8" fill="rgba(255,255,255,0.1)"/>
        <rect x="20" y="30" width="40" height="40" rx="8" fill="var(--strong-beat-accent)"/>
        <rect x="80" y="10" width="40" height="60" rx="8" fill="rgba(255,255,255,0.1)"/>
        <rect x="80" y="40" width="40" height="30" rx="8" fill="var(--secondary-accent)"/>
        <rect x="140" y="10" width="40" height="60" rx="8" fill="rgba(255,255,255,0.1)"/>
        <rect x="140" y="50" width="40" height="20" rx="8" fill="var(--tertiary-accent)"/>
        <rect x="200" y="10" width="40" height="60" rx="8" fill="rgba(255,255,255,0.1)"/>
        <rect x="200" y="20" width="40" height="50" rx="8" fill="rgba(255,255,255,0.5)"/>
    </svg>
);

const ManualSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="mb-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1 pb-2 border-b border-white/10">{title}</h3>
        {children}
    </section>
);

const Em: React.FC<{children: React.ReactNode}> = ({children}) => <span className="font-bold text-[var(--primary-accent)]">{children}</span>

const ManualModal: React.FC<ManualModalProps> = ({ onClose }) => {
    return (
        <main className="flex-1 w-full overflow-y-auto animate-panel">
            <div className="w-full max-w-[380px] mx-auto flex flex-col gap-4 px-[15px] py-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)'}}>
                
                <header className="w-full h-10 flex items-center justify-between sticky top-0 bg-[var(--bg-color)]/80 backdrop-blur-sm z-10 -mt-2 pt-2">
                    <button onClick={onClose} className="p-2 -m-2 rounded-full hover:bg-white/10 transition-colors" aria-label="Back to metronome">
                        <ChevronLeftIcon />
                    </button>
                    <h2 className="text-xl font-bold">User Manual</h2>
                    <div className="w-6" /> {/* Spacer for centering title */}
                </header>

                <div className="w-full bg-[var(--container-bg)] backdrop-blur-lg border border-[var(--container-border)] rounded-3xl p-5 flex flex-col">
                    
                    <ManualSection title="Main Controls">
                        <IllustrationWrapper><IllustrationMainControls /></IllustrationWrapper>
                        <div className="space-y-3 text-white/90 text-base leading-relaxed">
                            <p><Em>BPM Control:</Em> Adjust the tempo by dragging the large central display. Use the <Em>+</Em> and <Em>-</Em> buttons for fine-tuning. <Em>Long-press</Em> the number to type a value. If enabled in settings, you can also <Em>tap the display</Em> to set the tempo.</p>
                            <p><Em>Rhythm Sliders:</Em> The two sliders below the BPM control adjust the rhythm. <Em>Beats</Em> sets the number of main beats per measure, and <Em>SUBD.</Em> sets the number of subdivisions per beat.</p>
                            <p><Em>Play/Pause:</Em> The large circular button in the center starts and stops the metronome. This button is hidden when a setlist is active; use the bottom player bar instead.</p>
                        </div>
                    </ManualSection>

                    <ManualSection title="The Sequencer">
                        <IllustrationWrapper><IllustrationSequencer /></IllustrationWrapper>
                        <div className="space-y-3 text-white/90 text-base leading-relaxed">
                            <p>The sequencer is a flippable component. The front shows a simple one-measure editor, while the back reveals the powerful multi-measure Advanced Sequencer.</p>
                            <p><Em>Simple View:</Em> Create a pattern by tapping the steps. You can switch between a classic <Em>Grid</Em> view and a circular <Em>Ring</Em> view using the toggle buttons at the bottom.</p>
                            <p><Em>Advanced View:</Em> Tap "Adv. Sequencer" to flip it over. Here you can build a full song structure.
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>Tap a measure to select it for editing. Its parameters (BPM, sounds, etc.) and step pattern will appear below.</li>
                                    <li>Use the <Em>Edit</Em> button to enter multi-select mode to delete or reorder multiple measures at once.</li>
                                    <li>Enable <Em>Count In</Em> to add a preparatory measure, and <Em>Loop</Em> to repeat the sequence.</li>
                                </ul>
                            </p>
                        </div>
                    </ManualSection>
                    
                    <ManualSection title="Setlists & Songs">
                        <IllustrationWrapper><IllustrationSetlists /></IllustrationWrapper>
                        <div className="space-y-3 text-white/90 text-base leading-relaxed">
                            <p>Organize your songs into setlists for practice or performance.</p>
                            <p><Em>Managing Setlists:</Em> From the main list, tap a setlist to view its songs. Use the <Em>Edit</Em> icon to rename, reorder, duplicate, or delete setlists.</p>
                            <p><Em>Managing Songs:</Em> Inside a setlist, tap a song to load it. The <Em>Play</Em> button next to a song will load and immediately start playback. Use the <Em>Edit</Em> icon to manage songs.</p>
                            <p><Em>Player Bar:</Em> When a setlist is active, a player bar appears at the bottom for easy navigation between the previous and next songs in the list.</p>
                            <p><Em>Unsaved Changes:</Em> If you edit a loaded song, <Em>Save</Em> and <Em>Cancel</Em> buttons will appear, allowing you to commit your changes or revert them.</p>
                        </div>
                    </ManualSection>

                    <ManualSection title="Quick Songs">
                        <IllustrationWrapper><IllustrationQuickSongs /></IllustrationWrapper>
                        <div className="space-y-3 text-white/90 text-base leading-relaxed">
                            <p>The four slots at the bottom provide instant access to your favorite settings.</p>
                            <p><Em>Short-press</Em> an existing slot to load its settings.</p>
                            <p><Em>Long-press</Em> any slot (empty or full) to save the current metronome settings to that slot. A radial progress bar will show the save progress.</p>
                        </div>
                    </ManualSection>
                    
                    <ManualSection title="Mixer & Sounds">
                        <IllustrationWrapper><IllustrationMixer /></IllustrationWrapper>
                        <div className="space-y-3 text-white/90 text-base leading-relaxed">
                            <p>Tap the <Em>Mixer</Em> and <Em>Sounds</Em> buttons to reveal panels for fine-tuning the audio.</p>
                            <p><Em>Mixer Panel:</Em> Adjust the volume of <Em>Accent</Em> beats and <Em>Subdivisions</Em>. Add a <Em>Swing</Em> feel to your rhythm, or change the <Em>Master</Em> volume.</p>
                            <p><Em>Sounds Panel:</Em> Choose different sound kits for the main Beat and the Subdivision clicks independently.</p>
                        </div>
                    </ManualSection>

                </div>
            </div>
        </main>
    );
};

export default ManualModal;
