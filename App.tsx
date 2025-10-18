
import React from 'react';
import { useAppSettings } from './hooks';
import { MetronomeProvider, useMetronome } from './contexts/MetronomeContext';
import { AuthProvider } from './contexts/AuthContext';
import Knob from './components/Knob';
import SetlistManager from './components/SetlistManager';
import BpmControl from './components/HorizontalBpmSlider';
import CircularRhythmControl from './components/RhythmSlider';
import Sequencer from './components/Sequencer';
import SoundSelector from './components/SoundSelector';
import AddToHomeScreenPrompt from './components/AddToHomeScreenPrompt';
import QuickSongBar from './components/QuickSongBar';
import SettingsModal from './components/SettingsModal';
import FeedbackModal from './components/FeedbackModal';
import ManualModal from './components/ManualModal';
import SetlistPlayer from './components/SetlistPlayer';
import Walkthrough from './components/Walkthrough';
import { 
    MixerIcon, 
    SoundIcon, 
    PlayIcon,
    StopIcon
} from './components/Icons';
import Storybook from './components/Storybook';


/**
 * @file App.tsx
 * @description The main UI component for the Pulse Q Metronome application.
 * This component is responsible for laying out the UI and managing local UI state
 * like panels and modals. It consumes the core application logic and state from
 * the MetronomeContext.
 */
const AppContent: React.FC = () => {
  // App-wide settings for UI visibility etc.
  const { settings: appSettings, updateSetting: updateAppSetting, factoryReset } = useAppSettings();

  // Consume global state and actions from the context
  const {
    settings,
    settingsForDisplay,
    measureForDisplay,
    simpleViewMeasure,
    isPlaying,
    isAdvSequencerActive,
    isDirty,
    loadedSongInfo,
    loadedQuickSongIndex,
    currentlyPlayingId,
    setlists,
    newlyAddedItemId,
    quickSongs,
    isRhythmSliderActive,
    isKnobActive,
    isBpmSliderDragging,
    pressingSlots,
    beatTrigger,
    stepInMeasure,
    playingMeasureIndex,
    currentStep,
    selectedMeasureIndices,
    activeSetlist,
    currentSongIndex,
    canGoPrevSong,
    canGoNextSong,
    playingSetlistId,
    setlistActions,
    togglePlay,
    setIsRhythmSliderActive,
    setIsKnobActive,
    setIsBpmSliderDragging,
    handleSimpleRhythmChange,
    handlePatternChange,
    handleFlip,
    handleLoadQuickSong,
    handleSaveQuickSong,
    handleQuickSongPressingChange,
    handleRandomize,
    handleLoadSong,
    handleLoadAndPlay,
    handleStop,
    onRenameTriggered,
    handleCancelChanges,
    handlePrevSong,
    handleNextSong,
    handleMeasureSequenceChange,
    handleDuplicateMeasure,
    onSetSelectedMeasureIndices,
    handleCountInChange,
    updateSetting,
    handleLoopChange,
    handleRandomizeSelectedMeasures,
    addDemoSetlist,
  } = useMetronome();
  
  // Local UI State
  const [activePanel, setActivePanel] = React.useState<'mixer' | 'sounds' | null>(null);
  const [isEditingSequence, setIsEditingSequence] = React.useState(false);
  const [isSongsContainerOpen, setIsSongsContainerOpen] = React.useState(false);
  const [activeSetlistId, setActiveSetlistId] = React.useState<string | null>(null);
  const [isSettingsViewVisible, setIsSettingsViewVisible] = React.useState(false);
  const [isFeedbackViewVisible, setIsFeedbackViewVisible] = React.useState(false);
  const [isManualViewVisible, setIsManualViewVisible] = React.useState(false);
  const [isWalkthroughVisible, setIsWalkthroughVisible] = React.useState(false);

  // Refs
  const panelRef = React.useRef<HTMLDivElement>(null);
  const mainContentEndRef = React.useRef<HTMLDivElement>(null);
  
  const loadedSongId = React.useMemo(() => loadedSongInfo?.songId ?? null, [loadedSongInfo]);

  React.useEffect(() => {
    const hasCompletedWalkthrough = localStorage.getItem('pulseq_walkthrough_completed');
    if (hasCompletedWalkthrough !== 'true') {
      // Use a small delay to ensure the UI is fully mounted and elements are findable
      setTimeout(() => setIsWalkthroughVisible(true), 500);
    }
  }, []);

  const handleFinishWalkthrough = React.useCallback(() => {
    localStorage.setItem('pulseq_walkthrough_completed', 'true');
    setIsWalkthroughVisible(false);
  }, []);


  React.useEffect(() => {
    // When entering sequence edit mode, close any open panels.
    if (isEditingSequence) {
        setActivePanel(null);
    }
  }, [isEditingSequence]);

  React.useEffect(() => {
    // Prevents page scroll on mobile browsers when dragging a slider.
    const isActive = isRhythmSliderActive || isKnobActive || isBpmSliderDragging;
    const mainEl = document.querySelector('main');

    if (mainEl) {
      mainEl.style.overflowY = isActive ? 'hidden' : 'auto';
    }
    document.body.style.overscrollBehaviorY = isActive ? 'contain' : 'auto';
    
    return () => {
      if (mainEl) {
        mainEl.style.overflowY = 'auto';
      }
      document.body.style.overscrollBehaviorY = 'auto';
    };
  }, [isRhythmSliderActive, isKnobActive, isBpmSliderDragging]);

  React.useEffect(() => {
    // Auto-scroll to the bottom when a panel (Mixer/Sounds) is opened
    if (activePanel && mainContentEndRef.current) {
      setTimeout(() => mainContentEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 150);
    }
  }, [activePanel]);

  const handlePanelToggle = React.useCallback((panel: 'mixer' | 'sounds') => {
    setActivePanel(prev => prev === panel ? null : panel);
  }, []);

  const handleToggleSongsContainer = React.useCallback(() => {
    const nextState = !isSongsContainerOpen;
    setIsSongsContainerOpen(nextState);
    if (!nextState) {
        setActiveSetlistId(null);
    }
  }, [isSongsContainerOpen]);

  const isOverlayVisible = isRhythmSliderActive || isKnobActive;

  return (
    <div className="h-screen w-full flex flex-col font-sans relative">
      {isWalkthroughVisible && <Walkthrough onFinish={handleFinishWalkthrough} />}
      {isOverlayVisible && <div className="fixed inset-0 bg-black/75 z-30" />}
      
      <main className="flex-1 w-full overflow-y-auto">
        <div className="w-full max-w-[380px] mx-auto flex flex-col items-center gap-4 px-[15px] py-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)', paddingBottom: !!activeSetlistId ? 'calc(env(safe-area-inset-bottom, 0px) + 140px)' : 'calc(env(safe-area-inset-bottom, 0px) + 1rem)'}}>
          <div className="w-full h-10 flex items-center justify-center text-[var(--text-secondary)] uppercase text-sm tracking-widest font-bold">Pulse Q</div>
          
          <div data-tour-id="bpm-control" className="w-full">
            <BpmControl 
              isShrunk={!!activeSetlistId} 
              disabled={isEditingSequence} 
              showTapButton={appSettings.showTapButton} 
              showSlider={appSettings.showBpmControl}
              min={appSettings.minBpm}
              max={appSettings.maxBpm}
            />
          </div>
                    
          <div className={`w-full flex items-stretch h-[100px] transition-all duration-300 ease-in-out ${isEditingSequence ? 'opacity-50 pointer-events-none' : ''} ${!!activeSetlistId ? 'gap-0' : 'gap-2.5'}`}>
              <div data-tour-id="rhythm-dials" className={`relative flex-1 flex items-center justify-center gap-2 bg-[var(--container-bg)] backdrop-blur-lg border border-[var(--container-border)] rounded-3xl px-2 transition-all duration-300 h-full ${isRhythmSliderActive ? 'z-40' : ''}`}>
                  <CircularRhythmControl label="Beats" value={measureForDisplay.beats} min={1} max={16} onChange={(v) => handleSimpleRhythmChange('beats', v)} onInteractionStateChange={setIsRhythmSliderActive} accentColor='var(--strong-beat-accent)' />
                  <CircularRhythmControl label="SUBD." value={measureForDisplay.subdivisions} min={1} max={16} onChange={(v) => handleSimpleRhythmChange('subdivisions', v)} onInteractionStateChange={setIsRhythmSliderActive} accentColor='var(--secondary-accent)' />
                  <CircularRhythmControl label="Swing" value={Math.round(settingsForDisplay.swing * 100)} min={0} max={100} onChange={(v) => updateSetting('swing', v / 100)} onInteractionStateChange={setIsRhythmSliderActive} accentColor='var(--tertiary-accent)' />
              </div>
              <div data-tour-id="play-button" className={`flex-none transition-all duration-300 ease-in-out overflow-hidden ${!!activeSetlistId ? 'w-0' : 'w-[90px]'}`}>
                  <button
                      onClick={togglePlay}
                      disabled={isEditingSequence || !!activeSetlistId}
                      className={`w-full h-full flex items-center justify-center bg-[var(--container-bg)] backdrop-blur-lg border border-[var(--container-border)] rounded-3xl transition-all duration-300 ease-in-out ${isPlaying ? 'bg-gray-400 text-black' : 'bg-white/20 hover:enabled:bg-white/30 text-white'} disabled:cursor-not-allowed ${!!activeSetlistId ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}
                      aria-label={isPlaying ? 'Stop' : 'Play'}
                  >
                      {isPlaying ? <StopIcon /> : <PlayIcon />}
                  </button>
              </div>
          </div>

          {appSettings.showSetlists && (
              <div data-tour-id="setlists" className={`w-full ${isEditingSequence ? 'opacity-50 pointer-events-none' : ''}`}>
                <SetlistManager 
                    isContainerOpen={isSongsContainerOpen} 
                    onToggleVisibility={handleToggleSongsContainer} 
                    onActiveSetlistChange={setActiveSetlistId}
                />
              </div>
          )}

          {appSettings.showSequencer && (
            <div data-tour-id="sequencer" className={`w-full ${isRhythmSliderActive || isKnobActive ? 'relative z-40' : ''} ${isEditingSequence ? 'relative z-10' : ''}`}>
                <Sequencer
                // General props that are managed by this UI component
                isFlipped={isAdvSequencerActive}
                onFlip={handleFlip}
                isEditMode={isEditingSequence}
                onEditModeChange={setIsEditingSequence}
                />
            </div>
          )}

          {appSettings.showQuickSongs && (
            <div data-tour-id="quick-songs" className={`w-full transition-all duration-300 ease-in-out ${isAdvSequencerActive ? 'max-h-0 opacity-0' : 'max-h-[120px] opacity-100'}`}>
              <div className={`relative w-full bg-[var(--container-bg)] backdrop-blur-lg border border-[var(--container-border)] rounded-3xl p-[15px] overflow-hidden`}>
                {pressingSlots.size > 0 && (
                  <div 
                    key={Array.from(pressingSlots).join(',')}
                    className="absolute top-[1px] left-[24px] right-[24px] h-[2px] overflow-hidden"
                    style={{ maskImage: 'linear-gradient(to right, transparent, black 20%, black 80%, transparent)' }}
                  >
                    <div className="w-full h-full bg-[var(--primary-accent)] animate-progress-bar"></div>
                  </div>
                )}
                <QuickSongBar disabled={isEditingSequence} />
              </div>
            </div>
          )}
          
          <div data-tour-id="mixer-and-sounds-section" className="w-full flex flex-col gap-2">
            <div data-tour-id="mixer-sounds-buttons" className={`w-full flex items-stretch justify-center gap-2 ${isEditingSequence ? 'opacity-50 pointer-events-none' : ''}`}>
                <button onClick={() => handlePanelToggle('mixer')} disabled={isEditingSequence} className={`flex-1 flex justify-center items-center gap-2 transition-all duration-300 px-2 py-3 text-sm font-medium backdrop-blur-lg border rounded-3xl ${activePanel === 'mixer' ? 'bg-white/20 border-white/30' : 'bg-[var(--container-bg)] border-[var(--container-border)] hover:bg-white/10'}`} aria-pressed={activePanel === 'mixer'}><MixerIcon /> Mixer</button>
                <button onClick={() => handlePanelToggle('sounds')} disabled={isEditingSequence} className={`flex-1 flex justify-center items-center gap-2 transition-all duration-300 px-2 py-3 text-sm font-medium backdrop-blur-lg border rounded-3xl ${activePanel === 'sounds' ? 'bg-white/20 border-white/30' : 'bg-[var(--container-bg)] border-[var(--container-border)] hover:bg-white/10'}`} aria-pressed={activePanel === 'sounds'}><SoundIcon /> Sounds</button>
            </div>

            {activePanel && (
              <div data-tour-id="mixer-sounds-panel" ref={panelRef} className={`w-full bg-[var(--container-bg)] backdrop-blur-lg border border-[var(--container-border)] rounded-3xl px-[15px] pt-6 pb-8 animate-panel ${isKnobActive ? 'z-40' : ''}`}>
                {activePanel === 'mixer' && <div className="flex flex-col gap-4"><Knob label="Accent" value={settingsForDisplay.accentVolume} onChange={(v) => updateSetting('accentVolume', v)} color="var(--strong-beat-accent)" onInteractionStateChange={setIsKnobActive} /><Knob label="Subdivision" value={settingsForDisplay.beatVolume} onChange={(v) => updateSetting('beatVolume', v)} color="var(--secondary-accent)" onInteractionStateChange={setIsKnobActive} /><Knob label="Master" value={settings.masterVolume} onChange={(v) => updateSetting('masterVolume', v)} min={0} max={1} color="var(--text-primary)" onInteractionStateChange={setIsKnobActive} /></div>}
                {activePanel === 'sounds' && <SoundSelector />}
              </div>
            )}
          </div>
          
          <footer className="w-full text-center pt-8 pb-4 flex-shrink-0">
            <div className="flex justify-center items-center gap-4 mb-3">
                <button onClick={() => setIsFeedbackViewVisible(true)} className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Feedback</button>
                <div className="h-4 w-px bg-[var(--container-border)]"></div>
                <button onClick={() => setIsSettingsViewVisible(true)} className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Settings</button>
            </div>
            <a href="https://www.instagram.com/deepdof/" target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--text-tertiary)] tracking-wider hover:text-[var(--text-secondary)] transition-colors">@deepdof</a>
          </footer>
          <div ref={mainContentEndRef} />
        </div>
      </main>
      
      {isEditingSequence && <div className="fixed inset-0 bg-black/50 z-5" />}

      {activeSetlistId && appSettings.showSetlists && <SetlistPlayer isUiDisabled={isEditingSequence} />}

      {/* This component is a true modal and can overlay any view */}
      <AddToHomeScreenPrompt />

      {/* Modal Overlays */}
      {isSettingsViewVisible && (
        <SettingsModal 
            onClose={() => setIsSettingsViewVisible(false)}
            settings={appSettings}
            updateSetting={updateAppSetting}
            factoryReset={factoryReset}
            addDemoSetlist={addDemoSetlist}
            onOpenManual={() => {
              setIsSettingsViewVisible(false);
              setIsManualViewVisible(true);
            }}
            onShowWalkthrough={() => {
              setIsSettingsViewVisible(false);
              setTimeout(() => setIsWalkthroughVisible(true), 100);
            }}
        />
      )}
      {isFeedbackViewVisible && (
        <FeedbackModal 
            onClose={() => setIsFeedbackViewVisible(false)}
        />
      )}
      {isManualViewVisible && (
        <ManualModal
            onClose={() => setIsManualViewVisible(false)}
        />
      )}
    </div>
  );
};


const App: React.FC = () => {
  const [isStorybookMode, setIsStorybookMode] = React.useState(false);

  React.useEffect(() => {
    // Check for query param on mount to enable storybook mode
    const params = new URLSearchParams(window.location.search);
    if (params.get('storybook') === 'true') {
      setIsStorybookMode(true);
      // Clean up the aurora effect for storybook view
      document.body.className = 'text-white antialiased';
      document.body.style.backgroundColor = '#18181b';
    }
  }, []);

  if (isStorybookMode) {
    return <Storybook />;
  }

  return (
    <AuthProvider>
      <MetronomeProvider>
        <AppContent />
      </MetronomeProvider>
    </AuthProvider>
  );
};

export default App;
