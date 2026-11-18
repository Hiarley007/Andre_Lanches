
// ======================================================
// REGRAS DE PAGAMENTO — ANDRÉ LANCHES
// ======================================================

// Função para formatar valores monetários.
import { formatarPreco } from '../utils/formatarPreco.ts';

// Tipos utilizados nas formas de pagamento.
import type {
  FormaPagamentoId,
  NomeIcone,
} from './tipos.ts';

// ======================================================
// ESTRUTURA DAS FORMAS DE PAGAMENTO
// ======================================================

export interface FormaPagamento {
  id: FormaPagamentoId;
  rotulo: string;
  detalhe: string;
  icone: NomeIcone;
}

// ======================================================
// FORMAS DE PAGAMENTO DISPONÍVEIS
// ======================================================

// Formas de pagamento aceitas na entrega:
// Pix, cartão de débito e dinheiro.
export const FORMAS_PAGAMENTO: FormaPagamento[] = [
  {
    id: 'pix',
    rotulo: 'Pix',
    detalhe: 'Pague na entrega com QR Code',
    icone: 'qr-code-outline',
  },
  {
    id: 'debito',
    rotulo: 'Cartão de débito',
    detalhe: 'Maquininha na entrega',
    icone: 'card-outline',
  },
  {
    id: 'dinheiro',
    rotulo: 'Dinheiro',
    detalhe: 'Pague ao receber, com ou sem troco',
    icone: 'cash-outline',
  },
];

// ======================================================
// IDENTIFICAÇÃO DA FORMA DE PAGAMENTO
// ======================================================

// Retorna o rótulo correspondente ao identificador.
// Caso o identificador seja desconhecido, retorna vazio.
export function rotuloPagamento(id: string | null): string {
  const forma = FORMAS_PAGAMENTO.find(
    (forma) => forma.id === id,
  );

  return forma ? forma.rotulo : '';
}

// ======================================================
// CONVERSÃO DE VALORES MONETÁRIOS
// ======================================================

// Converte valores digitados pelo cliente em números.
//
// Exemplos aceitos:
// "50,00"
// "50.00"
// "R$ 1.234,50"
//
// Retorna NaN quando o valor não pode ser interpretado.
export function lerValor(
  texto: string | null | undefined,
): number {
  let limpo = String(texto ?? '').replace(/[^\d,.-]/g, '');

  // Quando existe vírgula, considera o formato brasileiro.
  if (limpo.includes(',')) {
    limpo = limpo.replace(/\./g, '').replace(',', '.');
  }

  return parseFloat(limpo);
}

// ======================================================
// RESULTADO DO CÁLCULO DE TROCO
// ======================================================

export interface ResultadoTroco {
  informado: boolean;
  pago: number | null;
  troco: number | null;
  erro: string | null;
}

// ======================================================
// CÁLCULO DE TROCO
// ======================================================

// Regras para pagamento em dinheiro:
//
// 1. Campo vazio: cliente não precisa de troco.
// 2. Valor menor que o total: retorna erro.
// 3. Valor igual ao total: troco de R$ 0,00.
// 4. Valor maior que o total: calcula o troco.
export function calcularTroco(
  texto: string | null | undefined,
  total: number,
): ResultadoTroco {
  // Verifica se o cliente informou algum valor.
  if (!String(texto ?? '').trim()) {
    return {
      informado: false,
      pago: null,
      troco: null,
      erro: null,
    };
  }

  const pago = lerValor(texto);

  // Compara os valores em centavos para evitar
  // problemas de precisão com números decimais.
  if (
    !Number.isFinite(pago) ||
    Math.round(pago * 100) < Math.round(total * 100)
  ) {
    return {
      informado: true,
      pago: null,
      troco: null,
      erro: `O valor precisa ser de pelo menos ${formatarPreco(total)}.`,
    };
  }

  // Calcula o troco em centavos.
  const troco =
    (Math.round(pago * 100) - Math.round(total * 100)) / 100;

  return {
    informado: true,
    pago,
    troco,
    erro: null,
  };
}
