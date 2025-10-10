

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { type MetronomeSettings, type PlaylistItem, type Setlist, type Measure } from './types';
import { SOUND_OPTIONS } from './constants';
import { useMetronomeEngine, useSetlist, useQuickSongs, useAppSettings } from './hooks';
import { generateDefaultPattern, migrateSettingsIfNeeded, createDemoSetlist, generateRandomPattern } from './utils';
import Knob from './components/Knob';
import SetlistManager from './components/SetlistManager';
import BpmControl from './components/HorizontalBpmSlider';
import RhythmSlider from './components/RhythmSlider';
import Sequencer from './components/Sequencer';
import SoundSelector from './components/SoundSelector';
import AddToHomeScreenPrompt from './components/AddToHomeScreenPrompt';
import { AudioEngine } from './services/audioEngine';
import QuickSongBar from './components/QuickSongBar';
import SettingsModal from './components/SettingsModal';
import FeedbackModal from './components/FeedbackModal';
import ManualModal from './components/ManualModal';
import SetlistPlayer from './components/SetlistPlayer';
import { 
    MixerIcon, 
    SoundIcon, 
    PlayIcon,
    PauseIcon
} from './components/Icons';


/**
 * @file App.tsx
 * @description The main component for the Pulse Q Metronome application.
 * 
 * This component serves as the root of the application, managing:
 * - Global metronome settings state (`settings`).
 * - Core audio engine integration via the `useMetronomeEngine` hook.
 * - All UI components (BPM control, sequencers, mixer, etc.).
 * - Data management for setlists and quick songs via custom hooks.
 * - UI state such as active panels, modal visibility, and edit modes.
 * - All business logic for loading, saving, and manipulating songs and settings.
 */
const App: React.FC = () => {
  // App-wide settings for UI visibility etc.
  const { settings: appSettings, updateSetting: updateAppSetting, factoryReset } = useAppSettings();

  // Global/Song settings state. This holds the configuration for the currently loaded song or new session.
  const [settings, setSettings] = useState<MetronomeSettings>(() => {
    const now = Date.now();
    // Default to a simple, single-measure setup, consistent with starting in the simple view.
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
      countIn: false, // Simple view doesn't use count-in
      loop: true,
      isAdvanced: false, // Start in simple view
      simpleView: 'grid',
    };
  });

  // UI State
  const [activePanel, setActivePanel] = useState<'mixer' | 'sounds' | null>(null);
  const [isAdvSequencerActive, setIsAdvSequencerActive] = useState(false); // Start in simple view
  const [isEditingSequence, setIsEditingSequence] = useState(false);
  const [beatTrigger, setBeatTrigger] = useState(0); // Used for visual feedback on beat
  const [isDirty, setIsDirty] = useState(false); // Tracks if the loaded song has unsaved changes
  const [isSongsContainerOpen, setIsSongsContainerOpen] = useState(false);
  const [activeSetlistId, setActiveSetlistId] = useState<string | null>(null);
  const [isSettingsViewVisible, setIsSettingsViewVisible] = useState(false);
  const [isFeedbackViewVisible, setIsFeedbackViewVisible] = useState(false);
  const [isManualViewVisible, setIsManualViewVisible] = useState(false);

  // State for tracking interaction with sliders to prevent page scroll on mobile
  const [isRhythmSliderActive, setIsRhythmSliderActive] = useState(false);
  const [isKnobActive, setIsKnobActive] = useState(false);
  const [isBpmSliderDragging, setIsBpmSliderDragging] = useState(false);
  const [pressingSlots, setPressingSlots] = useState<Set<number>>(new Set());

  // Data & Playback State
  const { setlists, setSetlists, saveSetlists } = useSetlist();
  const { quickSongs, saveQuickSongs } = useQuickSongs();
  const [loadedSongInfo, setLoadedSongInfo] = useState<{setlistId: string; songId: string} | null>(null);
  const [loadedQuickSongIndex, setLoadedQuickSongIndex] = useState<number | null>(null);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const [newlyAddedItemId, setNewlyAddedItemId] = useState<{type: 'setlist' | 'song', id: string} | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [selectedMeasureIndices, setSelectedMeasureIndices] = useState<number[]>([]);

  // Refs
  const panelRef = useRef<HTMLDivElement>(null);
  const mainContentEndRef = useRef<HTMLDivElement>(null);
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const isSwitchingSong = useRef(false); // Prevents race conditions when changing songs while playing

  // Memoized settings for the audio engine, adapting to simple vs. advanced sequencer mode
  const settingsForEngine = useMemo(() => {
    if (isAdvSequencerActive) {
      // In advanced mode, use the full song sequence
      return settings;
    }
    // In simple mode, the engine runs with a sequence containing only the first measure.
    const simpleSequence = settings.measureSequence.length > 0 ? [settings.measureSequence[0]] : [];
    return {
      ...settings,
      measureSequence: simpleSequence,
    };
  }, [settings, isAdvSequencerActive]);
  
  const { isPlaying, currentStep, togglePlay: engineTogglePlay } = useMetronomeEngine(settingsForEngine, audioEngineRef);
  
  const hasSongs = useMemo(() => setlists.some(sl => sl.songs.length > 0), [setlists]);
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
            masterVolume: settings.masterVolume, // Master volume is always global
            swing: measure.swing ?? settings.swing,
            countIn: settings.countIn,
            loop: settings.loop,
            simpleView: settings.simpleView,
        };
    }
    // In simple mode, or if no measure or multiple measures are selected, show global song settings.
    return settings;
  }, [settings, singleEditingMeasureIndex, isAdvSequencerActive]);

  // Determines which measure to display in the rhythm slider and simple sequencer view
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
    setLoadedQuickSongIndex(null); // Loading a setlist song clears quick song status
    setSelectedMeasureIndices([]);
    setIsDirty(false);
    setActivePanel(null);
  }, [isPlaying, togglePlay]);

  useEffect(() => {
    // This effect should only run once on startup to load the first song if available.
    if (!initialLoadComplete && setlists.length > 0 && setlists[0].songs.length > 0) {
      handleLoadSong(setlists[0].songs[0], setlists[0].id);
      setInitialLoadComplete(true);
    }
  }, [setlists, initialLoadComplete, handleLoadSong]);
  
  useEffect(() => {
    // When entering sequence edit mode, close any open panels.
    if (isEditingSequence) {
        setActivePanel(null);
    }
  }, [isEditingSequence]);

  useEffect(() => {
    // Prevents page scroll on mobile browsers when dragging a slider.
    const isActive = isRhythmSliderActive || isKnobActive || isBpmSliderDragging;
    const mainEl = document.querySelector('main');

    if (mainEl) {
      mainEl.style.overflowY = isActive ? 'hidden' : 'auto';
    }
    document.body.style.overscrollBehaviorY = isActive ? 'contain' : 'auto';
    
    return () => {
      if (mainEl) {
        mainEl.style.overflowY = 'auto';
      }
      document.body.style.overscrollBehaviorY = 'auto';
    };
  }, [isRhythmSliderActive, isKnobActive, isBpmSliderDragging]);

  useEffect(() => {
    // Triggers a visual beat effect in the BPM control
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
    // Clear the currently playing song ID when playback stops
    if (!isPlaying && !isSwitchingSong.current) {
      setCurrentlyPlayingId(null);
    }
  }, [isPlaying]);

  useEffect(() => {
    // Auto-scroll to the bottom when a panel (Mixer/Sounds) is opened
    if (activePanel && mainContentEndRef.current) {
      setTimeout(() => mainContentEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 150);
    }
  }, [activePanel]);
  
  const loadedSongId = useMemo(() => loadedSongInfo?.songId ?? null, [loadedSongInfo]);

  // Generic settings update handler. It handles both global and measure-specific changes.
  const updateSetting = useCallback(<K extends keyof MetronomeSettings>(key: K, value: MetronomeSettings[K]) => {
    if (loadedSongInfo) setIsDirty(true);
    if (loadedQuickSongIndex !== null) setLoadedQuickSongIndex(null);

    setSettings(prev => {
        // If a single measure is selected in advanced view, update its specific settings
        if (isAdvSequencerActive && singleEditingMeasureIndex !== null && prev.measureSequence[singleEditingMeasureIndex]) {
            // Some settings are always global
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
        // Otherwise, update the global song settings
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
            // Turning ON: Prepend a new count-in measure.
            const firstSongMeasure = newSequence.length > 0 ? newSequence[0] : { beats: 4, subdivisions: 2 };
            const countInMeasure: Measure = {
                id: `m-countin-${Date.now()}`,
                beats: firstSongMeasure.beats,
                subdivisions: 1, // Count-in is typically just quarter notes.
                pattern: generateDefaultPattern(firstSongMeasure.beats, 1),
            };
            newSequence.unshift(countInMeasure);
        } else if (!enabled && wasEnabled) {
            // Turning OFF: Remove the prepended count-in measure.
            if (newSequence.length > 0 && newSequence[0].id.startsWith('m-countin-')) {
                newSequence.shift();
            }
            // If turning off left the sequence empty, add a default measure.
            if (newSequence.length === 0) {
                newSequence.push({
                    id: `m-${Date.now()}-1`,
                    beats: 4,
                    subdivisions: 2,
                    pattern: generateDefaultPattern(4, 2),
                });
            }
        }

        return {
            ...prev,
            countIn: enabled,
            measureSequence: newSequence,
        };
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
        
        // Regenerate the step pattern when beats or subdivisions change
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
        const newMeasure: Measure = {
            ...JSON.parse(JSON.stringify(measureToCopy)),
            id: `m-${Date.now()}`
        };
        newSequence.splice(indexToDuplicate + 1, 0, newMeasure);
        return { ...prev, measureSequence: newSequence };
    });
  }, [loadedSongInfo, loadedQuickSongIndex]);


  const handlePanelToggle = useCallback((panel: 'mixer' | 'sounds') => {
    setActivePanel(prev => prev === panel ? null : panel);
  }, []);

  const handleToggleSongsContainer = useCallback(() => {
    const nextState = !isSongsContainerOpen;
    setIsSongsContainerOpen(nextState);
    if (!nextState) {
        setActiveSetlistId(null);
    }
  }, [isSongsContainerOpen]);
  
  const handleLoadAndPlay = useCallback((song: PlaylistItem, setlistId: string) => {
    const wasPlaying = isPlaying;
    const isSwitching = loadedSongId !== song.id;

    if (isSwitching) {
        // Use a ref to prevent useEffect from clearing the playing ID during the switch
        isSwitchingSong.current = true;
        handleLoadSong(song, setlistId);
    }

    setCurrentlyPlayingId(song.id);

    if (!wasPlaying || isSwitching) {
        // Short delay to allow state to update before starting playback
        setTimeout(() => {
            engineTogglePlay();
            isSwitchingSong.current = false;
        }, 50);
    } else {
        isSwitchingSong.current = false;
    }
    setActivePanel(null);
  }, [isPlaying, engineTogglePlay, loadedSongId, handleLoadSong]);

  const handleStop = useCallback(() => {
    if (isPlaying) togglePlay();
    setCurrentlyPlayingId(null);
  }, [isPlaying, togglePlay]);

  const onRenameTriggered = useCallback(() => setNewlyAddedItemId(null), []);

  const handleFlip = useCallback((isFlipped: boolean) => {
    if (isPlaying) togglePlay();
    if (loadedQuickSongIndex !== null) setLoadedQuickSongIndex(null);
    
    // If flipping back to simple view, ensure we exit edit mode.
    if (!isFlipped) {
        setIsEditingSequence(false);
        setSelectedMeasureIndices([]);
    }

    setIsAdvSequencerActive(isFlipped);

    // Update settings based on the flip action, creating a sensible default structure if needed
    setSettings(prev => {
      let newSequence = [...prev.measureSequence];
      let newCountIn = prev.countIn;

      if (isFlipped) {
          // When flipping to advanced from a simple, single-measure song, create a default advanced structure.
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
          // Flipping back to simple view. If count-in was on, disable it and clean up the sequence.
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

  const { stepInMeasure, playingMeasureIndex } = useMemo(() => {
    const sequenceToUse = settingsForEngine.measureSequence;
    if (currentStep === -1 || sequenceToUse.length === 0) {
      return { stepInMeasure: -1, playingMeasureIndex: -1 };
    }
    let globalStepCounter = 0;
    for (let i = 0; i < sequenceToUse.length; i++) {
        const measure = sequenceToUse[i];
        const measureLength = measure.pattern.length;
        if (currentStep < globalStepCounter + measureLength) {
            return {
                stepInMeasure: currentStep - globalStepCounter,
                playingMeasureIndex: i,
            };
        }
        globalStepCounter += measureLength;
    }
    return { stepInMeasure: -1, playingMeasureIndex: -1 };
  }, [currentStep, settingsForEngine.measureSequence]);

  useEffect(() => {
    // This effect makes the advanced sequencer follow the currently playing measure.
    if (isAdvSequencerActive && isPlaying && playingMeasureIndex !== null && playingMeasureIndex > -1) {
      setSelectedMeasureIndices([playingMeasureIndex]);
    }
  }, [isPlaying, playingMeasureIndex, isAdvSequencerActive]);


  // --- SETLIST PLAYER NAVIGATION ---
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
          setActivePanel(null);
      }
  }, [loadedSongInfo, setlists]);


  // --- QUICK SONG ACTIONS ---
  const handleLoadQuickSong = useCallback((slotIndex: number) => {
      const song = quickSongs[slotIndex];
      if (!song) return;

      if (isPlaying) togglePlay();
      
      const newSettings = migrateSettingsIfNeeded(song.settings);
      const isAdvanced = newSettings.isAdvanced ?? false;
      setIsAdvSequencerActive(isAdvanced);
      setSettings(newSettings);

      setLoadedQuickSongIndex(slotIndex);
      setLoadedSongInfo(null); // Loading a quick song clears setlist song status

      setSelectedMeasureIndices([]);
      setIsDirty(false);
      setActivePanel(null);

  }, [quickSongs, isPlaying, togglePlay]);

  const handleSaveQuickSong = useCallback((slotIndex: number) => {
      const newQuickSongs = [...quickSongs];
      const songToSave: PlaylistItem = {
          id: `qs-${Date.now()}`,
          name: `Slot ${slotIndex + 1}`,
          settings: JSON.parse(JSON.stringify(settings)) // Deep copy
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
          if (isPressing) {
              newSet.add(slotIndex);
          } else {
              newSet.delete(slotIndex);
          }
          return newSet;
      });
  }, []);

  const handleRandomize = useCallback(() => {
    if (isPlaying) togglePlay();

    // Weighted randomness for more musical results
    const beatChances = [2, 3, 4, 4, 4, 4, 4, 5, 6, 7];
    const subChances = [1, 2, 3, 4, 4];

    const randomBeats = beatChances[Math.floor(Math.random() * beatChances.length)];
    const randomSubdivisions = subChances[Math.floor(Math.random() * subChances.length)];
    
    // Triplets (3 subdivisions) typically don't have swing
    const randomSwing = randomSubdivisions === 3 ? 0 : (Math.random() < 0.4 ? Math.random() * 0.6 + 0.1 : 0);
    const randomPattern = generateRandomPattern(randomBeats, randomSubdivisions);

    const randomMeasure: Measure = {
        id: `m-random-${Date.now()}`,
        beats: randomBeats,
        subdivisions: randomSubdivisions,
        pattern: randomPattern,
    };

    const newSettings: MetronomeSettings = {
        bpm: Math.floor(Math.random() * (180 - 60 + 1)) + 60,
        beatSoundId: SOUND_OPTIONS[Math.floor(Math.random() * SOUND_OPTIONS.length)].id,
        subdivisionSoundId: SOUND_OPTIONS[Math.floor(Math.random() * SOUND_OPTIONS.length)].id,
        accentVolume: Math.random() * 0.5 + 0.5, // Range: 0.5 to 1.0
        beatVolume: Math.random() * 0.5 + 0.25, // Range: 0.25 to 0.75
        masterVolume: settings.masterVolume, // Keep user's master volume
        swing: randomSwing,
        measureSequence: [randomMeasure],
        countIn: false,
        loop: true,
        isAdvanced: false,
        simpleView: Math.random() < 0.5 ? 'grid' : 'rings',
    };
    
    setSettings(newSettings);
    setIsAdvSequencerActive(false);
    setLoadedSongInfo(null);
    setLoadedQuickSongIndex(null);
    setSelectedMeasureIndices([]);
    setIsDirty(false); // This is a new "session", not a modified song
    setActivePanel(null);

  }, [isPlaying, togglePlay, settings.masterVolume]);

  // --- SETLIST & SONG CRUD ---
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
        
        // Use a deep copy of the CURRENT settings for the new song.
        const newSongSettings: MetronomeSettings = JSON.parse(JSON.stringify(settings));

        const newSong: PlaylistItem = { 
            id: newId, 
            name: `New Song ${targetSetlist.songs.length + 1}`, 
            settings: newSongSettings 
        };
        
        setSetlists(prev => {
            const newSetlists = prev.map(sl => sl.id === setlistId ? { ...sl, songs: [...sl.songs, newSong] } : sl);
            saveSetlists(newSetlists);
            return newSetlists;
        });

        // Load the newly created song. Since it's based on current settings,
        // this will feel seamless to the user.
        setSettings(newSongSettings);
        setIsAdvSequencerActive(newSongSettings.isAdvanced ?? false);
        setLoadedSongInfo({ setlistId, songId: newId });
        setLoadedQuickSongIndex(null);
        setSelectedMeasureIndices([]);
        setIsDirty(false); // It's a newly saved song, so it's not "dirty".
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

  const handleAddDemoSetlist = useCallback(() => {
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

  const activeSetlist = useMemo(() => (currentSetlistIndex === -1) ? null : setlists[currentSetlistIndex], [setlists, currentSetlistIndex]);
  const isOverlayVisible = isRhythmSliderActive || isKnobActive;

  return (
    <div className="h-screen w-full flex flex-col font-sans relative">
      {isSettingsViewVisible ? (
          <SettingsModal 
              onClose={() => setIsSettingsViewVisible(false)}
              settings={appSettings}
              updateSetting={updateAppSetting}
              factoryReset={factoryReset}
              addDemoSetlist={handleAddDemoSetlist}
              onOpenManual={() => {
                setIsSettingsViewVisible(false);
                setIsManualViewVisible(true);
              }}
          />
      ) : isFeedbackViewVisible ? (
          <FeedbackModal 
              onClose={() => setIsFeedbackViewVisible(false)}
          />
      ) : isManualViewVisible ? (
          <ManualModal
              onClose={() => setIsManualViewVisible(false)}
          />
      ) : (
        <>
          {isOverlayVisible && <div className="fixed inset-0 bg-black/75 z-30" />}
          <main className="flex-1 w-full overflow-y-auto">
            <div className="w-full max-w-[380px] mx-auto flex flex-col items-center gap-4 px-[15px] py-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)', paddingBottom: !!activeSetlistId ? 'calc(env(safe-area-inset-bottom, 0px) + 140px)' : 'calc(env(safe-area-inset-bottom, 0px) + 1rem)'}}>
              <div className="w-full h-10 flex items-center justify-center text-[var(--text-secondary)] uppercase text-sm tracking-widest font-bold">Pulse Q</div>
              
              <BpmControl 
                bpm={settingsForDisplay.bpm} 
                onChange={(v) => updateSetting('bpm', v)} 
                beatTrigger={beatTrigger} 
                isShrunk={!!activeSetlistId} 
                hasSongs={hasSongs} 
                disabled={isEditingSequence} 
                onIsDraggingChange={setIsBpmSliderDragging} 
                showTapButton={appSettings.showTapButton} 
                showSlider={appSettings.showBpmControl}
                min={appSettings.minBpm}
                max={appSettings.maxBpm}
              />
                        
              <div className={`relative w-full flex items-center justify-center gap-4 bg-[var(--container-bg)] backdrop-blur-lg border border-[var(--container-border)] rounded-3xl px-[15px] py-2 transition-all duration-300 ${isRhythmSliderActive ? 'z-40' : ''} ${isEditingSequence ? 'opacity-50 pointer-events-none' : ''}`}>
                  <RhythmSlider label="Beats" value={measureForDisplay.beats} min={1} max={16} onChange={(v) => handleSimpleRhythmChange('beats', v)} onInteractionStateChange={setIsRhythmSliderActive} accentColor='var(--strong-beat-accent)' />
                  <button
                      onClick={togglePlay}
                      disabled={isEditingSequence || !!activeSetlistId}
                      className={`flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-300 ease-in-out ${isPlaying ? 'bg-gray-400 text-black border-2 border-black/20' : 'bg-white/20 hover:bg-white/30 text-white border border-white/30'} ${!!activeSetlistId ? 'w-0 h-0 scale-0 opacity-0' : 'w-20 h-20 scale-100 opacity-100'}`}
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                      aria-hidden={!!activeSetlistId}
                  >
                      {isPlaying ? <PauseIcon /> : <PlayIcon />}
                  </button>
                  <RhythmSlider label="SUBD." value={measureForDisplay.subdivisions} min={1} max={16} onChange={(v) => handleSimpleRhythmChange('subdivisions', v)} onInteractionStateChange={setIsRhythmSliderActive} accentColor='var(--secondary-accent)' />
              </div>

              {appSettings.showSetlists && (
                <div className={isEditingSequence ? 'opacity-50 pointer-events-none w-full' : 'w-full'}>
                    <SetlistManager 
                    setlists={setlists} 
                    currentlyPlayingId={currentlyPlayingId}
                    playingSetlistId={playingSetlistId}
                    loadedSongInfo={loadedSongInfo} 
                    newlyAddedItemId={newlyAddedItemId} 
                    isDirty={isDirty} 
                    actions={setlistActions}
                    onLoadSong={handleLoadSong} 
                    onLoadAndPlaySong={handleLoadAndPlay}
                    onStop={handleStop}
                    isPlaying={isPlaying}
                    onRenameTriggered={onRenameTriggered} 
                    isContainerOpen={isSongsContainerOpen} 
                    onToggleVisibility={handleToggleSongsContainer} 
                    onActiveSetlistChange={setActiveSetlistId}
                    />
                </div>
              )}

              {appSettings.showSequencer && (
                <div className={`w-full ${isRhythmSliderActive ? 'relative z-40' : ''} ${isEditingSequence ? 'relative z-10' : ''}`}>
                    <Sequencer
                    // Props for the simple (front) view
                    beats={simpleViewMeasure.beats}
                    subdivisions={simpleViewMeasure.subdivisions}
                    pattern={simpleViewMeasure.pattern}
                    onPatternChange={handlePatternChange}
                    currentStep={isAdvSequencerActive ? -1 : stepInMeasure}
                    bpm={settingsForDisplay.bpm}
                    simpleView={settings.simpleView ?? 'grid'}
                    onSimpleViewChange={(view) => updateSetting('simpleView', view)}
                    
                    // Props for the advanced (back) view
                    measureSequence={settings.measureSequence}
                    onMeasureSequenceChange={handleMeasureSequenceChange}
                    onDuplicateMeasure={handleDuplicateMeasure}
                    globalCurrentStep={currentStep}
                    selectedMeasureIndices={selectedMeasureIndices}
                    onSetSelectedMeasureIndices={setSelectedMeasureIndices}
                    countInEnabled={settings.countIn ?? false}
                    onCountInChange={handleCountInChange}
                    loopEnabled={settings.loop ?? true}
                    onLoopChange={(v) => updateSetting('loop', v)}

                    // General props
                    isPlaying={isPlaying}
                    isFlipped={isAdvSequencerActive}
                    onFlip={handleFlip}
                    isEditMode={isEditingSequence}
                    onEditModeChange={setIsEditingSequence}
                    />
                </div>
              )}

              {appSettings.showQuickSongs && (
                <div className={`w-full transition-all duration-300 ease-in-out ${isAdvSequencerActive ? 'max-h-0 opacity-0' : 'max-h-[120px] opacity-100'}`}>
                  <div className={`relative w-full bg-[var(--container-bg)] backdrop-blur-lg border border-[var(--container-border)] rounded-3xl p-[15px] overflow-hidden`}>
                    {pressingSlots.size > 0 && (
                      <div 
                        key={Array.from(pressingSlots).join(',')}
                        className="absolute top-[1px] left-[24px] right-[24px] h-[2px] overflow-hidden"
                        style={{ maskImage: 'linear-gradient(to right, transparent, black 20%, black 80%, transparent)' }}
                      >
                        <div className="w-full h-full bg-[var(--primary-accent)] animate-progress-bar"></div>
                      </div>
                    )}
                    <QuickSongBar
                        quickSongs={quickSongs}
                        onLoadSong={handleLoadQuickSong}
                        onSaveSong={handleSaveQuickSong}
                        onRandomize={handleRandomize}
                        loadedQuickSongIndex={loadedQuickSongIndex}
                        disabled={isEditingSequence}
                        onPressingChange={handleQuickSongPressingChange}
                    />
                  </div>
                </div>
              )}
              
              <div className={`w-full flex items-stretch justify-center gap-2 ${isEditingSequence ? 'opacity-50 pointer-events-none' : ''}`}>
                  <button onClick={() => handlePanelToggle('mixer')} disabled={isEditingSequence} className={`flex-1 flex justify-center items-center gap-2 transition-all duration-300 px-2 py-3 text-sm font-medium backdrop-blur-lg border rounded-3xl ${activePanel === 'mixer' ? 'bg-white/20 border-white/30' : 'bg-[var(--container-bg)] border-[var(--container-border)] hover:bg-white/10'}`} aria-pressed={activePanel === 'mixer'}><MixerIcon /> Mixer</button>
                  <button onClick={() => handlePanelToggle('sounds')} disabled={isEditingSequence} className={`flex-1 flex justify-center items-center gap-2 transition-all duration-300 px-2 py-3 text-sm font-medium backdrop-blur-lg border rounded-3xl ${activePanel === 'sounds' ? 'bg-white/20 border-white/30' : 'bg-[var(--container-bg)] border-[var(--container-border)] hover:bg-white/10'}`} aria-pressed={activePanel === 'sounds'}><SoundIcon /> Sounds</button>
              </div>

              {activePanel && (
                <div ref={panelRef} className={`w-full bg-[var(--container-bg)] backdrop-blur-lg border border-[var(--container-border)] rounded-3xl px-[15px] pt-6 pb-8 animate-panel ${isKnobActive ? 'z-40' : ''}`}>
                  {activePanel === 'mixer' && <div className="flex flex-col gap-4"><Knob label="Accent" value={settingsForDisplay.accentVolume} onChange={(v) => updateSetting('accentVolume', v)} color="var(--strong-beat-accent)" onInteractionStateChange={setIsKnobActive} /><Knob label="Subdivision" value={settingsForDisplay.beatVolume} onChange={(v) => updateSetting('beatVolume', v)} color="var(--secondary-accent)" onInteractionStateChange={setIsKnobActive} /><Knob label="Swing" value={settingsForDisplay.swing} onChange={(v) => updateSetting('swing', v)} min={0} max={1} color="var(--tertiary-accent)" onInteractionStateChange={setIsKnobActive} /><Knob label="Master" value={settings.masterVolume} onChange={(v) => updateSetting('masterVolume', v)} min={0} max={1} color="var(--text-primary)" onInteractionStateChange={setIsKnobActive} /></div>}
                  {activePanel === 'sounds' && <SoundSelector soundOptions={SOUND_OPTIONS} currentBeatSoundId={settingsForDisplay.beatSoundId} currentSubdivisionSoundId={settingsForDisplay.subdivisionSoundId} onBeatSoundSelect={(id) => updateSetting('beatSoundId', id)} onSubdivisionSoundSelect={(id) => updateSetting('subdivisionSoundId',id)} />}
                </div>
              )}
              
              <footer className="w-full text-center pt-8 pb-4 flex-shrink-0">
                <div className="flex justify-center items-center gap-4 mb-3">
                    <button onClick={() => setIsFeedbackViewVisible(true)} className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Feedback</button>
                    <div className="h-4 w-px bg-[var(--container-border)]"></div>
                    <button onClick={() => setIsSettingsViewVisible(true)} className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Settings</button>
                </div>
                <a href="https://www.instagram.com/deepdof/" target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--text-tertiary)] tracking-wider hover:text-[var(--text-secondary)] transition-colors">@deepdof</a>
              </footer>
              <div ref={mainContentEndRef} />
            </div>
          </main>
          
          {isEditingSequence && <div className="fixed inset-0 bg-black/50 z-5" />}

          {activeSetlistId && appSettings.showSetlists && <SetlistPlayer songs={activeSetlist?.songs ?? []} currentSongId={loadedSongId} isPlaying={isPlaying && currentlyPlayingId === loadedSongId} setlistName={activeSetlist?.name ?? ''} onPrevSong={handlePrevSong} onNextSong={handleNextSong} canGoPrevSong={canGoPrevSong} canGoNextSong={canGoNextSong} onPlayPause={() => {
              if (isEditingSequence) return;
              // If a song is loaded, play/pause it
              if (loadedSongId && activeSetlist) {
                  const songToPlay = activeSetlist.songs.find(s => s.id === loadedSongId);
                  if (!songToPlay) return;
                  if (currentlyPlayingId !== loadedSongId) {
                      handleLoadAndPlay(songToPlay, activeSetlist.id);
                  } else {
                      togglePlay();
                  }
              }
              // If no song is loaded, play the first one in the setlist
              else if (!loadedSongId && activeSetlist && activeSetlist.songs.length > 0) {
                  handleLoadAndPlay(activeSetlist.songs[0], activeSetlist.id);
              }
          }} isUiDisabled={isEditingSequence} />}
        </>
      )}

      {/* This component is a true modal and can overlay any view */}
      <AddToHomeScreenPrompt />
    </div>
  );
};

export default App;
