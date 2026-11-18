import { useCallback, useEffect, useState } from 'react';
import { listarProdutos } from '../services/produtosService';
import type { Consulta, Produto } from '../domain/tipos';

/**
 * Carrega o cardápio (lista de produtos) e expõe o estado da consulta.
 *
 * @returns `data` (produtos), `loading`, `error` (mensagem amigável ou `null`)
 * e `refetch` para tentar de novo.
 */
export default function useProdutos(): Consulta<Produto[]> {
  // ─────────────────────────────────────────────
  // Estado
  // ─────────────────────────────────────────────

  const [data, setData] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  // ─────────────────────────────────────────────
  // Carregamento
  // ─────────────────────────────────────────────

  useEffect(() => {
    let cancelado = false;

    setLoading(true);
    setError(null);

    listarProdutos()
      .then((produtos) => {
        if (!cancelado) setData(produtos);
      })
      .catch((erro: Error) => {
        if (!cancelado) setError(erro.message);
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    // Se a tela sair da memória antes da resposta, ignoramos o resultado.
    return () => {
      cancelado = true;
    };
  }, [tentativa]);

  // ─────────────────────────────────────────────
  // Ações
  // ─────────────────────────────────────────────

  /** Refaz a consulta (incrementar `tentativa` dispara o efeito de novo). */
  const refetch = useCallback(() => setTentativa((n) => n + 1), []);

  return { data, loading, error, refetch };
}