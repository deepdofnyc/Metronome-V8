import React, { useRef, useState, useCallback, useEffect } from 'react';

interface KnobProps {
  label: string;
  value: number; // The raw value, e.g. 0 to 1
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  color?: string;
  onInteractionStateChange?: (isActive: boolean) => void;
}

const Knob: React.FC<KnobProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  color,
  onInteractionStateChange = (_isActive: boolean) => {},
}) => {
  const [isInteracting, setIsInteracting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{
    initialX: number;
    initialY: number;
    initialValue: number;
    direction: 'none' | 'horizontal' | 'vertical';
  } | null>(null);
  const currentValueRef = useRef(value);
  const dragStartTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    currentValueRef.current = value;
  }, [value]);

  const fillPercentage = ((value - min) / (max - min)) * 100;
  const sliderStyle = {
    '--fill-percentage': `${fillPercentage}%`,
    '--slider-color': color,
  } as React.CSSProperties;

  const displayValue = Math.round(((value - min) / (max - min)) * 100);

  const handleInteractionEnd = useCallback(() => {
    if (!isInteracting) return;
    
    if (dragStartTimeoutRef.current) {
        window.clearTimeout(dragStartTimeoutRef.current);
        dragStartTimeoutRef.current = null;
    }
    
    setIsInteracting(false);
    if (isDragging) {
      setIsDragging(false);
      onInteractionStateChange(false);
    }
    dragStartRef.current = null;
  }, [isInteracting, isDragging, onInteractionStateChange]);

  const handleInteractionMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !dragStartRef.current) return;

    const isTouchEvent = 'touches' in e;
    const currentX = isTouchEvent ? e.touches[0].clientX : e.clientX;

    if (isTouchEvent && dragStartRef.current.direction === 'none') {
      const currentY = e.touches[0].clientY;
      const deltaX = Math.abs(currentX - dragStartRef.current.initialX);
      const deltaY = Math.abs(currentY - dragStartRef.current.initialY);

      if (deltaX > 5 || deltaY > 5) {
        if (deltaX > deltaY) {
          dragStartRef.current.direction = 'horizontal';
        } else {
          dragStartRef.current.direction = 'vertical';
          handleInteractionEnd();
          return;
        }
      }
    }

    if (dragStartRef.current.direction === 'horizontal') {
      if (e.cancelable) e.preventDefault();
      
      const totalDeltaX = currentX - dragStartRef.current.initialX;
      const sensitivity = 3; // px per percentage point
      const range = max - min;
      const valueChangePercent = totalDeltaX / sensitivity;
      const valueChange = (valueChangePercent / 100) * range;

      const newValue = dragStartRef.current.initialValue + valueChange;
      const clampedValue = Math.max(min, Math.min(max, newValue));

      if (clampedValue !== currentValueRef.current) {
        onChange(clampedValue);
      }
    }
  }, [isDragging, onChange, min, max, handleInteractionEnd]);

  const handleInteractionStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const nativeEvent = e.nativeEvent;
    const isTouchEvent = 'touches' in nativeEvent;
    const clientX = isTouchEvent ? nativeEvent.touches[0].clientX : nativeEvent.clientX;
    const clientY = isTouchEvent ? nativeEvent.touches[0].clientY : nativeEvent.clientY;

    dragStartRef.current = {
      initialX: clientX,
      initialY: clientY,
      initialValue: currentValueRef.current,
      direction: isTouchEvent ? 'none' : 'horizontal',
    };
    
    setIsInteracting(true);
    
    dragStartTimeoutRef.current = window.setTimeout(() => {
      setIsDragging(true);
      onInteractionStateChange(true);
      dragStartTimeoutRef.current = null;
    }, 120);

  }, [onInteractionStateChange]);

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

  return (
    <div
      onMouseDown={handleInteractionStart}
      onTouchStart={handleInteractionStart}
      className="w-full flex flex-col gap-2 relative cursor-pointer"
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-orientation="horizontal"
      aria-label={label}
    >
      {isDragging && dragStartRef.current?.direction !== 'vertical' && (
        <div 
            className="value-popup absolute bottom-full left-1/2 mb-2 w-24 h-24 rounded-2xl border border-[var(--container-border)] flex items-center justify-center pointer-events-none shadow-2xl"
            style={{ backgroundColor: color ?? 'var(--primary-accent)' }}
        >
          <span key={displayValue} className="text-5xl font-bold font-mono text-black tabular-nums">
            {displayValue}
          </span>
        </div>
      )}
      <div className="flex justify-between items-end pointer-events-none">
        <label className="text-sm text-[var(--text-secondary)] uppercase tracking-wider">{label}</label>
        <span className={`text-sm font-mono font-medium text-[var(--text-primary)] transition-opacity duration-200 ${isDragging ? 'opacity-0' : 'opacity-100'}`}>{displayValue}</span>
      </div>
      <div
        className="mixer-slider pointer-events-none"
        style={sliderStyle}
      />
    </div>
  );
};

export default Knob;