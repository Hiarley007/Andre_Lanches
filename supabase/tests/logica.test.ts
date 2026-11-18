import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  adicionarItem,
  alterarQuantidade,
  criarLinha,
  limitarQuantidade,
  subtotal,
  totalItens,
  totalPedido,
} from '../../src/domain/carrinho.ts';
import { agruparPorSecao, emLinhas } from '../../src/domain/cardapio.ts';
import type { Secao } from '../../src/domain/cardapio.ts';
import { montarMensagem, urlWhatsApp } from '../../src/domain/mensagemWhatsApp.ts';
import { abaAtiva } from '../../src/domain/navegacao.ts';
import {
  FORMAS_PAGAMENTO,
  calcularTroco,
  rotuloPagamento,
} from '../../src/domain/pagamento.ts';
import { montarPayload, montarPedido, numeroLocal } from '../../src/domain/pedido.ts';
import { resolverEsquema } from '../../src/domain/tema.ts';
import type { DadosCheckout, ItemCarrinho, Tela } from '../../src/domain/tipos.ts';
import { validarCheckout, validarContato } from '../../src/domain/validacoes.ts';
import { cores } from '../../src/theme/index.ts';
import { formatarPreco } from '../../src/utils/formatarPreco.ts';

// ─────────────────────────────────────────────
// Tipos locais dos testes
// ─────────────────────────────────────────────

/** Item mínimo usado nos testes do cardápio. */
interface ProdutoTeste {
  slug: string;
  secao: string;
}

/** Forma de pagamento, inferida direto de FORMAS_PAGAMENTO. */
type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number];

// ─────────────────────────────────────────────
// Dados de exemplo
// ─────────────────────────────────────────────

const xSalada = { slug: 'x-salada', nome: 'X-Salada', preco: '15.00' };
const batata = { slug: 'batata-frita', nome: 'Batata Frita', preco: 16 };
const sucos = { slug: 'sucos', nome: 'Sucos', preco: 8.5 };
const combo = { slug: 'combo', nome: 'X-Salada + Batata', preco: 24.9 };

const dadosOk: DadosCheckout = {
  nome: 'Ana Souza',
  telefone: '(61) 98137-5520',
  endereco: 'SQN 000, Bloco A, Asa Norte',
  complemento: 'Apto 101',
  pagamento: 'pix',
  troco: '',
  observacao: 'Sem cebola',
};

// ─────────────────────────────────────────────
// Funções auxiliares
// ─────────────────────────────────────────────

/** Carrinho com 2x X-Salada + 1x Batata Frita (total R$ 46,00). */
function carrinhoExemplo(): ItemCarrinho[] {
  let itens = adicionarItem([], criarLinha(xSalada), 2);
  itens = adicionarItem(itens, criarLinha(batata), 1);
  return itens;
}

function pedidoExemplo(dados: DadosCheckout = dadosOk) {
  return montarPedido({ numero: '1001', itens: carrinhoExemplo(), dados, salvo: true });
}

/** Lista todos os arquivos de uma pasta, incluindo subpastas. */
function arquivos(pasta: string): string[] {
  return readdirSync(pasta).flatMap((nome: string): string[] => {
    const caminho = join(pasta, nome);
    return statSync(caminho).isDirectory() ? arquivos(caminho) : [caminho];
  });
}

// ─────────────────────────────────────────────
// Carrinho
// ─────────────────────────────────────────────

describe('carrinho', () => {
  test('adiciona itens novos e soma o mesmo produto', () => {
    let itens = adicionarItem([], criarLinha(xSalada), 1);
    itens = adicionarItem(itens, criarLinha(xSalada), 2);

    assert.equal(itens.length, 1);
    assert.equal(itens[0].qtd, 3);
  });

  test('cada sabor de suco é uma linha independente', () => {
    let itens = adicionarItem([], criarLinha(sucos, 'Laranja'), 1);
    itens = adicionarItem(itens, criarLinha(sucos, 'Limão'), 1);
    itens = adicionarItem(itens, criarLinha(sucos, 'Laranja'), 1);

    assert.equal(itens.length, 2);
    assert.deepEqual(
      itens.map((i: ItemCarrinho) => [i.produto.id, i.produto.nome, i.qtd]),
      [
        ['sucos-Laranja', 'Sucos - Laranja', 2],
        ['sucos-Limão', 'Sucos - Limão', 1],
      ],
    );
  });

  test('aumentar, diminuir e remover ao chegar em zero', () => {
    let itens = carrinhoExemplo();

    itens = alterarQuantidade(itens, 'x-salada', 1);
    assert.equal(itens[0].qtd, 3);

    itens = alterarQuantidade(itens, 'batata-frita', -1);
    assert.equal(itens.length, 1);
    assert.equal(itens[0].produto.id, 'x-salada');
  });

  test('subtotais, total e contador', () => {
    const itens = carrinhoExemplo();
    assert.equal(subtotal(itens[0]), 30);
    assert.equal(totalPedido(itens), 46);
    assert.equal(totalItens(itens), 3);

    const tres = adicionarItem([], criarLinha(combo), 3);
    assert.equal(totalPedido(tres), 74.7);
    assert.equal(totalPedido([]), 0);
  });

  test('quantidade fica entre 1 e 20', () => {
    assert.equal(limitarQuantidade(0), 1);
    assert.equal(limitarQuantidade(21), 20);
    assert.equal(limitarQuantidade(5), 5);
  });
});

// ─────────────────────────────────────────────
// Pagamento e troco
// ─────────────────────────────────────────────

describe('pagamento', () => {
  test('só Pix, débito e dinheiro', () => {
    assert.deepEqual(
      FORMAS_PAGAMENTO.map((f: FormaPagamento) => f.id),
      ['pix', 'debito', 'dinheiro'],
    );
    assert.equal(rotuloPagamento('debito'), 'Cartão de débito');
    assert.equal(rotuloPagamento('credito'), '');
  });

  test('troco: vazio, menor, igual e maior que o total', () => {
    assert.equal(calcularTroco('', 46).informado, false);
    assert.match(calcularTroco('40', 46).erro ?? '', /pelo menos R\$ 46,00/);
    assert.match(calcularTroco('abc', 46).erro ?? '', /pelo menos/);
    assert.equal(calcularTroco('46,00', 46).troco, 0);
    assert.equal(calcularTroco('50', 46).troco, 4);
    assert.equal(calcularTroco('R$ 1.234,50', 1000).troco, 234.5);
    assert.equal(calcularTroco('50.00', 24.9).troco, 25.1);
  });
});

// ─────────────────────────────────────────────
// Validações
// ─────────────────────────────────────────────

describe('validações', () => {
  test('checkout: dados válidos não geram erros', () => {
    assert.deepEqual(validarCheckout(dadosOk, 46), {});
  });

  test('checkout: campos vazios geram os erros esperados', () => {
    const vazio: DadosCheckout = {
      ...dadosOk,
      nome: '',
      telefone: '',
      endereco: '',
      pagamento: null,
    };

    assert.deepEqual(Object.keys(validarCheckout(vazio, 46)), [
      'nome',
      'telefone',
      'endereco',
      'pagamento',
    ]);
  });

  test('checkout: o troco só é conferido em dinheiro', () => {
    const dinheiro: DadosCheckout = { ...dadosOk, pagamento: 'dinheiro', troco: '10' };

    assert.match(validarCheckout(dinheiro, 46).troco ?? '', /pelo menos R\$ 46,00/);
    assert.deepEqual(validarCheckout({ ...dinheiro, troco: '50' }, 46), {});
    assert.deepEqual(validarCheckout({ ...dinheiro, troco: '' }, 46), {});
    assert.deepEqual(validarCheckout({ ...dadosOk, pagamento: 'pix', troco: '1' }, 46), {});
    assert.deepEqual(
      validarCheckout({ ...dadosOk, pagamento: 'debito', troco: '1' }, 46),
      {},
    );
  });

  test('checkout: forma de pagamento fora da lista é recusada', () => {
    // @ts-expect-error o TypeScript já recusa 'outra'; o teste confere a regra ao rodar.
    const erros = validarCheckout({ ...dadosOk, pagamento: 'outra' }, 46);

    assert.equal(erros.pagamento, 'Forma de pagamento indisponível.');
  });

  test('contato: regras de nome, contato e mensagem', () => {
    const ok = { nome: 'Ana', contato: 'ana@email.com', mensagem: 'Gostei muito!' };
    assert.deepEqual(validarContato(ok), {});
    assert.deepEqual(validarContato({ ...ok, contato: '(61) 98137-5520' }), {});

    const ruim = validarContato({ nome: 'A', contato: 'abc', mensagem: 'oi' });
    assert.deepEqual(Object.keys(ruim), ['nome', 'contato', 'mensagem']);
  });
});

// ─────────────────────────────────────────────
// Pedido e WhatsApp
// ─────────────────────────────────────────────

describe('pedido', () => {
  test('número local tem 5 dígitos e o pedido guarda os totais', () => {
    assert.equal(numeroLocal(1731800012345), '12345');

    const pedido = pedidoExemplo();
    assert.equal(pedido.total, 46);
    assert.equal(pedido.cliente.nome, 'Ana Souza');
  });

  test('o payload não leva preços e usa slug, sabor e quantidade', () => {
    let itens = adicionarItem([], criarLinha(sucos, 'Limão'), 2);
    itens = adicionarItem(itens, criarLinha(combo), 1);
    const dados: DadosCheckout = { ...dadosOk, pagamento: 'dinheiro', troco: '50' };

    const payload = montarPayload(montarPedido({ numero: '1', itens, dados, salvo: true }));

    assert.deepEqual(payload.itens, [
      { slug: 'sucos', sabor: 'Limão', quantidade: 2 },
      { slug: 'combo', sabor: null, quantidade: 1 },
    ]);
    assert.equal(payload.troco_para, 50);
    assert.equal(JSON.stringify(payload).includes('preco'), false);
  });
});

describe('WhatsApp', () => {
  test('mensagem completa com Pix', () => {
    const texto = montarMensagem(pedidoExemplo());

    assert.match(texto, /\*Pedido #1001 - André Lanches\*/);
    assert.match(texto, /2x X-Salada - R\$ 15,00 cada = R\$ 30,00/);
    assert.match(texto, /1x Batata Frita - R\$ 16,00 cada = R\$ 16,00/);
    assert.match(texto, /\*Total: R\$ 46,00\*/);
    assert.match(texto, /\*Endereço:\* SQN 000, Bloco A, Asa Norte \(Apto 101\)/);
    assert.match(texto, /\*Pagamento:\* Pix/);
    assert.match(texto, /\*Observações:\* Sem cebola/);
    assert.doesNotMatch(texto, /Troco/);
  });

  test('sabor, valor entregue e troco em dinheiro', () => {
    const itens = adicionarItem([], criarLinha(sucos, 'Maracujá'), 1);
    const dados: DadosCheckout = {
      ...dadosOk,
      pagamento: 'dinheiro',
      troco: '20',
      observacao: '',
    };

    const texto = montarMensagem(montarPedido({ numero: '7', itens, dados, salvo: true }));
    assert.match(texto, /1x Sucos - Maracujá - R\$ 8,50 cada = R\$ 8,50/);
    assert.match(texto, /\*Valor entregue:\* R\$ 20,00/);
    assert.match(texto, /\*Troco:\* R\$ 11,50/);
    assert.doesNotMatch(texto, /Observações/);

    const sem = montarMensagem(
      montarPedido({ numero: '7', itens, dados: { ...dados, troco: '' }, salvo: true }),
    );
    assert.match(sem, /\*Troco:\* sem troco/);
  });

  test('o endereço do link leva o texto codificado', () => {
    const url = urlWhatsApp('https://wa.me/5561981375520', 'Olá, pedido #1');

    assert.equal(url, 'https://wa.me/5561981375520?text=Ol%C3%A1%2C%20pedido%20%231');
  });
});

// ─────────────────────────────────────────────
// Cardápio
// ─────────────────────────────────────────────

describe('cardápio', () => {
  test('agrupa por seção e divide em linhas de 2 cards', () => {
    const lista: ProdutoTeste[] = [
      { slug: 'a', secao: 'Sanduíches' },
      { slug: 'b', secao: 'Sanduíches' },
      { slug: 'c', secao: 'Sanduíches' },
      { slug: 'd', secao: 'Bebidas' },
    ];

    const secoes = agruparPorSecao(lista);
    assert.deepEqual(
      secoes.map((s: Secao<ProdutoTeste>) => [s.titulo, s.itens.length]),
      [
        ['Sanduíches', 3],
        ['Bebidas', 1],
      ],
    );
    assert.deepEqual(
      emLinhas(secoes[0].itens).map((l: ProdutoTeste[]) =>
        l.map((p: ProdutoTeste) => p.slug),
      ),
      [['a', 'b'], ['c']],
    );
    assert.deepEqual(agruparPorSecao([]), []);
  });
});

// ─────────────────────────────────────────────
// Navegação, tema e formatação
// ─────────────────────────────────────────────

describe('navegação', () => {
  test('aba marcada em cada tela', () => {
    assert.equal(abaAtiva('lanches'), 'lanches');
    assert.equal(abaAtiva('detalhe'), 'lanches');
    assert.equal(abaAtiva('sobre'), 'sobre');
    assert.equal(abaAtiva('contato'), 'contato');

    const semAba: Tela[] = ['carrinho', 'checkout', 'confirmacao', 'config'];
    for (const tela of semAba) {
      assert.equal(abaAtiva(tela), null);
    }
  });
});

describe('tema', () => {
  test('claro, escuro e sistema seguem o celular', () => {
    assert.equal(resolverEsquema('claro', 'dark'), 'claro');
    assert.equal(resolverEsquema('escuro', 'light'), 'escuro');
    assert.equal(resolverEsquema('sistema', 'dark'), 'escuro');
    assert.equal(resolverEsquema('sistema', 'light'), 'claro');
    assert.equal(resolverEsquema('sistema', null), 'claro');
  });

  test('as duas paletas têm as mesmas cores', () => {
    assert.deepEqual(Object.keys(cores.claro), Object.keys(cores.escuro));
    assert.equal(cores.claro.primary, '#E50021');
  });
});

describe('preço', () => {
  test('formato brasileiro', () => {
    assert.equal(formatarPreco(15), 'R$ 15,00');
    assert.equal(formatarPreco('8.50'), 'R$ 8,50');
  });
});

// ─────────────────────────────────────────────
// Regra de negócio: sem cartão de crédito
// ─────────────────────────────────────────────

describe('sem cartão de crédito', () => {
  test('não existe cartão de crédito no código do app nem no schema', () => {
    const alvos: string[] = [
      ...arquivos(fileURLToPath(new URL('../../src', import.meta.url))),
      fileURLToPath(new URL('../schema.sql', import.meta.url)),
    ];

    const achados = alvos.filter(
      (f: string) =>
        /\.(ts|tsx|sql)$/.test(f) && /cr[eé]dito/i.test(readFileSync(f, 'utf8')),
    );

    assert.deepEqual(achados, []);
  });
});