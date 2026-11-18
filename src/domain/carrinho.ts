
// ======================================================
// REGRAS DO CARRINHO — ANDRÉ LANCHES
// ======================================================

// Tipos utilizados nas operações do carrinho.
import type {
  ItemCarrinho,
  LinhaPedido,
  ProdutoDetalhe,
} from './tipos.ts';

// ======================================================
// LIMITES DE QUANTIDADE
// ======================================================

// Quantidade mínima e máxima permitida por item.
export const QTD_MIN = 1;
export const QTD_MAX = 20;

// ======================================================
// CONVERSÃO MONETÁRIA
// ======================================================

// Converte reais para centavos para evitar erros
// de precisão em operações com números decimais.
const emCentavos = (valor: number): number =>
  Math.round(valor * 100);

// ======================================================
// CONTROLE DE QUANTIDADE
// ======================================================

// Mantém a quantidade dentro dos limites permitidos.
export function limitarQuantidade(n: number): number {
  return Math.min(QTD_MAX, Math.max(QTD_MIN, n));
}

// ======================================================
// CRIAÇÃO DE ITENS
// ======================================================

// Cria uma linha do pedido.
//
// Cada sabor de suco gera uma linha independente.
// Exemplo:
// ID: sucos-Laranja
// Nome: Sucos - Laranja
export function criarLinha(
  produto: Pick<ProdutoDetalhe, 'slug' | 'nome' | 'preco'>,
  sabor: string | null = null,
): LinhaPedido {
  return {
    id: sabor ? `${produto.slug}-${sabor}` : produto.slug,
    slug: produto.slug,
    nome: sabor ? `${produto.nome} - ${sabor}` : produto.nome,
    preco: Number(produto.preco),
    sabor,
  };
}

// ======================================================
// ADICIONAR ITENS AO CARRINHO
// ======================================================

// Adiciona um produto ao carrinho.
// Se o produto já existir, aumenta sua quantidade.
export function adicionarItem(
  itens: ItemCarrinho[],
  linha: LinhaPedido,
  quantidade: number,
): ItemCarrinho[] {
  const existe = itens.some(
    (item) => item.produto.id === linha.id,
  );

  if (existe) {
    return itens.map((item) =>
      item.produto.id === linha.id
        ? { ...item, qtd: item.qtd + quantidade }
        : item,
    );
  }

  return [...itens, { produto: linha, qtd: quantidade }];
}

// ======================================================
// ALTERAR QUANTIDADE E REMOVER ITENS
// ======================================================

// delta: +1 aumenta a quantidade.
// delta: -1 diminui a quantidade.
// Quando chega a zero, o item é removido.
export function alterarQuantidade(
  itens: ItemCarrinho[],
  id: string,
  delta: number,
): ItemCarrinho[] {
  return itens
    .map((item) =>
      item.produto.id === id
        ? { ...item, qtd: item.qtd + delta }
        : item,
    )
    .filter((item) => item.qtd > 0);
}

// ======================================================
// CONTAGEM DE ITENS
// ======================================================

// Retorna a quantidade total de unidades no carrinho.
export function totalItens(itens: ItemCarrinho[]): number {
  return itens.reduce(
    (soma, item) => soma + item.qtd,
    0,
  );
}

// ======================================================
// CÁLCULO DE VALORES
// ======================================================

// Calcula o subtotal de um item.
// A operação é realizada em centavos para evitar
// problemas de precisão com números decimais.
export function subtotal(item: ItemCarrinho): number {
  return (
    (emCentavos(item.produto.preco) * item.qtd) / 100
  );
}

// Calcula o valor total de todos os itens do carrinho.
export function totalPedido(itens: ItemCarrinho[]): number {
  const centavos = itens.reduce(
    (soma, item) =>
      soma + emCentavos(item.produto.preco) * item.qtd,
    0,
  );

  return centavos / 100;
}
