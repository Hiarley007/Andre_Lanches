import type { Esquema, PreferenciaTema } from './tipos.ts';

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

/** Uma opção de tema: identificador interno e texto exibido. */
export interface OpcaoTema {
  id: PreferenciaTema;
  rotulo: string;
}

// ─────────────────────────────────────────────
// Dados
// ─────────────────────────────────────────────

/** Opções de tema exibidas nas configurações, na ordem em que aparecem. */
export const OPCOES_TEMA: readonly OpcaoTema[] = [
  { id: 'claro', rotulo: 'Claro' },
  { id: 'escuro', rotulo: 'Escuro' },
  { id: 'sistema', rotulo: 'Sistema' },
];

// ─────────────────────────────────────────────
// Funções
// ─────────────────────────────────────────────

/**
 * Decide qual paleta usar.
 *
 * @param preferencia - 'claro' | 'escuro' | 'sistema'.
 * @param esquemaSistema - O que o celular informa ('dark', 'light' ou null).
 *   Só é considerado quando a preferência é 'sistema'.
 * @returns 'escuro' ou 'claro'. Na dúvida (sistema sem informação), 'claro'.
 */
export function resolverEsquema(
  preferencia: PreferenciaTema,
  esquemaSistema: string | null | undefined,
): Esquema {
  if (preferencia === 'sistema') {
    return esquemaSistema === 'dark' ? 'escuro' : 'claro';
  }

  return preferencia === 'escuro' ? 'escuro' : 'claro';
}