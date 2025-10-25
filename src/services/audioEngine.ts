
import { type Measure, type MetronomeSettings } from '../types';

/**
 * @class AudioEngine
 * @description Manages all audio-related tasks for the metronome.
 * This includes initializing the Web Audio API, scheduling notes with precise timing
 * using a Web Worker, handling playback state, and applying all metronome settings
 * (BPM, volume, sounds, swing, etc.).
 */
export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private isRunning = false;
  private nextNoteTime = 0.0; // The time the next note is scheduled to play
  private scheduleAheadTime = 0.1; // How far ahead to schedule audio (in seconds)
  private schedulerWorker: Worker | null = null;

  // Audio nodes for volume control
  private masterGain: GainNode | null = null;
  private accentGain: GainNode | null = null;
  private beatGain: GainNode | null = null;
  
  // Current settings
  private globalSettings: Omit<MetronomeSettings, 'measureSequence' | 'loop'> | null = null;
  private bpm = 120;
  private measureSequence: Measure[] = [];
  private swing = 0;
  private masterVolume = 1;
  private beatSoundId = 'classic';
  private subdivisionSoundId = 'classic';
  private countInEnabled = false;
  private loopEnabled = true;
  private lastSettingsString: string | null = null; // Used for performance optimization
  
  // Playback state
  private currentMeasureIndex = 0;
  private currentStepInMeasure = 0;
  private globalStep = 0; // A continuous step count across all measures

  /** A callback function invoked on every scheduled step. -1 indicates stop. */
  public onStepCallback: ((step: number) => void) | null = null;


  /**
   * Initializes the AudioContext and the scheduler Web Worker.
   * Must be called after a user gesture (e.g., a click) to comply with browser audio policies.
   */
  public async init() {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      if (this.audioContext.state === 'suspended') await this.audioContext.resume();
    } else {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      await this.audioContext.resume();

      // WARM-UP: This is critical. Play a completely silent sound.
      // This forces the browser's audio hardware to wake up and initializes its clock,
      // preventing the first actual metronome click from being dropped or delayed.
      const buffer = this.audioContext.createBuffer(1, 1, 22050);
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      source.start(); // Use start() without arguments to play immediately.

      // Create the gain node chain: Oscillator -> Envelope -> Accent/Beat Gain -> Master Gain -> Destination
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.masterVolume;
      this.masterGain.connect(this.audioContext.destination);

      this.accentGain = this.audioContext.createGain();
      this.accentGain.gain.value = 0.5;
      this.accentGain.connect(this.masterGain);
      
      this.beatGain = this.audioContext.createGain();
      this.beatGain.gain.value = 0.5;
      this.beatGain.connect(this.masterGain);
    }

    if (!this.schedulerWorker) {
      // The Web Worker runs a simple interval timer to trigger the scheduler function periodically.
      // This is more reliable than setTimeout/setInterval in the main thread, which can be throttled.
      const workerCode = `
        let timerId = null;
        self.onmessage = (e) => {
          if (e.data.command === 'start') {
            if (timerId !== null) clearInterval(timerId);
            timerId = setInterval(() => self.postMessage('tick'), 25); // Tick every 25ms
          } else if (e.data.command === 'stop') {
            if (timerId !== null) clearInterval(timerId);
            timerId = null;
          }
        };
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.schedulerWorker = new Worker(URL.createObjectURL(blob));
      
      this.schedulerWorker.onmessage = () => {
        this.scheduler();
      };
    }
  }
  
  /** Calculates the duration of a single step, applying swing if necessary. */
  private getStepDuration(measure: Measure, stepInMeasure: number): number {
    const baseStepDuration = (60.0 / this.bpm) / measure.subdivisions;
    if (this.swing <= 0 || measure.subdivisions < 2) {
        return baseStepDuration;
    }

    const subStepInBeat = stepInMeasure % measure.subdivisions;
    const swingFactor = this.swing / 2.0;
    
    if (subStepInBeat % 2 === 0) { // On-beat subdivisions are longer
        return baseStepDuration * (1 + swingFactor);
    } else { // Off-beat subdivisions are shorter
        return baseStepDuration * (1 - swingFactor);
    }
  }

  /**
   * The core scheduling function. It's called by the Web Worker's 'tick'.
   * It looks ahead in time and schedules notes to be played by the Web Audio API.
   */
  private scheduler = () => {
    if (!this.isRunning || !this.audioContext || this.measureSequence.length === 0) return;
    const audioCtxCurrentTime = this.audioContext.currentTime;

    // Schedule notes until we are `scheduleAheadTime` in the future.
    while (this.nextNoteTime < audioCtxCurrentTime + this.scheduleAheadTime) {
      const currentMeasure = this.measureSequence[this.currentMeasureIndex];
      if (!currentMeasure || currentMeasure.pattern.length === 0) {
        this.advanceMeasure();
        continue;
      }
      
      this.scheduleNote(this.currentMeasureIndex, this.currentStepInMeasure, this.nextNoteTime);
      
      // Schedule the visual callback to sync with the audio.
      const stepForCallback = this.globalStep;
      if (this.onStepCallback) {
        const delay = (this.nextNoteTime - audioCtxCurrentTime) * 1000;
        setTimeout(() => {
          if (this.isRunning && this.onStepCallback) {
            this.onStepCallback(stepForCallback);
          }
        }, delay > 0 ? delay : 0);
      }
      
      // Calculate the duration of the current step, applying swing if necessary.
      const timeToNextStep = this.getStepDuration(currentMeasure, this.currentStepInMeasure);
      
      this.nextNoteTime += timeToNextStep;
      this.globalStep++;
      this.currentStepInMeasure++;

      if (this.currentStepInMeasure >= currentMeasure.pattern.length) {
        this.advanceMeasure();
      }
    }
  };

  /** Moves the playback cursor to the next measure, handling looping and count-ins. */
  private advanceMeasure() {
      this.currentStepInMeasure = 0;
      this.currentMeasureIndex++;

      if (this.currentMeasureIndex >= this.measureSequence.length) {
        if (!this.loopEnabled) {
            this.stop();
            return;
        }
        
        // If count-in is enabled, the loop starts from the second measure (index 1).
        const loopStartIndex = (this.countInEnabled && this.measureSequence.length > 1) ? 1 : 0;
        
        if (loopStartIndex >= this.measureSequence.length) {
            this.stop(); // Stop if there are no measures to loop.
            return;
        }

        this.currentMeasureIndex = loopStartIndex;
        
        // Reset globalStep to the beginning of the loop section.
        let newGlobalStep = 0;
        for (let i = 0; i < loopStartIndex; i++) {
          if (this.measureSequence[i]) {
            newGlobalStep += this.measureSequence[i].pattern.length;
          }
        }
        this.globalStep = newGlobalStep;
      }
      this.applyCurrentMeasureSettings();
  }

  /** Schedules a single audio note (an oscillator) to play at a specific time. */
  private scheduleNote(measureIndex: number, stepInMeasure: number, time: number) {
    if (!this.audioContext || !this.accentGain || !this.beatGain) return;

    const measure = this.measureSequence[measureIndex];
    const stepState = measure.pattern[stepInMeasure];
    if (stepState === 0) return; // 0 means silence

    // Determine which gain node to use based on the step type (accented or regular).
    const gainNode = (stepState === 2 || stepState === 3) ? this.accentGain : this.beatGain;

    const osc = this.audioContext.createOscillator();
    const envelope = this.audioContext.createGain(); // For a clean, percussive decay
    
    let freq: number;
    let type: OscillatorType;
    let decay = 0.05;

    const isBeat = stepState === 2 || stepState === 3;
    const soundIdForStep = isBeat ? this.beatSoundId : this.subdivisionSoundId;
    const isStrongBeat = stepState === 3;

    switch (soundIdForStep) {
        case 'electronic':
            type = 'square'; decay = 0.08;
            freq = isStrongBeat ? 880 : (isBeat ? 440 : 220); break;
        case 'woodblock':
            type = 'triangle'; decay = 0.1;
            freq = isStrongBeat ? 1500 : (isBeat ? 1200 : 800); break;
        case 'classic': default:
            type = 'sine';
            freq = isStrongBeat ? 880 : (isBeat ? 660 : 330); break;
    }

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    
    envelope.connect(gainNode);
    envelope.gain.setValueAtTime(1, time);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + decay);

    osc.connect(envelope);
    osc.start(time);
    osc.stop(time + decay);
  }

  /** Starts the metronome playback. */
  public start(startMeasureIndex = 0) {
    if (this.isRunning || !this.audioContext || !this.schedulerWorker) return;
    this.audioContext.resume();

    // Fade in master volume to avoid clicks
    if (this.masterGain) {
        this.masterGain.gain.cancelScheduledValues(this.audioContext.currentTime);
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.audioContext.currentTime);
        this.masterGain.gain.linearRampToValueAtTime(this.masterVolume, this.audioContext.currentTime + 0.01);
    }

    this.isRunning = true;
    
    // Handle starting from a specific measure
    this.currentMeasureIndex = (startMeasureIndex >= 0 && startMeasureIndex < this.measureSequence.length) ? startMeasureIndex : 0;
    this.currentStepInMeasure = 0;
    
    // Recalculate globalStep to match the starting measure
    let newGlobalStep = 0;
    for (let i = 0; i < this.currentMeasureIndex; i++) {
        if (this.measureSequence[i]) {
            newGlobalStep += this.measureSequence[i].pattern.length;
        }
    }
    this.globalStep = newGlobalStep;
    
    this.applyCurrentMeasureSettings();

    // --- NEW STRATEGY ---
    // Manually schedule the first beat with a safe buffer to ensure it plays,
    // then let the worker's scheduler take over for subsequent beats. This avoids
    // the race condition where the audio clock hasn't started when the first note is scheduled.
    const now = this.audioContext.currentTime;
    const firstNoteTime = now + 0.05; // 50ms buffer for reliability

    // 1. Schedule the first note's audio.
    this.scheduleNote(this.currentMeasureIndex, this.currentStepInMeasure, firstNoteTime);

    // 2. Schedule the first note's visual callback.
    const stepForCallback = this.globalStep;
    if (this.onStepCallback) {
        const delay = (firstNoteTime - now) * 1000;
        setTimeout(() => {
            if (this.isRunning && this.onStepCallback) {
                this.onStepCallback(stepForCallback);
            }
        }, delay);
    }
    
    // 3. Calculate when the *second* note should occur.
    const currentMeasure = this.measureSequence[this.currentMeasureIndex];
    const timeToNextStep = this.getStepDuration(currentMeasure, this.currentStepInMeasure);

    // 4. Advance the state to point to the second note.
    this.globalStep++;
    this.currentStepInMeasure++;
    if (this.currentStepInMeasure >= currentMeasure.pattern.length) {
        // This will reset step to 0 and advance measure index.
        this.advanceMeasure();
    }

    // 5. Set the nextNoteTime for the scheduler loop to pick up from.
    this.nextNoteTime = firstNoteTime + timeToNextStep;
    
    // 6. Start the worker.
    this.schedulerWorker.postMessage({ command: 'start' });
  }

  /** Stops the metronome playback. */
  public stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.schedulerWorker) {
      this.schedulerWorker.postMessage({ command: 'stop' });
    }

    // Fade out master volume to avoid clicks
    if (this.masterGain && this.audioContext) {
        this.masterGain.gain.cancelScheduledValues(this.audioContext.currentTime);
        this.masterGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.01);
    }
    
    // Signal stop to the UI
    if (this.onStepCallback) {
      this.onStepCallback(-1);
    }
  }

  /** Stops playback and terminates the Web Worker to release resources. */
  public terminate() {
    this.stop();
    if (this.schedulerWorker) {
      this.schedulerWorker.terminate();
      this.schedulerWorker = null;
    }
  }

  /**
   * Updates the engine with a new set of metronome settings.
   * @param settings The complete MetronomeSettings object.
   */
  public updateSettings(settings: MetronomeSettings) {
    // Stringify and compare for a quick deep-equality check to avoid unnecessary updates.
    const newSettingsString = JSON.stringify(settings);
    if (newSettingsString === this.lastSettingsString) return;
    
    this.lastSettingsString = newSettingsString;

    const { measureSequence, ...globalDefaults } = settings;
    this.globalSettings = globalDefaults;
    this.measureSequence = measureSequence;
    this.countInEnabled = settings.countIn ?? false;
    this.loopEnabled = settings.loop ?? true;

    this.updateMasterVolume(settings.masterVolume);
    
    // If not currently playing, apply settings for the first measure immediately for UI display.
    if (!this.isRunning) {
        this.currentMeasureIndex = 0;
        this.applyCurrentMeasureSettings();
    }
  }

  /** Applies the settings for the current measure, considering global defaults and measure-specific overrides. */
  private applyCurrentMeasureSettings() {
    if (!this.globalSettings) return;

    const measure = this.measureSequence?.[this.currentMeasureIndex];
    
    const bpm = measure?.bpm ?? this.globalSettings.bpm;
    const swing = measure?.swing ?? this.globalSettings.swing;
    const beatSoundId = measure?.beatSoundId ?? this.globalSettings.beatSoundId;
    const subdivisionSoundId = measure?.subdivisionSoundId ?? this.globalSettings.subdivisionSoundId;
    const accentVolume = measure?.accentVolume ?? this.globalSettings.accentVolume;
    const beatVolume = measure?.beatVolume ?? this.globalSettings.beatVolume;
    
    this.updateBpm(bpm);
    this.updateSwing(swing);
    this.updateBeatSound(beatSoundId);
    this.updateSubdivisionSound(subdivisionSoundId);
    if (this.accentGain) this.accentGain.gain.value = accentVolume;
    if (this.beatGain) this.beatGain.gain.value = beatVolume;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }
  
  private updateMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.audioContext) {
      // Use a ramp to avoid audio clicks if the volume changes during playback.
      if (this.isRunning) {
        this.masterGain.gain.cancelScheduledValues(this.audioContext.currentTime);
        this.masterGain.gain.linearRampToValueAtTime(this.masterVolume, this.audioContext.currentTime + 0.05);
      } else {
        this.masterGain.gain.value = this.masterVolume;
      }
    }
  }

  private updateBpm(bpm: number) { this.bpm = bpm; }
  private updateSwing(swing: number) { this.swing = swing; }
  private updateBeatSound(soundId: string) { this.beatSoundId = soundId; }
  private updateSubdivisionSound(soundId: string) { this.subdivisionSoundId = soundId; }
}
