import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MIN_BPM,MAX_BPM } from '@/constants/constants';
import { useMetronome } from '../contexts/MetronomeContext';
// FIX: Removed unused 'PlayIcon' and non-existent 'PauseIcon' from imports.
import { BpmMinusIcon, BpmPlusIcon } from './Icons';

interface BpmControlProps {
  isShrunk?: boolean;
  disabled?: boolean;
  showTapButton?: boolean;
  showSlider?: boolean;
  min?: number;
  max?: number;
}

const BpmControl: React.FC<BpmControlProps> = ({ 
  isShrunk = false, 
  disabled = false, 
  showTapButton = true,
  showSlider = true,
  min = MIN_BPM,
  max = MAX_BPM,
}) => {
  const { settingsForDisplay, updateSetting, beatTrigger, setIsBpmSliderDragging } = useMetronome();
  const { bpm } = settingsForDisplay;

  // State for manual BPM input
  const [isEditingBpm, setIsEditingBpm] = useState(false);
  const [editedBpm, setEditedBpm] = useState(String(bpm));
  const bpmInputRef = useRef<HTMLInputElement>(null);

  // --- BPM Slider Drag Logic (like Knob.tsx) ---
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ initialX: number; initialY: number; initialValue: number; } | null>(null);
  const dragStartTimeoutRef = useRef<number | null>(null);
  const wasDragged = useRef(false);
  
  // --- Tap Tempo Logic ---
  const tapHistory = useRef<number[]>([]);
  const tapTimeoutRef = useRef<number | null>(null);

  // --- Long Press for Edit Logic ---
  const longPressTimeoutRef = useRef<number | null>(null);
  const longPressActionFired = useRef(false);

  // --- Beat Animation State ---
  const [isBeating, setIsBeating] = useState(false);
  const animationDurationMs = Math.min(800, (60 / bpm * 750)); 

  // --- Continuous Change Logic for +/- buttons ---
  const continuousChangeIntervalRef = useRef<number | null>(null);
  const continuousChangeTimeoutRef = useRef<number | null>(null);
  const continuousChangeActive = useRef(false);
  const bpmRef = useRef(bpm);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    setIsBpmSliderDragging(isDragging);
  }, [isDragging, setIsBpmSliderDragging]);

  const startContinuousChange = useCallback((direction: 'increment' | 'decrement') => {
    if (continuousChangeActive.current) return;
    continuousChangeActive.current = true;
    
    const changeAmount = direction === 'increment' ? 1 : -1;
    updateSetting('bpm', Math.max(min, Math.min(max, bpmRef.current + changeAmount)));

    continuousChangeTimeoutRef.current = window.setTimeout(() => {
      continuousChangeIntervalRef.current = window.setInterval(() => {
        const newBpm = bpmRef.current + changeAmount;
        updateSetting('bpm', Math.max(min, Math.min(max, newBpm)));
      }, 80);
    }, 600);
  }, [updateSetting, min, max]);
  
  const stopContinuousChange = useCallback(() => {
    if (continuousChangeTimeoutRef.current) {
      window.clearTimeout(continuousChangeTimeoutRef.current);
    }
    if (continuousChangeIntervalRef.current) {
      window.clearInterval(continuousChangeIntervalRef.current);
    }
    continuousChangeTimeoutRef.current = null;
    continuousChangeIntervalRef.current = null;
    
    setTimeout(() => {
      continuousChangeActive.current = false;
    }, 50);
  }, []);

  useEffect(() => {
    if (!isEditingBpm) {
      setEditedBpm(String(bpm));
    }
  }, [bpm, isEditingBpm]);
  
  useEffect(() => {
    if (isEditingBpm && bpmInputRef.current) {
        bpmInputRef.current.focus();
        bpmInputRef.current.select();
    }
  }, [isEditingBpm]);

  useEffect(() => {
    // Basic beat flash effect, independent of actual audio scheduling
    if (beatTrigger > 0) {
      setIsBeating(true);
      const timer = setTimeout(() => {
        setIsBeating(false);
      }, animationDurationMs / 2); // Flash for half the duration for a snappier feel

      return () => clearTimeout(timer);
    }
  }, [beatTrigger, animationDurationMs]);

  const handleBpmEditCommit = useCallback(() => {
    const newBpm = parseInt(editedBpm, 10);
    if (!isNaN(newBpm)) {
        updateSetting('bpm', Math.max(min, Math.min(max, newBpm)));
    }
    setIsEditingBpm(false);
  }, [editedBpm, updateSetting, min, max]);

  const handleBpmEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        handleBpmEditCommit();
    } else if (e.key === 'Escape') {
        setIsEditingBpm(false);
        setEditedBpm(String(bpm));
    }
  };

  const handleTap = () => {
    const now = performance.now();
    
    if (tapHistory.current.length > 0) {
      const lastTapTime = tapHistory.current[tapHistory.current.length - 1];
      if (now - lastTapTime > 2000) {
        tapHistory.current = [];
      }
    }
    
    tapHistory.current.push(now);
    
    if (tapHistory.current.length > 5) {
      tapHistory.current.shift();
    }

    if (tapHistory.current.length > 1) {
      const intervals = [];
      for (let i = 1; i < tapHistory.current.length; i++) {
        intervals.push(tapHistory.current[i] - tapHistory.current[i - 1]);
      }
      const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      if (averageInterval > 0) {
        const newBpm = Math.round(60000 / averageInterval);
        updateSetting('bpm', Math.max(min, Math.min(max, newBpm)));
      }
    }
    
    if (tapTimeoutRef.current) {
        window.clearTimeout(tapTimeoutRef.current);
    }
    tapTimeoutRef.current = window.setTimeout(() => {
        tapHistory.current = [];
    }, 2000);
  };

  const handleInteractionEnd = useCallback(() => {
    if (!isInteracting) return;
    
    if (dragStartTimeoutRef.current) {
        window.clearTimeout(dragStartTimeoutRef.current);
        dragStartTimeoutRef.current = null;
    }
    
    setIsInteracting(false);
    if (isDragging) {
      setIsDragging(false);
    }
    dragStartRef.current = null;
  }, [isInteracting, isDragging]);

  const handleInteractionMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isInteracting || !dragStartRef.current) return;
    
    // Determine if drag should start
    if (!isDragging) {
      const isTouchEvent = 'touches' in e;
      const currentX = isTouchEvent ? e.touches[0].clientX : e.clientX;
      const currentY = isTouchEvent ? e.touches[0].clientY : ('clientY' in e ? e.clientY : dragStartRef.current.initialY);
      const deltaX = Math.abs(currentX - dragStartRef.current.initialX);
      const deltaY = Math.abs(currentY - dragStartRef.current.initialY);
      const dragThreshold = 5;

      if (deltaX > dragThreshold || deltaY > dragThreshold) {
        if (isTouchEvent && deltaY > deltaX) {
          // Vertical scroll detected, cancel interaction
          handleInteractionEnd();
          return;
        }
        // Horizontal drag detected, start dragging
        if (dragStartTimeoutRef.current) {
            window.clearTimeout(dragStartTimeoutRef.current);
            dragStartTimeoutRef.current = null;
        }
        setIsDragging(true);
      }
    }

    if (isDragging) {
        if (e.cancelable) e.preventDefault();
        wasDragged.current = true;
        
        const isTouchEvent = 'touches' in e;
        const currentX = isTouchEvent ? e.touches[0].clientX : e.clientX;
        const totalDeltaX = currentX - dragStartRef.current.initialX;
        const sensitivity = 2; // 2px drag = 1 BPM change
        const valueChange = totalDeltaX / sensitivity;
        const newValue = dragStartRef.current.initialValue + valueChange;
        const clampedValue = Math.max(min, Math.min(max, Math.round(newValue)));

        if (clampedValue !== bpmRef.current) {
            updateSetting('bpm', clampedValue);
        }
    }
  }, [isInteracting, isDragging, updateSetting, handleInteractionEnd, min, max]);
  
  const handleInteractionStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.bpm-editor-area')) return;
        
    e.preventDefault();
    wasDragged.current = false;

    const nativeEvent = e.nativeEvent;
    const isTouchEvent = 'touches' in nativeEvent;
    const clientX = isTouchEvent ? nativeEvent.touches[0].clientX : nativeEvent.clientX;
    const clientY = isTouchEvent ? nativeEvent.touches[0].clientY : nativeEvent.clientY;
    
    dragStartRef.current = {
      initialX: clientX,
      initialY: clientY,
      initialValue: bpmRef.current,
    };
    
    setIsInteracting(true);
    
    // Set a short timeout to start dragging if user holds without moving
    dragStartTimeoutRef.current = window.setTimeout(() => {
        if(isInteracting) { // Check if interaction is still active
            setIsDragging(true);
        }
        dragStartTimeoutRef.current = null;
    }, 120);
  }, [isInteracting]);

  const handlePressStartForEdit = useCallback(() => {
    if (isDragging || isShrunk) return;
    longPressActionFired.current = false; // Reset on new press
    longPressTimeoutRef.current = window.setTimeout(() => {
      setIsEditingBpm(true);
      longPressActionFired.current = true; // Flag that the long press action happened
      longPressTimeoutRef.current = null;
    }, 500); // 500ms threshold for long press
  }, [isDragging, isShrunk]);

  const handlePressEndForEdit = useCallback(() => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    const moveHandler = (e: MouseEvent | TouchEvent) => handleInteractionMove(e);
    const endHandler = () => handleInteractionEnd();

    if (isInteracting) {
      document.addEventListener('mousemove', moveHandler);
      document.addEventListener('touchmove', moveHandler, { passive: false });
      document.addEventListener('mouseup', endHandler);
      document.addEventListener('touchend', endHandler);
    }
    return () => {
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('touchmove', moveHandler);
      document.removeEventListener('mouseup', endHandler);
      document.removeEventListener('touchend', endHandler);
    };
  }, [isInteracting, handleInteractionMove, handleInteractionEnd]);
  
  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      stopContinuousChange();
      if (tapTimeoutRef.current) window.clearTimeout(tapTimeoutRef.current);
      if (dragStartTimeoutRef.current) window.clearTimeout(dragStartTimeoutRef.current);
      if (longPressTimeoutRef.current) window.clearTimeout(longPressTimeoutRef.current);
    };
  }, [stopContinuousChange]);

  const handleContainerClick = (e: React.MouseEvent) => {
    if (wasDragged.current) return;
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
        return;
    }
    
    // If the long press action just fired, consume the flag and prevent the tap.
    if (longPressActionFired.current) {
        longPressActionFired.current = false;
        return;
    }

    if (showTapButton) {
        handleTap();
    }
  };

  const sliderPositionPercent = max > min ? ((bpm - min) / (max - min)) * 100 : 0;

  const bpmContainerClasses = [
    "w-full bg-[var(--container-bg)] backdrop-blur-lg rounded-3xl flex items-center justify-center select-none relative overflow-hidden",
    isBeating ? "bpm-container-pulse" : "bpm-container-base",
    "transition-all duration-500 ease-in-out",
    disabled ? '' : (showSlider && (isDragging ? 'cursor-grabbing' : 'cursor-grabbing')),
    isShrunk ? "h-[60px]" : "h-48",
  ].filter(Boolean).join(" ");
  
  const bpmContainerStyle: React.CSSProperties = isBeating ? { 
    animationDuration: `${animationDurationMs}ms`,
  } : {};

  const buttonClasses = [
    "absolute top-1/2 -translate-y-1/2 z-20 rounded-full flex items-center justify-center bg-black/25 hover:bg-black/40 text-white/60 hover:text-white transition-all duration-300",
    isShrunk ? "w-[46px] h-[46px]" : "w-[57px] h-[57px]",
  ].join(" ");

  return (
    <div className={`w-full flex flex-col gap-4 transition-opacity duration-300 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div 
        ref={sliderRef}
        onMouseDown={showSlider ? handleInteractionStart : undefined}
        onTouchStart={showSlider ? handleInteractionStart : undefined}
        onClick={handleContainerClick}
        className={bpmContainerClasses}
        style={bpmContainerStyle}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={bpm}
        aria-valuetext={`${bpm} BPM`}
        aria-label="BPM Slider and Tap Tempo"
      >
        <button
            onMouseDown={(e) => { e.stopPropagation(); startContinuousChange('decrement'); }}
            onMouseUp={() => stopContinuousChange()}
            onMouseLeave={() => stopContinuousChange()}
            onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); startContinuousChange('decrement'); }}
            onTouchEnd={() => stopContinuousChange()}
            onContextMenu={(e) => e.preventDefault()}
            className={`${buttonClasses} left-[15px]`}
            aria-label="Decrement BPM"
        >
            <BpmMinusIcon />
        </button>

        <div 
            className={`flex flex-col text-center z-10 bpm-editor-area ${isShrunk ? 'h-full justify-center' : 'justify-center'}`}
            onMouseDown={handlePressStartForEdit}
            onMouseUp={handlePressEndForEdit}
            onMouseLeave={handlePressEndForEdit}
            onTouchStart={handlePressStartForEdit}
            onTouchEnd={handlePressEndForEdit}
            onTouchCancel={handlePressEndForEdit}
        >
          <p className={`text-xs tracking-[0.2em] uppercase text-white/80 transition-all duration-300 ${isShrunk ? 'h-0 opacity-0' : 'h-4 opacity-100 mb-1'}`}>BPM</p>
          {isEditingBpm ? (
            <input
              ref={bpmInputRef}
              type="text"
              inputMode="numeric"
              value={editedBpm}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^\d+$/.test(value)) {
                    setEditedBpm(value);
                }
              }}
              onBlur={handleBpmEditCommit}
              onKeyDown={handleBpmEditKeyDown}
              className={`font-mono font-bold text-white tabular-nums leading-none tracking-tighter bg-transparent text-center outline-none w-48 transition-all duration-300 ${isShrunk ? 'text-5xl' : 'text-7xl'}`}
              style={{MozAppearance: 'textfield'}}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className={`font-mono font-bold text-white tabular-nums leading-none tracking-tighter transition-all duration-300 ${isShrunk ? 'text-5xl' : 'text-7xl'}`}>{bpm}</span>
          )}
          {!isEditingBpm && showTapButton && <p className={`text-xs tracking-[0.2em] uppercase text-white/80 transition-all duration-300 ${isShrunk ? 'h-0 opacity-0' : 'h-auto opacity-100 mt-1'}`}>TAP TEMPO</p>}
        </div>
        
        <button
            onMouseDown={(e) => { e.stopPropagation(); startContinuousChange('increment'); }}
            onMouseUp={() => stopContinuousChange()}
            onMouseLeave={() => stopContinuousChange()}
            onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); startContinuousChange('increment'); }}
            onTouchEnd={() => stopContinuousChange()}
            onContextMenu={(e) => e.preventDefault()}
            className={`${buttonClasses} right-[15px]`}
            aria-label="Increment BPM"
        >
            <BpmPlusIcon />
        </button>
        
        {showSlider && (
          <div 
              className="bpm-slider-fill absolute top-0 left-0 h-full opacity-70 pointer-events-none" 
              style={{ width: `${sliderPositionPercent}%` }}
          />
        )}
      </div>
    </div>
  );
};

export default BpmControl;