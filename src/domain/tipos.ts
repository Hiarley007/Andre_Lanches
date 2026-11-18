// ======================================================
// TIPOS COMPARTILHADOS DO APLICATIVO ANDRÉ LANCHES
// ======================================================

// Imports utilizados apenas para tipagem.
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

// ======================================================
// PRODUTOS E PROMOÇÕES
// ======================================================

// Coluna numeric do PostgreSQL.
// O Supabase pode retornar o valor como texto ou número.
export type Preco = number | string;

// Estrutura de um produto da tabela produtos.
export interface Produto {
  id: string;
  slug: string;
  nome: string;
  descricao: string | null;
  preco: Preco;
  secao: string;
  opcoes: string[] | null;
  ordem: number | null;
}

// Estrutura de uma promoção da tabela promocoes.
export interface Promocao {
  id: string;
  slug: string;
  titulo: string;
  descricao: string | null;
  preco: Preco;
  preco_original: Preco | null;
}

// Dados necessários para a tela de detalhes.
// Pode representar um produto ou uma promoção.
export type ProdutoDetalhe = Pick<
  Produto,
  'slug' | 'nome' | 'descricao' | 'preco' | 'opcoes'
>;

// ======================================================
// CARRINHO E ITENS DO PEDIDO
// ======================================================

// Produto selecionado pelo cliente.
// Cada sabor de suco possui seu próprio identificador.
export interface LinhaPedido {
  id: string;
  slug: string;
  nome: string;
  preco: number;
  sabor: string | null;
}

// Item armazenado no carrinho.
export interface ItemCarrinho {
  produto: LinhaPedido;
  qtd: number;
}

// ======================================================
// PAGAMENTO E CHECKOUT
// ======================================================

// Formas de pagamento aceitas pelo aplicativo.
export type FormaPagamentoId = 'pix' | 'debito' | 'dinheiro';

// Dados recebidos do formulário de checkout.
export interface DadosCheckout {
  nome: string;
  telefone: string;
  endereco: string;
  complemento: string;
  pagamento: FormaPagamentoId | null;
  troco: string;
  observacao: string;
}

// ======================================================
// CLIENTE E CONTATO
// ======================================================

// Dados enviados pelo formulário de contato.
export interface DadosContato {
  nome: string;
  contato: string;
  mensagem: string;
}

// Dados do cliente associados ao pedido.
export interface Cliente {
  nome: string;
  telefone: string;
  endereco: string;
  complemento: string;
}

// ======================================================
// PEDIDOS
// ======================================================

// Pedido montado pelo aplicativo.
// O número pode vir do banco ou ser gerado localmente.
export interface Pedido {
  numero: string;
  itens: ItemCarrinho[];
  total: number;
  cliente: Cliente;
  pagamento: FormaPagamentoId | null;
  valorPago: number | null;
  troco: number | null;
  observacao: string;
  salvo: boolean;
}

// Dados enviados à função criar_pedido do Supabase.
// Os preços não são enviados: o banco calcula os valores.
export interface PayloadPedido {
  nome: string;
  telefone: string;
  endereco: string;
  complemento: string;
  pagamento: FormaPagamentoId | null;
  troco_para: number | null;
  observacao: string;
  itens: {
    slug: string;
    sabor: string | null;
    quantidade: number;
  }[];
}

// ======================================================
// VALIDAÇÃO DE FORMULÁRIOS
// ======================================================

// Armazena uma mensagem para cada campo inválido.
// Um objeto vazio significa que não existem erros.
export type Erros<Campo extends string> = Partial<Record<Campo, string>>;

// ======================================================
// NAVEGAÇÃO E TELAS
// ======================================================

// Telas disponíveis no aplicativo.
export type Tela =
  | 'abertura'
  | 'lanches'
  | 'detalhe'
  | 'carrinho'
  | 'checkout'
  | 'confirmacao'
  | 'sobre'
  | 'contato'
  | 'config';

// Abas disponíveis no menu principal.
export type IdAba = 'lanches' | 'sobre' | 'contato';

// ======================================================
// TEMA E APARÊNCIA
// ======================================================

// Preferência de tema escolhida pelo usuário.
export type PreferenciaTema = 'claro' | 'escuro' | 'sistema';

// Tema efetivamente aplicado pelo aplicativo.
export type Esquema = 'claro' | 'escuro';

// ======================================================
// ÍCONES
// ======================================================

// Nome válido de um ícone da biblioteca Ionicons.
export type NomeIcone = ComponentProps<typeof Ionicons>['name'];

// ======================================================
// CONSULTAS E CARREGAMENTO DE DADOS
// ======================================================

// Estrutura de retorno dos hooks de consulta.
export interface Consulta<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}
