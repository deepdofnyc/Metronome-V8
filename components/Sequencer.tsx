
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { type Measure } from '../types';
import { generateDefaultPattern } from '../utils';
import RingSequencer from './RingSequencer';
import StepGrid from './StepGrid';
import { useMetronome } from '../contexts/MetronomeContext';
import { 
    GridViewIcon, 
    RingViewIcon, 
    AdvSequencerIcon, 
    SequenceIcon, 
    PlusIcon, 
    TrashIcon, 
    EditIcon, 
    DuplicateIcon,
    CheckIcon,
    GripIcon,
    DiceIcon,
    ChevronLeftIcon
} from './Icons';

interface SequencerProps {
  // UI state props managed by the parent component
  isFlipped: boolean;
  onFlip: (isFlipped: boolean) => void;
  isEditMode: boolean;
  onEditModeChange: (isEditing: boolean) => void;
  disabled?: boolean;
}

/**
 * A flippable sequencer component.
 * The front face shows a simple sequencer (grid or ring) for a single measure.
 * The back face shows an advanced multi-measure sequence editor.
 */
const Sequencer: React.FC<SequencerProps> = (props) => {
  const { isFlipped, onFlip, isEditMode, onEditModeChange } = props;
  
  const {
    settings,
    settingsForDisplay,
    simpleViewMeasure,
    isPlaying,
    stepInMeasure,
    currentStep,
    playingMeasureIndex,
    stepInPlayingMeasure,
    selectedMeasureIndices,
    onSetSelectedMeasureIndices,
    handlePatternChange,
    handleMeasureSequenceChange,
    handleDuplicateMeasure,
    handleCountInChange,
    handleLoopChange,
    updateSetting,
    handleRandomizeSelectedMeasures,
  } = useMetronome();
  
  const { 
    beats, subdivisions, pattern 
  } = simpleViewMeasure;

  const {
    measureSequence,
    countIn: countInEnabled,
    loop: loopEnabled,
    simpleView,
  } = settings;
  
  const { beatSoundId, subdivisionSoundId, bpm } = settingsForDisplay;

  // Refs for managing props during flip transition to prevent visual glitches
  const prevFrontProps = useRef({ beats, subdivisions, pattern });
  useEffect(() => {
    prevFrontProps.current = { beats, subdivisions, pattern };
  }, [beats, subdivisions, pattern]);
  
  const prevMeasureSequenceRef = useRef<Measure[]>(measureSequence);
  useEffect(() => {
    prevMeasureSequenceRef.current = measureSequence;
  }, [measureSequence]);

  const prevCountInRef = useRef<boolean>(countInEnabled);
  useEffect(() => {
    prevCountInRef.current = countInEnabled;
  }, [countInEnabled]);

  // Determine which props to display based on flip state to ensure smooth transitions
  const displayBeats = isFlipped ? prevFrontProps.current.beats : beats;
  const displaySubdivisions = isFlipped ? prevFrontProps.current.subdivisions : subdivisions;
  const displayPattern = isFlipped ? prevFrontProps.current.pattern : pattern;

  const flipperRef = useRef<HTMLDivElement>(null);
  const frontContentRef = useRef<HTMLDivElement>(null);
  const backContentRef = useRef<HTMLDivElement>(null);

  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [liveSequence, setLiveSequence] = useState<Measure[] | null>(null);
  const [newlyAddedMeasureId, setNewlyAddedMeasureId] = useState<string | null>(null);
  const [isRandomizing, setIsRandomizing] = useState(false);
  const singleSelectedMeasureIndex = useMemo(() => selectedMeasureIndices.length === 1 ? selectedMeasureIndices[0] : null, [selectedMeasureIndices]);
  
  const sequenceForBackView = liveSequence || (isFlipped ? measureSequence : prevMeasureSequenceRef.current);
  const countInForBackView = isFlipped ? countInEnabled : prevCountInRef.current;

  useEffect(() => {
    // Follow the currently playing measure in the advanced view
    if (isFlipped && isPlaying && playingMeasureIndex !== null && playingMeasureIndex > -1) {
      if (!isEditMode && !draggedItemId) {
          onSetSelectedMeasureIndices([playingMeasureIndex]);
      }
    }
  }, [isFlipped, isPlaying, playingMeasureIndex, onSetSelectedMeasureIndices, isEditMode, draggedItemId]);

  const measureForGrid = singleSelectedMeasureIndex !== null && sequenceForBackView[singleSelectedMeasureIndex]
    ? sequenceForBackView[singleSelectedMeasureIndex]
    : null;


  useEffect(() => {
    // Adjusts the height of the flipper container to match the visible content, ensuring a smooth flip animation.
    const flipper = flipperRef.current;
    const frontContent = frontContentRef.current;
    const backContent = backContentRef.current;

    if (flipper && frontContent && backContent) {
      const setFlipperHeight = () => {
        const height = isFlipped ? backContent.offsetHeight : frontContent.offsetHeight;
        if (height > 0) {
          flipper.style.height = `${height}px`;
        }
      };
      
      const observer = new ResizeObserver(setFlipperHeight);
      observer.observe(frontContent);
      observer.observe(backContent);
      const timerId = setTimeout(setFlipperHeight, 0);
      return () => { clearTimeout(timerId); observer.disconnect(); }
    }
  }, [isFlipped, sequenceForBackView, singleSelectedMeasureIndex, displayBeats, displaySubdivisions, isEditMode, simpleView]);


  const handleSelectMeasureForEdit = (index: number) => {
    if (props.disabled || draggedItemId) return;
    
    if (isEditMode) { // Single-select in edit mode
      onSetSelectedMeasureIndices([index]);
    } else { // Single-select (or deselect) outside edit mode
      onSetSelectedMeasureIndices(prev => (prev.length === 1 && prev[0] === index) ? [] : [index]);
    }
  }

  const handleAddMeasure = () => {
    if (props.disabled || measureSequence.length >= 40) return;
    const newMeasure: Measure = {
      id: `m-${Date.now()}`,
      beats: 4,
      subdivisions: 4,
      pattern: generateDefaultPattern(4, 4),
    };
    const sequence = liveSequence || measureSequence;
    handleMeasureSequenceChange([...sequence, newMeasure]);
    setNewlyAddedMeasureId(newMeasure.id);
    setTimeout(() => setNewlyAddedMeasureId(null), 500); // Corresponds to animation duration
  };

  const handleDeleteMeasure = () => {
    if (props.disabled || selectedMeasureIndices.length === 0 || measureSequence.length <= 1) return;
    const sequence = liveSequence || measureSequence;

    // With single-select in edit mode, we operate on the first (and only) selected index
    const indexToDelete = selectedMeasureIndices[0];

    const newSequence = sequence.filter((_, index) => index !== indexToDelete);
    handleMeasureSequenceChange(newSequence);

    // After deleting, select the next logical measure to allow for sequential deletions.
    if (newSequence.length > 0) {
        const newIndexToSelect = Math.min(indexToDelete, newSequence.length - 1);
        onSetSelectedMeasureIndices([newIndexToSelect]);
    } else {
        // This case is unlikely due to the length check, but is here for safety.
        onSetSelectedMeasureIndices([]);
    }
  };
  
  const handleDuplicateClick = () => {
    if (props.disabled || singleSelectedMeasureIndex === null || measureSequence.length >= 40) return;
    handleDuplicateMeasure(singleSelectedMeasureIndex);
    onSetSelectedMeasureIndices([singleSelectedMeasureIndex + 1]);
  };

  const handleRandomizeClick = () => {
    if (isRandomizing || props.disabled) return;
    setIsRandomizing(true);
    handleRandomizeSelectedMeasures();
    setTimeout(() => setIsRandomizing(false), 500); // Animation duration
  }

  // --- Drag & Drop Logic for reordering measures ---
  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, measureId: string) => {
    if (!isEditMode) { e.preventDefault(); return; }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', measureId);
    setDraggedItemId(measureId);
    setLiveSequence([...measureSequence]); // Use a temporary sequence for live reordering
  };

  const handleDragEnter = (hoverMeasureId: string) => {
    if (!isEditMode || !draggedItemId || !liveSequence || draggedItemId === hoverMeasureId) return;

    const dragIndex = liveSequence.findIndex(m => m.id === draggedItemId);
    const hoverIndex = liveSequence.findIndex(m => m.id === hoverMeasureId);
    if (dragIndex === -1 || hoverIndex === -1 || dragIndex === hoverIndex) return;

    const reordered = [...liveSequence];
    const [draggedItem] = reordered.splice(dragIndex, 1);
    reordered.splice(hoverIndex, 0, draggedItem);
    setLiveSequence(reordered); // Update the live preview
  };

  const handleDragEnd = () => {
    if (!isEditMode || !liveSequence || !draggedItemId) {
      setDraggedItemId(null);
      setLiveSequence(null);
      return;
    }
    handleMeasureSequenceChange(liveSequence); // Commit the change
    const newIndex = liveSequence.findIndex(m => m.id === draggedItemId);
    if (newIndex !== -1) { onSetSelectedMeasureIndices([newIndex]); }
    setDraggedItemId(null);
    setLiveSequence(null);
  };

  const handleMeasurePatternChange = (newPattern: number[]) => {
    if (props.disabled || singleSelectedMeasureIndex === null) return;
    const sequence = liveSequence || measureSequence;
    const newSequence = [...sequence];
    newSequence[singleSelectedMeasureIndex] = { ...newSequence[singleSelectedMeasureIndex], pattern: newPattern };
    handleMeasureSequenceChange(newSequence);
  };
  
  const stepForGrid = (singleSelectedMeasureIndex === playingMeasureIndex) ? stepInPlayingMeasure : -1;
  
  const getHeaderText = () => {
    if (isEditMode) {
      if (selectedMeasureIndices.length > 0) return `${selectedMeasureIndices.length} Measure Selected`;
      return 'Edit Sequence';
    }
    if (singleSelectedMeasureIndex !== null) {
      const isCountInMeasure = countInForBackView && singleSelectedMeasureIndex === 0 && sequenceForBackView.length > 1;
      const measureLabel = isCountInMeasure ? 'Count-in' : `Measure ${countInForBackView ? singleSelectedMeasureIndex : singleSelectedMeasureIndex + 1}`;
      
      if (isPlaying) return `Playing ${measureLabel}`;
      return measureLabel;
    }
    return 'Adv. Sequencer';
  };

  const shouldIsolateCountIn = countInForBackView && sequenceForBackView.length > 4;

  const renderMeasureButton = (measure: Measure, index: number) => {
    const isCountInMeasure = countInForBackView && index === 0 && sequenceForBackView.length > 1;
    const isEditableInThisMode = !(isEditMode && isCountInMeasure);
    const isNewlyAdded = newlyAddedMeasureId === measure.id;
    const isBeingDragged = isEditMode && draggedItemId === measure.id;
    const isSelected = selectedMeasureIndices.includes(index);
    const isPlayingThisMeasure = !isEditMode && index === playingMeasureIndex;

    let ringClass = '';
    if (isSelected) {
      if (isPlaying && isPlayingThisMeasure) {
        ringClass = 'ring-2 ring-offset-2 ring-offset-[var(--container-bg)] ring-[var(--strong-beat-accent)] animate-pulse';
      } else if (isEditableInThisMode) {
        ringClass = 'ring-2 ring-offset-2 ring-offset-[var(--container-bg)] ring-blue-500';
      }
    }

    const buttonClasses = [
      'relative w-16 h-16 rounded-full border border-[var(--container-border)] flex flex-col items-center justify-center',
      'transition-all duration-300 ease-in-out',
      isEditMode && isEditableInThisMode ? 'rounded-tl-lg' : '', // Visual cue for draggable area
      isCountInMeasure ? 'bg-[var(--primary-accent)]/10' : '', ringClass,
      isEditMode && !isEditableInThisMode ? 'opacity-60' : '',
      isEditMode ? '' : 'hover:bg-white/5',
      props.disabled ? 'cursor-not-allowed' : (isEditMode ? (isEditableInThisMode ? 'cursor-grab' : 'cursor-default') : 'cursor-pointer'),
      isBeingDragged ? 'opacity-30' : 'opacity-100',
      isNewlyAdded ? 'animate-drop-in' : '',
    ].filter(Boolean).join(' ');

    return (
      <button 
        key={measure.id}
        onClick={isEditMode && !isEditableInThisMode ? undefined : () => handleSelectMeasureForEdit(index)}
        draggable={isEditMode && isEditableInThisMode}
        onDragStart={(e) => handleDragStart(e, measure.id)}
        onDragEnd={handleDragEnd}
        onDragEnter={() => { if (isEditableInThisMode) handleDragEnter(measure.id); }}
        onDragOver={(e) => { if (isEditMode && isEditableInThisMode) e.preventDefault(); }}
        className={buttonClasses}
        aria-disabled={isEditMode && !isEditableInThisMode}
      >
        {isEditMode && isEditableInThisMode && (
          <div className="absolute top-1 left-1 p-1 cursor-grab active:cursor-grabbing group"><GripIcon /></div>
        )}
        <div className={`flex flex-col items-center justify-center transition-opacity ${isEditMode && !isSelected && !isBeingDragged ? 'opacity-40' : ''}`}>
          {isCountInMeasure ? (
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary-accent)]">Count In</span>
          ) : (
              <>
                  <span className="text-xl font-bold text-white leading-none">{measure.beats}</span>
                  <div className="w-8 h-px bg-[var(--text-secondary)] my-0.5"></div>
                  <span className="text-lg text-[var(--text-secondary)] leading-none">{measure.subdivisions}</span>
              </>
          )}
        </div>
        {measure.bpm && (
          <span className={`absolute -bottom-1 text-xs text-white/70 font-mono bg-[var(--container-bg)] px-1 rounded-sm transition-opacity ${isEditMode ? 'opacity-40' : ''}`}>{measure.bpm}</span>
        )}
      </button>
    );
  };


  const containerClasses = `w-full bg-[var(--container-bg)] backdrop-blur-lg border border-[var(--container-border)] rounded-3xl p-[15px] transition-opacity duration-300 flip-container ${props.disabled ? 'opacity-50' : ''} overflow-hidden`;
  
  return (
    <div className={containerClasses}>
      <div ref={flipperRef} className={`flipper ${isFlipped ? 'is-flipped' : ''}`}>
        {/* FRONT FACE: Simple Sequencer */}
        <div className="front" id="sequencer-front" aria-hidden={isFlipped}>
          <div ref={frontContentRef} className="flex flex-col w-full">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-white/10">
              <button
                onClick={() => updateSetting('simpleView', simpleView === 'grid' ? 'rings' : 'grid')}
                className="flex items-center gap-1 bg-black/20 p-1 rounded-full cursor-pointer transition-colors hover:bg-black/40"
                aria-label={`Switch to ${simpleView === 'grid' ? 'ring' : 'grid'} view`}
                aria-live="polite"
              >
                <div className={`p-1.5 rounded-full transition-colors duration-300 ${simpleView === 'grid' ? 'text-[var(--primary-accent)]' : 'text-[var(--text-secondary)]'}`} aria-hidden="true"><GridViewIcon /></div>
                <div className={`p-1.5 rounded-full transition-colors duration-300 ${simpleView === 'rings' ? 'text-[var(--primary-accent)]' : 'text-[var(--text-secondary)]'}`} aria-hidden="true"><RingViewIcon /></div>
              </button>
              <button
                onClick={() => onFlip(true)}
                className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors py-2"
                aria-controls="sequencer-back"
                aria-expanded="false"
              >
                <AdvSequencerIcon />
                Adv. Sequencer
              </button>
            </div>

            {simpleView === 'grid' ? (
                <StepGrid 
                    beats={displayBeats}
                    subdivisions={displaySubdivisions}
                    pattern={displayPattern}
                    onPatternChange={handlePatternChange}
                    currentStep={isFlipped ? -1 : stepInMeasure}
                    isPlaying={isPlaying}
                    disabled={props.disabled}
                    beatSoundId={beatSoundId}
                    subdivisionSoundId={subdivisionSoundId}
                />
            ) : (
                <RingSequencer
                    beats={displayBeats}
                    subdivisions={displaySubdivisions}
                    pattern={displayPattern}
                    onPatternChange={handlePatternChange}
                    currentStep={isFlipped ? -1 : stepInMeasure}
                    isPlaying={isPlaying}
                    disabled={props.disabled}
                    bpm={bpm}
                    beatSoundId={beatSoundId}
                    subdivisionSoundId={subdivisionSoundId}
                />
            )}
          </div>
        </div>
        {/* BACK FACE: Advanced Sequencer */}
        <div className="back" id="sequencer-back" aria-hidden={!isFlipped}>
          <div ref={backContentRef} className="flex flex-col w-full">
             <div className="flex-grow flex flex-col">
              <div className="flex justify-between items-stretch h-[60px] -my-[10px]">
                <div className="flex flex-1 items-center gap-2 min-w-0">
                  <button
                    onClick={() => { onFlip(false); onSetSelectedMeasureIndices([]); onEditModeChange(false); }}
                    className="flex items-center text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-2 -ml-2"
                    aria-controls="sequencer-front"
                    aria-expanded="true"
                  >
                    <ChevronLeftIcon />
                  </button>
                  <h4 className="min-w-0 text-sm uppercase tracking-wider text-[var(--text-secondary)]">
                      <span className="truncate">{getHeaderText()}</span>
                  </h4>
                </div>
                <div className="flex items-stretch flex-shrink-0">
                    {isEditMode && (
                        <>
                            <div className="flex items-center justify-center px-1">
                                <button onClick={handleDuplicateClick} disabled={measureSequence.length >= 40 || selectedMeasureIndices.length !== 1} className="p-2 rounded-full bg-black/20 text-gray-300 hover:bg-white/20 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Duplicate selected measure"><DuplicateIcon /></button>
                            </div>
                            <div className="flex items-center justify-center px-1">
                                <button onClick={handleDeleteMeasure} disabled={selectedMeasureIndices.length === 0 || measureSequence.length <= 1} className="p-2 rounded-full bg-black/20 text-gray-300 hover:bg-red-600/80 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Delete selected measures"><TrashIcon /></button>
                            </div>
                            <div className="w-px h-6 bg-[var(--container-border)] opacity-50 my-auto mx-2"></div>
                        </>
                    )}
                    <button onClick={() => onEditModeChange(!isEditMode)} className="flex items-center justify-center px-2 rounded-lg hover:bg-white/5 transition-colors" aria-label={isEditMode ? "Done editing" : "Enter edit mode"}>
                        <div className={`p-2 rounded-full pointer-events-none transition-colors ${isEditMode ? 'bg-blue-500 text-white' : 'text-gray-300 bg-white/10'}`}>
                            {isEditMode ? <CheckIcon /> : <EditIcon />}
                        </div>
                    </button>
                    <button onClick={handleAddMeasure} disabled={props.disabled || measureSequence.length >= 40} className="flex items-center justify-center px-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Add measure">
                        <div className="p-2 rounded-full pointer-events-none text-gray-300 bg-white/10">
                            <PlusIcon />
                        </div>
                    </button>
                </div>
              </div>

              <div className={`mb-4 border-t border-white/10 transition-opacity ${isEditMode ? 'opacity-50' : ''}`}></div>
              
              <div className={`flex items-center gap-2 transition-opacity ${isEditMode ? 'opacity-50 pointer-events-none' : ''}`}>
                  <button 
                    onClick={() => handleCountInChange(!countInEnabled)} 
                    disabled={isEditMode} 
                    className={`flex-1 h-11 flex items-center justify-center font-bold rounded-2xl transition-all duration-300 uppercase tracking-wider text-sm ${countInEnabled ? 'bg-gray-400 text-black' : 'bg-black/20 text-white/70'}`} 
                    aria-pressed={countInEnabled}
                  >
                    Count In
                  </button>
                  <button 
                    onClick={() => handleLoopChange(!loopEnabled)} 
                    disabled={isEditMode} 
                    className={`flex-1 h-11 flex items-center justify-center font-bold rounded-2xl transition-all duration-300 uppercase tracking-wider text-sm ${loopEnabled ? 'bg-gray-400 text-black' : 'bg-black/20 text-white/70'}`} 
                    aria-pressed={loopEnabled}
                  >
                    Loop
                  </button>
                  <button 
                      onClick={handleRandomizeClick} 
                      disabled={isEditMode || selectedMeasureIndices.length === 0}
                      className={`
                          h-11 flex-shrink-0 flex items-center justify-center rounded-2xl bg-black/20 text-white/70 
                          transition-all duration-300 ease-in-out overflow-hidden
                          hover:enabled:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed
                          ${selectedMeasureIndices.length > 0 ? 'w-12 px-2' : 'w-0 px-0 opacity-0'}
                      `}
                      aria-label="Randomize selected measure(s)"
                      tabIndex={selectedMeasureIndices.length > 0 ? 0 : -1}
                  >
                      <div className={isRandomizing ? 'animate-spin-dice' : ''}>
                          <DiceIcon className="h-6 w-6"/>
                      </div>
                  </button>
              </div>
              
              <div className={`my-4 border-t border-white/10 transition-opacity ${isEditMode ? 'opacity-50' : ''}`}></div>

              {shouldIsolateCountIn && sequenceForBackView.length > 0 ? (
                <div onDragOver={(e) => { if(isEditMode && e.target !== e.currentTarget.firstChild?.firstChild) e.preventDefault(); }}>
                    <div className="mb-4 pb-4 border-b border-white/10 flex justify-center">{renderMeasureButton(sequenceForBackView[0], 0)}</div>
                    <div className="grid grid-cols-4 justify-items-center gap-x-1 gap-y-3">{sequenceForBackView.slice(1).map((measure, i) => renderMeasureButton(measure, i + 1))}</div>
                </div>
              ) : (
                <div className="grid grid-cols-4 justify-items-center gap-x-1 gap-y-3" onDragOver={(e) => isEditMode && e.preventDefault()}>
                  {sequenceForBackView.map((measure, index) => renderMeasureButton(measure, index))}
                </div>
              )}

              {measureForGrid && !isEditMode && (
                <div key={measureForGrid.id} className="mt-4 pt-4 border-t border-white/10 animate-panel">
                  <div className="flex justify-between items-center pb-4">
                      <h5 className="text-sm uppercase tracking-wider text-[var(--text-secondary)]">Pattern Editor</h5>
                      <button
                          onClick={() => updateSetting('simpleView', simpleView === 'grid' ? 'rings' : 'grid')}
                          className="flex items-center gap-1 bg-black/20 p-1 rounded-full cursor-pointer transition-colors hover:bg-black/40"
                          aria-label={`Switch to ${simpleView === 'grid' ? 'ring' : 'grid'} view`}
                          aria-live="polite"
                      >
                          <div className={`p-1.5 rounded-full transition-colors duration-300 ${simpleView === 'grid' ? 'text-[var(--primary-accent)]' : 'text-[var(--text-secondary)]'}`} aria-hidden="true"><GridViewIcon /></div>
                          <div className={`p-1.5 rounded-full transition-colors duration-300 ${simpleView === 'rings' ? 'text-[var(--primary-accent)]' : 'text-[var(--text-secondary)]'}`} aria-hidden="true"><RingViewIcon /></div>
                      </button>
                  </div>
                  {simpleView === 'grid' ? (
                      <StepGrid
                          beats={measureForGrid.beats}
                          subdivisions={measureForGrid.subdivisions}
                          pattern={measureForGrid.pattern}
                          onPatternChange={handleMeasurePatternChange}
                          currentStep={stepForGrid}
                          isPlaying={isPlaying}
                          disabled={props.disabled || singleSelectedMeasureIndex === null}
                          beatSoundId={beatSoundId}
                          subdivisionSoundId={subdivisionSoundId}
                      />
                  ) : (
                      <RingSequencer
                          beats={measureForGrid.beats}
                          subdivisions={measureForGrid.subdivisions}
                          pattern={measureForGrid.pattern}
                          onPatternChange={handleMeasurePatternChange}
                          currentStep={stepForGrid}
                          isPlaying={isPlaying}
                          disabled={props.disabled || singleSelectedMeasureIndex === null}
                          bpm={bpm}
                          beatSoundId={beatSoundId}
                          subdivisionSoundId={subdivisionSoundId}
                      />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sequencer;