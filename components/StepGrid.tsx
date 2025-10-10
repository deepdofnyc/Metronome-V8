
import React, { useState, useEffect, useRef } from 'react';

interface StepGridProps {
  beats: number;
  subdivisions: number;
  pattern: number[];
  onPatternChange: (newPattern: number[]) => void;
  currentStep: number;
  isPlaying: boolean;
  disabled?: boolean;
}

/**
 * Displays an interactive grid of steps for a single measure,
 * allowing pattern creation and visualizing playback.
 */
const StepGrid: React.FC<StepGridProps> = ({ beats, subdivisions, pattern, onPatternChange, currentStep, isPlaying, disabled = false }) => {
  const [manuallyPressedSteps, setManuallyPressedSteps] = useState<Set<number>>(new Set());
  const [pulsingSteps, setPulsingSteps] = useState<Set<number>>(new Set());
  const isMounted = useRef(true);
  const pulseRemovalTimers = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      pulseRemovalTimers.current.forEach(timerId => window.clearTimeout(timerId));
    };
  }, []);

  // Effect to handle the playback pulse animation on the current step
  useEffect(() => {
    if (!isPlaying || currentStep < 0) {
      setPulsingSteps(new Set());
      pulseRemovalTimers.current.forEach(timerId => window.clearTimeout(timerId));
      pulseRemovalTimers.current.clear();
      return;
    }

    if (pulseRemovalTimers.current.has(currentStep)) {
      window.clearTimeout(pulseRemovalTimers.current.get(currentStep)!);
    }

    // This logic ensures the animation re-triggers if the same step is hit again quickly
    setPulsingSteps(prev => {
      const newSet = new Set(prev);
      newSet.delete(currentStep);
      return newSet;
    });

    window.setTimeout(() => {
      if (!isMounted.current) return;
      setPulsingSteps(prev => new Set(prev).add(currentStep));

      const removalTimer = window.setTimeout(() => {
        if (!isMounted.current) return;
        setPulsingSteps(prev => {
          const newSet = new Set(prev);
          newSet.delete(currentStep);
          return newSet;
        });
        pulseRemovalTimers.current.delete(currentStep);
      }, 800);

      pulseRemovalTimers.current.set(currentStep, removalTimer);
    }, 10);

  }, [currentStep, isPlaying]);

  const totalSteps = beats * subdivisions;
  if (totalSteps <= 0 || totalSteps > 256) return <div className="text-center text-sm text-red-400">Invalid grid size</div>;

  const handleStepClick = (index: number) => {
    if(disabled) return;
    const newPattern = [...pattern];
    // Cycle through 4 states: 0 (off), 1 (sub), 2 (beat), 3 (accent)
    newPattern[index] = (newPattern[index] + 1) % 4;
    onPatternChange(newPattern);
  };

  // Handlers for the visual press-down effect
  const handlePressStart = (index: number) => {
    if(disabled) return;
    setManuallyPressedSteps(prev => new Set(prev).add(index));
  };

  const handlePressEnd = (index: number) => {
    if(disabled) return;
    setManuallyPressedSteps(prev => {
      if (!prev.has(index)) {
        return prev;
      }
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  };

  // Dynamically adjust font size for beat numbers based on grid density
  let numberFontSize = 'text-xl';
  if (beats >= 15) { numberFontSize = 'text-xs'; }
  else if (beats >= 13) { numberFontSize = 'text-sm'; }
  else if (beats >= 11) { numberFontSize = 'text-base'; }
  else if (beats >= 9) { numberFontSize = 'text-lg'; }

  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: beats }).map((_, beatIndex) => (
        <div key={beatIndex} className="flex-1 flex flex-col gap-2 min-w-0">
          {Array.from({ length: subdivisions }).map((_, subIndex) => {
            const stepIndex = beatIndex * subdivisions + subIndex;
            if (stepIndex >= pattern.length) return null;

            const state = pattern[stepIndex] ?? 0;
            const isPulsingDuringPlay = pulsingSteps.has(stepIndex);
            const isManuallyPressed = manuallyPressedSteps.has(stepIndex);
            const isTopRow = subIndex === 0;

            let colorClass = '';
            switch (state) {
              case 3: colorClass = 'bg-[var(--strong-beat-accent)]'; break;
              case 2: colorClass = 'bg-[var(--primary-accent)] opacity-60'; break;
              case 1: colorClass = 'bg-[var(--secondary-accent)]'; break;
              default: colorClass = `bg-white/10 ${!disabled ? 'hover:bg-white/20' : ''}`;
            }

            let numberClass = `${numberFontSize} font-bold text-black/60`;
            if (isPlaying && isPulsingDuringPlay) {
              numberClass += ' number-playback-pulse';
            }

            return (
              <button
                key={stepIndex}
                className={`w-full aspect-square ${disabled ? 'cursor-not-allowed' : ''}`}
                onClick={() => handleStepClick(stepIndex)}
                onMouseDown={() => handlePressStart(stepIndex)}
                onMouseUp={() => handlePressEnd(stepIndex)}
                onMouseLeave={() => handlePressEnd(stepIndex)}
                onTouchStart={() => handlePressStart(stepIndex)}
                onTouchEnd={() => handlePressEnd(stepIndex)}
                onTouchCancel={() => handlePressEnd(stepIndex)}
                aria-label={`Step ${stepIndex + 1}`}
                disabled={disabled}
              >
                <div
                  className={`step-base-style ${isPulsingDuringPlay ? 'step-playback-pulse' : ''} ${isManuallyPressed ? 'step-is-pressed' : ''} flex items-center justify-center select-none`}
                >
                  <div className={`absolute inset-0 rounded-full transition-colors ${colorClass}`}></div>
                  {isTopRow && state > 0 && (
                    <span className={`${numberClass} relative`}>
                      {beatIndex + 1}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default StepGrid;
