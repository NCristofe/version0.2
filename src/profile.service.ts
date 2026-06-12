import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export const profileService = {
  async getMyProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: ProfileUpdate) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId);
    
    if (error) throw error;
    return data;
  }
};