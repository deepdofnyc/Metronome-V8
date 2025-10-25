-- Supabase Setup Script for Metronome App
-- Run this in Supabase SQL Editor

-- 1. Create app_settings table
CREATE TABLE app_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{
        "showBpmControl": true,
        "showTapButton": true,
        "showQuickSongs": true,
        "showSetlists": true,
        "showSequencer": true,
        "minBpm": 40,
        "maxBpm": 340
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create setlists table
CREATE TABLE setlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create songs table
CREATE TABLE songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setlist_id UUID REFERENCES setlists(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INTEGER NOT NULL,
    settings JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create quick_songs table
CREATE TABLE quick_songs (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    slot_index INTEGER CHECK (slot_index >= 0 AND slot_index <= 2),
    song_data JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, slot_index)
);

-- 5. Create indexes for performance
CREATE INDEX idx_setlists_user_id ON setlists(user_id);
CREATE INDEX idx_setlists_user_position ON setlists(user_id, position);
CREATE INDEX idx_songs_setlist_id ON songs(setlist_id);
CREATE INDEX idx_songs_user_id ON songs(user_id);
CREATE INDEX idx_songs_setlist_position ON songs(setlist_id, position);

-- 6. Enable Row Level Security
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_songs ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies (simplified)
CREATE POLICY "Users can manage own app settings" ON app_settings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own setlists" ON setlists
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own songs" ON songs
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own quick songs" ON quick_songs
    FOR ALL USING (auth.uid() = user_id);

-- 8. Data validation is handled by app logic
-- No need for database constraints since:
-- 1. TypeScript types enforce structure and types
-- 2. constants.ts defines BPM ranges (MIN_BPM=20, MAX_BPM=400)
-- 3. SOUND_OPTIONS defines allowed sound IDs
-- 4. UI components enforce volume ranges (0-1)
-- 5. App logic ensures measure sequences are valid arrays
-- 6. generateDefaultPattern() ensures correct pattern lengths

-- 9. Add unique constraints
ALTER TABLE setlists ADD CONSTRAINT unique_user_position 
    UNIQUE (user_id, position);
ALTER TABLE songs ADD CONSTRAINT unique_setlist_position 
    UNIQUE (setlist_id, position);
