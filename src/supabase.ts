import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

// Utilizando o padrão do Vite para variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Configuração do Supabase ausente no arquivo .env. Certifique-se de usar o prefixo VITE_.');
}

export const supabase = createClient<Database>(supabaseUrl || '', supabaseAnonKey || '');