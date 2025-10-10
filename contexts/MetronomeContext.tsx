import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo, type ReactNode } from 'react';
import { type MetronomeSettings, type PlaylistItem, type Setlist, type Measure } from '../types';
import { useMetronomeEngine, useSetlist, useQuickSongs } from '../hooks';
import { generateDefaultPattern, migrateSettingsIfNeeded, generateRandomPattern, createDemoSetlist } from '../utils';
import { AudioEngine } from '../services/audioEngine';
import { SOUND_OPTIONS } from '../constants';


interface IMetronomeContext {
    settings: MetronomeSettings;
    settingsForDisplay: Omit<MetronomeSettings, 'measureSequence' | 'isAdvanced'> & { bpm: number };
    measureForDisplay: Measure;
    simpleViewMeasure: Measure;
    isPlaying: boolean;
    isAdvSequencerActive: boolean;
    isDirty: boolean;
    loadedSongInfo: { setlistId: string; songId: string } | null;
    loadedQuickSongIndex: number | null;
    currentlyPlayingId: string | null;
    setlists: Setlist[];
    newlyAddedItemId: { type: 'setlist' | 'song', id: string } | null;
    quickSongs: (PlaylistItem | null)[];
    isRhythmSliderActive: boolean;
    isKnobActive: boolean;
    isBpmSliderDragging: boolean;
    pressingSlots: Set<number>;
    beatTrigger: number;
    currentStep: number;
    stepInMeasure: number;
    playingMeasureIndex: number;
    stepInPlayingMeasure: number;
    selectedMeasureIndices: number[];
    activeSetlist: Setlist | null;
    currentSongIndex: number;
    canGoPrevSong: boolean;
    canGoNextSong: boolean;
    playingSetlistId: string | null;
    setlistActions: {
        saveChanges: () => void;
        cancelChanges: () => void;
        addNewSetlist: () => void;
        addNewSong: (setlistId: string) => void;
        updateSetlistName: (id: string, newName: string) => void;
        updateSongName: (setlistId: string, songId: string, newName: string) => void;
        deleteSetlist: (id: string) => void;
        deleteSong: (setlistId: string, songId: string) => void;
        duplicateSetlist: (id: string) => void;
        duplicateSong: (setlistId: string, songId: string) => void;
        reorderSetlists: (reorderedSetlists: Setlist[]) => void;
        reorderSongs: (setlistId: string, reorderedSongs: PlaylistItem[]) => void;
    };
    togglePlay: () => void;
    setIsRhythmSliderActive: React.Dispatch<React.SetStateAction<boolean>>;
    setIsKnobActive: React.Dispatch<React.SetStateAction<boolean>>;
    setIsBpmSliderDragging: React.Dispatch<React.SetStateAction<boolean>>;
    handleSimpleRhythmChange: (prop: 'beats' | 'subdivisions', value: number) => void;
    handlePatternChange: (newPattern: number[]) => void;
    handleFlip: (isFlipped: boolean) => void;
    handleLoadQuickSong: (slotIndex: number) => void;
    handleSaveQuickSong: (slotIndex: number) => void;
    handleQuickSongPressingChange: (isPressing: boolean, slotIndex: number) => void;
    handleRandomize: () => void;
    handleLoadSong: (song: PlaylistItem, setlistId: string, preventStop?: boolean) => void;
    handleLoadAndPlay: (song: PlaylistItem, setlistId: string) => void;
    handleStop: () => void;
    onRenameTriggered: () => void;
    handleCancelChanges: () => void;
    handlePrevSong: () => void;
    handleNextSong: () => void;
    handleMeasureSequenceChange: (newSequence: Measure[]) => void;
    handleDuplicateMeasure: (indexToDuplicate: number) => void;
    onSetSelectedMeasureIndices: React.Dispatch<React.SetStateAction<number[]>>;
    handleCountInChange: (enabled: boolean) => void;
    updateSetting: <K extends keyof MetronomeSettings>(key: K, value: MetronomeSettings[K]) => void;
    handleLoopChange: (enabled: boolean) => void;
    handleRandomizeSelectedMeasures: () => void;
    addDemoSetlist: () => void;
}

const MetronomeContext = createContext<IMetronomeContext | null>(null);

export const useMetronome = () => {
    const context = useContext(MetronomeContext);
    if (!context) {
        throw new Error('useMetronome must be used within a MetronomeProvider');
    }
    return context;
};

export const MetronomeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Global/Song settings state. This holds the configuration for the currently loaded song or new session.
    const [settings, setSettings] = useState<MetronomeSettings>(() => {
        const now = Date.now();
        const initialMeasures: Measure[] = [
            { id: `m-${now}-init-m1`, beats: 4, subdivisions: 4, pattern: generateDefaultPattern(4, 4) },
        ];
        return {
          bpm: 112,
          beatSoundId: 'classic',
          subdivisionSoundId: 'classic',
          accentVolume: 0.75, 
          beatVolume: 0.5, 
          masterVolume: 0.7, 
          swing: 0,
          measureSequence: initialMeasures,
          countIn: false,
          loop: true,
          isAdvanced: false,
          simpleView: 'grid',
        };
    });

    // UI State that affects logic
    const [isAdvSequencerActive, setIsAdvSequencerActive] = useState(false);
    const [beatTrigger, setBeatTrigger] = useState(0);
    const [isDirty, setIsDirty] = useState(false);
    const [isRhythmSliderActive, setIsRhythmSliderActive] = useState(false);
    const [isKnobActive, setIsKnobActive] = useState(false);
    const [isBpmSliderDragging, setIsBpmSliderDragging] = useState(false);
    const [pressingSlots, setPressingSlots] = useState<Set<number>>(new Set());
    const [selectedMeasureIndices, setSelectedMeasureIndices] = useState<number[]>([]);

    // Data & Playback State
    const { setlists, setSetlists, saveSetlists } = useSetlist();
    const { quickSongs, saveQuickSongs } = useQuickSongs();
    const [loadedSongInfo, setLoadedSongInfo] = useState<{setlistId: string; songId: string} | null>(null);
    const [loadedQuickSongIndex, setLoadedQuickSongIndex] = useState<number | null>(null);
    const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
    const [newlyAddedItemId, setNewlyAddedItemId] = useState<{type: 'setlist' | 'song', id: string} | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    
    // Refs
    const audioEngineRef = useRef<AudioEngine | null>(null);
    const isSwitchingSong = useRef(false);

    // Memoized settings for the audio engine, adapting to simple vs. advanced sequencer mode
    const settingsForEngine = useMemo(() => {
        if (isAdvSequencerActive) {
          return settings;
        }
        const simpleSequence = settings.measureSequence.length > 0 ? [settings.measureSequence[0]] : [];
        return {
          ...settings,
          measureSequence: simpleSequence,
        };
    }, [settings, isAdvSequencerActive]);
  
    const { isPlaying, currentStep, togglePlay: engineTogglePlay } = useMetronomeEngine(settingsForEngine, audioEngineRef);
  
    const singleEditingMeasureIndex = useMemo(() => selectedMeasureIndices.length === 1 ? selectedMeasureIndices[0] : null, [selectedMeasureIndices]);

    // Determines which settings to display in the UI (global song settings vs. measure-specific overrides)
    const settingsForDisplay = useMemo(() => {
        if (isAdvSequencerActive && singleEditingMeasureIndex !== null && settings.measureSequence[singleEditingMeasureIndex]) {
            const measure = settings.measureSequence[singleEditingMeasureIndex];
            return {
                bpm: measure.bpm ?? settings.bpm,
                beatSoundId: measure.beatSoundId ?? settings.beatSoundId,
                subdivisionSoundId: measure.subdivisionSoundId ?? settings.subdivisionSoundId,
                accentVolume: measure.accentVolume ?? settings.accentVolume,
                beatVolume: measure.beatVolume ?? settings.beatVolume,
                masterVolume: settings.masterVolume,
                swing: measure.swing ?? settings.swing,
                countIn: settings.countIn,
                loop: settings.loop,
                simpleView: settings.simpleView,
            };
        }
        return settings;
    }, [settings, singleEditingMeasureIndex, isAdvSequencerActive]);

    const measureForDisplay = useMemo(() => {
        const measureIndex = singleEditingMeasureIndex ?? 0;
        return settings.measureSequence[measureIndex] ?? { id: 'fallback', beats: 4, subdivisions: 2, pattern: generateDefaultPattern(4,2) };
    }, [settings.measureSequence, singleEditingMeasureIndex]);
  
    const simpleViewMeasure = useMemo(() => settings.measureSequence[0] ?? { id: 'fallback', beats: 4, subdivisions: 2, pattern: generateDefaultPattern(4,2) }, [settings.measureSequence]);
    
    const togglePlay = useCallback(() => {
        engineTogglePlay();
    }, [engineTogglePlay]);

    const handleLoadSong = useCallback((song: PlaylistItem, setlistId: string, preventStop = false) => {
        if (isPlaying && !preventStop) togglePlay();

        const newSettings = migrateSettingsIfNeeded(song.settings);
        const isAdvanced = newSettings.isAdvanced ?? false;
        setIsAdvSequencerActive(isAdvanced);
        setSettings(newSettings);
        setLoadedSongInfo({ setlistId, songId: song.id });
        setLoadedQuickSongIndex(null);
        setSelectedMeasureIndices([]);
        setIsDirty(false);
    }, [isPlaying, togglePlay]);

    useEffect(() => {
        if (!initialLoadComplete && setlists.length > 0 && setlists[0].songs.length > 0) {
          handleLoadSong(setlists[0].songs[0], setlists[0].id);
          setInitialLoadComplete(true);
        }
    }, [setlists, initialLoadComplete, handleLoadSong]);

    useEffect(() => {
        if (isPlaying && currentStep !== -1) {
            let globalStepCounter = 0;
            for(const measure of settingsForEngine.measureSequence) {
                if (currentStep < globalStepCounter + measure.pattern.length) {
                    const stepInMeasure = currentStep - globalStepCounter;
                    if (stepInMeasure % measure.subdivisions === 0) {
                        setBeatTrigger(t => t + 1);
                    }
                    break;
                }
                globalStepCounter += measure.pattern.length;
            }
        }
    }, [currentStep, isPlaying, settingsForEngine.measureSequence]);

    useEffect(() => {
        if (!isPlaying && !isSwitchingSong.current) {
          setCurrentlyPlayingId(null);
        }
    }, [isPlaying]);
    
    const updateSetting = useCallback(<K extends keyof MetronomeSettings>(key: K, value: MetronomeSettings[K]) => {
        if (loadedSongInfo) setIsDirty(true);
        if (loadedQuickSongIndex !== null) setLoadedQuickSongIndex(null);

        setSettings(prev => {
            if (isAdvSequencerActive && singleEditingMeasureIndex !== null && prev.measureSequence[singleEditingMeasureIndex]) {
                if (key === 'countIn' || key === 'masterVolume' || key === 'loop' || key === 'isAdvanced' || key === 'simpleView') {
                     return { ...prev, [key]: value };
                }
                const newSequence = [...prev.measureSequence];
                const updatedMeasure = {
                    ...newSequence[singleEditingMeasureIndex],
                    [key]: value
                };
                newSequence[singleEditingMeasureIndex] = updatedMeasure;
                return { ...prev, measureSequence: newSequence };
            }
            return { ...prev, [key]: value };
        });
    }, [loadedSongInfo, loadedQuickSongIndex, singleEditingMeasureIndex, isAdvSequencerActive]);

    const handleCountInChange = useCallback((enabled: boolean) => {
        if (loadedSongInfo) setIsDirty(true);
        if (loadedQuickSongIndex !== null) setLoadedQuickSongIndex(null);
        setSettings(prev => {
            const wasEnabled = prev.countIn;
            let newSequence = [...prev.measureSequence];

            if (enabled && !wasEnabled) {
                const firstSongMeasure = newSequence.length > 0 ? newSequence[0] : { beats: 4, subdivisions: 2 };
                const countInMeasure: Measure = {
                    id: `m-countin-${Date.now()}`,
                    beats: firstSongMeasure.beats,
                    subdivisions: 1,
                    pattern: generateDefaultPattern(firstSongMeasure.beats, 1),
                };
                newSequence.unshift(countInMeasure);
            } else if (!enabled && wasEnabled) {
                if (newSequence.length > 0 && newSequence[0].id.startsWith('m-countin-')) {
                    newSequence.shift();
                }
                if (newSequence.length === 0) {
                    newSequence.push({
                        id: `m-${Date.now()}-1`,
                        beats: 4,
                        subdivisions: 2,
                        pattern: generateDefaultPattern(4, 2),
                    });
                }
            }

            return { ...prev, countIn: enabled, measureSequence: newSequence, };
        });
    }, [loadedSongInfo, loadedQuickSongIndex]);

    const handleSimpleRhythmChange = useCallback((prop: 'beats' | 'subdivisions', value: number) => {
        if (loadedSongInfo) setIsDirty(true);
        if (loadedQuickSongIndex !== null) setLoadedQuickSongIndex(null);
        
        setSettings(prev => {
            const measureIndexToUpdate = singleEditingMeasureIndex ?? 0;
            if (!prev.measureSequence[measureIndexToUpdate]) return prev;
            const newSequence = [...prev.measureSequence];
            const targetMeasure = newSequence[measureIndexToUpdate];
            const newMeasure = { ...targetMeasure, [prop]: value };
            if ((prop === 'beats' && newMeasure.beats > 0) || (prop === 'subdivisions' && newMeasure.subdivisions > 0)) {
                newMeasure.pattern = generateDefaultPattern(newMeasure.beats, newMeasure.subdivisions);
            }
            newSequence[measureIndexToUpdate] = newMeasure;
            return { ...prev, measureSequence: newSequence };
        });
    }, [loadedSongInfo, loadedQuickSongIndex, singleEditingMeasureIndex]);
      
    const handlePatternChange = useCallback((newPattern: number[]) => {
        if (loadedSongInfo) setIsDirty(true);
        if (loadedQuickSongIndex !== null) setLoadedQuickSongIndex(null);
        setSettings(prev => {
            const newSequence = [...prev.measureSequence];
            const measureIndexToUpdate = singleEditingMeasureIndex ?? 0;
            if (newSequence.length > 0) {
                newSequence[measureIndexToUpdate] = { ...newSequence[measureIndexToUpdate], pattern: newPattern };
            }
            return { ...prev, measureSequence: newSequence };
        });
    }, [loadedSongInfo, loadedQuickSongIndex, singleEditingMeasureIndex]);

    const handleMeasureSequenceChange = useCallback((newSequence: Measure[]) => {
        if (loadedSongInfo) setIsDirty(true);
        if (loadedQuickSongIndex !== null) setLoadedQuickSongIndex(null);
        setSettings(prev => ({...prev, measureSequence: newSequence}));
    }, [loadedSongInfo, loadedQuickSongIndex]);

    const handleDuplicateMeasure = useCallback((indexToDuplicate: number) => {
        if (loadedSongInfo) setIsDirty(true);
        if (loadedQuickSongIndex !== null) setLoadedQuickSongIndex(null);
        setSettings(prev => {
            if (prev.measureSequence.length >= 40) return prev;
            if (indexToDuplicate < 0 || indexToDuplicate >= prev.measureSequence.length) return prev;
            
            const newSequence = [...prev.measureSequence];
            const measureToCopy = newSequence[indexToDuplicate];
            const newMeasure: Measure = { ...JSON.parse(JSON.stringify(measureToCopy)), id: `m-${Date.now()}` };
            newSequence.splice(indexToDuplicate + 1, 0, newMeasure);
            return { ...prev, measureSequence: newSequence };
        });
    }, [loadedSongInfo, loadedQuickSongIndex]);

    const handleLoadAndPlay = useCallback((song: PlaylistItem, setlistId: string) => {
        const wasPlaying = isPlaying;
        const isSwitching = loadedSongInfo?.songId !== song.id;

        if (isSwitching) {
            isSwitchingSong.current = true;
            handleLoadSong(song, setlistId);
        }

        setCurrentlyPlayingId(song.id);

        if (!wasPlaying || isSwitching) {
            setTimeout(() => {
                engineTogglePlay();
                isSwitchingSong.current = false;
            }, 50);
        } else {
            isSwitchingSong.current = false;
        }
    }, [isPlaying, engineTogglePlay, loadedSongInfo, handleLoadSong]);

    const handleStop = useCallback(() => {
        if (isPlaying) togglePlay();
        setCurrentlyPlayingId(null);
    }, [isPlaying, togglePlay]);

    const onRenameTriggered = useCallback(() => setNewlyAddedItemId(null), []);

    const handleFlip = useCallback((isFlipped: boolean) => {
        if (isPlaying) togglePlay();
        if (loadedQuickSongIndex !== null) setLoadedQuickSongIndex(null);
        
        if (!isFlipped) {
            setSelectedMeasureIndices([]);
        }

        setIsAdvSequencerActive(isFlipped);

        setSettings(prev => {
          let newSequence = [...prev.measureSequence];
          let newCountIn = prev.countIn;

          if (isFlipped) {
              if (prev.measureSequence.length === 1 && !prev.countIn) {
                const firstMeasure = prev.measureSequence[0];
                const countInMeasure: Measure = {
                    id: `m-countin-${Date.now()}`,
                    beats: firstMeasure.beats,
                    subdivisions: 1,
                    pattern: generateDefaultPattern(firstMeasure.beats, 1),
                };
                newSequence = [
                  countInMeasure,
                  firstMeasure,
                  { ...JSON.parse(JSON.stringify(firstMeasure)), id: `m-${Date.now()}-2` },
                  { ...JSON.parse(JSON.stringify(firstMeasure)), id: `m-${Date.now()}-3` }
                ];
                newCountIn = true;
              }
          } else {
              if (prev.countIn) {
                  newCountIn = false;
                  if (newSequence.length > 1 && (newSequence[0].id.startsWith('m-countin-'))) {
                      newSequence.shift();
                  }
                  if (newSequence.length === 0) {
                      newSequence.push({ id: `m-${Date.now()}-fallback`, beats: 4, subdivisions: 2, pattern: generateDefaultPattern(4, 2) });
                  }
              }
          }
          return { ...prev, isAdvanced: isFlipped, measureSequence: newSequence, countIn: newCountIn };
        });
        
        if (loadedSongInfo) setIsDirty(true);
        
    }, [loadedSongInfo, loadedQuickSongIndex, isPlaying, togglePlay]);

    const { stepInMeasure, playingMeasureIndex, stepInPlayingMeasure } = useMemo(() => {
        const sequenceToUse = settingsForEngine.measureSequence;
        if (currentStep === -1 || sequenceToUse.length === 0) {
          return { stepInMeasure: -1, playingMeasureIndex: -1, stepInPlayingMeasure: -1 };
        }
        let globalStepCounter = 0;
        for (let i = 0; i < sequenceToUse.length; i++) {
            const measure = sequenceToUse[i];
            const measureLength = measure.pattern.length;
            if (currentStep < globalStepCounter + measureLength) {
                return {
                    stepInMeasure: currentStep - globalStepCounter,
                    playingMeasureIndex: i,
                    stepInPlayingMeasure: currentStep - globalStepCounter,
                };
            }
            globalStepCounter += measureLength;
        }
        return { stepInMeasure: -1, playingMeasureIndex: -1, stepInPlayingMeasure: -1 };
    }, [currentStep, settingsForEngine.measureSequence]);

    useEffect(() => {
        if (isAdvSequencerActive && isPlaying && playingMeasureIndex !== null && playingMeasureIndex > -1) {
          setSelectedMeasureIndices([playingMeasureIndex]);
        }
    }, [isPlaying, playingMeasureIndex, isAdvSequencerActive]);

    const { currentSongIndex, currentSetlistIndex } = useMemo(() => {
        if (!loadedSongInfo) return { currentSongIndex: -1, currentSetlistIndex: -1 };
        const setlistIndex = setlists.findIndex(sl => sl.id === loadedSongInfo.setlistId);
        if (setlistIndex === -1) return { currentSongIndex: -1, currentSetlistIndex: setlistIndex };
        const songIndex = setlists[setlistIndex].songs.findIndex(s => s.id === loadedSongInfo.songId);
        return { currentSongIndex: songIndex, currentSetlistIndex: setlistIndex };
    }, [loadedSongInfo, setlists]);

    const handlePrevSong = () => {
        if (currentSetlistIndex === -1 || currentSongIndex <= 0) return;
        handleLoadSong(setlists[currentSetlistIndex].songs[currentSongIndex - 1], setlists[currentSetlistIndex].id);
    };
    const handleNextSong = () => {
        if (currentSetlistIndex === -1 || currentSongIndex >= setlists[currentSetlistIndex].songs.length - 1) return;
        handleLoadSong(setlists[currentSetlistIndex].songs[currentSongIndex + 1], setlists[currentSetlistIndex].id);
    };

    const canGoPrevSong = currentSongIndex > 0;
    const canGoNextSong = currentSetlistIndex !== -1 && currentSongIndex < (setlists[currentSetlistIndex]?.songs.length - 1);

    const playingSetlistId = useMemo(() => {
        if (!currentlyPlayingId) return null;
        for (const setlist of setlists) {
            if (setlist.songs.some(song => song.id === currentlyPlayingId)) {
                return setlist.id;
            }
        }
        return null;
    }, [currentlyPlayingId, setlists]);

    const handleCancelChanges = useCallback(() => {
        if (!loadedSongInfo) return;
        const { setlistId, songId } = loadedSongInfo;
        const setlist = setlists.find(sl => sl.id === setlistId);
        const song = setlist?.songs.find(s => s.id === songId);
        if (song) {
            const originalSettings = migrateSettingsIfNeeded(song.settings);
            setIsAdvSequencerActive(originalSettings.isAdvanced ?? false);
            setSettings(originalSettings);
            setIsDirty(false);
            setSelectedMeasureIndices([]);
        }
    }, [loadedSongInfo, setlists]);

    const handleLoadQuickSong = useCallback((slotIndex: number) => {
        const song = quickSongs[slotIndex];
        if (!song) return;
        if (isPlaying) togglePlay();

        const quickSongSettings = migrateSettingsIfNeeded(song.settings);
        const isAdvanced = quickSongSettings.isAdvanced ?? false;

        if (loadedSongInfo) {
            // A setlist song is loaded. Overwrite its settings with the quick song's settings
            // and mark it as dirty, giving the user the option to save or cancel.
            setSettings(quickSongSettings);
            setIsAdvSequencerActive(isAdvanced);
            setLoadedQuickSongIndex(null); // This is not a "quick song load" anymore, but an "edit"
            setSelectedMeasureIndices([]);
            setIsDirty(true);
        } else {
            // Original behavior: No setlist song is loaded, so just load the quick song directly.
            setIsAdvSequencerActive(isAdvanced);
            setSettings(quickSongSettings);
            setLoadedQuickSongIndex(slotIndex);
            setLoadedSongInfo(null);
            setSelectedMeasureIndices([]);
            setIsDirty(false);
        }
    }, [quickSongs, isPlaying, togglePlay, loadedSongInfo]);

    const handleSaveQuickSong = useCallback((slotIndex: number) => {
        const newQuickSongs = [...quickSongs];
        const songToSave: PlaylistItem = {
            id: `qs-${Date.now()}`,
            name: `Slot ${slotIndex + 1}`,
            settings: JSON.parse(JSON.stringify(settings))
        };
        newQuickSongs[slotIndex] = songToSave;
        saveQuickSongs(newQuickSongs);
        setLoadedQuickSongIndex(slotIndex);
        setLoadedSongInfo(null);
        setIsDirty(false);
    }, [settings, quickSongs, saveQuickSongs]);
      
    const handleQuickSongPressingChange = useCallback((isPressing: boolean, slotIndex: number) => {
        setPressingSlots(prev => {
            const newSet = new Set(prev);
            if (isPressing) newSet.add(slotIndex);
            else newSet.delete(slotIndex);
            return newSet;
        });
    }, []);

    const handleRandomize = useCallback(() => {
        if (isPlaying) togglePlay();
        
        const currentBpm = settings.bpm;
        let subChances: number[];
        if (currentBpm > 180) { subChances = [1, 2]; } 
        else if (currentBpm > 140) { subChances = [1, 2, 3, 4]; } 
        else if (currentBpm > 100) { subChances = [1, 2, 3, 4, 6]; } 
        else { subChances = [1, 2, 3, 4, 6, 8]; }
        
        const beatChances = [2, 3, 4, 4, 4, 4, 4, 5, 6, 7];
        const randomBeats = beatChances[Math.floor(Math.random() * beatChances.length)];
        
        let randomSubdivisions = subChances[Math.floor(Math.random() * subChances.length)];
        if (randomBeats * randomSubdivisions > 64) {
            randomSubdivisions = Math.floor(64 / randomBeats) || 1;
        }

        const randomSwing = randomSubdivisions === 3 ? 0 : (Math.random() < 0.4 ? Math.random() * 0.6 + 0.1 : 0);
        const randomPattern = generateRandomPattern(randomBeats, randomSubdivisions);
        
        const randomMeasure: Measure = {
            id: `m-random-${Date.now()}`,
            beats: randomBeats,
            subdivisions: randomSubdivisions,
            pattern: randomPattern,
        };
        
        // FIX: Explicitly type randomSoundSettings to ensure `simpleView` is not widened to `string`.
        const randomSoundSettings: {
            beatSoundId: string;
            subdivisionSoundId: string;
            accentVolume: number;
            beatVolume: number;
            swing: number;
            simpleView: 'grid' | 'rings';
        } = {
            beatSoundId: SOUND_OPTIONS[Math.floor(Math.random() * SOUND_OPTIONS.length)].id,
            subdivisionSoundId: SOUND_OPTIONS[Math.floor(Math.random() * SOUND_OPTIONS.length)].id,
            accentVolume: Math.random() * 0.5 + 0.5,
            beatVolume: Math.random() * 0.5 + 0.25,
            swing: randomSwing,
            simpleView: Math.random() < 0.5 ? 'grid' : 'rings',
        };

        if (loadedSongInfo) {
            // A setlist song is loaded. Modify its settings in place and mark as dirty.
            setSettings(prev => ({
                ...prev, // Keeps BPM, masterVolume, loop, etc. from the loaded song
                ...randomSoundSettings,
                measureSequence: [randomMeasure],
                countIn: false,
                isAdvanced: false,
            }));
            setIsAdvSequencerActive(false);
            setLoadedQuickSongIndex(null);
            setSelectedMeasureIndices([]);
            setIsDirty(true);
        } else {
            // No setlist song is loaded (it's a new session or a quick song is active).
            // Create a new configuration from scratch, preserving only BPM and master volume.
            const newSettings: MetronomeSettings = {
                bpm: settings.bpm,
                masterVolume: settings.masterVolume,
                ...randomSoundSettings,
                measureSequence: [randomMeasure],
                countIn: false,
                loop: true,
                isAdvanced: false,
            };
            setSettings(newSettings);
            setIsAdvSequencerActive(false);
            setLoadedSongInfo(null);
            setLoadedQuickSongIndex(null);
            setSelectedMeasureIndices([]);
            setIsDirty(false);
        }
    }, [isPlaying, togglePlay, settings.bpm, settings.masterVolume, loadedSongInfo]);

    const handleRandomizeSelectedMeasures = useCallback(() => {
        if (isPlaying) togglePlay();
        if (selectedMeasureIndices.length === 0) return;
        if (loadedSongInfo) setIsDirty(true);
        if (loadedQuickSongIndex !== null) setLoadedQuickSongIndex(null);
        setSettings(prev => {
            const newSequence = [...prev.measureSequence];
            selectedMeasureIndices.forEach(index => {
                if (index < newSequence.length) {
                    if (prev.countIn && index === 0) return;
                    const beatChances = [2, 3, 4, 4, 4, 4, 4, 5, 6, 7, 8];
                    const subChances = [1, 2, 3, 4, 4, 6, 8].filter(s => s <= 16);
                    const randomBeats = beatChances[Math.floor(Math.random() * beatChances.length)];
                    let randomSubdivisions = subChances[Math.floor(Math.random() * subChances.length)];
                    if (randomBeats * randomSubdivisions > 64) {
                        randomSubdivisions = Math.floor(64 / randomBeats) || 1;
                    }
                    const randomSwing = randomSubdivisions === 3 ? 0 : (Math.random() < 0.4 ? Math.random() * 0.6 + 0.1 : 0);
                    const randomPattern = generateRandomPattern(randomBeats, randomSubdivisions);
                    const randomizedMeasure: Measure = {
                        ...newSequence[index],
                        beats: randomBeats, subdivisions: randomSubdivisions, pattern: randomPattern,
                        swing: Math.random() < 0.5 ? randomSwing : undefined,
                        bpm: Math.random() < 0.3 ? Math.floor(Math.random() * (180 - 60 + 1)) + 60 : undefined,
                        beatSoundId: Math.random() < 0.3 ? SOUND_OPTIONS[Math.floor(Math.random() * SOUND_OPTIONS.length)].id : undefined,
                        subdivisionSoundId: Math.random() < 0.3 ? SOUND_OPTIONS[Math.floor(Math.random() * SOUND_OPTIONS.length)].id : undefined,
                        accentVolume: Math.random() < 0.3 ? Math.random() * 0.5 + 0.5 : undefined,
                        beatVolume: Math.random() < 0.3 ? Math.random() * 0.5 + 0.25 : undefined,
                    };
                    newSequence[index] = randomizedMeasure;
                }
            });
            return { ...prev, measureSequence: newSequence };
        });
    }, [isPlaying, togglePlay, selectedMeasureIndices, loadedSongInfo, loadedQuickSongIndex]);

    const setlistActions = useMemo(() => ({
        saveChanges: () => {
            if (!loadedSongInfo) return;
            const { setlistId, songId } = loadedSongInfo;
            setSetlists(prev => {
              const newSetlists = prev.map(sl => sl.id === setlistId ? { ...sl, songs: sl.songs.map(s => s.id === songId ? { ...s, settings } : s) } : sl);
              saveSetlists(newSetlists);
              return newSetlists;
            });
            setIsDirty(false);
        },
        cancelChanges: handleCancelChanges,
        addNewSetlist: () => {
            const newId = `setlist-${new Date().toISOString()}`;
            const newSetlist: Setlist = { id: newId, name: `Setlist ${setlists.length + 1}`, songs: [] };
            setSetlists(prev => { const newSetlists = [...prev, newSetlist]; saveSetlists(newSetlists); return newSetlists; });
            setNewlyAddedItemId({ type: 'setlist', id: newId });
        },
        addNewSong: (setlistId: string) => {
            const targetSetlist = setlists.find(sl => sl.id === setlistId);
            if (!targetSetlist) return;
            const newId = `song-${new Date().toISOString()}`;
            const newSongSettings: MetronomeSettings = JSON.parse(JSON.stringify(settings));
            const newSong: PlaylistItem = { id: newId, name: `New Song ${targetSetlist.songs.length + 1}`, settings: newSongSettings };
            setSetlists(prev => {
                const newSetlists = prev.map(sl => sl.id === setlistId ? { ...sl, songs: [...sl.songs, newSong] } : sl);
                saveSetlists(newSetlists);
                return newSetlists;
            });
            setSettings(newSongSettings);
            setIsAdvSequencerActive(newSongSettings.isAdvanced ?? false);
            setLoadedSongInfo({ setlistId, songId: newId });
            setLoadedQuickSongIndex(null);
            setSelectedMeasureIndices([]);
            setIsDirty(false);
        },
        updateSetlistName: (id, name) => { setSetlists(p => { const n = p.map(s=>s.id===id?{...s,name}:s); saveSetlists(n); return n; }); },
        updateSongName: (sId, sgId, name) => { setSetlists(p => { const n = p.map(sl=>sl.id===sId?{...sl,songs:sl.songs.map(s=>s.id===sgId?{...s,name}:s)}:sl); saveSetlists(n); return n; }); },
        deleteSetlist: (id) => { setSetlists(p => { const n = p.filter(s=>s.id!==id); saveSetlists(n); return n; }); if (loadedSongInfo?.setlistId === id) { setLoadedSongInfo(null); setLoadedQuickSongIndex(null); setSelectedMeasureIndices([]); setIsDirty(false); } },
        deleteSong: (sId, sgId) => { setSetlists(p => { const n = p.map(sl=>sl.id===sId?{...sl,songs:sl.songs.filter(s=>s.id!==sgId)}:sl); saveSetlists(n); return n; }); if (loadedSongInfo?.songId === sgId) { setLoadedSongInfo(null); setLoadedQuickSongIndex(null); setSelectedMeasureIndices([]); setIsDirty(false); } },
        duplicateSong: (sId, sgId) => { setSetlists(p => { let n=[...p]; const si=n.findIndex(s=>s.id===sId); if(si===-1)return p; const sgi=n[si].songs.findIndex(s=>s.id===sgId); if(sgi===-1)return p; const s={...JSON.parse(JSON.stringify(n[si].songs[sgi])),id:`song-${new Date().toISOString()}`,name:`${n[si].songs[sgi].name} (Copy)`}; n[si].songs.splice(sgi+1,0,s); saveSetlists(n); return n; }); },
        duplicateSetlist: (id) => {
          setSetlists(prev => {
            const listToCopy = prev.find(sl => sl.id === id);
            if (!listToCopy) return prev;
            const newSetlist: Setlist = { ...JSON.parse(JSON.stringify(listToCopy)), id: `setlist-${new Date().toISOString()}`, name: `${listToCopy.name} (Copy)` };
            const index = prev.findIndex(sl => sl.id === id);
            const newSetlists = [...prev];
            newSetlists.splice(index + 1, 0, newSetlist);
            saveSetlists(newSetlists);
            return newSetlists;
          });
        },
        reorderSetlists: (reordered) => { setSetlists(reordered); saveSetlists(reordered); },
        reorderSongs: (sId, reordered) => { setSetlists(p => { const n=p.map(s=>s.id===sId?{...s,songs:reordered}:s); saveSetlists(n); return n; }); },
    }), [setlists, loadedSongInfo, settings, saveSetlists, setSetlists, handleCancelChanges]);

    const addDemoSetlist = useCallback(() => {
        const demoSetlists = createDemoSetlist();
        const demoSetlistToAdd = demoSetlists.find(sl => sl.id === 'setlist-demo-1');
        if (!demoSetlistToAdd) return;

        setSetlists(prev => {
            const otherSetlists = prev.filter(sl => sl.id !== demoSetlistToAdd.id);
            const newSetlists = [demoSetlistToAdd, ...otherSetlists];
            saveSetlists(newSetlists);
            return newSetlists;
        });
    }, [setSetlists, saveSetlists]);

    const handleLoopChange = (enabled: boolean) => updateSetting('loop', enabled);

    const activeSetlist = useMemo(() => (currentSetlistIndex === -1) ? null : setlists[currentSetlistIndex], [setlists, currentSetlistIndex]);

    const value = useMemo(() => ({
        settings, settingsForDisplay, measureForDisplay, simpleViewMeasure, isPlaying,
        isAdvSequencerActive, isDirty, loadedSongInfo, loadedQuickSongIndex,
        currentlyPlayingId, setlists, newlyAddedItemId, quickSongs, isRhythmSliderActive,
        isKnobActive, isBpmSliderDragging, pressingSlots, beatTrigger, currentStep,
        stepInMeasure, playingMeasureIndex, stepInPlayingMeasure, selectedMeasureIndices,
        activeSetlist, currentSongIndex, canGoPrevSong, canGoNextSong, playingSetlistId,
        setlistActions, togglePlay, setIsRhythmSliderActive, setIsKnobActive, setIsBpmSliderDragging,
        handleSimpleRhythmChange, handlePatternChange, handleFlip, handleLoadQuickSong,
        handleSaveQuickSong, handleQuickSongPressingChange, handleRandomize, handleLoadSong,
        handleLoadAndPlay, handleStop, onRenameTriggered, handleCancelChanges, handlePrevSong,
        handleNextSong, handleMeasureSequenceChange, handleDuplicateMeasure,
        onSetSelectedMeasureIndices: setSelectedMeasureIndices, handleCountInChange,
        updateSetting, handleLoopChange, handleRandomizeSelectedMeasures, addDemoSetlist
    }), [
        settings, settingsForDisplay, measureForDisplay, simpleViewMeasure, isPlaying,
        isAdvSequencerActive, isDirty, loadedSongInfo, loadedQuickSongIndex,
        currentlyPlayingId, setlists, newlyAddedItemId, quickSongs, isRhythmSliderActive,
        isKnobActive, isBpmSliderDragging, pressingSlots, beatTrigger, currentStep,
        stepInMeasure, playingMeasureIndex, stepInPlayingMeasure, selectedMeasureIndices,
        activeSetlist, currentSongIndex, canGoPrevSong, canGoNextSong, playingSetlistId,
        setlistActions, togglePlay, handleSimpleRhythmChange, handlePatternChange, handleFlip,
        handleLoadQuickSong, handleSaveQuickSong, handleQuickSongPressingChange, handleRandomize,
        handleLoadSong, handleLoadAndPlay, handleStop, onRenameTriggered, handleCancelChanges,
        handlePrevSong, handleNextSong, handleMeasureSequenceChange, handleDuplicateMeasure,
        handleCountInChange, updateSetting, handleLoopChange, handleRandomizeSelectedMeasures,
        addDemoSetlist
    ]);

    return (
        <MetronomeContext.Provider value={value}>
            {children}
        </MetronomeContext.Provider>
    );
};