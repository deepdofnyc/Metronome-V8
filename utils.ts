import { type MetronomeSettings, type OldMetronomeSettings, type SubdivisionV1, type Measure, type Setlist, type PlaylistItem } from './types';

export const generateDefaultPattern = (beats: number, subdivisions: number): number[] => {
  const totalSteps = beats * subdivisions;
  if (totalSteps <= 0) return [];
  return Array.from({ length: totalSteps }, (_, i) => {
    if (i === 0) return 3; // Strong beat
    if (i % subdivisions === 0) return 2; // Weak beat
    return 1; // Subdivision
  });
};

export const generateRandomPattern = (beats: number, subdivisions: number): number[] => {
  const totalSteps = beats * subdivisions;
  if (totalSteps <= 0) return [];
  
  // Start with a standard pattern where beats are on
  const pattern = generateDefaultPattern(beats, subdivisions);

  // Randomly introduce rests and accents to create variation
  for (let i = 0; i < totalSteps; i++) {
    const isFirstBeat = i === 0;
    const isMainBeat = i % subdivisions === 0;

    // The very first beat of the measure should always be a strong beat.
    if (isFirstBeat) continue;

    if (isMainBeat) {
      // It's a main beat (but not the first one)
      const rand = Math.random();
      if (rand < 0.15) { // 15% chance of being a rest
        pattern[i] = 0;
      } else if (rand < 0.25) { // 10% chance of being an accent
        pattern[i] = 3;
      }
      // Otherwise, it remains a normal beat (2)
    } else {
      // It's a subdivision
      const rand = Math.random();
      if (rand < 0.5) { // 50% chance of being a rest
        pattern[i] = 0;
      }
      // Otherwise, it remains a subdivision (1)
    }
  }
  return pattern;
};

export const createDemoSetlist = (): Setlist[] => {
    const now = Date.now();

    const starterSongMeasures: Measure[] = [
        // This is now a single measure for a simple sequencer song.
        { id: `m-${now}-s1-m1`, beats: 4, subdivisions: 4, pattern: generateDefaultPattern(4, 4) },
    ];
    const starterSong: PlaylistItem = {
        id: `song-${now}-1`,
        name: "Simple 4/4 Beat", // Updated name
        settings: {
            bpm: 112,
            beatSoundId: 'classic',
            subdivisionSoundId: 'classic',
            accentVolume: 0.75,
            beatVolume: 0.5,
            masterVolume: 0.7,
            swing: 0,
            measureSequence: starterSongMeasures,
            countIn: false, // Simple sequencer doesn't have a separate count-in
            loop: true,
            isAdvanced: false, // Key change: this is now a simple song
            simpleView: 'grid',
        }
    };

    const waltzSong: PlaylistItem = {
        id: `song-${now}-2`,
        name: "Simple Swung Waltz",
        settings: {
            bpm: 130,
            beatSoundId: 'woodblock',
            subdivisionSoundId: 'woodblock',
            accentVolume: 0.75,
            beatVolume: 0.6,
            masterVolume: 0.7,
            swing: 0.5,
            measureSequence: [{ id: `m-${now}-s2-m1`, beats: 3, subdivisions: 3, pattern: generateDefaultPattern(3, 3) }],
            countIn: false,
            loop: true,
            isAdvanced: false,
            simpleView: 'grid',
        }
    };
    
    const everybodyWantsToRuleTheWorldSong: PlaylistItem = {
        id: `song-${now}-5`,
        name: "Everybody Wants to Rule the World",
        settings: {
            bpm: 112,
            beatSoundId: 'electronic',
            subdivisionSoundId: 'electronic',
            accentVolume: 0.8,
            beatVolume: 0.6,
            masterVolume: 0.7,
            swing: 0.6, // The key shuffle feel
            measureSequence: [{ id: `m-${now}-s5-m1`, beats: 4, subdivisions: 2, pattern: generateDefaultPattern(4, 2) }],
            countIn: false,
            loop: true,
            isAdvanced: false,
            simpleView: 'grid',
        }
    };

    const comeTogetherSong: PlaylistItem = {
        id: `song-${now}-6`,
        name: "Come Together",
        settings: {
            bpm: 85,
            beatSoundId: 'classic',
            subdivisionSoundId: 'classic',
            accentVolume: 0.8,
            beatVolume: 0.6,
            masterVolume: 0.7,
            swing: 0.65, // Heavy 16th note swing
            measureSequence: [{ id: `m-${now}-s6-m1`, beats: 4, subdivisions: 4, pattern: [
                3, 0, 0, 1, // Beat 1: Kick, rest, rest, Tom
                2, 0, 1, 0, // Beat 2: Kick, rest, Tom, rest
                2, 0, 0, 1, // Beat 3: Kick, rest, rest, Tom
                2, 0, 1, 1  // Beat 4: Kick, rest, Tom, Hat
            ] }],
            countIn: false,
            loop: true,
            isAdvanced: false, // It's a single-measure pattern
            simpleView: 'grid',
        }
    };

    const verseChorusMeasures: Measure[] = [
        { id: `m-${now}-s3-cin`, beats: 4, subdivisions: 1, pattern: generateDefaultPattern(4, 1) },
        { id: `m-${now}-s3-m1`, beats: 4, subdivisions: 2, pattern: generateDefaultPattern(4, 2) },
        { id: `m-${now}-s3-m2`, beats: 4, subdivisions: 2, pattern: generateDefaultPattern(4, 2) },
        { id: `m-${now}-s3-m3`, beats: 4, subdivisions: 4, pattern: generateDefaultPattern(4, 4), bpm: 125, beatSoundId: 'electronic' },
        { id: `m-${now}-s3-m4`, beats: 4, subdivisions: 4, pattern: generateDefaultPattern(4, 4), bpm: 125, beatSoundId: 'electronic' },
    ];
    const verseChorusSong: PlaylistItem = {
        id: `song-${now}-3`,
        name: "Verse/Chorus Rock",
        settings: {
            bpm: 120,
            beatSoundId: 'classic',
            subdivisionSoundId: 'classic',
            accentVolume: 0.8,
            beatVolume: 0.5,
            masterVolume: 0.7,
            swing: 0,
            measureSequence: verseChorusMeasures,
            countIn: true,
            loop: true,
            isAdvanced: true,
            simpleView: 'grid',
        }
    };
    
    const oddTimeMeasures: Measure[] = [
        { id: `m-${now}-s4-m1`, beats: 7, subdivisions: 4, pattern: generateDefaultPattern(7, 4) },
        { id: `m-${now}-s4-m2`, beats: 7, subdivisions: 4, pattern: generateDefaultPattern(7, 4) },
        { id: `m-${now}-s4-m3`, beats: 5, subdivisions: 2, pattern: generateDefaultPattern(5, 2) },
        { id: `m-${now}-s4-m4`, beats: 5, subdivisions: 2, pattern: generateDefaultPattern(5, 2) },
    ];
    const oddTimeSong: PlaylistItem = {
        id: `song-${now}-4`,
        name: "Odd-Time Jam",
        settings: {
            bpm: 100,
            beatSoundId: 'electronic',
            subdivisionSoundId: 'classic',
            accentVolume: 0.75,
            beatVolume: 0.5,
            masterVolume: 0.7,
            swing: 0,
            measureSequence: oddTimeMeasures,
            countIn: false,
            loop: true,
            isAdvanced: true,
            simpleView: 'grid',
        }
    };

    const demoSetlist: Setlist = {
        id: 'setlist-demo-1',
        name: 'Demo',
        songs: [starterSong, waltzSong, everybodyWantsToRuleTheWorldSong, comeTogetherSong, verseChorusSong, oddTimeSong]
    };

    const mySetlist: Setlist = {
        id: `setlist-user-${now}`,
        name: 'My Setlist',
        songs: []
    };

    return [demoSetlist, mySetlist];
};


export const migrateSettingsIfNeeded = (settings: MetronomeSettings | OldMetronomeSettings): MetronomeSettings => {
    // If it's already in the new format, just ensure defaults and return.
    if ('measureSequence' in settings) {
        const s = settings as MetronomeSettings;
        return {
            ...s,
            swing: s.swing ?? 0,
            masterVolume: s.masterVolume ?? 0.7,
            countIn: s.countIn ?? false,
            loop: s.loop ?? true,
            // Backwards compatibility for the new flag. If it doesn't exist, derive it.
            isAdvanced: s.isAdvanced ?? ((s.measureSequence?.length ?? 1) > 1 || (s.countIn ?? false)),
            simpleView: s.simpleView ?? 'grid',
        };
    }
    
    // It's an old format, needs migration.
    const old = settings as OldMetronomeSettings;
    
    let beats = 4;
    let subdivisions = 4;
    let pattern: number[];

    if (old.timeSignature) {
        const ts = typeof old.timeSignature === 'number' ? old.timeSignature : (old.timeSignature.top || 4);
        const sub = old.subdivision || 'quarter';
        const subdivisionMap: Record<SubdivisionV1, number> = { quarter: 1, eighth: 2, triplet: 3, sixteenth: 4 };
        beats = ts === 6 && sub === 'eighth' ? 2 : ts; // Handle 6/8 as 2 beats of triplets
        subdivisions = ts === 6 && sub === 'eighth' ? 3 : subdivisionMap[sub];
    } else if (old.beats && old.subdivisions) {
        beats = old.beats;
        subdivisions = old.subdivisions;
    }
    
    pattern = old.pattern && old.pattern.length === beats * subdivisions ? old.pattern : generateDefaultPattern(beats, subdivisions);

    const firstMeasure: Measure = {
        id: `m-${Date.now()}`,
        beats,
        subdivisions,
        pattern,
    };

    return {
        bpm: old.bpm,
        beatSoundId: old.soundPresetId || 'classic',
        subdivisionSoundId: old.soundPresetId || 'classic',
        accentVolume: old.accentVolume,
        beatVolume: old.beatVolume,
        masterVolume: 0.7,
        swing: old.swing || 0,
        measureSequence: [firstMeasure],
        countIn: false,
        loop: true,
        isAdvanced: false, // Old songs are always simple by default.
        simpleView: 'grid',
    };
};