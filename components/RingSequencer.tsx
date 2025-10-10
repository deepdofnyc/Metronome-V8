

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { playStepPreview } from '../services/audioPreviews';

interface RingSequencerProps {
  beats: number;
  subdivisions: number;
  pattern: number[];
  onPatternChange: (newPattern: number[]) => void;
  currentStep: number;
  isPlaying: boolean;
  disabled?: boolean;
  bpm: number;
  beatSoundId: string;
  subdivisionSoundId: string;
}

const RingSequencer: React.FC<RingSequencerProps> = ({ beats, subdivisions, pattern, onPatternChange, currentStep, isPlaying, disabled = false, bpm, beatSoundId, subdivisionSoundId }) => {
    const [manuallyPressedSteps, setManuallyPressedSteps] = useState<Set<string>>(new Set());
    const [pulsingStep, setPulsingStep] = useState<number>(-1);
    const [rotation, setRotation] = useState(0);
    const animationFrameId = useRef<number | undefined>(undefined);
    const playbackStartTime = useRef<number>(0);

    const measureDurationMs = useMemo(() => {
        if (beats <= 0 || bpm <= 0) return 0;
        return (beats * 60 / bpm) * 1000;
    }, [beats, bpm]);

    useEffect(() => {
        if (!isPlaying) {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = undefined;
            }
            playbackStartTime.current = 0;
            setRotation(0);
            return;
        }

        playbackStartTime.current = performance.now();
        setRotation(0);

        const animate = (timestamp: number) => {
            if (measureDurationMs > 0 && playbackStartTime.current > 0) {
                const elapsedTime = timestamp - playbackStartTime.current;
                const progress = (elapsedTime % measureDurationMs) / measureDurationMs;
                const newRotation = progress * 360;
                setRotation(-newRotation);
            }
            animationFrameId.current = requestAnimationFrame(animate);
        };

        animationFrameId.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [isPlaying, measureDurationMs]);

    useEffect(() => {
        if (!isPlaying) {
            setPulsingStep(-1);
        } else {
            setPulsingStep(currentStep);
        }
    }, [currentStep, isPlaying]);

    const handleBeatClick = (beatIndex: number) => {
        if (disabled) return;
        const newPattern = [...pattern];
        const patternIndex = beatIndex * subdivisions;
        
        if (patternIndex >= newPattern.length) return;

        const currentVal = newPattern[patternIndex];

        let newVal;
        if (currentVal === 3) newVal = 0; // accent -> off
        else if (currentVal === 2) newVal = 3; // beat -> accent
        else newVal = 2; // off/sub -> beat
        
        newPattern[patternIndex] = newVal;
        
        // Play preview sound
        if (newVal === 2) {
            playStepPreview(beatSoundId, 2);
        } else if (newVal === 3) {
            playStepPreview(beatSoundId, 3);
        }

        onPatternChange(newPattern);
    };

    const handleSubdivisionStepClick = (stepIndex: number) => {
        if (disabled) return;

        const newPattern = [...pattern];
        if (stepIndex >= newPattern.length) return;
        
        // Check if this is the first subdivision of a beat (an on-beat step)
        if (subdivisions > 0 && stepIndex % subdivisions === 0) {
            // This is a main beat, so use the same logic as handleBeatClick
            const currentVal = newPattern[stepIndex];

            let newVal;
            if (currentVal === 3) {
                newVal = 0; // accent -> off
            } else if (currentVal === 2) {
                newVal = 3; // beat -> accent
            } else { // Handles 0 and 1
                newVal = 2; // off/sub -> beat
            }
            
            newPattern[stepIndex] = newVal;
            
            // Play preview sound for the beat
            if (newVal === 2) {
                playStepPreview(beatSoundId, 2);
            } else if (newVal === 3) {
                playStepPreview(beatSoundId, 3);
            }
            
            onPatternChange(newPattern);
        } else {
            // This is an off-beat subdivision, so just toggle between on and off
            const currentVal = newPattern[stepIndex];
            const newVal = currentVal === 1 ? 0 : 1;
            newPattern[stepIndex] = newVal;
            
            // Play preview sound for the subdivision
            if (newVal === 1) {
                playStepPreview(subdivisionSoundId, 1);
            }
            
            onPatternChange(newPattern);
        }
    };

    const handlePressStart = (key: string) => {
        if(disabled) return;
        setManuallyPressedSteps(prev => new Set(prev).add(key));
    };
    
    const handlePressEnd = (key: string) => {
        if(disabled) return;
        setManuallyPressedSteps(prev => {
          if (!prev.has(key)) return prev;
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
    };
    
    const totalSteps = useMemo(() => (beats * subdivisions > 0 ? beats * subdivisions : 1), [beats, subdivisions]);
    if (totalSteps <= 0 || totalSteps > 256 || beats <= 0) return <div className="text-center text-sm text-red-400">Invalid grid size</div>;

    const currentBeat = useMemo(() => {
        if (!isPlaying || currentStep < 0 || subdivisions <= 0) return null;
        return Math.floor(currentStep / subdivisions) + 1;
    }, [currentStep, subdivisions, isPlaying]);

    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    };

    const describeSegment = (x: number, y: number, outerRadius: number, innerRadius: number, startAngle: number, endAngle: number, gap: number, cornerRadius: number) => {
        if (!cornerRadius || cornerRadius <= 0) {
            const startOuter = polarToCartesian(x, y, outerRadius, endAngle - gap);
            const endOuter = polarToCartesian(x, y, outerRadius, startAngle + gap);
            const startInner = polarToCartesian(x, y, innerRadius, endAngle - gap);
            const endInner = polarToCartesian(x, y, innerRadius, startAngle + gap);
            
            const arcSweep = endAngle - startAngle;
            const largeArcFlag = arcSweep - (gap * 2) <= 180 ? "0" : "1";

            return [
                "M", startOuter.x, startOuter.y,
                "A", outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
                "L", endInner.x, endInner.y,
                "A", innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
                "Z"
            ].join(" ");
        }

        const sa = startAngle + gap;
        const ea = endAngle - gap;
        
        const outerCornerAngle = Math.asin(cornerRadius / outerRadius) * (180 / Math.PI);
        const innerCornerAngle = Math.asin(cornerRadius / innerRadius) * (180 / Math.PI);

        const p_outer_start = polarToCartesian(x, y, outerRadius, ea - outerCornerAngle);
        const p_outer_end = polarToCartesian(x, y, outerRadius, sa + outerCornerAngle);
        const p_inner_start = polarToCartesian(x, y, innerRadius, sa + innerCornerAngle);
        const p_inner_end = polarToCartesian(x, y, innerRadius, ea - innerCornerAngle);
        
        const p_line_outer_start = polarToCartesian(x, y, outerRadius - cornerRadius, ea);
        const p_line_inner_end_at_ea = polarToCartesian(x, y, innerRadius + cornerRadius, ea);
        const p_line_outer_end = polarToCartesian(x, y, outerRadius - cornerRadius, sa);
        const p_line_inner_start_at_sa = polarToCartesian(x, y, innerRadius + cornerRadius, sa);

        const arcSweep = ea - sa;
        const largeArcFlag = arcSweep > 180 ? "1" : "0";

        const d = [
            "M", p_outer_start.x, p_outer_start.y,
            "A", outerRadius, outerRadius, 0, largeArcFlag, 0, p_outer_end.x, p_outer_end.y,
            "A", cornerRadius, cornerRadius, 0, 0, 0, p_line_outer_end.x, p_line_outer_end.y,
            "L", p_line_inner_start_at_sa.x, p_line_inner_start_at_sa.y,
            "A", cornerRadius, cornerRadius, 0, 0, 0, p_inner_start.x, p_inner_start.y,
            "A", innerRadius, innerRadius, 0, largeArcFlag, 1, p_inner_end.x, p_inner_end.y,
            "A", cornerRadius, cornerRadius, 0, 0, 0, p_line_inner_end_at_ea.x, p_line_inner_end_at_ea.y,
            "L", p_line_outer_start.x, p_line_outer_start.y,
            "A", cornerRadius, cornerRadius, 0, 0, 0, p_outer_start.x, p_outer_start.y,
            "Z"
        ].join(" ");

        return d;
    };
    
    const anglePerBeat = 360 / beats;
    const anglePerStep = totalSteps > 0 ? 360 / totalSteps : 0;
    
    const activeBeatIndex = (isPlaying && pulsingStep !== -1 && subdivisions > 0) ? Math.floor(pulsingStep / subdivisions) : -1;
    
    const rotationGroupStyle: React.CSSProperties = {
        transform: `rotate(${rotation}deg)`,
        transformOrigin: '100px 100px',
        transition: isPlaying ? 'none' : 'transform 0.3s ease-out',
    };

    return (
        <div className="w-full aspect-square relative flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="w-full h-full">
                {/* Static Playhead Indicator at the top */}
                <path d="M 98 2 L 102 2 L 100 7 Z" fill="var(--primary-accent)" />

                <g style={rotationGroupStyle}>
                    {/* Outer Ring: Beats */}
                    {Array.from({ length: beats }).map((_, i) => {
                        const patternIndex = i * subdivisions;
                        if (patternIndex >= pattern.length) return null;

                        const state = pattern[patternIndex];
                        const startAngle = i * anglePerBeat;
                        const endAngle = (i + 1) * anglePerBeat;
                        
                        const key = `beat-${i}`;
                        const isPulsing = isPlaying && i === activeBeatIndex;
                        const isPressed = manuallyPressedSteps.has(key);

                        let color = 'rgba(255, 255, 255, 0.1)';
                        if (state === 3) color = 'var(--strong-beat-accent)';
                        else if (state === 2) color = 'var(--primary-accent)';
                        else if (state === 1) color = 'var(--secondary-accent)';

                        if (isPulsing) {
                            color = state > 0 ? 'white' : 'rgba(255, 255, 255, 0.7)';
                        }
                        
                        const pressTransition = isPressed 
                            ? 'transform 0.1s ease-in'
                            : 'transform 1.2s cubic-bezier(0.19, 1, 0.22, 1)';
                        const playbackTransition = 'fill 0.2s ease-out';

                        return (
                            <path
                                key={key}
                                d={describeSegment(100, 100, 95, 80, startAngle, endAngle, 1.5, 0)}
                                fill={color}
                                className={`${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                onClick={() => handleBeatClick(i)}
                                onMouseDown={() => handlePressStart(key)}
                                onMouseUp={() => handlePressEnd(key)}
                                onMouseLeave={() => handlePressEnd(key)}
                                onTouchStart={() => handlePressStart(key)}
                                onTouchEnd={() => handlePressEnd(key)}
                                onTouchCancel={() => handlePressEnd(key)}
                                style={{
                                    transformOrigin: 'center center',
                                    transform: isPressed ? 'scale(0.95)' : 'scale(1)',
                                    transition: `${pressTransition}, ${playbackTransition}`,
                                }}
                            />
                        );
                    })}

                    {/* Inner Ring: All subdivision steps */}
                    {subdivisions > 1 && Array.from({ length: totalSteps }).map((_, stepIndex) => {
                        const startAngle = stepIndex * anglePerStep;
                        const endAngle = (stepIndex + 1) * anglePerStep;

                        const key = `substep-${stepIndex}`;
                        const isPulsing = isPlaying && stepIndex === pulsingStep;
                        const isPressed = manuallyPressedSteps.has(key);

                        const state = pattern[stepIndex];
                        let color;

                        switch (state) {
                            case 3: color = 'var(--strong-beat-accent)'; break;
                            case 2: color = 'var(--primary-accent)'; break;
                            case 1: color = 'var(--secondary-accent)'; break;
                            default: color = 'rgba(255, 255, 255, 0.1)';
                        }
                        
                        if (isPulsing) {
                            color = state > 0 ? 'white' : 'rgba(255, 255, 255, 0.7)';
                        }

                        const pressTransition = isPressed 
                            ? 'transform 0.1s ease-in'
                            : 'transform 1.2s cubic-bezier(0.19, 1, 0.22, 1)';
                        const playbackTransition = 'fill 0.2s ease-out';

                        return (
                            <path
                                key={key}
                                d={describeSegment(100, 100, 75, 60, startAngle, endAngle, 2, 0)}
                                fill={color}
                                className={`${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                onClick={() => handleSubdivisionStepClick(stepIndex)}
                                onMouseDown={() => handlePressStart(key)}
                                onMouseUp={() => handlePressEnd(key)}
                                onMouseLeave={() => handlePressEnd(key)}
                                onTouchStart={() => handlePressStart(key)}
                                onTouchEnd={() => handlePressEnd(key)}
                                onTouchCancel={() => handlePressEnd(key)}
                                style={{
                                    transformOrigin: 'center center',
                                    transform: isPressed ? 'scale(0.95)' : 'scale(1)',
                                    transition: `${pressTransition}, ${playbackTransition}`,
                                }}
                            />
                        );
                    })}
                </g>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className={`
                    w-28 h-28 rounded-full flex items-center justify-center text-6xl font-bold font-mono text-white transition-all
                    ${currentBeat !== null ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}
                `}>
                    <span
                        key={currentBeat}
                        className={currentBeat !== null ? 'central-number-playback-pulse' : ''}
                    >
                        {currentBeat}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default RingSequencer;
