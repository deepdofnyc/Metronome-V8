
import React, { useMemo, type ReactNode } from 'react';
import { ChevronLeftIcon, PlayIcon } from './Icons';
// FIX: Import `useMetronome` to resolve 'Cannot find name' errors.
import { MetronomeProvider, useMetronome } from '../contexts/MetronomeContext';
import { AuthProvider } from '../contexts/AuthContext';

// Import actual components for illustrations
import BpmControl from './HorizontalBpmSlider';
import RhythmSlider from './RhythmSlider';
import Sequencer from './Sequencer';
import SetlistManager from './SetlistManager';
import QuickSongBar from './QuickSongBar';
import Knob from './Knob';
import AccountManager from './AccountManager';
import SoundSelector from './SoundSelector';

// Import utilities to create mock data
import { createDemoSetlist, generateDefaultPattern } from '../utils/utils';
import { type MetronomeSettings, type PlaylistItem, type Measure } from '../types/types';


// A self-contained mock context provider to render components in isolation.
// This is a simplified version of the StorybookWrapper.
const ManualComponentWrapper: React.FC<{
    children: ReactNode;
    mods?: Partial<ReturnType<typeof useMetronome>>;
}> = ({ children, mods }) => {
    const setlists = useMemo(() => createDemoSetlist(), []);

    const value = useMemo(() => {
        const baseSettings: MetronomeSettings = {
            bpm: 120, beatSoundId: 'classic', subdivisionSoundId: 'classic', accentVolume: 0.75,
            beatVolume: 0.5, masterVolume: 0.7, swing: 0,
            measureSequence: [{ id: 'm-manual-1', beats: 4, subdivisions: 4, pattern: generateDefaultPattern(4, 4) }],
            countIn: false, loop: true, isAdvanced: false, simpleView: 'grid',
        };

        const mockContext: any = {
            settings: baseSettings,
            settingsForDisplay: baseSettings,
            measureForDisplay: baseSettings.measureSequence[0],
            simpleViewMeasure: baseSettings.measureSequence[0],
            isPlaying: false, isAdvSequencerActive: false, isDirty: false,
            loadedSongInfo: null, loadedQuickSongIndex: null, currentlyPlayingId: null,
            setlists: setlists, newlyAddedItemId: null,
            quickSongs: [setlists[0].songs[0], setlists[0].songs[1], null],
            isRhythmSliderActive: false, isKnobActive: false, isBpmSliderDragging: false,
            pressingSlots: new Set(), beatTrigger: 0, currentStep: -1, stepInMeasure: -1,
            playingMeasureIndex: -1, stepInPlayingMeasure: -1, selectedMeasureIndices: [],
            activeSetlist: null, currentSongIndex: -1, canGoPrevSong: false,
            canGoNextSong: false, playingSetlistId: null,
            setlistActions: {}, togglePlay: () => {}, setIsRhythmSliderActive: () => {},
            setIsKnobActive: () => {}, setIsBpmSliderDragging: () => {}, handleSimpleRhythmChange: () => {},
            handlePatternChange: () => {}, handleFlip: () => {}, handleLoadQuickSong: () => {},
            handleSaveQuickSong: () => {}, handleQuickSongPressingChange: () => {}, handleRandomize: () => {},
            handleResetToDefault: () => {}, handleLoadSong: () => {}, handleLoadAndPlay: () => {},
            handleStop: () => {}, onRenameTriggered: () => {}, handleCancelChanges: () => {},
            handlePrevSong: () => {}, handleNextSong: () => {}, handleMeasureSequenceChange: () => {},
            handleDuplicateMeasure: () => {}, onSetSelectedMeasureIndices: () => {}, handleCountInChange: () => {},
            updateSetting: () => {}, handleLoopChange: () => {}, handleRandomizeSelectedMeasures: () => {},
            addDemoSetlist: () => {},
        };
        return { ...mockContext, ...mods };
    }, [mods, setlists]);

    return (
        <AuthProvider>
            <MetronomeProvider value={value}>
                {children}
            </MetronomeProvider>
        </AuthProvider>
    );
};

// --- Component-based Illustrations ---

const BpmControlIllustration = () => (
    <BpmControl showTapButton={true} showSlider={true} min={40} max={340} />
);

const RhythmControlsIllustration = () => (
     <div className="w-full flex items-stretch h-[100px]">
      <div className="relative flex-1 flex items-center justify-center gap-2 bg-[var(--container-bg)] backdrop-blur-lg border border-[var(--container-border)] rounded-3xl px-2 h-full">
        <RhythmSlider label="Beats" value={4} min={1} max={16} onChange={()=>{}} onInteractionStateChange={()=>{}} accentColor='var(--strong-beat-accent)' />
        <RhythmSlider label="SUBD." value={4} min={1} max={16} onChange={()=>{}} onInteractionStateChange={()=>{}} accentColor='var(--secondary-accent)' />
        <RhythmSlider label="Swing" value={0} min={0} max={100} onChange={()=>{}} onInteractionStateChange={()=>{}} accentColor='var(--tertiary-accent)' />
      </div>
    </div>
);

const PlayStopIllustration = () => (
    <div className="w-[90px] h-[100px]">
        <button className="w-full h-full flex items-center justify-center bg-white/20 border border-[var(--container-border)] rounded-3xl">
            <PlayIcon />
        </button>
    </div>
);

const SequencerGridViewIllustration = () => {
    const mods = useMemo(() => {
        const settings: MetronomeSettings = {
            bpm: 120, beatSoundId: 'classic', subdivisionSoundId: 'classic', accentVolume: 0.75,
            beatVolume: 0.5, masterVolume: 0.7, swing: 0,
            measureSequence: [{ id: 'm-manual-grid', beats: 4, subdivisions: 2, pattern: [3, 1, 2, 1, 3, 1, 2, 1] }],
            countIn: false, loop: true, isAdvanced: false, simpleView: 'grid',
        };
        return { settings: settings, simpleViewMeasure: settings.measureSequence[0] };
    }, []);
    return (
        <ManualComponentWrapper mods={mods}>
            <div className="w-[340px]">
                <Sequencer isFlipped={false} onFlip={()=>{}} isEditMode={false} onEditModeChange={()=>{}} />
            </div>
        </ManualComponentWrapper>
    );
};

const SequencerRingViewIllustration = () => {
    const mods = useMemo(() => {
        const settings: MetronomeSettings = {
            bpm: 120, beatSoundId: 'classic', subdivisionSoundId: 'classic', accentVolume: 0.75,
            beatVolume: 0.5, masterVolume: 0.7, swing: 0,
            measureSequence: [{ id: 'm-manual-ring', beats: 3, subdivisions: 3, pattern: [3, 1, 1, 2, 1, 1, 2, 1, 1] }],
            countIn: false, loop: true, isAdvanced: false, simpleView: 'rings',
        };
        return { settings: settings, simpleViewMeasure: settings.measureSequence[0] };
    }, []);
    return (
        <ManualComponentWrapper mods={mods}>
            <div className="w-[340px]">
                <Sequencer isFlipped={false} onFlip={()=>{}} isEditMode={false} onEditModeChange={()=>{}} />
            </div>
        </ManualComponentWrapper>
    );
};

const SequencerAdvViewIllustration = () => {
    const mods = useMemo(() => {
        const measureSequence: Measure[] = [
            // Count-in
            { id: 'm-adv-cin', beats: 4, subdivisions: 1, pattern: generateDefaultPattern(4, 1) },
            // Verse 1
            { id: 'm-adv-m1', beats: 4, subdivisions: 2, pattern: [3, 1, 2, 1, 3, 1, 2, 1] },
            // Verse 2
            { id: 'm-adv-m2', beats: 4, subdivisions: 2, pattern: [3, 1, 2, 1, 3, 1, 2, 1] },
            // Chorus 1
            { id: 'm-adv-m3', beats: 4, subdivisions: 4, pattern: generateDefaultPattern(4, 4) },
            // Chorus 2
            { id: 'm-adv-m4', beats: 4, subdivisions: 4, pattern: generateDefaultPattern(4, 4) },
        ];
        const settings: MetronomeSettings = {
            bpm: 120, beatSoundId: 'classic', subdivisionSoundId: 'classic', accentVolume: 0.75,
            beatVolume: 0.5, masterVolume: 0.7, swing: 0,
            measureSequence: measureSequence,
            countIn: true, loop: true, isAdvanced: true, simpleView: 'grid',
        };
        return { 
            settings: settings,
            isAdvSequencerActive: true,
            selectedMeasureIndices: [1] // Select the first "real" measure
        };
    }, []);

    return (
        <ManualComponentWrapper mods={mods}>
            <div className="w-[340px]">
                <Sequencer isFlipped={true} onFlip={()=>{}} isEditMode={false} onEditModeChange={()=>{}} />
            </div>
        </ManualComponentWrapper>
    );
};


const SetlistsIllustration = () => {
    const { setlists } = useMetronome();
    return <SetlistManager isContainerOpen={true} onToggleVisibility={() => {}} onActiveSetlistChange={() => {}} initialActiveSetlistId={setlists[0].id} />
}

const QuickSongsIllustration = () => <QuickSongBar />;

const MixerIllustration = () => (
    <div className="w-full flex flex-col gap-4">
        <Knob label="Accent" value={0.75} onChange={()=>{}} color="var(--strong-beat-accent)" />
        <Knob label="Subdivision" value={0.5} onChange={()=>{}} color="var(--secondary-accent)" />
        <Knob label="Master" value={0.8} onChange={()=>{}} color="var(--text-primary)" />
    </div>
);

const SoundsIllustration = () => (
    <SoundSelector />
);

const AccountIllustration = () => <AccountManager onBack={() => {}} />;

// --- Main Manual Component ---

interface ManualModalProps {
    onClose: () => void;
}

const IllustrationWrapper: React.FC<{ children: React.ReactNode, scale?: number }> = ({ children, scale = 0.9 }) => (
    <div className="my-4 p-4 rounded-xl bg-black/20 flex items-center justify-center overflow-hidden">
        <div className="pointer-events-none" style={{ transform: `scale(${scale})` }}>
            {children}
        </div>
    </div>
);

const ManualSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="mb-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--primary-accent)] mb-2 p-2 rounded-lg bg-white/5">{title}</h3>
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
                    
                    <ManualSection title="Tempo Editor (BPM)">
                        <IllustrationWrapper scale={0.8}>
                            <ManualComponentWrapper>
                                <div className="w-[340px]">
                                    <BpmControlIllustration />
                                </div>
                            </ManualComponentWrapper>
                        </IllustrationWrapper>
                        <div className="space-y-3 text-white/90 text-base leading-relaxed">
                            <p>At the top of the interface, you’ll find the Tempo Editor, which combines several ways to control the BPM:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Drag the <Em>slider</Em> to change the tempo smoothly.</li>
                                <li>Use the <Em>+</Em> and <Em>–</Em> buttons for fine adjustments.</li>
                                <li><Em>Long-press</Em> the BPM number to type an exact value.</li>
                                <li>You can also tap the number multiple times to use the <Em>tap-tempo</Em> feature (if enabled in Settings).</li>
                            </ul>
                        </div>
                    </ManualSection>

                    <ManualSection title="Rhythm Controls">
                         <IllustrationWrapper scale={0.8}>
                            <ManualComponentWrapper>
                                <div className="w-[300px]">
                                    <RhythmControlsIllustration />
                                </div>
                            </ManualComponentWrapper>
                        </IllustrationWrapper>
                         <div className="space-y-3 text-white/90 text-base leading-relaxed">
                            <p>The three circular dials define your rhythm setup:</p>
                             <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li><Em>Beats:</Em> horizontal steps in the sequencer.</li>
                                <li><Em>Subdivisions:</Em> vertical divisions inside each beat.</li>
                                <li><Em>Swing:</Em> adds a shuffle feel to the rhythm.</li>
                            </ul>
                            <p>Slide up/right to increase values, down/left to decrease.</p>
                        </div>
                    </ManualSection>
                    
                    <ManualSection title="Play/Stop Button">
                        <IllustrationWrapper scale={0.8}>
                            <PlayStopIllustration />
                        </IllustrationWrapper>
                        <div className="space-y-3 text-white/90 text-base leading-relaxed">
                            <p>This button starts and stops the metronome with a single tap.</p>
                            <p>When a Setlist is active, this button is hidden and replaced by the bottom playback bar.</p>
                        </div>
                    </ManualSection>

                    <ManualSection title="Standard Sequencer">
                        <div className="space-y-3 text-white/90 text-base leading-relaxed">
                            <p>This section lets you create rhythm patterns and view them in two modes:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li><Em>Grid View:</Em> classic step-by-step horizontal layout.</li>
                                <li><Em>Ring View:</Em> circular visualization of the rhythm cycle.</li>
                            </ul>
                             <IllustrationWrapper scale={0.85}>
                               <SequencerGridViewIllustration />
                            </IllustrationWrapper>
                             <IllustrationWrapper scale={0.85}>
                               <SequencerRingViewIllustration />
                            </IllustrationWrapper>
                            <p>Both views display the same pattern—only the layout changes.</p>
                            <p>Each step in the sequencer has one of four color-coded states:</p>
                             <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li><span className="font-bold" style={{color: 'var(--strong-beat-accent)'}}>🟧 Orange:</span> strong accent.</li>
                                <li><span className="font-bold" style={{color: 'var(--primary-accent)'}}>🟩 Green:</span> regular beat.</li>
                                <li><span className="font-bold" style={{color: 'var(--secondary-accent)'}}>🟪 Purple:</span> subdivision.</li>
                                <li><span className="font-bold text-gray-400">⚪ Gray:</span> muted (no sound).</li>
                            </ul>
                            <p>Tap any step to cycle through its states. Volumes for each type can be customized in the Mixer.</p>
                        </div>
                    </ManualSection>
                    
                    <ManualSection title="Advanced Sequencer">
                        <IllustrationWrapper scale={0.85}>
                           <SequencerAdvViewIllustration />
                        </IllustrationWrapper>
                        <div className="space-y-3 text-white/90 text-base leading-relaxed">
                            <p>This mode lets you create a sequence of multiple measures, each with its own pattern.</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Tap the <Em>“Advanced Seq.”</Em> button to activate.</li>
                                <li>Each measure appears as a circle—tap to edit.</li>
                                <li>You can adjust beats, subdivisions, swing, and the step pattern.</li>
                                <li>Enable <Em>Loop</Em> to repeat the full sequence.</li>
                                <li>Enable <Em>Count In</Em> to add a preparatory measure.</li>
                                <li>Use <Em>Edit</Em> to remove, duplicate, or reorder multiple measures.</li>
                                <li>Tap the <Em>🎲 “Dice”</Em> to randomize a selected measure.</li>
                            </ul>
                        </div>
                    </ManualSection>

                    <ManualSection title="Quick Songs">
                        <IllustrationWrapper scale={0.85}>
                            <ManualComponentWrapper>
                                <div className="w-[340px] bg-[var(--container-bg)] p-4 rounded-3xl">
                                    <QuickSongsIllustration />
                                </div>
                            </ManualComponentWrapper>
                        </IllustrationWrapper>
                        <div className="space-y-3 text-white/90 text-base leading-relaxed">
                            <p>Located at the bottom of the sequencer, these slots let you save and instantly recall your favorite presets.</p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li><Em>Long-press</Em> to save the current configuration.</li>
                                <li><Em>Tap</Em> a slot to load.</li>
                                <li>The <Em>🏠 “Home”</Em> icon resets the pattern to default.</li>
                                <li>The <Em>🎲 “Dice”</Em> icon generates a random rhythm (time signature and pattern).</li>
                            </ul>
                            <p>Up to 3 quick presets can be stored.</p>
                        </div>
                    </ManualSection>

                    <ManualSection title="Setlists">
                        <IllustrationWrapper scale={0.85}>
                             <ManualComponentWrapper>
                                <div className="w-[340px]">
                                    <SetlistsIllustration />
                                </div>
                            </ManualComponentWrapper>
                        </IllustrationWrapper>
                        <div className="space-y-3 text-white/90 text-base leading-relaxed">
                            <p>Group multiple patterns into named lists for practice or performance.</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Tap a list to open its songs.</li>
                                <li>Use <Em>Edit</Em> to rename, duplicate, or reorder lists or songs.</li>
                                <li>When a song is loaded, a playback bar appears at the bottom.</li>
                                <li>If changes are made to a loaded song, <Em>Save</Em> and <Em>Cancel</Em> buttons will appear.</li>
                            </ul>
                        </div>
                    </ManualSection>
                    
                    <ManualSection title="Mixer & Sounds">
                        <IllustrationWrapper scale={0.9}>
                            <ManualComponentWrapper>
                                <div className="w-[300px] p-4">
                                    <MixerIllustration />
                                </div>
                            </ManualComponentWrapper>
                        </IllustrationWrapper>
                        <div className="space-y-3 text-white/90 text-base leading-relaxed">
                             <p><Em>Mixer:</Em> Adjust volume levels for accented beats, subdivisions, and the master volume.</p>
                        </div>
                        <IllustrationWrapper scale={0.9}>
                            <ManualComponentWrapper>
                                <div className="w-[300px] p-4">
                                    <SoundsIllustration />
                                </div>
                            </ManualComponentWrapper>
                        </IllustrationWrapper>
                        <div className="space-y-3 text-white/90 text-base leading-relaxed">
                            <p><Em>Sounds:</Em> Choose from 3 kits for beats and 3 for subdivisions—independently.</p>
                            <p>This allows full customization of the metronome’s sound.</p>
                        </div>
                    </ManualSection>

                    <ManualSection title="Settings & Personalization">
                        <div className="space-y-3 text-white/90 text-base leading-relaxed">
                            <p>In the Settings menu, you can:</p>
                             <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Log in with Google or Apple.</li>
                                <li>Hide interface components (Quick Songs, Setlists, Tap Tempo, etc.) for a cleaner layout.</li>
                                <li>Set custom minimum and maximum BPM values.</li>
                                <li>Re-download the demo setlist.</li>
                                <li>Access tutorials and this manual.</li>
                                <li>Use the <Em>Danger Zone</Em> to reset the app to its default state.</li>
                            </ul>
                            <p>You can also enable tap-tempo, cloud sync, and account management features.</p>
                        </div>
                    </ManualSection>

                    <ManualSection title="Account & Sync">
                        <IllustrationWrapper scale={0.85}>
                           <ManualComponentWrapper>
                                <div className="w-[340px]">
                                    <AccountIllustration />
                                </div>
                            </ManualComponentWrapper>
                        </IllustrationWrapper>
                        <div className="space-y-3 text-white/90 text-base leading-relaxed">
                            <p>Create a free account to back up and sync your lists and configurations across all your devices.</p>
                        </div>
                    </ManualSection>

                </div>
            </div>
        </main>
    );
};

export default ManualModal;
