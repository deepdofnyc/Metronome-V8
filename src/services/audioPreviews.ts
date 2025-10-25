
// A self-contained audio context for playing sound previews without interfering with the main engine.
let audioPreviewContext: AudioContext | null = null;

/**
 * Initializes and returns the audio preview context.
 * Must be called after a user gesture.
 */
const getAudioPreviewContext = async (): Promise<AudioContext | null> => {
    if (!audioPreviewContext) {
        try {
            audioPreviewContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.");
            return null;
        }
    }
    if (audioPreviewContext.state === 'suspended') {
        await audioPreviewContext.resume();
    }
    return audioPreviewContext;
};


/**
 * Plays a one-shot sound sample based on sound ID and step type.
 * @param soundId The ID of the sound to play (e.g., 'classic', 'electronic').
 * @param stepType The type of step to play a sound for: 1 (sub), 2 (beat), 3 (accent).
 */
export const playStepPreview = async (soundId: string, stepType: 1 | 2 | 3) => {
  const audioContext = await getAudioPreviewContext();
  if (!audioContext) return;

  const time = audioContext.currentTime;

  const osc = audioContext.createOscillator();
  const envelope = audioContext.createGain();
  
  let freq: number;
  let oscType: OscillatorType;
  let decay = 0.05;

  const isStrongBeat = stepType === 3;
  const isBeat = stepType === 2; // weak beat

  switch (soundId) {
    case 'electronic':
      oscType = 'square'; decay = 0.08;
      freq = isStrongBeat ? 880 : (isBeat ? 440 : 220); break;
    case 'woodblock':
      oscType = 'triangle'; decay = 0.1;
      freq = isStrongBeat ? 1500 : (isBeat ? 1200 : 800); break;
    case 'classic': default:
      oscType = 'sine';
      freq = isStrongBeat ? 880 : (isBeat ? 660 : 330); break;
  }

  osc.type = oscType;
  osc.frequency.setValueAtTime(freq, time);
  
  // Create a percussive envelope
  envelope.connect(audioContext.destination);
  envelope.gain.setValueAtTime(1, time);
  envelope.gain.exponentialRampToValueAtTime(0.001, time + decay);

  // Play the sound
  osc.connect(envelope);
  osc.start(time);
  osc.stop(time + decay);
};
