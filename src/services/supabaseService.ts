import { supabase } from '../lib/supabase';
import { type Setlist, type PlaylistItem, type MetronomeSettings } from '../types/types';

// Helper to check if Supabase is available
export const isSupabaseAvailable = () => {
  return supabase !== null;
};

// Setlists service
export const setlistService = {
  // Get all setlists for a user
  async getSetlists(): Promise<Setlist[]> {
    if (!isSupabaseAvailable()) {
      console.warn('Supabase not available, falling back to localStorage');
      return [];
    }

    try {
      const { data, error } = await supabase!
        .from('setlists')
        .select(`
          *,
          songs (*)
        `)
        .order('position');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching setlists:', error);
      return [];
    }
  },

  // Save a setlist
  async saveSetlist(setlist: Setlist, position?: number): Promise<boolean> {
    if (!isSupabaseAvailable()) {
      console.warn('Supabase not available, cannot save setlist');
      return false;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return false;
      }

      // Use transaction for setlist + songs
      const { error: setlistError } = await supabase!
        .from('setlists')
        .upsert({
          id: setlist.id,
          user_id: user.id,
          name: setlist.name,
          position: position ?? 0,
        });

      if (setlistError) throw setlistError;

      // Save songs if they exist
      if (setlist.songs && setlist.songs.length > 0) {
        const songsData = setlist.songs.map((song, index) => ({
          id: song.id,
          setlist_id: setlist.id,
          user_id: user.id,
          name: song.name,
          position: index,
          settings: song.settings,
        }));

        const { error: songsError } = await supabase!
          .from('songs')
          .upsert(songsData);

        if (songsError) throw songsError;
      }

      return true;
    } catch (error) {
      console.error('Error saving setlist:', error);
      return false;
    }
  },

  // Delete a setlist
  async deleteSetlist(setlistId: string): Promise<boolean> {
    if (!isSupabaseAvailable()) {
      console.warn('Supabase not available, cannot delete setlist');
      return false;
    }

    try {
      const { error } = await supabase!
        .from('setlists')
        .delete()
        .eq('id', setlistId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting setlist:', error);
      return false;
    }
  }
};

// Quick songs service
export const quickSongsService = {
  // Get quick songs for a user
  async getQuickSongs(): Promise<(PlaylistItem | null)[]> {
    if (!isSupabaseAvailable()) {
      console.warn('Supabase not available, falling back to localStorage');
      return [null, null, null];
    }

    try {
      const { data, error } = await supabase!
        .from('quick_songs')
        .select('*')
        .order('slot_index');

      if (error) throw error;

      // Convert to array format (3 slots)
      const quickSongs: (PlaylistItem | null)[] = [null, null, null];
      data?.forEach(item => {
        if (item.song_data && item.slot_index >= 0 && item.slot_index < 3) {
          quickSongs[item.slot_index] = item.song_data;
        }
      });

      return quickSongs;
    } catch (error) {
      console.error('Error fetching quick songs:', error);
      return [null, null, null];
    }
  },

  // Save quick song to a slot
    async saveQuickSong(slotIndex: number, song: PlaylistItem): Promise<boolean> {
      if (!isSupabaseAvailable()) {
        console.warn('Supabase not available, cannot save quick song');
        return false;
      }

      if (slotIndex < 0 || slotIndex > 2) {
        console.error('Invalid slot index:', slotIndex);
        return false;
      }

      try {
        // Get current user
        const { data: { user } } = await supabase!.auth.getUser();
        if (!user) {
          console.error('User not authenticated');
          return false;
        }

        const { error } = await supabase!
          .from('quick_songs')
          .upsert({
            user_id: user.id,
            slot_index: slotIndex,
            song_data: song,
          });

        if (error) throw error;
        return true;
      } catch (error) {
        console.error('Error saving quick song:', error);
        return false;
      }
    },

    async deleteQuickSong(slotIndex: number): Promise<boolean> {
      if (!isSupabaseAvailable()) {
        console.warn('Supabase not available, cannot delete quick song');
        return false;
      }

      if (slotIndex < 0 || slotIndex > 2) {
        console.error('Invalid slot index:', slotIndex);
        return false;
      }

      try {
        // Get current user
        const { data: { user } } = await supabase!.auth.getUser();
        if (!user) {
          console.error('User not authenticated');
          return false;
        }

        const { error } = await supabase!
          .from('quick_songs')
          .delete()
          .eq('user_id', user.id)
          .eq('slot_index', slotIndex);

        if (error) throw error;
        return true;
      } catch (error) {
        console.error('Error deleting quick song:', error);
        return false;
      }
    }
};

// App settings service
export const appSettingsService = {
  // Get app settings for a user
  async getAppSettings(): Promise<any> {
    if (!isSupabaseAvailable()) {
      console.warn('Supabase not available, falling back to localStorage');
      return null;
    }

    try {
      const { data, error } = await supabase!
        .from('app_settings')
        .select('settings')
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data?.settings || null;
    } catch (error) {
      console.error('Error fetching app settings:', error);
      return null;
    }
  },

  // Save app settings
  async saveAppSettings(settings: any): Promise<boolean> {
    if (!isSupabaseAvailable()) {
      console.warn('Supabase not available, cannot save app settings');
      return false;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return false;
      }

      const { error } = await supabase!
        .from('app_settings')
        .upsert({
          user_id: user.id,
          settings,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving app settings:', error);
      return false;
    }
  }
};
