import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { MetronomeProvider } from '../../contexts/MetronomeContext'
import { AuthProvider } from '../../contexts/AuthContext'
import { vi } from 'vitest'

// Mock the hooks that MetronomeContext depends on
vi.mock('../../hooks', () => ({
  useMetronomeEngine: () => ({
    isPlaying: false,
    currentStep: -1,
    togglePlay: vi.fn(),
  }),
  useSetlist: () => ({
    setlists: [],
    setSetlists: vi.fn(),
    saveSetlists: vi.fn(),
  }),
  useQuickSongs: () => ({
    quickSongs: [null, null, null, null, null, null, null, null],
    saveQuickSongs: vi.fn(),
  }),
}))

// Mock the audio engine
vi.mock('../../services/audioEngine', () => ({
  AudioEngine: vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    setBpm: vi.fn(),
    setVolume: vi.fn(),
    setSwing: vi.fn(),
    setPattern: vi.fn(),
    setMeasureSequence: vi.fn(),
  })),
}))

// Mock utils
vi.mock('../../utils', () => ({
  generateDefaultPattern: vi.fn((beats: number, subdivisions: number) => 
    Array(beats * subdivisions).fill(1)
  ),
  migrateSettingsIfNeeded: vi.fn((settings: any) => settings),
  generateRandomPattern: vi.fn((beats: number, subdivisions: number) => 
    Array(beats * subdivisions).fill(1)
  ),
  createDemoSetlist: vi.fn(() => []),
}))

// Mock constants
vi.mock('../../constants', () => ({
  SOUND_OPTIONS: [
    { id: 'classic', name: 'Classic' },
    { id: 'wood', name: 'Wood' },
    { id: 'electronic', name: 'Electronic' },
  ],
}))

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialContext?: any
}

const AllTheProviders = ({ children, initialContext }: { children: React.ReactNode; initialContext?: any }) => {
  return (
    <AuthProvider>
      <MetronomeProvider value={initialContext}>
        {children}
      </MetronomeProvider>
    </AuthProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { initialContext, ...renderOptions } = options
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders initialContext={initialContext}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  })
}

// Helper function to create mock settings
export const createMockSettings = (overrides = {}) => ({
  bpm: 120,
  beatSoundId: 'classic',
  subdivisionSoundId: 'classic',
  accentVolume: 0.75,
  beatVolume: 0.5,
  masterVolume: 0.7,
  swing: 0,
  measureSequence: [
    {
      id: 'm-1',
      beats: 4,
      subdivisions: 4,
      pattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    },
  ],
  countIn: false,
  loop: true,
  isAdvanced: false,
  simpleView: 'grid' as const,
  ...overrides,
})

// Helper function to create mock measure
export const createMockMeasure = (overrides = {}) => ({
  id: 'm-test',
  beats: 4,
  subdivisions: 4,
  pattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  ...overrides,
})

// Helper function to create mock playlist item
export const createMockPlaylistItem = (overrides = {}) => ({
  id: 'song-1',
  name: 'Test Song',
  settings: createMockSettings(),
  ...overrides,
})

// Helper function to create mock setlist
export const createMockSetlist = (overrides = {}) => ({
  id: 'setlist-1',
  name: 'Test Setlist',
  songs: [createMockPlaylistItem()],
  ...overrides,
})

export * from '@testing-library/react'
export { customRender as render }
