import React, { useMemo } from 'react';
import { type PlaylistItem } from '../types/types';
import { useMetronome } from '../contexts/MetronomeContext';
import { PlayerStopIcon, PlayerPlayIcon, SongNextIcon, SongPrevIcon } from './Icons';

interface SetlistPlayerProps {
    isUiDisabled?: boolean;
}

/**
 * Renders the bottom player bar for navigating and controlling playback within a setlist.
 * This component is displayed when a user has drilled into a specific setlist.
 */
const SetlistPlayer: React.FC<SetlistPlayerProps> = ({ isUiDisabled = false }) => {
    const {
        activeSetlist,
        loadedSongInfo,
        isPlaying,
        currentlyPlayingId,
        handlePrevSong,
        handleNextSong,
        canGoPrevSong,
        canGoNextSong,
        togglePlay,
        handleLoadAndPlay,
    } = useMetronome();

    const songs = activeSetlist?.songs ?? [];
    const currentSongId = loadedSongInfo?.songId ?? null;

    const onPlayPause = () => {
        if (isUiDisabled) return;
        // If a song is loaded, play/pause it
        if (currentSongId && activeSetlist) {
            const songToPlay = activeSetlist.songs.find(s => s.id === currentSongId);
            if (!songToPlay) return;
            if (currentlyPlayingId !== currentSongId) {
                handleLoadAndPlay(songToPlay, activeSetlist.id);
            } else {
                togglePlay();
            }
        }
        // If no song is loaded, play the first one in the setlist
        else if (!currentSongId && activeSetlist && activeSetlist.songs.length > 0) {
            handleLoadAndPlay(activeSetlist.songs[0], activeSetlist.id);
        }
    };

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
                <button onClick={handlePrevSong} disabled={!canGoPrevSong || isUiDisabled} className="w-[30%] flex items-center justify-center p-2 transition-colors hover:enabled:bg-white/10 disabled:text-white/30" aria-label="Previous song"><SongPrevIcon /></button>
                <div className="w-px bg-[var(--container-border)] opacity-50 my-3"></div>
                <button onClick={onPlayPause} disabled={!canPlay || isUiDisabled} className="w-[40%] flex flex-col items-center justify-center p-2 min-w-0 transition-colors hover:enabled:bg-white/10 disabled:opacity-50" aria-label={isPlaying ? "Stop" : "Play"}>
                    <span className="text-xs text-white/80 mb-1 truncate w-full text-center">{activeSetlist?.name ?? ''}</span>
                    {isPlaying ? <PlayerStopIcon/> : <PlayerPlayIcon/>}
                    <span className="text-sm text-white mt-1 truncate w-full text-center">{currentSongName}</span>
                </button>
                <div className="w-px bg-[var(--container-border)] opacity-50 my-3"></div>
                <button onClick={handleNextSong} disabled={!canGoNextSong || isUiDisabled} className="w-[30%] flex items-center justify-center p-2 transition-colors hover:enabled:bg-white/10 disabled:text-white/30" aria-label="Next song"><SongNextIcon /></button>
            </div>
        </div>
    );
}

export default SetlistPlayer;