// Teste rápido de conexão com o Supabase, fora do app.
// Uso: node --env-file=.env scripts/testar-conexao.ts
import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

/** Colunas lidas da tabela `produtos` neste teste. */
interface ProdutoResumo {
  nome: string;
  preco: number | string;
}

// ─────────────────────────────────────────────
// Variáveis de ambiente
// ─────────────────────────────────────────────

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const chave = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !chave) {
  console.error(
    'Faltam variáveis no .env (EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY).',
  );
  process.exit(1);
}

// ─────────────────────────────────────────────
// Cliente
// ─────────────────────────────────────────────

const supabase = createClient(url, chave, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// ─────────────────────────────────────────────
// Consulta
// ─────────────────────────────────────────────

const { data, error } = await supabase
  .from('produtos')
  .select('nome, preco')
  .order('ordem');

if (error) {
  console.error('Falha na conexão:', error.message);
  process.exit(1);
}

const produtos: ProdutoResumo[] = data ?? [];

console.log(`Conexão OK: ${produtos.length} produtos encontrados.`);
for (const p of produtos) {
  console.log(`- ${p.nome}: ${p.preco}`);
}