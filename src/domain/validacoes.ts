
// ======================================================
// VALIDAÇÕES — ANDRÉ LANCHES
// ======================================================

// Funções relacionadas às formas de pagamento.
import { FORMAS_PAGAMENTO, calcularTroco } from './pagamento.ts';

// Tipos utilizados nos formulários.
import type {
  DadosCheckout,
  DadosContato,
  Erros,
} from './tipos.ts';

// ======================================================
// TIPOS DE ERROS
// ======================================================

// Campos que podem apresentar erros no checkout.
export type ErrosCheckout = Erros<
  'nome' | 'telefone' | 'endereco' | 'pagamento' | 'troco'
>;

// Campos que podem apresentar erros no formulário de contato.
export type ErrosContato = Erros<keyof DadosContato>;

// ======================================================
// FUNÇÕES AUXILIARES
// ======================================================

// Remove tudo que não for letra.
const soLetras = (texto: string): string =>
  texto.replace(/[^A-Za-zÀ-ÿ]/g, '');

// Mantém somente os números.
const soDigitos = (texto: string): string =>
  texto.replace(/\D/g, '');

// Expressão regular para validação básica de e-mail.
const PADRAO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ======================================================
// VALIDAÇÃO DO CHECKOUT
// ======================================================

// Verifica os dados informados pelo cliente antes de finalizar
// o pedido. Retorna um objeto com os erros encontrados.
// Objeto vazio significa que todos os campos estão válidos.
export function validarCheckout(
  dados: DadosCheckout,
  total: number,
): ErrosCheckout {
  const erros: ErrosCheckout = {};

  // Validação do nome.
  if (soLetras(dados.nome).length < 2) {
    erros.nome = 'Informe seu nome (mínimo 2 letras).';
  }

  // Validação do telefone com DDD.
  const telefone = soDigitos(dados.telefone);

  if (telefone.length !== 10 && telefone.length !== 11) {
    erros.telefone = 'Informe um telefone com DDD.';
  }

  // Validação do endereço.
  if (dados.endereco.trim().length < 8) {
    erros.endereco = 'Informe rua, número e bairro.';
  }

  // Validação da forma de pagamento.
  if (!dados.pagamento) {
    erros.pagamento = 'Escolha uma forma de pagamento.';
  } else if (
    !FORMAS_PAGAMENTO.some(
      (forma) => forma.id === dados.pagamento,
    )
  ) {
    erros.pagamento = 'Forma de pagamento indisponível.';
  }

  // O campo de troco só é considerado para dinheiro.
  // Em Pix e débito, o valor informado é ignorado.
  if (dados.pagamento === 'dinheiro' && dados.troco.trim()) {
    const resultado = calcularTroco(dados.troco, total);

    if (resultado.erro) {
      erros.troco = resultado.erro;
    }
  }

  return erros;
}

// ======================================================
// VALIDAÇÃO DO FORMULÁRIO DE CONTATO
// ======================================================

// Verifica nome, e-mail ou telefone e mensagem.
export function validarContato({
  nome,
  contato,
  mensagem,
}: DadosContato): ErrosContato {
  const erros: ErrosContato = {};

  // Validação do nome.
  if (soLetras(nome).length < 2) {
    erros.nome = 'Informe seu nome (mínimo 2 letras).';
  }

  // Validação do e-mail ou telefone.
  const texto = contato.trim();
  const digitos = soDigitos(texto);

  const telefoneOk =
    digitos.length === 10 || digitos.length === 11;

  if (!PADRAO_EMAIL.test(texto) && !telefoneOk) {
    erros.contato = 'Use um e-mail válido ou telefone com DDD.';
  }

  // Validação do conteúdo da mensagem.
  if (mensagem.trim().length < 10) {
    erros.mensagem = 'A mensagem precisa de ao menos 10 caracteres.';
  }

  return erros;
}
