import React, { useRef, useState, useCallback, useEffect } from 'react';

interface SettingsSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  color?: string;
}

const SettingsSlider: React.FC<SettingsSliderProps> = ({
  label,
  value,
  min,
  max,
  onChange,
  color = 'var(--primary-accent)',
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{
    initialX: number;
    initialY: number;
    initialValue: number;
  } | null>(null);
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const handleInteractionEnd = useCallback(() => {
    if (!isInteracting) return;
    setIsInteracting(false);
    if (isDragging) {
      setIsDragging(false);
    }
    dragStartRef.current = null;
  }, [isInteracting, isDragging]);

  const handleInteractionMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isInteracting || !dragStartRef.current) return;

    if (!isDragging) {
      const isTouchEvent = 'touches' in e;
      const currentX = isTouchEvent ? e.touches[0].clientX : e.clientX;
      const currentY = isTouchEvent ? e.touches[0].clientY : ('clientY' in e ? e.clientY : dragStartRef.current.initialY);
      const deltaX = Math.abs(currentX - dragStartRef.current.initialX);
      const deltaY = Math.abs(currentY - dragStartRef.current.initialY);
      const dragThreshold = 5;

      if (deltaX > dragThreshold || deltaY > dragThreshold) {
        if (isTouchEvent && deltaY > deltaX) {
          handleInteractionEnd();
          return;
        }
        setIsDragging(true);
      }
    }

    if (isDragging) {
      if (e.cancelable) e.preventDefault();
      
      const isTouchEvent = 'touches' in e;
      const currentX = isTouchEvent ? e.touches[0].clientX : e.clientX;
      const totalDeltaX = currentX - dragStartRef.current.initialX;
      
      const sensitivity = 2.5; // pixels per unit change
      const valueChange = totalDeltaX / sensitivity;
      const newValue = dragStartRef.current.initialValue + valueChange;
      const clampedValue = Math.max(min, Math.min(max, Math.round(newValue)));

      if (clampedValue !== valueRef.current) {
        onChange(clampedValue);
      }
    }
  }, [isInteracting, isDragging, onChange, handleInteractionEnd, min, max]);

  const handleInteractionStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    
    const nativeEvent = e.nativeEvent;
    const isTouchEvent = 'touches' in nativeEvent;
    const clientX = isTouchEvent ? nativeEvent.touches[0].clientX : nativeEvent.clientX;
    const clientY = isTouchEvent ? nativeEvent.touches[0].clientY : nativeEvent.clientY;
    
    dragStartRef.current = {
      initialX: clientX,
      initialY: clientY,
      initialValue: valueRef.current,
    };
    
    setIsInteracting(true);
  }, []);

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

  const fillPercentage = max > min ? ((value - min) / (max - min)) * 100 : 0;

  const sliderStyle = {
    '--fill-percentage': `${fillPercentage}%`,
    '--slider-color': color,
  } as React.CSSProperties;

  return (
    <div className="flex-1 relative">
      {isDragging && (
        <div 
            className="value-popup absolute bottom-full left-1/2 mb-2 w-24 h-24 rounded-2xl border border-[var(--container-border)] flex items-center justify-center pointer-events-none shadow-2xl"
            style={{ backgroundColor: color }}
        >
          <span key={value} className="text-5xl font-bold font-mono text-black tabular-nums">
            {value}
          </span>
        </div>
      )}
      <div className="flex justify-between items-baseline mb-1">
        <label className="text-sm font-medium text-white/70">{label}</label>
        <span className={`font-mono text-lg transition-opacity duration-200 ${isDragging ? 'opacity-0' : 'opacity-100'}`}>{value}</span>
      </div>
      <div
        ref={sliderRef}
        onMouseDown={handleInteractionStart}
        onTouchStart={handleInteractionStart}
        className={`mixer-slider h-11 w-full rounded-lg ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={sliderStyle}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-orientation="horizontal"
      >
      </div>
    </div>
  );
};

export default SettingsSlider;
