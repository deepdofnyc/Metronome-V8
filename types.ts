
export type SubdivisionV1 = 'quarter' | 'eighth' | 'triplet' | 'sixteenth';

export interface Sound {
  id: string;
  name: string;
}

export interface Measure {
  id:string;
  beats: number;
  subdivisions: number;
  pattern: number[];
  // ADDED: Overrides for measure-specific settings
  bpm?: number;
  beatSoundId?: string;
  subdivisionSoundId?: string;
  accentVolume?: number;
  beatVolume?: number; // Controls subdivision volume
  swing?: number;
}

export interface MetronomeSettings {
  bpm: number;
  beatSoundId: string;
  subdivisionSoundId: string;
  accentVolume: number;
  beatVolume: number; // Controls subdivision volume
  masterVolume: number;
  swing: number;
  measureSequence: Measure[];
  countIn: boolean;
  loop: boolean;
  isAdvanced?: boolean;
  simpleView?: 'rings' | 'grid';
}


// Kept for migrating old presets
export interface OldMetronomeSettings {
    bpm: number;
    // sound is deprecated
    sound?: any;
    accentVolume: number;
    beatVolume: number;
    subdivision?: SubdivisionV1;
    swing?: number;
    timeSignature?: any;
    soundPresetId?: string; // Optional for migration
    beats?: number;
    subdivisions?: number;
    pattern?: number[];
}


export interface PlaylistItem {
  id: string;
  name: string;
  settings: MetronomeSettings | OldMetronomeSettings; // Allow for old settings for migration
}

export interface Setlist {
  id: string;
  name: string;
  songs: PlaylistItem[];
}

// Added for authentication
export interface Credentials {
  email: string;
  password: string;
}
