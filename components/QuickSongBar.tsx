import React, { useState, useRef, useCallback } from 'react';
import { type PlaylistItem, type MetronomeSettings } from '../types';
import { PlusIcon } from './Icons';

interface QuickSongBarProps {
  quickSongs: (PlaylistItem | null)[];
  onLoadSong: (slotIndex: number) => void;
  onSaveSong: (slotIndex: number) => void;
  loadedQuickSongIndex: number | null;
  disabled?: boolean;
  onPressingChange: (isPressing: boolean, slotIndex: number) => void;
}

const QuickSongSlot: React.FC<{
    song: PlaylistItem | null;
    slotIndex: number;
    isLoaded: boolean;
    onLoad: () => void;
    onSave: () => void;
    disabled?: boolean;
    onPressingChange: (isPressing: boolean) => void;
}> = ({ song, slotIndex, isLoaded, onLoad, onSave, disabled, onPressingChange }) => {
    const longPressTimeout = useRef<number | null>(null);
    const [isPressing, setIsPressing] = useState(false);

    const handlePressStart = useCallback(() => {
        if (disabled) return;
        onPressingChange(true);
        setIsPressing(true);

        // Schedule the long press action. It will be cancelled if the user releases early.
        longPressTimeout.current = window.setTimeout(() => {
            onSave(); // The action happens here, when the circle completes.
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            setIsPressing(false); // Reset pressing state, which removes the animation.
            longPressTimeout.current = null; // Mark the long press as completed.
        }, 1000); // 1-second duration matches the animation.
    }, [disabled, onSave, onPressingChange]);

    // Called on mouse up or touch end.
    const handlePressEnd = useCallback(() => {
        onPressingChange(false);
        // If a long press timer is still active, it means it was a short press.
        if (longPressTimeout.current) {
            clearTimeout(longPressTimeout.current);
            longPressTimeout.current = null;

            // Execute short press logic: only load if a song exists.
            if (song) {
                onLoad();
            }
        }
        // If the timeout is null, the long press already fired, so do nothing more.
        setIsPressing(false);
    }, [song, onLoad, onPressingChange]);
    
    // Called if the mouse leaves the button or the touch is cancelled.
    const handleCancel = useCallback(() => {
        onPressingChange(false);
        if (longPressTimeout.current) {
            clearTimeout(longPressTimeout.current);
            longPressTimeout.current = null;
        }
        setIsPressing(false);
    }, [onPressingChange]);


    const baseClasses = "w-16 h-16 rounded-full flex-shrink-0 flex flex-col items-center justify-center transition-all duration-200 relative select-none";
    const pressClasses = isPressing ? 'scale-90' : 'scale-100';

    if (song) {
        const settings = song.settings as MetronomeSettings;
        const firstMeasure = settings.measureSequence?.[0];
        const beats = firstMeasure?.beats ?? 4;
        const subdivisions = firstMeasure?.subdivisions ?? 4;
        const bpm = settings.bpm;

        return (
            <div className="relative">
                <button
                    onMouseDown={handlePressStart}
                    onMouseUp={handlePressEnd}
                    onMouseLeave={handleCancel}
                    onTouchStart={handlePressStart}
                    onTouchEnd={handlePressEnd}
                    onTouchCancel={handleCancel}
                    disabled={disabled}
                    className={`${baseClasses} ${pressClasses} bg-[var(--container-bg)] border border-[var(--container-border)] text-white`}
                    aria-label={`Load Quick Song ${slotIndex + 1}: ${beats} over ${subdivisions} at ${bpm} BPM`}
                >
                    {isLoaded && <div className="absolute inset-0 rounded-full ring-2 ring-offset-2 ring-offset-[var(--bg-color)] ring-[var(--primary-accent)]" />}
                    
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-xl font-bold text-white leading-none">{beats}</span>
                        <div className="w-8 h-px bg-[var(--text-secondary)] my-0.5"></div>
                        <span className="text-lg text-[var(--text-secondary)] leading-none">{subdivisions}</span>
                    </div>

                    {isPressing && (
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                             <circle
                                cx="50"
                                cy="50"
                                r="48"
                                fill={'rgba(var(--primary-accent-rgb), 0.3)'}
                                style={{ transition: 'fill 1s linear' }}
                            />
                            <circle
                                className="animate-radial-fill"
                                style={{ animationDuration: '1s' }}
                                cx="50"
                                cy="50"
                                r="48"
                                stroke="var(--primary-accent)"
                                strokeWidth="4"
                                fill="transparent"
                                strokeLinecap="round"
                            />
                        </svg>
                    )}
                </button>
                {bpm && (
                     <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs text-white/70 font-mono bg-[var(--bg-color)] px-1 rounded-sm pointer-events-none tabular-nums">{bpm}</span>
                )}
            </div>
        );
    }

    return (
        <button
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handleCancel}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
            onTouchCancel={handleCancel}
            disabled={disabled}
            className={`${baseClasses} ${pressClasses} border-2 border-dashed border-white/20 text-white/40 hover:bg-white/10 hover:border-white/40`}
            aria-label={`Save current settings to Quick Song slot ${slotIndex + 1}`}
        >
            <PlusIcon />
            {isPressing && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                    <circle
                        cx="50"
                        cy="50"
                        r="48"
                        fill={'rgba(var(--primary-accent-rgb), 0.3)'}
                        style={{ transition: 'fill 1s linear' }}
                    />
                    <circle
                        className="animate-radial-fill"
                        style={{ animationDuration: '1s' }}
                        cx="50"
                        cy="50"
                        r="48"
                        stroke="var(--primary-accent)"
                        strokeWidth="4"
                        fill="transparent"
                        strokeLinecap="round"
                    />
                </svg>
            )}
        </button>
    );
};


const QuickSongBar: React.FC<QuickSongBarProps> = ({ quickSongs, onLoadSong, onSaveSong, loadedQuickSongIndex, disabled, onPressingChange }) => {
  const allSlotsEmpty = quickSongs.every(song => song === null);

  return (
    <div className={`w-full flex flex-col items-center gap-2 transition-opacity duration-300 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="w-full flex items-start justify-center gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <QuickSongSlot
            key={index}
            slotIndex={index}
            song={quickSongs[index]}
            isLoaded={loadedQuickSongIndex === index}
            onLoad={() => onLoadSong(index)}
            onSave={() => onSaveSong(index)}
            disabled={disabled}
            onPressingChange={(isPressing) => onPressingChange(isPressing, index)}
          />
        ))}
      </div>
      {allSlotsEmpty && (
        <p className="text-xs text-center text-[var(--text-secondary)]">
          Long-press a slot to save.
        </p>
      )}
    </div>
  );
};

export default QuickSongBar;