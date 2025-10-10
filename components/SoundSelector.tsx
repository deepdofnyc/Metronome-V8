import React from 'react';
import { type Sound } from '../types';

interface SoundSelectorProps {
  soundOptions: Sound[];
  currentBeatSoundId: string;
  currentSubdivisionSoundId: string;
  onBeatSoundSelect: (id: string) => void;
  onSubdivisionSoundSelect: (id: string) => void;
}

const SoundSelector: React.FC<SoundSelectorProps> = ({
  soundOptions,
  currentBeatSoundId,
  currentSubdivisionSoundId,
  onBeatSoundSelect,
  onSubdivisionSoundSelect,
}) => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-start gap-4">
        {/* Beat Sounds Column */}
        <div className="flex-1">
          <h4 className="text-center text-white/80 mb-2 font-medium tracking-wide">Beat</h4>
          <div className="flex flex-col gap-2 bg-black/20 p-1.5 rounded-3xl">
            {soundOptions.map(sound => (
              <button
                key={sound.id}
                onClick={() => onBeatSoundSelect(sound.id)}
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
            {soundOptions.map(sound => (
              <button
                key={sound.id}
                onClick={() => onSubdivisionSoundSelect(sound.id)}
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