
// ======================================================
// MENSAGEM DO PEDIDO — ANDRÉ LANCHES
// ======================================================

// Função para formatar valores monetários.
import { formatarPreco } from '../utils/formatarPreco.ts';

// Função para obter o nome da forma de pagamento.
import { rotuloPagamento } from './pagamento.ts';

// Função para calcular o subtotal de cada item.
import { subtotal } from './carrinho.ts';

// Tipo utilizado para representar um pedido.
import type { Pedido } from './tipos.ts';

// ======================================================
// MONTAGEM DA MENSAGEM
// ======================================================

// Monta o texto do pedido que o cliente poderá
// revisar e enviar diretamente pelo WhatsApp.
export function montarMensagem(pedido: Pedido): string {
  const { cliente } = pedido;

  // Adiciona o complemento somente quando informado.
  const complemento = cliente.complemento
    ? ` (${cliente.complemento})`
    : '';

  // Organiza as informações do pedido em linhas.
  const linhas = [
    // Identificação do pedido.
    `*Pedido #${pedido.numero} - André Lanches*`,

    '',

    // Produtos selecionados.
    '*Itens*',

    ...pedido.itens.map((item) => {
      const unitario = formatarPreco(item.produto.preco);
      const sub = formatarPreco(subtotal(item));

      return `${item.qtd}x ${item.produto.nome} - ${unitario} cada = ${sub}`;
    }),

    '',

    // Valor total.
    `*Total: ${formatarPreco(pedido.total)}*`,

    '',

    // Dados do cliente.
    `*Cliente:* ${cliente.nome}`,
    `*Telefone:* ${cliente.telefone}`,
    `*Endereço:* ${cliente.endereco}${complemento}`,

    // Forma de pagamento.
    `*Pagamento:* ${rotuloPagamento(pedido.pagamento)}`,
  ];

  // Informações adicionais para pagamento em dinheiro.
  if (pedido.pagamento === 'dinheiro') {
    if (pedido.valorPago != null) {
      linhas.push(
        `*Valor entregue:* ${formatarPreco(pedido.valorPago)}`,
      );

      linhas.push(
        `*Troco:* ${formatarPreco(pedido.troco)}`,
      );
    } else {
      linhas.push('*Troco:* sem troco');
    }
  }

  // Adiciona observações somente quando existem.
  if (pedido.observacao) {
    linhas.push(`*Observações:* ${pedido.observacao}`);
  }

  // Junta todas as linhas em uma única mensagem.
  return linhas.join('\n');
}

// ======================================================
// GERAÇÃO DO LINK DO WHATSAPP
// ======================================================

// Codifica a mensagem para utilizá-la como parâmetro
// de texto no link do WhatsApp.
export function urlWhatsApp(
  base: string,
  texto: string,
): string {
  return `${base}?text=${encodeURIComponent(texto)}`;
}
