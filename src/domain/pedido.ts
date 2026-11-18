
// ======================================================
// GERENCIAMENTO DE PEDIDOS — ANDRÉ LANCHES
// ======================================================

// Função para calcular o total do carrinho.
import { totalPedido } from './carrinho.ts';

// Função para calcular o troco.
import { calcularTroco } from './pagamento.ts';

// Tipos utilizados na montagem dos pedidos.
import type {
  DadosCheckout,
  ItemCarrinho,
  PayloadPedido,
  Pedido,
} from './tipos.ts';

// ======================================================
// GERAÇÃO DE NÚMERO LOCAL
// ======================================================

// Gera um número provisório para pedidos que não puderam
// ser salvos no banco de dados por falta de conexão.
//
// Utiliza os cinco últimos dígitos do horário atual,
// seguindo o comportamento do protótipo HTML.
export function numeroLocal(agora = Date.now()): string {
  return String(agora).slice(-5);
}

// ======================================================
// ESTRUTURA DOS DADOS DO PEDIDO
// ======================================================

// Informações necessárias para montar um pedido.
interface DadosDoPedido {
  numero: string;
  itens: ItemCarrinho[];
  dados: DadosCheckout;
  salvo: boolean;
}

// ======================================================
// MONTAGEM DO PEDIDO
// ======================================================

// Reúne os dados do formulário e do carrinho
// em um único objeto utilizado pelas telas.
export function montarPedido({
  numero,
  itens,
  dados,
  salvo,
}: DadosDoPedido): Pedido {
  // Calcula o valor total dos produtos.
  const total = totalPedido(itens);

  // Calcula o troco somente quando o pagamento
  // selecionado for em dinheiro.
  const troco =
    dados.pagamento === 'dinheiro'
      ? calcularTroco(dados.troco, total)
      : { pago: null, troco: null };

  // Retorna o pedido completo.
  return {
    numero,
    itens,
    total,

    // Dados do cliente.
    cliente: {
      nome: dados.nome.trim(),
      telefone: dados.telefone.trim(),
      endereco: dados.endereco.trim(),
      complemento: dados.complemento.trim(),
    },

    // Informações de pagamento.
    pagamento: dados.pagamento,
    valorPago: troco.pago,
    troco: troco.troco,

    // Observações adicionais.
    observacao: dados.observacao.trim(),

    // Indica se o pedido foi salvo no banco.
    salvo,
  };
}

// ======================================================
// PREPARAÇÃO DO PAYLOAD PARA O SUPABASE
// ======================================================

// Prepara os dados que serão enviados à função
// criar_pedido do Supabase.
//
// Os preços não são enviados pelo aplicativo.
// O banco recalcula os valores com base nas tabelas.
export function montarPayload(pedido: Pedido): PayloadPedido {
  return {
    // Dados do cliente.
    nome: pedido.cliente.nome,
    telefone: pedido.cliente.telefone,
    endereco: pedido.cliente.endereco,
    complemento: pedido.cliente.complemento,

    // Dados do pagamento.
    pagamento: pedido.pagamento,
    troco_para: pedido.valorPago,

    // Observações do pedido.
    observacao: pedido.observacao,

    // Produtos, sabores e quantidades.
    itens: pedido.itens.map((item) => ({
      slug: item.produto.slug,
      sabor: item.produto.sabor,
      quantidade: item.qtd,
    })),
  };
}
