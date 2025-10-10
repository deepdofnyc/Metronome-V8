import React, { useRef, useState, useCallback, useEffect } from 'react';

interface RhythmSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  onInteractionStateChange: (isActive: boolean) => void;
  accentColor?: string;
}

const RhythmSlider: React.FC<RhythmSliderProps> = ({ label, value, min, max, onChange, onInteractionStateChange, accentColor = 'var(--primary-accent)' }) => {
  const [isInteracting, setIsInteracting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  
  const dragStartRef = useRef<{
    initialX: number;
    initialY: number;
    initialValue: number;
  } | null>(null);
  const currentValueRef = useRef(value);
  const popupTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    currentValueRef.current = value;
  }, [value]);

  const fillPercentage = max > min ? ((value - min) / (max - min)) * 100 : 0;
  
  const sliderStyle = {
    background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${fillPercentage}%, rgba(255, 255, 255, 0.15) ${fillPercentage}%, rgba(255, 255, 255, 0.15) 100%)`
  } as React.CSSProperties;

  const handleInteractionStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const nativeEvent = e.nativeEvent;
    const isTouchEvent = 'touches' in nativeEvent;
    const clientX = isTouchEvent ? nativeEvent.touches[0].clientX : nativeEvent.clientX;
    const clientY = isTouchEvent ? nativeEvent.touches[0].clientY : nativeEvent.clientY;

    setIsInteracting(true);

    dragStartRef.current = {
      initialX: clientX,
      initialY: clientY,
      initialValue: currentValueRef.current,
    };
    
    popupTimeoutRef.current = window.setTimeout(() => {
        setIsPopupVisible(true);
        onInteractionStateChange(true);
        popupTimeoutRef.current = null;
    }, 100);

  }, [onInteractionStateChange]);

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
      const totalDeltaX = currentX - dragStartRef.current.initialX;
      const sensitivity = 15;
      const valueChange = Math.round(totalDeltaX / sensitivity);
      const newValue = dragStartRef.current.initialValue + valueChange;
      const clampedValue = Math.max(min, Math.min(max, newValue));

      if (clampedValue !== currentValueRef.current) {
        onChange(clampedValue);
      }
    }
  }, [isInteracting, isDragging, isPopupVisible, onInteractionStateChange, min, max, onChange, handleInteractionEnd]);

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
  
  const containerClasses = `relative flex flex-col items-center gap-2 flex-1 px-2 py-1 transition-opacity duration-300 ${isPopupVisible ? 'z-40' : ''} cursor-pointer`;

  return (
    <div
      onMouseDown={handleInteractionStart}
      onTouchStart={handleInteractionStart}
      className={containerClasses}
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-orientation="horizontal"
      aria-label={`${label} slider`}
    >
      {isPopupVisible && (
        <div 
            className="value-popup absolute bottom-full left-1/2 mb-3.5 w-28 h-28 rounded-3xl border border-[var(--container-border)] flex items-center justify-center pointer-events-none shadow-2xl"
            style={{ backgroundColor: accentColor }}
        >
          <span key={value} className="text-6xl font-bold font-mono text-black tabular-nums">
            {value}
          </span>
        </div>
      )}
      <div className="w-full flex justify-between items-baseline pointer-events-none">
        <span className="text-sm text-[var(--text-secondary)] uppercase tracking-wider">{label}</span>
        <span className={`text-3xl font-mono font-bold text-[var(--text-primary)] tabular-nums transition-opacity duration-200 ${isPopupVisible ? 'opacity-0' : 'opacity-100'}`}>{value}</span>
      </div>
      <div
        className="mixer-slider h-1.5 w-full pointer-events-none"
        style={sliderStyle}
      />
    </div>
  );
};

export default RhythmSlider;