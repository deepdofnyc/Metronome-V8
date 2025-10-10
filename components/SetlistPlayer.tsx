import React, { useMemo } from 'react';
import { type PlaylistItem } from '../types';
import { PlayerPauseIcon, PlayerPlayIcon, SongNextIcon, SongPrevIcon } from './Icons';

interface SetlistPlayerProps {
    songs: PlaylistItem[];
    currentSongId: string | null;
    isPlaying: boolean;
    onPlayPause: () => void;
    onPrevSong: () => void;
    onNextSong: () => void;
    canGoPrevSong: boolean;
    canGoNextSong: boolean;
    setlistName: string;
    isUiDisabled?: boolean;
}

/**
 * Renders the bottom player bar for navigating and controlling playback within a setlist.
 * This component is displayed when a user has drilled into a specific setlist.
 */
const SetlistPlayer: React.FC<SetlistPlayerProps> = ({
    songs, currentSongId, isPlaying, onPlayPause,
    onPrevSong, onNextSong, canGoPrevSong, canGoNextSong,
    setlistName, isUiDisabled = false
}) => {
    const { currentSongName } = useMemo(() => {
        if (!currentSongId || songs.length === 0) {
            return { currentSongName: 'No Song Selected' };
        }
        const index = songs.findIndex(song => song.id === currentSongId);
        return {
            currentSongName: index !== -1 ? songs[index].name : 'Song Not Found'
        };
    }, [currentSongId, songs]);

    const canPlay = currentSongId !== null || songs.length > 0;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--container-bg)] backdrop-blur-lg border-t border-[var(--container-border)] animate-panel" style={{ animationName: 'a2hs-fade-in' }}>
            <div className="w-full max-w-[380px] mx-auto flex items-stretch text-white" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px))' }}>
                <button onClick={onPrevSong} disabled={!canGoPrevSong || isUiDisabled} className="w-[30%] flex items-center justify-center p-2 transition-colors hover:enabled:bg-white/10 disabled:text-white/30" aria-label="Previous song"><SongPrevIcon /></button>
                <div className="w-px bg-[var(--container-border)] opacity-50 my-3"></div>
                <button onClick={onPlayPause} disabled={!canPlay || isUiDisabled} className="w-[40%] flex flex-col items-center justify-center p-2 min-w-0 transition-colors hover:enabled:bg-white/10 disabled:opacity-50" aria-label={isPlaying ? "Pause" : "Play"}>
                    <span className="text-xs text-white/80 mb-1 truncate w-full text-center">{setlistName}</span>
                    {isPlaying ? <PlayerPauseIcon/> : <PlayerPlayIcon/>}
                    <span className="text-sm text-white mt-1 truncate w-full text-center">{currentSongName}</span>
                </button>
                <div className="w-px bg-[var(--container-border)] opacity-50 my-3"></div>
                <button onClick={onNextSong} disabled={!canGoNextSong || isUiDisabled} className="w-[30%] flex items-center justify-center p-2 transition-colors hover:enabled:bg-white/10 disabled:text-white/30" aria-label="Next song"><SongNextIcon /></button>
            </div>
        </div>
    );
}

export default SetlistPlayer;