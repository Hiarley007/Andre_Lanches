
// ============================================================
// ANDRÉ LANCHES
// Testes automatizados do banco de dados
// PGlite + Node.js Test Runner
//
// Aplica o mesmo schema.sql utilizado no Supabase.
// ============================================================

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const schema = readFileSync(
  new URL('../schema.sql', import.meta.url),
  'utf8'
);

let db: PGlite;

// Linha devolvida por uma consulta.
type Linha = Record<string, unknown>;


// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

// Executa uma função com o papel indicado e retorna
// ao papel administrador ao finalizar.

async function como<T>(
  papel: 'anon' | 'authenticated',
  fn: () => Promise<T>
): Promise<T> {
  await db.exec(`SET ROLE ${papel}`);

  try {
    return await fn();
  } finally {
    await db.exec('RESET ROLE');
  }
}


// Chama a função criar_pedido como o aplicativo faz.
// O pedido aceita qualquer objeto para permitir testes
// com dados inválidos.

function criar(p: Record<string, unknown>): Promise<number> {
  return como('anon', async () => {
    const r = await db.query<{ numero: number }>(
      'SELECT public.criar_pedido($1::jsonb) AS numero',
      [JSON.stringify(p)]
    );

    return r.rows[0].numero;
  });
}


// Cliente utilizado nos testes.

const cliente = {
  nome: 'Ana Souza',
  telefone: '(61) 98137-5520',
  endereco: 'SQN 000, Bloco A, Asa Norte',
  complemento: 'Apto 101',
  pagamento: 'pix',
  observacao: 'Sem cebola',
};


// ============================================================
// CONFIGURAÇÃO DOS TESTES
// ============================================================

before(async () => {
  db = new PGlite();

  // No Supabase real, estes papéis já existem.
  // No PGlite, precisamos criá-los.

  await db.exec(`
    CREATE ROLE anon NOLOGIN;
    CREATE ROLE authenticated NOLOGIN;
  `);

  // Aplicar o schema do banco.

  await db.exec(schema);
});


after(async () => {
  await db.close();
});


// ============================================================
// 1. TESTES DOS DADOS INICIAIS (SEED)
// ============================================================

test('seed: 9 produtos ativos e 1 promoção ativa', async () => {
  const p = await db.query<Linha>(
    'SELECT COUNT(*)::int AS n FROM public.produtos WHERE ativo'
  );

  const a = await db.query<Linha>(
    'SELECT COUNT(*)::int AS n FROM public.promocoes WHERE ativa'
  );

  assert.equal(p.rows[0].n, 9);
  assert.equal(a.rows[0].n, 1);
});


test('seed: preços do cardápio', async () => {
  const r = await db.query<Linha>(
    'SELECT slug, preco::text FROM public.produtos ORDER BY ordem'
  );

  assert.deepEqual(
    r.rows.map((x) => `${x.slug}=${x.preco}`),
    [
      'x-salada=15.00',
      'cheddar=18.00',
      'x-burguer=14.00',
      'big-tower=22.00',
      'x-frango=16.00',
      'batata-frita=16.00',
      'nuggets=9.00',
      'refri=6.00',
      'sucos=8.50',
    ]
  );
});


test('seed: promoção De 31,00 por 24,90 e sucos com 6 sabores', async () => {
  const m = await db.query<Linha>(
    'SELECT preco::text, preco_original::text FROM public.promocoes'
  );

  assert.deepEqual(m.rows[0], {
    preco: '24.90',
    preco_original: '31.00',
  });

  const s = await db.query<Linha>(
    `SELECT cardinality(opcoes)::int AS n
     FROM public.produtos
     WHERE slug = 'sucos'`
  );

  assert.equal(s.rows[0].n, 6);
});


test('preço negativo é recusado', async () => {
  await assert.rejects(
    db.query(
      `INSERT INTO public.produtos
       (slug, nome, preco, secao)
       VALUES ('t', 'T', -1, 'X')`
    )
  );
});


// ============================================================
// 2. TESTES DE LEITURA E PERMISSÕES
// ============================================================

test('anon lê produtos e promoções ativos, e produto inativo some', async () => {
  await db.exec(
    "UPDATE public.produtos SET ativo = false WHERE slug = 'refri'"
  );

  await como('anon', async () => {
    const p = await db.query<Linha>(
      'SELECT COUNT(*)::int AS n FROM public.produtos'
    );

    const a = await db.query<Linha>(
      'SELECT COUNT(*)::int AS n FROM public.promocoes'
    );

    assert.equal(p.rows[0].n, 8);
    assert.equal(a.rows[0].n, 1);
  });

  await db.exec(
    "UPDATE public.produtos SET ativo = true WHERE slug = 'refri'"
  );
});


test('anon NÃO altera nem apaga produtos', async () => {
  await como('anon', async () => {
    await assert.rejects(
      db.query('UPDATE public.produtos SET preco = 0')
    );

    await assert.rejects(
      db.query('DELETE FROM public.produtos')
    );
  });
});


test('contatos: anon insere, não lê e campo vazio é recusado', async () => {
  await como('anon', async () => {
    await db.query(
      `INSERT INTO public.contatos
       (nome, contato, mensagem)
       VALUES ('Ana', 'a@b.com', 'Oi!')`
    );

    await assert.rejects(
      db.query('SELECT * FROM public.contatos')
    );

    await assert.rejects(
      db.query(
        `INSERT INTO public.contatos
         (nome, contato, mensagem)
         VALUES ('', 'a@b.com', 'x')`
      )
    );
  });
});


test('pedidos: anon NÃO lê nem grava diretamente nas tabelas', async () => {
  await como('anon', async () => {
    await assert.rejects(
      db.query('SELECT * FROM public.pedidos')
    );

    await assert.rejects(
      db.query('SELECT * FROM public.itens_pedido')
    );

    await assert.rejects(
      db.query(
        `INSERT INTO public.pedidos
         (nome, telefone, endereco, pagamento, total)
         VALUES ('A', '1', 'x', 'pix', 1)`
      )
    );
  });
});


// ============================================================
// 3. TESTES DA FUNÇÃO CRIAR_PEDIDO
// ============================================================

test('criar_pedido: total recalculado e número sequencial', async () => {
  const numero = await criar({
    ...cliente,
    itens: [
      { slug: 'x-salada', quantidade: 2 },
      { slug: 'batata-frita', quantidade: 1 },
    ],
  });

  assert.equal(numero, 1001);

  const p = await db.query<Linha>(
    `SELECT total::text, pagamento, troco_para
     FROM public.pedidos
     WHERE numero = 1001`
  );

  assert.deepEqual(p.rows[0], {
    total: '46.00',
    pagamento: 'pix',
    troco_para: null,
  });

  const i = await db.query<Linha>(
    `SELECT
       COUNT(*)::int AS n,
       SUM(subtotal)::text AS s
     FROM public.itens_pedido`
  );

  assert.deepEqual(i.rows[0], {
    n: 2,
    s: '46.00',
  });
});


test('criar_pedido: ignora preços enviados pelo cliente', async () => {
  const numero = await criar({
    ...cliente,
    itens: [
      { slug: 'cheddar', quantidade: 1, preco: 0.01 },
    ],
    total: 0.01,
  });

  const p = await db.query<Linha>(
    `SELECT total::text
     FROM public.pedidos
     WHERE numero = $1`,
    [numero]
  );

  assert.equal(p.rows[0].total, '18.00');
});


test('criar_pedido: sabor do suco gera linha própria e sabor inválido é recusado', async () => {
  const numero = await criar({
    ...cliente,
    itens: [
      { slug: 'sucos', sabor: 'Laranja', quantidade: 1 },
      { slug: 'sucos', sabor: 'Limão', quantidade: 2 },
    ],
  });

  const i = await db.query<Linha>(
    `SELECT ip.nome, ip.subtotal::text
     FROM public.itens_pedido ip
     JOIN public.pedidos p ON p.id = ip.pedido_id
     WHERE p.numero = $1
     ORDER BY ip.nome`,
    [numero]
  );

  assert.deepEqual(i.rows, [
    { nome: 'Sucos - Laranja', subtotal: '8.50' },
    { nome: 'Sucos - Limão', subtotal: '17.00' },
  ]);

  await assert.rejects(
    criar({
      ...cliente,
      itens: [{ slug: 'sucos', sabor: 'Uva', quantidade: 1 }],
    }),
    /pedido_invalido/
  );

  await assert.rejects(
    criar({
      ...cliente,
      itens: [{ slug: 'sucos', quantidade: 1 }],
    }),
    /pedido_invalido/
  );

  await assert.rejects(
    criar({
      ...cliente,
      itens: [{ slug: 'refri', sabor: 'Cola', quantidade: 1 }],
    }),
    /pedido_invalido/
  );
});


test('criar_pedido: combo da promoção custa R$ 24,90', async () => {
  const numero = await criar({
    ...cliente,
    itens: [{ slug: 'combo', quantidade: 1 }],
  });

  const p = await db.query<Linha>(
    `SELECT total::text
     FROM public.pedidos
     WHERE numero = $1`,
    [numero]
  );

  assert.equal(p.rows[0].total, '24.90');
});


test('criar_pedido: troco em dinheiro, menor é recusado e igual ou maior passa', async () => {
  const base = {
    ...cliente,
    pagamento: 'dinheiro',
    itens: [{ slug: 'x-burguer', quantidade: 1 }],
  };

  await assert.rejects(
    criar({ ...base, troco_para: 10 }),
    /pedido_invalido/
  );

  const igual = await criar({
    ...base,
    troco_para: 14,
  });

  const maior = await criar({
    ...base,
    troco_para: 20,
  });

  const semTroco = await criar(base);

  const r = await db.query<Linha>(
    `SELECT troco_para::text
     FROM public.pedidos
     WHERE numero IN ($1, $2, $3)
     ORDER BY numero`,
    [igual, maior, semTroco]
  );

  assert.deepEqual(
    r.rows.map((x) => x.troco_para),
    ['14.00', '20.00', null]
  );
});


test('criar_pedido: Pix e débito descartam o valor de troco', async () => {
  const numero = await criar({
    ...cliente,
    pagamento: 'debito',
    troco_para: 50,
    itens: [{ slug: 'refri', quantidade: 1 }],
  });

  const r = await db.query<Linha>(
    `SELECT troco_para
     FROM public.pedidos
     WHERE numero = $1`,
    [numero]
  );

  assert.equal(r.rows[0].troco_para, null);
});


test('criar_pedido: só aceita Pix, débito e dinheiro', async () => {
  const itens = [{ slug: 'refri', quantidade: 1 }];

  await assert.rejects(
    criar({
      ...cliente,
      pagamento: 'credito',
      itens,
    }),
    /pedido_invalido/
  );

  await assert.rejects(
    criar({
      ...cliente,
      pagamento: undefined,
      itens,
    }),
    /pedido_invalido/
  );

  await assert.rejects(
    db.query(
      `INSERT INTO public.pedidos
       (nome, telefone, endereco, pagamento, total)
       VALUES ('Ana', '61981375520', 'Rua A, 10, Centro', 'credito', 1)`
    )
  );
});


test('criar_pedido: dados inválidos e produto inativo são recusados', async () => {
  const itens = [{ slug: 'refri', quantidade: 1 }];

  await assert.rejects(
    criar({ ...cliente, nome: 'A', itens }),
    /pedido_invalido/
  );

  await assert.rejects(
    criar({ ...cliente, telefone: '123', itens }),
    /pedido_invalido/
  );

  await assert.rejects(
    criar({ ...cliente, endereco: 'Rua', itens }),
    /pedido_invalido/
  );

  await assert.rejects(
    criar({ ...cliente, itens: [] }),
    /pedido_invalido/
  );

  await assert.rejects(
    criar({
      ...cliente,
      itens: [{ slug: 'inexistente', quantidade: 1 }],
    }),
    /pedido_invalido/
  );

  await assert.rejects(
    criar({
      ...cliente,
      itens: [{ slug: 'refri', quantidade: 0 }],
    }),
    /pedido_invalido/
  );

  await db.exec(
    "UPDATE public.produtos SET ativo = false WHERE slug = 'refri'"
  );

  await assert.rejects(
    criar({ ...cliente, itens }),
    /pedido_invalido/
  );

  await db.exec(
    "UPDATE public.produtos SET ativo = true WHERE slug = 'refri'"
  );
});
