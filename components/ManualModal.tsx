

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
import { createDemoSetlist, generateDefaultPattern } from '../utils';
import { type MetronomeSettings, type PlaylistItem, type Measure } from '../types';


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

const RhythmPlayIllustration = () => (
     <div className="w-full flex items-stretch h-[100px] gap-2.5">
      <div className="relative flex-1 flex items-center justify-center gap-2 bg-[var(--container-bg)] backdrop-blur-lg border border-[var(--container-border)] rounded-3xl px-2 h-full">
        <RhythmSlider label="Beats" value={4} min={1} max={16} onChange={()=>{}} onInteractionStateChange={()=>{}} accentColor='var(--strong-beat-accent)' />
        <RhythmSlider label="SUBD." value={4} min={1} max={16} onChange={()=>{}} onInteractionStateChange={()=>{}} accentColor='var(--secondary-accent)' />
        <RhythmSlider label="Swing" value={0} min={0} max={100} onChange={()=>{}} onInteractionStateChange={()=>{}} accentColor='var(--tertiary-accent)' />
      </div>
      <div className="flex-none w-[90px]">
        <button className="w-full h-full flex items-center justify-center bg-white/20 border border-[var(--container-border)] rounded-3xl">
          <PlayIcon />
        </button>
      </div>
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
                    
                    <ManualSection title="BPM & Tempo">
                        <IllustrationWrapper scale={0.8}>
                            <ManualComponentWrapper>
                                <div className="w-[340px]">
                                    <BpmControlIllustration />
                                </div>
                            </ManualComponentWrapper>
                        </IllustrationWrapper>
                        <div className="space-y-3 text-white/90 text-base leading-relaxed">
                            <p>Adjust the tempo by dragging the large central display. Use the <Em>+</Em> and <Em>-</Em> buttons for fine adjustments. <Em>Long-press</Em> the number to type in a value. If enabled in settings, you can also <Em>tap the display</Em> to set the tempo.</p>
                        </div>
                    </ManualSection>

                    <ManualSection title="Rhythm & Playback">
                         <IllustrationWrapper scale={0.8}>
                            <ManualComponentWrapper>
                                <div className="w-[340px]">
                                    <RhythmPlayIllustration />
                                </div>
                            </ManualComponentWrapper>
                        </IllustrationWrapper>
                         <div className="space-y-3 text-white/90 text-base leading-relaxed">
                            <p><Em>Rhythm Controls:</Em> The three circular dials adjust the rhythm. Drag up/right to increase the value, and down/left to decrease. They control the <Em>Beats</Em> per measure, <Em>Subdivisions</Em> per beat, and the amount of <Em>Swing</Em>.</p>
                            <p><Em>Play/Stop:</Em> The large button on the right starts and stops the metronome. This button is hidden when a setlist is active; use the bottom player bar instead.</p>
                        </div>
                    </ManualSection>
                    
                    <ManualSection title="The Sequencer">
                        <div className="space-y-3 text-white/90 text-base leading-relaxed">
                            <p>The sequencer is a flippable component. The front face shows a simple, single-measure editor, while the back reveals the powerful multi-measure Advanced Sequencer.</p>
                        </div>
                        
                        <h4 className="text-base font-bold text-white mt-4 mb-2">Simple View: Grid</h4>
                        <IllustrationWrapper scale={0.85}>
                           <SequencerGridViewIllustration />
                        </IllustrationWrapper>
                         <div className="space-y-3 text-white/90 text-base leading-relaxed">
                             <p>Create a pattern by tapping the steps in a classic grid layout. Use the toggle at the top left to switch views.</p>
                        </div>

                        <h4 className="text-base font-bold text-white mt-4 mb-2">Simple View: Ring</h4>
                        <IllustrationWrapper scale={0.85}>
                           <SequencerRingViewIllustration />
                        </IllustrationWrapper>
                         <div className="space-y-3 text-white/90 text-base leading-relaxed">
                            <p>The <Em>Ring</Em> view provides a circular interface, which can be more intuitive for visualizing rhythmic cycles.</p>
                        </div>

                        <h4 className="text-base font-bold text-white mt-4 mb-2">Advanced Sequencer</h4>
                        <IllustrationWrapper scale={0.85}>
                           <SequencerAdvViewIllustration />
                        </IllustrationWrapper>
                        <div className="space-y-3 text-white/90 text-base leading-relaxed">
                            <p>Tap "Adv. Sequencer" to flip it over. Here, you can build a full song structure.
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>Tap a measure to select it for editing. Its parameters (BPM, sounds, etc.) and step pattern will appear below.</li>
                                    <li>When a single measure is selected, a <Em>Dice</Em> icon appears. Tap it to generate a new random pattern for that specific measure.</li>
                                    <li>Use the <Em>Edit</Em> button to enter multi-select mode for deleting or reordering multiple measures at once.</li>
                                    <li>Enable <Em>Count In</Em> to add a preparatory measure, and <Em>Loop</Em> to repeat the sequence.</li>
                                </ul>
                            </p>
                        </div>
                    </ManualSection>
                    
                    <ManualSection title="Setlists & Songs">
                        <IllustrationWrapper scale={0.85}>
                             <ManualComponentWrapper>
                                <div className="w-[340px]">
                                    <SetlistsIllustration />
                                </div>
                            </ManualComponentWrapper>
                        </IllustrationWrapper>
                        <div className="space-y-3 text-white/90 text-base leading-relaxed">
                            <p>Organize your songs into lists for practice or performance.</p>
                            <p><Em>Manage Lists:</Em> From the main list view, tap a setlist to view its songs. Use the <Em>Edit</Em> icon to rename, reorder, duplicate, or delete setlists.</p>
                            <p><Em>Manage Songs:</Em> Inside a setlist, tap a song to load it. The <Em>Play</Em> button next to a song will load it and immediately start playback. Use the <Em>Edit</Em> icon to manage songs.</p>
                            <p><Em>Player Bar:</Em> When a setlist is active, a player bar appears at the bottom for easy navigation to the previous and next songs in the list.</p>
                            <p><Em>Unsaved Changes:</Em> If you edit a loaded song, <Em>Save</Em> and <Em>Cancel</Em> buttons will appear, allowing you to commit your changes or revert them.</p>
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
                            <p>The bottom bar provides instant access to your favorite settings and creative tools.</p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li><Em>Main Slots:</Em> <Em>Short-tap</Em> an existing slot to load its settings. <Em>Long-press</Em> any slot (empty or full) to save the current metronome settings. A radial progress bar will show the save progress.</li>
                                <li><Em>Reset:</Em> The <Em>Home</Em> icon on the far left resets the metronome to its default state.</li>
                                <li><Em>Randomize:</Em> The <Em>Dice</Em> icon on the far right generates a completely new, random groove, including the time signature and pattern.</li>
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
                        <IllustrationWrapper scale={0.9}>
                            <ManualComponentWrapper>
                                <div className="w-[300px] p-4">
                                    <SoundsIllustration />
                                </div>
                            </ManualComponentWrapper>
                        </IllustrationWrapper>
                        <div className="space-y-3 text-white/90 text-base leading-relaxed">
                            <p>Tap the <Em>Mixer</Em> and <Em>Sounds</Em> buttons to reveal panels for adjusting the audio.</p>
                            <p><Em>Mixer Panel:</Em> Adjust the volume for <Em>Accent</Em> beats, <Em>Subdivisions</Em>, and the overall <Em>Master</Em> volume.</p>
                            <p><Em>Sounds Panel:</Em> Choose different sound kits for the main Beat and Subdivision clicks independently.</p>
                        </div>
                    </ManualSection>

                    <ManualSection title="Account & Syncing">
                        <IllustrationWrapper scale={0.85}>
                           <ManualComponentWrapper>
                                <div className="w-[340px]">
                                    <AccountIllustration />
                                </div>
                            </ManualComponentWrapper>
                        </IllustrationWrapper>
                        <div className="space-y-3 text-white/90 text-base leading-relaxed">
                            <p>Create a free account to back up and sync your setlists and settings across all your devices. Access your account from the <Em>Settings</Em> page.</p>
                        </div>
                    </ManualSection>

                </div>
            </div>
        </main>
    );
};

export default ManualModal;