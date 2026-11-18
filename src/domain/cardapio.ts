// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

/** Uma seção do cardápio, com título e a lista de itens. */
export interface Secao<T> {
  titulo: string;
  itens: T[];
}

/** Qualquer item que pertença a uma seção. */
export interface ItemComSecao {
  secao: string;
}

// ─────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────

/** O cardápio é exibido em 2 colunas. */
const COLUNAS_PADRAO = 2;

// ─────────────────────────────────────────────
// Funções
// ─────────────────────────────────────────────

/**
 * Agrupa os produtos por seção, mantendo a ordem em que aparecem.
 * <T> é genérico: funciona para produtos ou qualquer item com `secao`.
 */
export function agruparPorSecao<T extends ItemComSecao>(produtos: T[]): Secao<T>[] {
  // Map preserva a ordem de inserção e dá acesso direto por título.
  const secoes = new Map<string, Secao<T>>();

  for (const produto of produtos) {
    let secao = secoes.get(produto.secao);

    if (!secao) {
      secao = { titulo: produto.secao, itens: [] };
      secoes.set(produto.secao, secao);
    }

    secao.itens.push(produto);
  }

  return Array.from(secoes.values());
}

/**
 * Divide a lista em linhas com `colunas` itens cada.
 * A última linha pode ter menos itens.
 */
export function emLinhas<T>(itens: T[], colunas = COLUNAS_PADRAO): T[][] {
  const linhas: T[][] = [];

  for (let i = 0; i < itens.length; i += colunas) {
    linhas.push(itens.slice(i, i + colunas));
  }

  return linhas;
}