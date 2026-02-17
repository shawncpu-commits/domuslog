import { createClient } from '@supabase/supabase-js';

// In Vite si usa import.meta.env, NON process.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("DomusLog Cloud Status: Variabili VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY non trovate. Verificare i parametri di build.");
}

// Inizializzazione del client
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);