
import { createClient } from '@supabase/supabase-js';

// Estraiamo i valori con fallback sicuri per evitare errori fatali della libreria Supabase JS
// Se process.env.SUPABASE_URL è mancante o vuoto, usiamo un URL segnaposto valido.
const rawUrl = process.env?.SUPABASE_URL || '';
const rawKey = process.env?.SUPABASE_ANON_KEY || '';

const supabaseUrl = rawUrl.trim() !== '' ? rawUrl : 'https://placeholder-project-id.supabase.co';
const supabaseAnonKey = rawKey.trim() !== '' ? rawKey : 'placeholder-anon-key';

if (!rawUrl || !rawKey) {
  console.warn("DomusLog Cloud Status: SUPABASE_URL o SUPABASE_ANON_KEY non trovati nelle variabili d'ambiente. Il sistema funzionerà in modalità localStorage.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
