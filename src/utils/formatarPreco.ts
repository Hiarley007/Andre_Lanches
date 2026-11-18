
// ======================================================
// FORMATAÇÃO DE PREÇOS — ANDRÉ LANCHES
// ======================================================

// Formata valores monetários no padrão brasileiro.
// Não utiliza Intl para manter compatibilidade com Hermes
// no Android e iOS.
//
// O Supabase pode retornar colunas numeric como texto
// (ex.: "8.00") ou número. Number() converte ambos.

export function formatarPreco(
  valor: number | string | null | undefined
): string {
  const numero = Number(valor);

  // Retorna um valor padrão caso a entrada seja inválida.
  if (!Number.isFinite(numero)) {
    return 'R$ --,--';
  }

  // Identifica o sinal do valor.
  const sinal = numero < 0 ? '-' : '';

  // Separa a parte inteira dos centavos.
  const [inteiro, centavos] = Math.abs(numero)
    .toFixed(2)
    .split('.');

  // Adiciona pontos como separadores de milhar.
  const comMilhar = inteiro.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    '.'
  );

  // Retorna o preço no formato brasileiro.
  return `${sinal}R$ ${comMilhar},${centavos}`;
}
