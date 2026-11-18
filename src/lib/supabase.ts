import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────
// Variáveis de ambiente
// ─────────────────────────────────────────────

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const chave = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Depois deste if, o TypeScript sabe que url e chave são texto (não undefined).
if (!url || !chave) {
  throw new Error(
    'Variáveis do Supabase não encontradas. Confira o arquivo .env e ' +
      'reinicie o servidor com: npx expo start -c',
  );
}

// ─────────────────────────────────────────────
// Cliente
// ─────────────────────────────────────────────

/** Cliente do Supabase. App sem login: não guardamos sessão nem renovamos tokens. */
export const supabase = createClient(url, chave, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});