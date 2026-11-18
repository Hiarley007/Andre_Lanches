import type { IdAba, Tela } from './tipos.ts';

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

/** Uma aba do menu: identificador interno e texto exibido. */
export interface Aba {
  id: IdAba;
  rotulo: string;
}

// ─────────────────────────────────────────────
// Dados
// ─────────────────────────────────────────────

/** Abas exibidas no menu, na ordem em que aparecem. */
export const ABAS: readonly Aba[] = [
  { id: 'lanches', rotulo: 'Lanches' },
  { id: 'sobre', rotulo: 'Sobre Nós' },
  { id: 'contato', rotulo: 'Contato' },
];

/**
 * Qual aba do menu fica marcada em cada tela.
 * O detalhe do produto pertence ao cardápio ('lanches'). Carrinho, checkout,
 * confirmação e configurações ficam fora do mapa, então não marcam nenhuma aba.
 */
const ABA_DA_TELA: Readonly<Partial<Record<Tela, IdAba>>> = {
  lanches: 'lanches',
  detalhe: 'lanches',
  sobre: 'sobre',
  contato: 'contato',
};

// ─────────────────────────────────────────────
// Funções
// ─────────────────────────────────────────────

/** Retorna a aba a ser marcada para a tela atual, ou `null` se nenhuma. */
export function abaAtiva(tela: Tela): IdAba | null {
  return ABA_DA_TELA[tela] ?? null;
}