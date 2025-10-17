# Pulse Q Metronome - Database Schema Documentation

## Overview
Database schema for a web-based metronome application with user authentication, settings persistence, setlists, songs, and quick-access slots. Built for Supabase/PostgreSQL.

## Database Structure

### 1. **users** (Managed by Supabase Auth)
- Uses Supabase's built-in authentication system
- No custom table needed - uses `auth.users`

### 2. **app_settings**
Stores user interface preferences and application settings.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `user_id` | UUID | PRIMARY KEY, FK → auth.users(id), ON DELETE CASCADE | References the authenticated user |
| `settings` | JSONB | NOT NULL, DEFAULT object | User's app preferences (see JSON structure below) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last modification timestamp |

**JSONB Structure for `settings`:**
```json
{
  "showBpmControl": boolean,      // Display BPM slider control
  "showTapButton": boolean,        // Display tap tempo button
  "showQuickSongs": boolean,       // Display quick songs bar
  "showSetlists": boolean,         // Display setlists manager
  "showSequencer": boolean,        // Display sequencer component
  "minBpm": number,               // Minimum BPM value (default: 40)
  "maxBpm": number                // Maximum BPM value (default: 340)
}
```

### 3. **setlists**
Contains user-created setlists (collections of songs).

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | TEXT | PRIMARY KEY | Unique identifier (format: "setlist-{timestamp}") |
| `user_id` | UUID | FK → auth.users(id), ON DELETE CASCADE | Owner of the setlist |
| `name` | TEXT | NOT NULL | Display name of the setlist |
| `position` | INTEGER | NOT NULL | Order position (for sorting) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last modification timestamp |

### 4. **songs**
Individual songs within setlists, each containing complete metronome configuration.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | TEXT | PRIMARY KEY | Unique identifier (format: "song-{timestamp}") |
| `setlist_id` | TEXT | FK → setlists(id), ON DELETE CASCADE | Parent setlist |
| `user_id` | UUID | FK → auth.users(id), ON DELETE CASCADE | Owner (denormalized for RLS) |
| `name` | TEXT | NOT NULL | Song title |
| `position` | INTEGER | NOT NULL | Order within setlist |
| `settings` | JSONB | NOT NULL | Complete metronome configuration |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last modification timestamp |

**JSONB Structure for `settings` (MetronomeSettings):**
```json
{
  "bpm": number,                          // Base tempo (20-400)
  "beatSoundId": string,                  // Sound preset for beats
  "subdivisionSoundId": string,           // Sound preset for subdivisions
  "accentVolume": number,                 // Volume for accented beats (0-1)
  "beatVolume": number,                   // Volume for subdivisions (0-1)
  "masterVolume": number,                 // Master volume control (0-1)
  "swing": number,                        // Swing amount (0-1)
  "countIn": boolean,                     // Enable count-in measure
  "loop": boolean,                        // Loop the sequence
  "isAdvanced": boolean,                  // Advanced sequencer mode
  "simpleView": "grid" | "rings",        // Visualization mode
  "measureSequence": [                    // Array of measure configurations
    {
      "id": string,                      // Measure identifier
      "beats": number,                   // Beats per measure
      "subdivisions": number,            // Subdivisions per beat
      "pattern": number[],               // Step pattern array
      "bpm": number (optional),          // Measure-specific BPM override
      "beatSoundId": string (optional),  // Measure-specific sound
      "subdivisionSoundId": string (optional),
      "accentVolume": number (optional),
      "beatVolume": number (optional),
      "swing": number (optional)
    }
  ]
}
```

**Pattern Array Values:**
- `0` = Rest/Off
- `1` = Subdivision hit
- `2` = Beat hit
- `3` = Accented beat hit

### 5. **quick_songs**
Fixed 3-slot quick access for frequently used configurations.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `user_id` | UUID | FK → auth.users(id), ON DELETE CASCADE | User reference |
| `slot_index` | INTEGER | CHECK (0-2) | Slot number (0, 1, or 2) |
| `song_data` | JSONB | NULLABLE | Complete song configuration |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last modification timestamp |

**Primary Key:** Composite (`user_id`, `slot_index`)

**JSONB Structure for `song_data` (PlaylistItem):**
```json
{
  "id": string,                    // Song identifier
  "name": string,                  // Display name
  "settings": MetronomeSettings    // Complete settings (same as songs.settings)
}
```

## Required Indexes
```sql
-- Performance indexes for common queries
CREATE INDEX idx_setlists_user_id ON setlists(user_id);
CREATE INDEX idx_setlists_user_position ON setlists(user_id, position);
CREATE INDEX idx_songs_setlist_id ON songs(setlist_id);
CREATE INDEX idx_songs_user_id ON songs(user_id);
CREATE INDEX idx_songs_setlist_position ON songs(setlist_id, position);
```

## Row Level Security (RLS)

All tables require RLS policies to ensure users can only access their own data:

### Required Policies:

**app_settings:**
- SELECT: user_id = auth.uid()
- INSERT: user_id = auth.uid()
- UPDATE: user_id = auth.uid()

**setlists:**
- SELECT: user_id = auth.uid()
- INSERT: user_id = auth.uid()
- UPDATE: user_id = auth.uid()
- DELETE: user_id = auth.uid()

**songs:**
- SELECT: user_id = auth.uid()
- INSERT: user_id = auth.uid()
- UPDATE: user_id = auth.uid()
- DELETE: user_id = auth.uid()

**quick_songs:**
- ALL operations: user_id = auth.uid()

## SQL Creation Scripts
```sql
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
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create songs table
CREATE TABLE songs (
    id TEXT PRIMARY KEY,
    setlist_id TEXT REFERENCES setlists(id) ON DELETE CASCADE,
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

-- 5. Create indexes
CREATE INDEX idx_setlists_user_id ON setlists(user_id);
CREATE INDEX idx_setlists_user_position ON setlists(user_id, position);
CREATE INDEX idx_songs_setlist_id ON songs(setlist_id);
CREATE INDEX idx_songs_user_id ON songs(user_id);
CREATE INDEX idx_songs_setlist_position ON songs(setlist_id, position);

-- 6. Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_songs ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for app_settings
CREATE POLICY "Users can view own settings" ON app_settings
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON app_settings
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON app_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. Create RLS policies for setlists
CREATE POLICY "Users can view own setlists" ON setlists
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own setlists" ON setlists
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own setlists" ON setlists
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own setlists" ON setlists
    FOR DELETE USING (auth.uid() = user_id);

-- 9. Create RLS policies for songs
CREATE POLICY "Users can view own songs" ON songs
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own songs" ON songs
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own songs" ON songs
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own songs" ON songs
    FOR DELETE USING (auth.uid() = user_id);

-- 10. Create RLS policies for quick_songs
CREATE POLICY "Users can manage own quick songs" ON quick_songs
    FOR ALL USING (auth.uid() = user_id);
```

## Additional Notes

### Implementation Details
1. **ID Format**: The application uses string IDs with specific patterns (e.g., "setlist-1234567890", "song-1234567890") rather than UUIDs
2. **Position Management**: Both setlists and songs use integer positions for custom ordering
3. **Data Redundancy**: `user_id` is denormalized in the songs table for simpler RLS policies
4. **Quick Songs**: Limited to exactly 3 slots per user (enforced by CHECK constraint)
5. **Default Values**: app_settings should initialize with default values if not present
6. **Timestamps**: All tables use TIMESTAMPTZ for timezone-aware timestamps

### Sound Preset IDs
Valid values for `beatSoundId` and `subdivisionSoundId`:
- `"classic"`
- `"electronic"`
- `"woodblock"`

### Migration Considerations
- Data currently exists in browser localStorage under these keys:
  - `metronomeAppSettings_v1` → app_settings table
  - `metronomeSetlist` → setlists and songs tables
  - `metronomeQuickSongs` → quick_songs table
- All existing IDs should be preserved during migration
- Position values should be derived from array indices during initial migration

### Sample Data Structure

**Example Setlist with Songs:**
```json
{
  "id": "setlist-1699123456789",
  "name": "Practice Set",
  "songs": [
    {
      "id": "song-1699123456790",
      "name": "Warm-up 4/4",
      "settings": {
        "bpm": 120,
        "beatSoundId": "classic",
        "subdivisionSoundId": "classic",
        "accentVolume": 0.75,
        "beatVolume": 0.5,
        "masterVolume": 0.7,
        "swing": 0,
        "countIn": false,
        "loop": true,
        "isAdvanced": false,
        "simpleView": "grid",
        "measureSequence": [
          {
            "id": "m-1699123456791",
            "beats": 4,
            "subdivisions": 4,
            "pattern": [3, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0]
          }
        ]
      }
    }
  ]
}
```

