import React, { useState, useMemo, type ReactNode } from 'react';
import { MetronomeProvider, useMetronome } from '../contexts/MetronomeContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { createDemoSetlist, generateDefaultPattern } from '../utils';
import { type MetronomeSettings, type PlaylistItem, type Setlist, type Measure } from '../types';

// Import all components to be displayed
import Knob from './Knob';
import BpmControl from './HorizontalBpmSlider';
import RhythmSlider from './RhythmSlider';
import Sequencer from './Sequencer';
import SoundSelector from './SoundSelector';
import QuickSongBar from './QuickSongBar';
import SetlistManager from './SetlistManager';
import SetlistPlayer from './SetlistPlayer';
import SettingsModal from './SettingsModal';
import FeedbackModal from './FeedbackModal';
import ManualModal from './ManualModal';
import AccountManager from './AccountManager';
import AddToHomeScreenPrompt from './AddToHomeScreenPrompt';
import { useAppSettings } from '../hooks';

// --- Storybook Wrapper ---
// Provides a mock context for all components so they can render without crashing.
const StorybookWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<MetronomeSettings>({
        bpm: 120, beatSoundId: 'classic', subdivisionSoundId: 'classic', accentVolume: 0.75,
        beatVolume: 0.5, masterVolume: 0.7, swing: 0,
        measureSequence: [{ id: 'm-1', beats: 4, subdivisions: 4, pattern: generateDefaultPattern(4, 4) }],
        countIn: false, loop: true, isAdvanced: false, simpleView: 'grid',
    });
    const [isPlaying, setIsPlaying] = useState(false);
    const [isAdvSequencerActive, setIsAdvSequencerActive] = useState(false);
    const [beatTrigger, setBeatTrigger] = useState(0);
    const [setlists, setSetlists] = useState(createDemoSetlist());
    const [quickSongs, setQuickSongs] = useState<(PlaylistItem | null)[]>([setlists[0].songs[0], setlists[0].songs[1], null]);
    const [loadedSongInfo, setLoadedSongInfo] = useState<{ setlistId: string, songId: string } | null>({ setlistId: setlists[0].id, songId: setlists[0].songs[0].id });

    // Simulate beat trigger for animations
    React.useEffect(() => {
        if (isPlaying) {
            const interval = setInterval(() => setBeatTrigger(t => t + 1), 60000 / settings.bpm);
            return () => clearInterval(interval);
        }
    }, [isPlaying, settings.bpm]);

    const mockContextValue = useMemo(() => ({
        settings,
        settingsForDisplay: settings,
        measureForDisplay: settings.measureSequence[0],
        simpleViewMeasure: settings.measureSequence[0],
        isPlaying,
        isAdvSequencerActive,
        isDirty: false,
        loadedSongInfo,
        loadedQuickSongIndex: null,
        currentlyPlayingId: isPlaying ? loadedSongInfo?.songId : null,
        setlists,
        newlyAddedItemId: null,
        quickSongs,
        isRhythmSliderActive: false,
        isKnobActive: false,
        isBpmSliderDragging: false,
        pressingSlots: new Set<number>(),
        beatTrigger,
        currentStep: -1,
        stepInMeasure: -1,
        playingMeasureIndex: -1,
        stepInPlayingMeasure: -1,
        selectedMeasureIndices: [],
        activeSetlist: loadedSongInfo ? setlists.find(s => s.id === loadedSongInfo.setlistId) ?? null : null,
        currentSongIndex: loadedSongInfo ? setlists.find(s => s.id === loadedSongInfo!.setlistId)?.songs.findIndex(s => s.id === loadedSongInfo!.songId) ?? -1 : -1,
        canGoPrevSong: true,
        canGoNextSong: true,
        playingSetlistId: isPlaying ? loadedSongInfo?.setlistId : null,
        setlistActions: {
            saveChanges: () => console.log('Storybook: saveChanges'),
            cancelChanges: () => console.log('Storybook: cancelChanges'),
            addNewSetlist: () => console.log('Storybook: addNewSetlist'),
            addNewSong: () => console.log('Storybook: addNewSong'),
            updateSetlistName: () => console.log('Storybook: updateSetlistName'),
            updateSongName: () => console.log('Storybook: updateSongName'),
            deleteSetlist: () => console.log('Storybook: deleteSetlist'),
            deleteSong: () => console.log('Storybook: deleteSong'),
            duplicateSetlist: () => console.log('Storybook: duplicateSetlist'),
            duplicateSong: () => console.log('Storybook: duplicateSong'),
            reorderSetlists: () => console.log('Storybook: reorderSetlists'),
            reorderSongs: () => console.log('Storybook: reorderSongs'),
        },
        togglePlay: () => setIsPlaying(p => !p),
        setIsRhythmSliderActive: () => {},
        setIsKnobActive: () => {},
        setIsBpmSliderDragging: () => {},
        handleSimpleRhythmChange: (prop, value) => setSettings(s => ({ ...s, measureSequence: [{ ...s.measureSequence[0], [prop]: value, pattern: generateDefaultPattern(prop === 'beats' ? value : s.measureSequence[0].beats, prop === 'subdivisions' ? value : s.measureSequence[0].subdivisions) }] })),
        handlePatternChange: (p) => setSettings(s => ({ ...s, measureSequence: [{...s.measureSequence[0], pattern: p}] })),
        handleFlip: (isFlipped) => setIsAdvSequencerActive(isFlipped),
        handleLoadQuickSong: (i) => console.log('Storybook: loadQuickSong', i),
        handleSaveQuickSong: (i) => console.log('Storybook: saveQuickSong', i),
        handleQuickSongPressingChange: () => {},
        handleRandomize: () => console.log('Storybook: randomize'),
        handleResetToDefault: () => console.log('Storybook: resetToDefault'),
        handleLoadSong: (song, setlistId) => setLoadedSongInfo({ songId: song.id, setlistId }),
        handleLoadAndPlay: (song, setlistId) => { setLoadedSongInfo({ songId: song.id, setlistId }); setIsPlaying(true); },
        handleStop: () => setIsPlaying(false),
        onRenameTriggered: () => {},
        handleCancelChanges: () => {},
        handlePrevSong: () => console.log('Storybook: prevSong'),
        handleNextSong: () => console.log('Storybook: nextSong'),
        handleMeasureSequenceChange: (seq) => setSettings(s => ({...s, measureSequence: seq})),
        handleDuplicateMeasure: () => console.log('Storybook: duplicateMeasure'),
        onSetSelectedMeasureIndices: () => {},
        handleCountInChange: (enabled) => setSettings(s => ({...s, countIn: enabled})),
        updateSetting: (key, value) => setSettings(s => ({ ...s, [key]: value })),
        handleLoopChange: (enabled) => setSettings(s => ({...s, loop: enabled})),
        handleRandomizeSelectedMeasures: () => console.log('Storybook: randomizeSelected'),
        addDemoSetlist: () => console.log('Storybook: addDemoSetlist'),
    }), [settings, isPlaying, beatTrigger, setlists, quickSongs, loadedSongInfo, isAdvSequencerActive]);

    return (
        <AuthProvider>
            <MetronomeProvider value={mockContextValue}>
                {children}
            </MetronomeProvider>
        </AuthProvider>
    );
};


// --- Individual Component Stories ---

const KnobStory = () => {
    const [accent, setAccent] = useState(0.75);
    const [sub, setSub] = useState(0.5);
    const [swing, setSwing] = useState(0.2);
    const [master, setMaster] = useState(0.8);
    return (
        <div className="w-full max-w-xs p-4 bg-[var(--container-bg)] rounded-2xl flex flex-col gap-4">
            <Knob label="Accent" value={accent} onChange={setAccent} color="var(--strong-beat-accent)" />
            <Knob label="Subdivision" value={sub} onChange={setSub} color="var(--secondary-accent)" />
            <Knob label="Swing" value={swing} onChange={setSwing} color="var(--tertiary-accent)" />
            <Knob label="Master" value={master} onChange={setMaster} color="var(--text-primary)" />
        </div>
    );
};

const BpmControlStory = () => (
    <div className="w-full max-w-sm flex flex-col gap-4">
        <BpmControl />
        <BpmControl isShrunk={true} />
        <BpmControl disabled={true} />
    </div>
);

const RhythmSliderStory = () => {
    const [beats, setBeats] = useState(4);
    const [sub, setSub] = useState(4);
    return (
        <div className="w-full max-w-sm p-4 bg-[var(--container-bg)] rounded-3xl flex items-center justify-center gap-4">
            <RhythmSlider label="Beats" value={beats} min={1} max={16} onChange={setBeats} onInteractionStateChange={() => {}} accentColor='var(--strong-beat-accent)' />
            <div className="w-20 h-20 bg-white/20 rounded-full"></div>
            <RhythmSlider label="SUBD." value={sub} min={1} max={16} onChange={setSub} onInteractionStateChange={() => {}} accentColor='var(--secondary-accent)' />
        </div>
    );
}

const SequencerStory = () => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    return <div className="w-full max-w-sm"><Sequencer isFlipped={isFlipped} onFlip={setIsFlipped} isEditMode={isEditMode} onEditModeChange={setIsEditMode} /></div>
}

const QuickSongBarStory = () => <div className="w-full max-w-sm p-4 bg-[var(--container-bg)] rounded-3xl"><QuickSongBar /></div>;

const SetlistManagerStory = () => {
    const [isOpen, setIsOpen] = useState(true);
    const [activeId, setActiveId] = useState<string | null>(null);
    return <div className="w-full max-w-sm"><SetlistManager isContainerOpen={isOpen} onToggleVisibility={() => setIsOpen(p => !p)} onActiveSetlistChange={setActiveId} /></div>
}

const SoundSelectorStory = () => <div className="w-full max-w-sm p-4 bg-[var(--container-bg)] rounded-3xl"><SoundSelector /></div>;

const SetlistPlayerStory = () => <div className="w-full max-w-sm relative h-40"><SetlistPlayer /></div>;

const SettingsModalStory = () => {
    const { settings, updateSetting, factoryReset } = useAppSettings();
    return <SettingsModal onClose={() => {}} settings={settings} updateSetting={updateSetting} factoryReset={factoryReset} addDemoSetlist={() => {}} onOpenManual={() => {}} />;
}

// --- Storybook Component Definitions ---
const stories: Record<string, { title: string; component: React.FC }> = {
    bpmControl: { title: 'BPM Control', component: BpmControlStory },
    rhythmSlider: { title: 'Rhythm Slider', component: RhythmSliderStory },
    knob: { title: 'Knob', component: KnobStory },
    soundSelector: { title: 'Sound Selector', component: SoundSelectorStory },
    sequencer: { title: 'Sequencer', component: SequencerStory },
    quickSongBar: { title: 'Quick Song Bar', component: QuickSongBarStory },
    setlistManager: { title: 'Setlist Manager', component: SetlistManagerStory },
    setlistPlayer: { title: 'Setlist Player', component: SetlistPlayerStory },
    settings: { title: 'Settings Modal', component: SettingsModalStory },
    feedback: { title: 'Feedback Modal', component: () => <FeedbackModal onClose={() => {}} /> },
    manual: { title: 'Manual Modal', component: () => <ManualModal onClose={() => {}} /> },
    account: { title: 'Account Manager', component: () => <div className="w-full max-w-sm"><AccountManager onBack={() => {}}/></div> },
    a2hs: { title: 'Add to Home Screen', component: AddToHomeScreenPrompt },
};
const storyKeys = Object.keys(stories);

// --- Main Storybook Component ---
const Storybook = () => {
    const [activeStoryKey, setActiveStoryKey] = useState(storyKeys[0]);
    const ActiveComponent = stories[activeStoryKey].component;

    return (
        <div className="w-full min-h-screen flex font-sans bg-[#18181b]">
            <a href={window.location.pathname} className="fixed top-4 right-4 z-[1001] px-4 py-2 bg-[var(--primary-accent)] text-black font-bold rounded-lg shadow-lg hover:bg-[var(--primary-accent-dark)] transition-colors">
                Back to App
            </a>
            <aside className="w-56 flex-shrink-0 bg-black/20 h-screen overflow-y-auto p-4">
                <h1 className="text-xl font-bold text-[var(--primary-accent)] mb-4">Pulse Q Storybook</h1>
                <nav>
                    <ul>
                        {storyKeys.map(key => (
                            <li key={key}>
                                <button
                                    onClick={() => setActiveStoryKey(key)}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${activeStoryKey === key ? 'bg-[var(--primary-accent)] text-black font-semibold' : 'text-gray-300 hover:bg-white/10'}`}
                                >
                                    {stories[key].title}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>
            <main className="flex-1 flex items-center justify-center p-8 overflow-auto">
                <StorybookWrapper>
                    <ActiveComponent />
                </StorybookWrapper>
            </main>
        </div>
    );
};

export default Storybook;