

import React from 'react';
import { type Sound } from '../types';
import { playStepPreview } from '../services/audioPreviews';
import { useMetronome } from '../contexts/MetronomeContext';
import { SOUND_OPTIONS } from '../constants';

interface SoundSelectorProps {}

const SoundSelector: React.FC<SoundSelectorProps> = () => {
  const { settingsForDisplay, updateSetting } = useMetronome();
  const { beatSoundId: currentBeatSoundId, subdivisionSoundId: currentSubdivisionSoundId } = settingsForDisplay;

  const handleBeatSoundSelect = (soundId: string) => {
    // A 'beat' preview should be distinct, so we use the strong beat sound (type 3).
    playStepPreview(soundId, 3);
    updateSetting('beatSoundId', soundId);
  };
  
  const handleSubdivisionSoundSelect = (soundId: string) => {
    // A 'subdivision' preview uses the standard subdivision sound (type 1).
    playStepPreview(soundId, 1);
    updateSetting('subdivisionSoundId', soundId);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-start gap-4">
        {/* Beat Sounds Column */}
        <div className="flex-1">
          <h4 className="text-center text-white/80 mb-2 font-medium tracking-wide">Beat</h4>
          <div className="flex flex-col gap-2 bg-black/20 p-1.5 rounded-3xl">
            {SOUND_OPTIONS.map(sound => (
              <button
                key={sound.id}
                onClick={() => handleBeatSoundSelect(sound.id)}
                className={`w-full text-center font-semibold py-2 px-[15px] rounded-2xl transition-all duration-300 focus:outline-none 
                  ${currentBeatSoundId === sound.id 
                      ? 'bg-[var(--primary-accent)] text-black shadow-md' 
                      : 'bg-transparent text-gray-300 hover:bg-white/10'
                  }`}
                aria-pressed={currentBeatSoundId === sound.id}
              >
                {sound.name}
              </button>
            ))}
          </div>
        </div>

        {/* Subdivision Sounds Column */}
        <div className="flex-1">
          <h4 className="text-center text-white/80 mb-2 font-medium tracking-wide">Subdivision</h4>
          <div className="flex flex-col gap-2 bg-black/20 p-1.5 rounded-3xl">
            {SOUND_OPTIONS.map(sound => (
              <button
                key={sound.id}
                onClick={() => handleSubdivisionSoundSelect(sound.id)}
                className={`w-full text-center font-semibold py-2 px-[15px] rounded-2xl transition-all duration-300 focus:outline-none 
                  ${currentSubdivisionSoundId === sound.id 
                      ? 'bg-[var(--secondary-accent)] text-black shadow-md'
                      : 'bg-transparent text-gray-300 hover:bg-white/10'
                  }`}
                aria-pressed={currentSubdivisionSoundId === sound.id}
              >
                {sound.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoundSelector;
