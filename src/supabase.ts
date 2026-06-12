import { createClient } from '@supabase/supabase-js';

// Substitua pelas suas credenciais do painel do Supabase (Project Settings > API)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Erro: Supabase URL ou Anon Key não encontradas. Verifique seu arquivo .env'
  );
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');

export type SupabaseClient = typeof supabase;