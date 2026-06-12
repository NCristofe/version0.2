export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          nome: string | null;
          sobrenome: string | null;
          apelido: string | null;
          foto_url: string | null;
          data_nascimento: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nome?: string | null;
          sobrenome?: string | null;
          apelido?: string | null;
          foto_url?: string | null;
          data_nascimento?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
    };
  };
}