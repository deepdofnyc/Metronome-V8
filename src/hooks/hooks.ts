

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AudioEngine } from './services/audioEngine';
import { type MetronomeSettings, type PlaylistItem, type Setlist } from './types';
import { migrateSettingsIfNeeded, createDemoSetlist } from './utils';

/**
 * @hook useMetronomeEngine
 * @description Manages the lifecycle and state of the AudioEngine.
 * @param {MetronomeSettings} settings - The current settings to be applied to the engine.
 * @param {React.MutableRefObject<AudioEngine | null>} audioEngineRef - A ref to hold the single AudioEngine instance.
 * @returns {{isPlaying: boolean, currentStep: number, togglePlay: () => Promise<void>}} - Playback state and control function.
 */
export const useMetronomeEngine = (settings: MetronomeSettings, audioEngineRef: React.MutableRefObject<AudioEngine | null>) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);

  // Callback passed to the audio engine to update the UI on each step
  const onStepChange = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);
  
  // Effect to initialize and terminate the audio engine instance
  useEffect(() => {
    if (!audioEngineRef.current) {
        const engine = new AudioEngine();
        audioEngineRef.current = engine;
    }
    const engine = audioEngineRef.current;
    
    // Cleanup on component unmount
    return () => { 
        if(engine) {
            engine.terminate(); // Stops engine and terminates the worker.
        }
    };
  }, [audioEngineRef]);

  // Effect to update the engine's settings when they change
  useEffect(() => {
    if (!audioEngineRef.current) return;
    audioEngineRef.current.onStepCallback = onStepChange;
    audioEngineRef.current.updateSettings(settings);
  }, [settings, onStepChange, audioEngineRef]);

  // Effect to reset the visual step counter when playback stops
  useEffect(() => { 
    if (!isPlaying) {
      setCurrentStep(-1);
    }
  }, [isPlaying]);

  const togglePlay = useCallback(async (startMeasureIndex?: number) => {
    const engine = audioEngineRef.current;
    if (!engine) return;
    
    // AudioContext must be initialized after a user gesture
    await engine.init(); 
    
    if (engine.getIsRunning()) {
      engine.stop();
      setIsPlaying(false);
    } else {
      engine.start(startMeasureIndex);
      setIsPlaying(true);
    }
  }, [audioEngineRef]);

  return { isPlaying, currentStep, togglePlay };
};

/**
 * @hook useQuickSongs
 * @description Manages the state for the three "quick song" slots.
 * Handles loading from and saving to localStorage.
 * @returns {{quickSongs: (PlaylistItem | null)[], saveQuickSongs: (newQuickSongs: (PlaylistItem | null)[]) => void}}
 */
export const useQuickSongs = () => {
    const [quickSongs, setQuickSongs] = useState<(PlaylistItem | null)[]>(() => {
        const storedData = localStorage.getItem('metronomeQuickSongs');
        if (storedData) {
            try {
                const parsed = JSON.parse(storedData);
                if (Array.isArray(parsed)) {
                    // Ensure it's an array of 3, padding with null if needed
                    const validated = new Array(3).fill(null);
                    for (let i = 0; i < 3; i++) {
                        if (parsed[i]) {
                            validated[i] = { ...parsed[i], settings: migrateSettingsIfNeeded(parsed[i].settings) };
                        }
                    }
                    return validated;
                }
            } catch (e) {
                console.error("Failed to parse quick songs from localStorage.", e);
            }
        }
        return new Array(3).fill(null);
    });

    const saveQuickSongs = (newQuickSongs: (PlaylistItem | null)[]) => {
        localStorage.setItem('metronomeQuickSongs', JSON.stringify(newQuickSongs));
        setQuickSongs(newQuickSongs);
    };
    
    return { quickSongs, saveQuickSongs };
};

/**
 * @hook useSetlist
 * @description Manages the state for all user-created setlists and songs.
 * Handles loading from localStorage, saving to localStorage, and migrating data from older formats.
 * @returns {{setlists: Setlist[], setSetlists: React.Dispatch<React.SetStateAction<Setlist[]>>, saveSetlists: (listToSave: Setlist[]) => void}}
 */
export const useSetlist = () => {
    const [setlists, setSetlists] = useState<Setlist[]>(() => {
        const storedData = localStorage.getItem('metronomeSetlist');
        // If no data exists, create and store the demo setlist.
        if (storedData === null) {
            const demoData = createDemoSetlist();
            localStorage.setItem('metronomeSetlist', JSON.stringify(demoData));
            return demoData;
        }

        try {
            const parsedData = JSON.parse(storedData);
            // If stored data is an empty array, initialize with demo data.
            if (parsedData.length === 0) {
                const demoData = createDemoSetlist();
                localStorage.setItem('metronomeSetlist', JSON.stringify(demoData));
                return demoData;
            }

            // Check if the data is in an old format (array of songs) and migrate it.
            if ('settings' in parsedData[0] && !('songs' in parsedData[0])) {
                const migratedData: Setlist[] = [{
                    id: `setlist-${Date.now()}`,
                    name: 'My Songs',
                    songs: parsedData.map((p: any) => ({
                        ...p,
                        id: p.id || `song-${Date.now()}-${Math.random()}`,
                        settings: migrateSettingsIfNeeded(p.settings)
                    }))
                }];
                localStorage.setItem('metronomeSetlist', JSON.stringify(migratedData));
                return migratedData;
            }
            
            // If data is in the new format, ensure all song settings within are up-to-date.
            return parsedData.map((setlist: any) => ({
                ...setlist,
                songs: setlist.songs.map((p: any) => ({
                    ...p,
                    settings: migrateSettingsIfNeeded(p.settings)
                }))
            }));
        } catch (e) {
            console.error("Failed to parse setlist from localStorage, starting fresh.", e);
            const demoData = createDemoSetlist();
            localStorage.setItem('metronomeSetlist', JSON.stringify(demoData));
            return demoData;
        }
    });

    const saveSetlists = (listToSave: Setlist[]) => {
        localStorage.setItem('metronomeSetlist', JSON.stringify(listToSave));
    };
    
    return { setlists, setSetlists, saveSetlists };
};

// --- App Settings Hook ---
export interface AppSettings {
  showBpmControl: boolean;
  showTapButton: boolean;
  showQuickSongs: boolean;
  showSetlists: boolean;
  showSequencer: boolean;
  minBpm: number;
  maxBpm: number;
}

const DEFAULT_APP_SETTINGS: AppSettings = {
  showBpmControl: true,
  showTapButton: true,
  showQuickSongs: true,
  showSetlists: true,
  showSequencer: true,
  minBpm: 40,
  maxBpm: 340,
};

/**
 * @hook useAppSettings
 * @description Manages general UI and behavior settings for the app.
 * Handles loading from and saving to localStorage. Also provides a factory reset function.
 * @returns {{settings: AppSettings, updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void, factoryReset: () => void}}
 */
export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const stored = localStorage.getItem('metronomeAppSettings_v1');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Merge stored settings with defaults to ensure all keys are present
        return { ...DEFAULT_APP_SETTINGS, ...parsed };
      } catch (e) {
        console.error("Failed to parse app settings from localStorage, using defaults.", e);
        return DEFAULT_APP_SETTINGS;
      }
    }
    return DEFAULT_APP_SETTINGS;
  });

  // Save settings to localStorage whenever they change.
  useEffect(() => {
    localStorage.setItem('metronomeAppSettings_v1', JSON.stringify(settings));
  }, [settings]);
  
  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  /** Wipes all application data from localStorage and reloads the page. */
  const factoryReset = () => {
    if (window.confirm('Are you sure you want to reset the app? All your setlists, quick songs, and settings will be permanently deleted.')) {
      localStorage.removeItem('metronomeAppSettings_v1');
      localStorage.removeItem('metronomeSetlist');
      localStorage.removeItem('metronomeQuickSongs');
      window.location.reload();
    }
  };

  return { settings, updateSetting, factoryReset };
};
