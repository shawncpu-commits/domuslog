import { createClient } from '@supabase/supabase-js';

// Accesso sicuro alle variabili d'ambiente tramite process.env
// Le chiavi VITE_ sono esposte al client durante il build process
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("DomusLog Cloud Status: Variabili VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY non trovate. Verificare i parametri di build.");
}

// Fallback su URL placeholder se le chiavi mancano per evitare crash all'inizializzazione
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);