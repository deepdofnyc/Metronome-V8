import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

interface WalkthroughProps {
    onFinish: () => void;
}

type StepPosition = 'top' | 'bottom' | 'left' | 'right' | 'center';

interface Step {
    targetId: string | null;
    title: string;
    content: string;
    position: StepPosition;
    highlightPadding?: number;
    onEnter?: () => void;
    transitionDelay?: number;
}

const Walkthrough: React.FC<WalkthroughProps> = ({ onFinish }) => {
    const [stepIndex, setStepIndex] = useState(0);
    const [styles, setStyles] = useState({
        highlight: {},
        bubble: {},
        bubbleVisible: false,
    });
    const [isTransitioning, setIsTransitioning] = useState(false);
    
    const highlightedElementRef = useRef<HTMLElement | null>(null);
    const transitionTimeoutRef = useRef<number | null>(null);
    const bubbleRef = useRef<HTMLDivElement>(null);

    // --- State helpers for interactive steps ---
    const ensureView = (view: 'grid' | 'ring') => {
        const switcher = document.querySelector<HTMLElement>('[data-tour-id="sequencer-view-switch"]');
        if (!switcher) return;
        const gridIconContainer = switcher.querySelectorAll('div')[0];
        const isGridViewActive = gridIconContainer?.classList.contains('text-[var(--primary-accent)]');
        if (view === 'grid' && !isGridViewActive) switcher.click();
        if (view === 'ring' && isGridViewActive) switcher.click();
    };

    const ensureSequencerFace = (face: 'simple' | 'advanced') => {
        const flipper = document.querySelector<HTMLElement>('.flipper');
        if (!flipper) return;
        const isFlipped = flipper.classList.contains('is-flipped'); // Flipped means advanced
        if (face === 'simple' && isFlipped) {
            document.querySelector<HTMLElement>('#sequencer-back [aria-controls="sequencer-front"]')?.click();
        }
        if (face === 'advanced' && !isFlipped) {
            document.querySelector<HTMLElement>('[data-tour-id="adv-sequencer-button"]')?.click();
        }
    };

    const steps: Step[] = useMemo(() => [
        {
            targetId: null,
            title: 'Welcome to Pulse Q!',
            content: 'Let\'s take a quick tour of the main features to get you started.',
            position: 'center',
        },
        {
            targetId: 'bpm-control',
            title: 'Tempo Editor',
            content: 'This is where you set the speed. Drag the slider, tap the number, or long-press to type an exact BPM.',
            position: 'bottom',
            highlightPadding: 8,
        },
        {
            targetId: 'rhythm-dials',
            title: 'Rhythm Dials',
            content: 'Use these dials to set the BEATS, SUBDIVISIONS, and add SWING to your rhythm.',
            position: 'bottom',
            highlightPadding: 8,
        },
        {
            targetId: 'play-button',
            title: 'Play/Stop',
            content: 'Tap here to start and stop the metronome.',
            position: 'bottom',
            highlightPadding: 8,
        },
        {
            targetId: 'sequencer',
            title: 'The Sequencer (Grid)',
            content: 'Create your rhythm pattern in this grid. Tap steps to cycle sounds. Next, we\'ll see another view.',
            position: 'bottom',
            highlightPadding: 8,
            onEnter: () => {
                ensureSequencerFace('simple');
                ensureView('grid');
            }
        },
        {
            targetId: 'sequencer',
            title: 'The Sequencer (Ring)',
            content: 'This is the Ring view. It\'s a different way to see the same pattern. Now for the advanced editor.',
            position: 'bottom',
            highlightPadding: 8,
            onEnter: () => {
                ensureSequencerFace('simple');
                ensureView('ring');
            }
        },
        {
            targetId: 'sequencer',
            title: 'Advanced Sequencer',
            content: 'Here you can chain multiple patterns into a song. Tap a measure to select it and edit its pattern below.',
            position: 'top',
            highlightPadding: 8,
            onEnter: () => ensureSequencerFace('advanced'),
            transitionDelay: 800, // Wait for flip animation
        },
        {
            targetId: 'quick-songs',
            title: 'Quick Songs',
            content: 'Long-press an empty slot to save your current settings. Tap to load it back instantly!',
            position: 'top',
            highlightPadding: 8,
            onEnter: () => ensureSequencerFace('simple'),
            transitionDelay: 800, // Wait for flip animation
        },
        {
            targetId: 'setlists',
            title: 'Setlists',
            content: 'Organize your saved songs into setlists for practice or performance. The manager is now open.',
            position: 'top',
            highlightPadding: 8,
            onEnter: () => {
                const setlistToggleButton = document.querySelector<HTMLElement>('[data-tour-id="setlists"] [role="button"]');
                const setlistContent = document.querySelector<HTMLElement>('#setlist-content');
                // Check if the content is closed (max-h-0) and click the button to open it
                if (setlistToggleButton && setlistContent?.classList.contains('max-h-0')) {
                    setlistToggleButton.click();
                }
            },
            transitionDelay: 500, // Wait for setlist container animation
        },
        {
            targetId: 'mixer-and-sounds-section',
            title: 'The Mixer',
            content: 'Adjust the volume for accents, subdivisions, and the master output here. Drag the sliders left or right.',
            position: 'top',
            highlightPadding: 8,
            onEnter: () => {
                ensureSequencerFace('simple');
                // Close setlists if open for a cleaner view
                const setlistToggleButton = document.querySelector<HTMLElement>('[data-tour-id="setlists"] [role="button"]');
                const setlistContent = document.querySelector<HTMLElement>('#setlist-content');
                if (setlistToggleButton && !setlistContent?.classList.contains('max-h-0')) {
                    setlistToggleButton.click();
                }
                // Open the mixer panel
                const buttonsContainer = document.querySelector<HTMLElement>('[data-tour-id="mixer-sounds-buttons"]');
                if (!buttonsContainer) return;
                const mixerButton = buttonsContainer.querySelectorAll('button')[0];
                if (mixerButton.getAttribute('aria-pressed') === 'false') mixerButton.click();
            },
            transitionDelay: 500, // Wait for setlist container to close
        },
        {
            targetId: 'mixer-and-sounds-section',
            title: 'Sound Kits',
            content: 'Choose different sound kits for your beats and subdivisions independently for a custom feel.',
            position: 'top',
            highlightPadding: 8,
            onEnter: () => {
                ensureSequencerFace('simple');
                const buttonsContainer = document.querySelector<HTMLElement>('[data-tour-id="mixer-sounds-buttons"]');
                if (!buttonsContainer) return;
                const soundsButton = buttonsContainer.querySelectorAll('button')[1];
                if (soundsButton.getAttribute('aria-pressed') === 'false') soundsButton.click();
            }
        },
         {
            targetId: null,
            title: "You're all set!",
            content: "That covers the basics. Explore the settings for even more control. Happy practicing!",
            position: 'center',
            onEnter: () => {
                ensureSequencerFace('simple');
                // Close any open panel
                const activeButton = document.querySelector<HTMLElement>('[data-tour-id="mixer-sounds-buttons"] button[aria-pressed="true"]');
                if (activeButton) activeButton.click();
                // Close setlists if open
                const setlistToggleButton = document.querySelector<HTMLElement>('[data-tour-id="setlists"] [role="button"]');
                const setlistContent = document.querySelector<HTMLElement>('#setlist-content');
                if (setlistToggleButton && !setlistContent?.classList.contains('max-h-0')) {
                    setlistToggleButton.click();
                }
            },
        },
    ], []);


    const updatePositionsForStep = useCallback((index: number) => {
        if (highlightedElementRef.current) {
            highlightedElementRef.current.classList.remove('walkthrough-highlighted-element');
            highlightedElementRef.current = null;
        }

        const step = steps[index];
        if (!step) return;

        if (!step.targetId) {
            return {
                highlight: { display: 'none' },
                bubble: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
            };
        }

        const targetElement = document.querySelector<HTMLElement>(`[data-tour-id="${step.targetId}"]`);
        if (!targetElement) {
            return { 
                highlight: { display: 'none' }, 
                bubble: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' } 
            };
        }

        targetElement.classList.add('walkthrough-highlighted-element');
        highlightedElementRef.current = targetElement;
        
        const rect = targetElement.getBoundingClientRect();
        const padding = step.highlightPadding ?? 4;
        
        const highlightStyle = {
            width: `${rect.width + padding * 2}px`,
            height: `${rect.height + padding * 2}px`,
            top: `${rect.top - padding}px`,
            left: `${rect.left - padding}px`,
        };

        const bubbleEl = bubbleRef.current;
        if (!bubbleEl) return { highlight: highlightStyle, bubble: {} };

        const bubbleStyle: React.CSSProperties = {};
        const bubbleMargin = 16;
        const safeAreaPadding = 16;
        const bubbleHeight = bubbleEl.offsetHeight;
        const bubbleWidth = bubbleEl.offsetWidth;

        let preferredPosition = step.position;
        if (['left', 'right', 'center'].includes(preferredPosition)) {
            preferredPosition = (rect.top + rect.height / 2 < window.innerHeight / 2) ? 'bottom' : 'top';
        }

        const spaceBelow = window.innerHeight - rect.bottom - bubbleMargin - safeAreaPadding;
        const spaceAbove = rect.top - bubbleMargin - safeAreaPadding;

        let finalVPosition: 'top' | 'bottom';
        if (preferredPosition === 'bottom') {
            finalVPosition = (spaceBelow >= bubbleHeight || spaceBelow > spaceAbove) ? 'bottom' : 'top';
        } else {
            finalVPosition = (spaceAbove >= bubbleHeight || spaceAbove > spaceBelow) ? 'top' : 'bottom';
        }

        let finalTop;
        if (finalVPosition === 'bottom') {
            finalTop = rect.bottom + bubbleMargin;
        } else { // 'top'
            finalTop = rect.top - bubbleHeight - bubbleMargin;
        }

        if (finalTop < safeAreaPadding) {
            finalTop = safeAreaPadding;
        } else if (finalTop + bubbleHeight > window.innerHeight - safeAreaPadding) {
            finalTop = window.innerHeight - bubbleHeight - safeAreaPadding;
        }
        
        const idealLeft = rect.left + rect.width / 2;
        let finalLeft = idealLeft - (bubbleWidth / 2);

        if (finalLeft < safeAreaPadding) {
            finalLeft = safeAreaPadding;
        } else if (finalLeft + bubbleWidth > window.innerWidth - safeAreaPadding) {
            finalLeft = window.innerWidth - bubbleWidth - safeAreaPadding;
        }

        bubbleStyle.top = `${finalTop}px`;
        bubbleStyle.left = `${finalLeft}px`;
        bubbleStyle.transform = 'none';

        return { highlight: highlightStyle, bubble: bubbleStyle };

    }, [steps]);
    
    const handleFinish = useCallback(() => {
        const lastStep = steps[steps.length - 1];
        if (lastStep.onEnter) {
            lastStep.onEnter();
        }

        // Scroll the main content area to the top.
        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.scrollTo({ top: 0, behavior: 'smooth' });
        }
        
        onFinish();
    }, [onFinish, steps]);
    
    const changeStep = useCallback((direction: 'next' | 'prev') => {
        if (isTransitioning) return;

        const targetStepIndex = direction === 'next' ? stepIndex + 1 : stepIndex - 1;
        
        if (direction === 'next' && targetStepIndex >= steps.length) {
            handleFinish();
            return;
        }
        
        if (targetStepIndex < 0) return;

        setIsTransitioning(true);
        setStyles(s => ({ ...s, bubbleVisible: false }));
        
        transitionTimeoutRef.current = window.setTimeout(() => {
            setStepIndex(targetStepIndex);
        }, 150);
    }, [isTransitioning, stepIndex, steps, handleFinish]);
    
    const handleNext = useCallback(() => changeStep('next'), [changeStep]);
    const handlePrev = useCallback(() => changeStep('prev'), [changeStep]);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleFinish();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                handleNext();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                handlePrev();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleFinish, handleNext, handlePrev]);


    useEffect(() => {
        const step = steps[stepIndex];
        if (!step) return;

        if (step.onEnter) step.onEnter();

        const repositionTimeout = setTimeout(() => {
            const targetElement = step.targetId ? document.querySelector<HTMLElement>(`[data-tour-id="${step.targetId}"]`) : null;

            if (targetElement) {
                const mainEl = document.querySelector('main');
                const bubbleEl = bubbleRef.current;
                if (!mainEl || !bubbleEl) return;

                const targetRect = targetElement.getBoundingClientRect();
                const bubbleHeight = bubbleEl.offsetHeight;
                const bubbleMargin = 16;
                const safeAreaPadding = 16;
                
                let preferredPosition = step.position;
                if (['left', 'right', 'center'].includes(preferredPosition)) {
                    preferredPosition = (targetRect.top + targetRect.height / 2 < window.innerHeight / 2) ? 'bottom' : 'top';
                }
                const spaceBelow = window.innerHeight - targetRect.bottom - bubbleMargin - safeAreaPadding;
                const spaceAbove = targetRect.top - bubbleMargin - safeAreaPadding;
                
                const finalVPosition = (preferredPosition === 'bottom')
                    ? ((spaceBelow >= bubbleHeight || spaceBelow > spaceAbove) ? 'bottom' : 'top')
                    : ((spaceAbove >= bubbleHeight || spaceAbove > spaceBelow) ? 'top' : 'bottom');

                const comboHeight = targetRect.height + bubbleMargin + bubbleHeight;
                const comboTop = (finalVPosition === 'bottom') ? targetRect.top : targetRect.top - bubbleHeight - bubbleMargin;
                const comboCenterY = comboTop + comboHeight / 2;
                const viewportCenterY = window.innerHeight / 2;
                const scrollDelta = comboCenterY - viewportCenterY;
                
                mainEl.scrollBy({ top: scrollDelta, behavior: 'smooth' });
            }

            const styleUpdateTimeout = setTimeout(() => {
                const newPositions = updatePositionsForStep(stepIndex);
                setStyles({ ...newPositions, bubbleVisible: false });

                const fadeInTimeout = setTimeout(() => {
                    setStyles(s => ({ ...s, bubbleVisible: true }));
                    setIsTransitioning(false);
                }, 250);
                transitionTimeoutRef.current = fadeInTimeout;
            }, targetElement ? 250 : 50);

            transitionTimeoutRef.current = styleUpdateTimeout;
        }, step.transitionDelay || 50);

        const debouncedRecalculate = () => {
            const newPositions = updatePositionsForStep(stepIndex);
            setStyles(s => ({ ...s, ...newPositions }));
        };
        const mainElForScroll = document.querySelector('main');
        window.addEventListener('resize', debouncedRecalculate);
        mainElForScroll?.addEventListener('scroll', debouncedRecalculate);

        return () => {
            clearTimeout(repositionTimeout);
            if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
            window.removeEventListener('resize', debouncedRecalculate);
            mainElForScroll?.removeEventListener('scroll', debouncedRecalculate);
            if (highlightedElementRef.current) {
                highlightedElementRef.current.classList.remove('walkthrough-highlighted-element');
            }
        };
    }, [stepIndex, steps, updatePositionsForStep]);

    const currentStep = steps[stepIndex];
    if (!currentStep) return null;

    return (
        <div className="walkthrough-overlay" onClick={handleFinish}>
            <div className="walkthrough-highlight-box" style={styles.highlight}></div>
            <div 
                ref={bubbleRef}
                className={`walkthrough-bubble ${styles.bubbleVisible ? 'visible' : ''}`} 
                style={styles.bubble}
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-xl font-bold text-white mb-2">{currentStep.title}</h3>
                <p className="text-white/80 leading-relaxed">{currentStep.content}</p>
                <div className="flex justify-between items-center mt-5">
                    <button onClick={handleFinish} className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Skip</button>
                    <div className="flex items-center gap-2">
                        {stepIndex > 0 && (
                            <button onClick={handlePrev} className="px-4 py-2 text-sm rounded-full bg-black/25 hover:bg-white/10 transition-colors" disabled={isTransitioning}>Previous</button>
                        )}
                        <button onClick={handleNext} className="px-5 py-2 text-sm font-bold rounded-full bg-[var(--primary-accent)] text-black hover:bg-[var(--primary-accent-dark)] transition-colors" disabled={isTransitioning}>
                            {stepIndex === steps.length - 1 ? 'Finish' : 'Next'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Walkthrough;
