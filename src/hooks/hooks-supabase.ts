import React, { useState, useEffect, useCallback } from 'react';
import { type MetronomeSettings, type PlaylistItem, type Setlist } from '../types/types';
import { migrateSettingsIfNeeded, createDemoSetlist } from '../utils/utils';
import { setlistService, quickSongsService, appSettingsService } from '../services/supabaseService';

/**
 * @hook useSetlist (Supabase version)
 * @description Manages the state for all user-created setlists and songs.
 * Handles loading from Supabase with localStorage fallback, and migrating data from older formats.
 * @returns {{setlists: Setlist[], setSetlists: React.Dispatch<React.SetStateAction<Setlist[]>>, saveSetlists: (listToSave: Setlist[]) => void}}
 */
export const useSetlist = () => {
    const [setlists, setSetlists] = useState<Setlist[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load setlists from Supabase or localStorage fallback
    useEffect(() => {
        const loadSetlists = async () => {
            setIsLoading(true);
            
            try {
                // Try Supabase first
                const supabaseSetlists = await setlistService.getSetlists();
                
                if (supabaseSetlists.length > 0) {
                    setSetlists(supabaseSetlists);
                    setIsLoading(false);
                    return;
                }
            } catch (error) {
                console.warn('Supabase not available, falling back to localStorage:', error);
            }

            // Fallback to localStorage
            const storedData = localStorage.getItem('metronomeSetlist');
            if (storedData === null) {
                const demoData = createDemoSetlist();
                localStorage.setItem('metronomeSetlist', JSON.stringify(demoData));
                setSetlists(demoData);
            } else {
                try {
                    const parsedData = JSON.parse(storedData);
                    if (parsedData.length === 0) {
                        const demoData = createDemoSetlist();
                        localStorage.setItem('metronomeSetlist', JSON.stringify(demoData));
                        setSetlists(demoData);
                    } else {
                        // Migrate old format if needed
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
                            setSetlists(migratedData);
                        } else {
                            setSetlists(parsedData.map((setlist: any) => ({
                                ...setlist,
                                songs: setlist.songs.map((p: any) => ({
                                    ...p,
                                    settings: migrateSettingsIfNeeded(p.settings)
                                }))
                            })));
                        }
                    }
                } catch (e) {
                    console.error("Failed to parse setlist from localStorage, starting fresh.", e);
                    const demoData = createDemoSetlist();
                    localStorage.setItem('metronomeSetlist', JSON.stringify(demoData));
                    setSetlists(demoData);
                }
            }
            
            setIsLoading(false);
        };

        loadSetlists();
    }, []);

    const saveSetlists = useCallback(async (listToSave: Setlist[]) => {
        try {
            // Save to Supabase with proper position handling
            for (let i = 0; i < listToSave.length; i++) {
                await setlistService.saveSetlist(listToSave[i], i);
            }
            
            // Also save to localStorage as backup
            localStorage.setItem('metronomeSetlist', JSON.stringify(listToSave));
            
            // Update local state
            setSetlists(listToSave);
        } catch (error) {
            console.error('Error saving setlists:', error);
            // Fallback to localStorage only
            localStorage.setItem('metronomeSetlist', JSON.stringify(listToSave));
            setSetlists(listToSave);
        }
    }, []);

    return { setlists, setSetlists, saveSetlists, isLoading };
};

/**
 * @hook useQuickSongs (Supabase version)
 * @description Manages the state for the three "quick song" slots.
 * Handles loading from Supabase with localStorage fallback.
 * @returns {{quickSongs: (PlaylistItem | null)[], saveQuickSongs: (newQuickSongs: (PlaylistItem | null)[]) => void}}
 */
export const useQuickSongs = () => {
    const [quickSongs, setQuickSongs] = useState<(PlaylistItem | null)[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load quick songs from Supabase or localStorage fallback
    useEffect(() => {
        const loadQuickSongs = async () => {
            setIsLoading(true);
            
            try {
                // Try Supabase first
                const supabaseQuickSongs = await quickSongsService.getQuickSongs();
                
                if (supabaseQuickSongs.some(song => song !== null)) {
                    setQuickSongs(supabaseQuickSongs);
                    setIsLoading(false);
                    return;
                }
            } catch (error) {
                console.warn('Supabase not available, falling back to localStorage:', error);
            }

            // Fallback to localStorage
            const storedData = localStorage.getItem('metronomeQuickSongs');
            if (storedData) {
                try {
                    const parsed = JSON.parse(storedData);
                    if (Array.isArray(parsed)) {
                        const validated = new Array(3).fill(null);
                        for (let i = 0; i < 3; i++) {
                            if (parsed[i]) {
                                validated[i] = { ...parsed[i], settings: migrateSettingsIfNeeded(parsed[i].settings) };
                            }
                        }
                        setQuickSongs(validated);
                    }
                } catch (e) {
                    console.error("Failed to parse quick songs from localStorage.", e);
                    setQuickSongs(new Array(3).fill(null));
                }
            } else {
                setQuickSongs(new Array(3).fill(null));
            }
            
            setIsLoading(false);
        };

        loadQuickSongs();
    }, []);

    const saveQuickSongs = useCallback(async (newQuickSongs: (PlaylistItem | null)[]) => {
        try {
            // Save to Supabase - handle both saves and deletions
            for (let i = 0; i < newQuickSongs.length; i++) {
                if (newQuickSongs[i]) {
                    // Save the song to this slot
                    await quickSongsService.saveQuickSong(i, newQuickSongs[i]!);
                } else {
                    // Delete the song from this slot (clear it)
                    await quickSongsService.deleteQuickSong(i);
                }
            }
            
            // Also save to localStorage as backup
            localStorage.setItem('metronomeQuickSongs', JSON.stringify(newQuickSongs));
            
            // Update local state
            setQuickSongs(newQuickSongs);
        } catch (error) {
            console.error('Error saving quick songs:', error);
            // Fallback to localStorage only
            localStorage.setItem('metronomeQuickSongs', JSON.stringify(newQuickSongs));
            setQuickSongs(newQuickSongs);
        }
    }, []);

    return { quickSongs, saveQuickSongs, isLoading };
};

/**
 * @hook useAppSettings (Supabase version)
 * @description Manages app-wide settings like UI preferences and configuration.
 * Handles loading from Supabase with localStorage fallback.
 * @returns {{settings: any, updateSetting: (key: string, value: any) => void, factoryReset: () => void, isLoading: boolean}}
 */
export const useAppSettings = () => {

        // Define defaults
    const DEFAULT_SETTINGS = {
        showBpmControl: true,
        showTapButton: true,
        showQuickSongs: true,
        showSetlists: true,
        showSequencer: true,
        minBpm: 40,
        maxBpm: 340
    };
 const [settings, setSettings] = useState<any>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);

    // Load app settings from Supabase or localStorage fallback
    useEffect(() => {
        const loadAppSettings = async () => {
            setIsLoading(true);
            
            try {
                // Try Supabase first
                const supabaseSettings = await appSettingsService.getAppSettings();
                
                if (supabaseSettings) {
                    setSettings(supabaseSettings);
                    setIsLoading(false);
                    return;
                }
            } catch (error) {
                console.warn('Supabase not available, falling back to localStorage:', error);
            }

            // Fallback to localStorage
            const storedData = localStorage.getItem('metronomeAppSettings');
            if (storedData) {
                try {
                    const parsed = JSON.parse(storedData);
                    setSettings(parsed);
                } catch (e) {
                    console.error("Failed to parse app settings from localStorage.", e);
                    // Use default settings
                    const defaultSettings = {
                        showBpmControl: true,
                        showTapButton: true,
                        showQuickSongs: true,
                        showSetlists: true,
                        showSequencer: true,
                        minBpm: 40,
                        maxBpm: 340
                    };
                    setSettings(defaultSettings);
                }
            } else {
                // Use default settings
                const defaultSettings = {
                    showBpmControl: true,
                    showTapButton: true,
                    showQuickSongs: true,
                    showSetlists: true,
                    showSequencer: true,
                    minBpm: 40,
                    maxBpm: 340
                };
                setSettings(defaultSettings);
            }
            
            setIsLoading(false);
        };

        loadAppSettings();
    }, []);

    const updateSetting = useCallback(async (key: string, value: any) => {
        const newSettings = { ...settings, [key]: value };
        
        try {
            // Save to Supabase
            await appSettingsService.saveAppSettings(newSettings);
            
            // Also save to localStorage as backup
            localStorage.setItem('metronomeAppSettings', JSON.stringify(newSettings));
            
            // Update local state
            setSettings(newSettings);
        } catch (error) {
            console.error('Error saving app settings:', error);
            // Fallback to localStorage only
            localStorage.setItem('metronomeAppSettings', JSON.stringify(newSettings));
            setSettings(newSettings);
        }
    }, [settings]);

    const factoryReset = useCallback(async () => {
        const defaultSettings = {
            showBpmControl: true,
            showTapButton: true,
            showQuickSongs: true,
            showSetlists: true,
            showSequencer: true,
            minBpm: 40,
            maxBpm: 340
        };
        
        try {
            // Save to Supabase
            await appSettingsService.saveAppSettings(defaultSettings);
            
            // Also save to localStorage as backup
            localStorage.setItem('metronomeAppSettings', JSON.stringify(defaultSettings));
            
            // Update local state
            setSettings(defaultSettings);
        } catch (error) {
            console.error('Error resetting app settings:', error);
            // Fallback to localStorage only
            localStorage.setItem('metronomeAppSettings', JSON.stringify(defaultSettings));
            setSettings(defaultSettings);
        }
    }, []);

    return { settings, updateSetting, factoryReset, isLoading };
};
