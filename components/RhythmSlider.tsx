import React, { useRef, useState, useCallback, useEffect } from 'react';

interface CircularRhythmControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  onInteractionStateChange: (isActive: boolean) => void;
  accentColor?: string;
}

// Helper to convert polar coordinates to Cartesian for SVG paths (0 degrees is at 3 o'clock)
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
    };
}

// Helper to describe an SVG arc path
function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number): string {
    // Prevent arc from disappearing at tiny values or when full
    if (endAngle <= startAngle + 0.01) {
      endAngle = startAngle + 0.01;
    }
    if (endAngle >= startAngle + 360) {
      endAngle = startAngle + 359.99;
    }

    const start = polarToCartesian(x, y, radius, startAngle);
    const end = polarToCartesian(x, y, radius, endAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    const d = [
        'M', start.x, start.y,
        'A', radius, radius, 0, largeArcFlag, 1, end.x, end.y, // sweep-flag=1 for clockwise
    ].join(' ');

    return d;
}


const CircularRhythmControl: React.FC<CircularRhythmControlProps> = ({ label, value, min, max, onChange, onInteractionStateChange, accentColor = 'var(--primary-accent)' }) => {
  const [isInteracting, setIsInteracting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  
  // Use local state for immediate feedback during drag, preventing lag-induced issues.
  const [localValue, setLocalValue] = useState(value);
  
  const dragStartRef = useRef<{
    initialX: number;
    initialY: number;
    initialValue: number;
  } | null>(null);
  const popupTimeoutRef = useRef<number | null>(null);

  // Sync local state with prop when not dragging.
  useEffect(() => {
    if (!isDragging) {
      setLocalValue(value);
    }
  }, [value, isDragging]);

  const handleInteractionStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const nativeEvent = e.nativeEvent;
    const isTouchEvent = 'touches' in nativeEvent;
    const clientX = isTouchEvent ? nativeEvent.touches[0].clientX : nativeEvent.clientX;
    const clientY = isTouchEvent ? nativeEvent.touches[0].clientY : nativeEvent.clientY;

    setIsInteracting(true);

    // Start drag from the last known prop value to prevent jumps.
    dragStartRef.current = {
      initialX: clientX,
      initialY: clientY,
      initialValue: value,
    };
    
    popupTimeoutRef.current = window.setTimeout(() => {
        setIsPopupVisible(true);
        onInteractionStateChange(true);
        popupTimeoutRef.current = null;
    }, 100);

  }, [onInteractionStateChange, value]);

  const handleInteractionEnd = useCallback(() => {
    if (!isInteracting) return;

    if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
        popupTimeoutRef.current = null;
    }
    
    if (isPopupVisible) {
      setIsPopupVisible(false);
      onInteractionStateChange(false);
    }
    setIsDragging(false);
    setIsInteracting(false);
  }, [isInteracting, isPopupVisible, onInteractionStateChange]);

  const handleInteractionMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isInteracting || !dragStartRef.current) return;

    if (!isDragging) {
        if (popupTimeoutRef.current) {
            clearTimeout(popupTimeoutRef.current);
            popupTimeoutRef.current = null;
        }

        const isTouchEvent = 'touches' in e;
        const currentX = isTouchEvent ? e.touches[0].clientX : e.clientX;
        const currentY = isTouchEvent ? e.touches[0].clientY : e.clientY;
        const deltaX = Math.abs(currentX - dragStartRef.current.initialX);
        const deltaY = Math.abs(currentY - dragStartRef.current.initialY);
        const dragThreshold = 5;

        if (deltaX > dragThreshold || deltaY > dragThreshold) {
            setIsDragging(true);
            if (!isPopupVisible) {
                setIsPopupVisible(true);
                onInteractionStateChange(true);
            }
        }
    }

    if (isDragging) {
      if (e.cancelable) e.preventDefault();
      
      const isTouchEvent = 'touches' in e;
      const currentX = isTouchEvent ? e.touches[0].clientX : e.clientX;
      const currentY = isTouchEvent ? e.touches[0].clientY : e.clientY;

      const totalDeltaX = currentX - dragStartRef.current.initialX;
      const totalDeltaY = currentY - dragStartRef.current.initialY;
      
      // Combine vertical and horizontal movement.
      // Up/Right increases value, Down/Left decreases.
      const combinedDelta = totalDeltaX - totalDeltaY;

      // Dynamically calculate sensitivity based on the slider's range.
      // This ensures a consistent "feel" regardless of the min/max values.
      const range = Math.max(1, max - min); // Avoid division by zero
      const totalDragDistance = 300; // The desired pixel distance to cover the full range
      const sensitivity = totalDragDistance / range;

      const valueChange = combinedDelta / sensitivity;
      const newValue = dragStartRef.current.initialValue + valueChange;
      const clampedValue = Math.round(Math.max(min, Math.min(max, newValue)));

      // Compare with local state to prevent redundant updates to the parent.
      if (clampedValue !== localValue) {
        setLocalValue(clampedValue);
        onChange(clampedValue);
      }
    }
  }, [isInteracting, isDragging, isPopupVisible, onInteractionStateChange, min, max, onChange, localValue]);

  useEffect(() => {
    const moveHandler = (e: MouseEvent | TouchEvent) => handleInteractionMove(e);
    const endHandler = () => handleInteractionEnd();

    if (isInteracting) {
      document.addEventListener('mousemove', moveHandler, { passive: false });
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
  
  const containerClasses = `relative flex flex-col items-center justify-center gap-0 flex-1 transition-opacity duration-300 ${isPopupVisible ? 'z-40' : ''} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`;

  // SVG Arc Calculations
  const START_ANGLE = 150; // Corresponds to 8 o'clock
  const ANGLE_RANGE = 240; // 240 degrees from 8 o'clock to 4 o'clock
  const END_ANGLE = START_ANGLE + ANGLE_RANGE;

  const radius = 33;
  const strokeWidth = 4;
  const viewBoxSize = 80;
  
  const fullArcPath = describeArc(viewBoxSize / 2, viewBoxSize / 2, radius, START_ANGLE, END_ANGLE);
  const valueForDisplay = isDragging ? localValue : value;
  // Safety clamp normalizedValue between 0 and 1
  const normalizedValue = Math.max(0, Math.min(1, (valueForDisplay - min) / (max - min)));
  const currentAngle = START_ANGLE + (normalizedValue * ANGLE_RANGE);
  const valuePath = describeArc(viewBoxSize / 2, viewBoxSize / 2, radius, START_ANGLE, currentAngle);
  
  // Disable CSS transitions during drag to prevent visual tearing/bugs
  const pathClassName = isDragging ? '' : 'transition-all duration-100';

  return (
    <div
      onMouseDown={handleInteractionStart}
      onTouchStart={handleInteractionStart}
      className={containerClasses}
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={valueForDisplay}
      aria-orientation="vertical"
      aria-label={`${label} control`}
    >
      {isPopupVisible && (
        <div 
            className="value-popup absolute bottom-full left-1/2 mb-3.5 w-28 h-28 rounded-3xl border border-[var(--container-border)] flex items-center justify-center pointer-events-none shadow-2xl"
            style={{ backgroundColor: accentColor }}
        >
          <span key={localValue} className="text-6xl font-bold font-mono text-black tabular-nums">
            {localValue}
          </span>
        </div>
      )}

      <div className="relative w-20 h-20">
          <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="absolute inset-0 w-full h-full">
              {/* Background Track */}
              <path
                  d={fullArcPath}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
              />
              {/* Value Progress */}
              <path
                  d={valuePath}
                  fill="none"
                  stroke={accentColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  className={pathClassName}
              />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-3xl font-mono font-bold text-[var(--text-primary)] tabular-nums">{valueForDisplay}</span>
          </div>
      </div>

      <span className="-mt-4 text-[11px] text-[var(--text-secondary)] uppercase tracking-wider">{label}</span>
    </div>
  );
};

export default CircularRhythmControl;