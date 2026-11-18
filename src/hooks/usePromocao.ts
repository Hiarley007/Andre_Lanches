import { useCallback, useEffect, useState } from 'react';
import { buscarPromocaoAtiva } from '../services/promocaoService';
import type { Consulta, Promocao } from '../domain/tipos';

/**
 * Carrega a promoção ativa e expõe o estado da consulta.
 *
 * @returns `data` (a promoção, ou `null` se não houver nenhuma ativa),
 * `loading`, `error` (mensagem amigável ou `null`) e `refetch` para tentar de novo.
 */
export default function usePromocao(): Consulta<Promocao | null> {
  // ─────────────────────────────────────────────
  // Estado
  // ─────────────────────────────────────────────

  const [data, setData] = useState<Promocao | null>(null);
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

    buscarPromocaoAtiva()
      .then((promocao) => {
        if (!cancelado) setData(promocao);
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