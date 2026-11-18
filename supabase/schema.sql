
-- ============================================================
-- ANDRÉ LANCHES
-- schema.sql
-- Execute no SQL Editor do Supabase
--
-- Pode ser executado mais de uma vez:
-- - Tabelas utilizam IF NOT EXISTS.
-- - Políticas são recriadas.
-- - A função é substituída.
-- - O seed só é inserido se a tabela estiver vazia.
-- ============================================================


-- ============================================================
-- 1. TABELAS
-- ============================================================

-- Produtos
-- slug identifica o produto e permite localizar sua imagem
-- dentro da pasta assets/ do aplicativo.

CREATE TABLE IF NOT EXISTS public.produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    descricao TEXT,
    preco NUMERIC(10,2) NOT NULL CHECK (preco >= 0),
    secao TEXT NOT NULL,
    opcoes TEXT[],
    ordem INT,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);


-- Promoções
-- preco_original representa o preço anterior, exibido riscado.

CREATE TABLE IF NOT EXISTS public.promocoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    preco NUMERIC(10,2) NOT NULL CHECK (preco >= 0),
    preco_original NUMERIC(10,2) CHECK (preco_original >= preco),
    ativa BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);


-- Contatos

CREATE TABLE IF NOT EXISTS public.contatos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    contato TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);


-- Pedidos
-- numero: identificador sequencial iniciado em 1001.
-- troco_para: valor que o cliente entregará em dinheiro.

CREATE TABLE IF NOT EXISTS public.pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero INTEGER GENERATED ALWAYS AS IDENTITY (START WITH 1001) UNIQUE,
    nome TEXT NOT NULL CHECK (CHAR_LENGTH(nome) <= 80),
    telefone TEXT NOT NULL,
    endereco TEXT NOT NULL CHECK (CHAR_LENGTH(endereco) <= 200),
    complemento TEXT CHECK (CHAR_LENGTH(complemento) <= 100),
    pagamento TEXT NOT NULL CHECK (
        pagamento IN ('pix', 'debito', 'dinheiro')
    ),
    troco_para NUMERIC(10,2) CHECK (troco_para >= 0),
    total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
    observacao TEXT CHECK (CHAR_LENGTH(observacao) <= 300),
    criado_em TIMESTAMPTZ DEFAULT NOW()
);


-- Itens do pedido
-- Armazena uma cópia do nome e do preço no momento da compra.

CREATE TABLE IF NOT EXISTS public.itens_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
    produto_slug TEXT NOT NULL,
    nome TEXT NOT NULL,
    sabor TEXT,
    preco_unitario NUMERIC(10,2) NOT NULL CHECK (preco_unitario >= 0),
    quantidade INT NOT NULL CHECK (quantidade BETWEEN 1 AND 99),
    subtotal NUMERIC(10,2) GENERATED ALWAYS AS (
        preco_unitario * quantidade
    ) STORED
);


-- ============================================================
-- 2. SEGURANÇA: ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promocoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 3. PERMISSÕES
-- ============================================================

REVOKE ALL ON
    public.produtos,
    public.promocoes,
    public.contatos,
    public.pedidos,
    public.itens_pedido
FROM anon, authenticated;

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.produtos TO anon, authenticated;

GRANT SELECT ON public.promocoes TO anon, authenticated;

GRANT INSERT ON public.contatos TO anon, authenticated;

-- Pedidos e itens_pedido:
-- Nenhuma permissão direta de acesso.
-- Somente a função criar_pedido() poderá gravar esses dados.


-- ============================================================
-- 4. POLÍTICAS DE SEGURANÇA
-- ============================================================

-- Produtos: leitura somente dos produtos ativos.

DROP POLICY IF EXISTS "produtos_leitura" ON public.produtos;

CREATE POLICY "produtos_leitura"
ON public.produtos
FOR SELECT
TO anon, authenticated
USING (ativo);


-- Promoções: leitura somente das promoções ativas.

DROP POLICY IF EXISTS "promocoes_leitura" ON public.promocoes;

CREATE POLICY "promocoes_leitura"
ON public.promocoes
FOR SELECT
TO anon, authenticated
USING (ativa);


-- Contatos: somente inserção de mensagens com campos preenchidos.

DROP POLICY IF EXISTS "contatos_envio" ON public.contatos;

CREATE POLICY "contatos_envio"
ON public.contatos
FOR INSERT
TO anon, authenticated
WITH CHECK (
    LENGTH(TRIM(nome)) > 0
    AND LENGTH(TRIM(contato)) > 0
    AND LENGTH(TRIM(mensagem)) > 0
);


-- ============================================================
-- 5. FUNÇÃO: CRIAR PEDIDO
-- ============================================================

-- Recebe os dados do pedido em JSON.
-- Valida as informações e recalcula os preços diretamente
-- utilizando os valores cadastrados no banco de dados.
--
-- O aplicativo não envia preços confiáveis.
-- Isso impede que o cliente manipule o valor da compra.
--
-- SECURITY DEFINER permite que a função execute operações
-- utilizando as permissões de seu proprietário.

CREATE OR REPLACE FUNCTION public.criar_pedido(p JSONB)
RETURNS INTEGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$

DECLARE
    v_nome TEXT := BTRIM(COALESCE(p->>'nome', ''));
    v_tel TEXT := BTRIM(COALESCE(p->>'telefone', ''));
    v_end TEXT := BTRIM(COALESCE(p->>'endereco', ''));

    v_pag TEXT := p->>'pagamento';

    v_troco NUMERIC(10,2) :=
        NULLIF(p->>'troco_para', '')::NUMERIC;

    v_total NUMERIC(10,2) := 0;

    v_linhas JSONB := '[]'::JSONB;
    v_item JSONB;

    v_slug TEXT;
    v_sabor TEXT;
    v_qtd INT;

    v_preco NUMERIC(10,2);
    v_titulo TEXT;

    v_opcoes TEXT[];

    v_id UUID;
    v_numero INTEGER;

BEGIN

    -- Validar nome.
    IF LENGTH(REGEXP_REPLACE(v_nome, '[^A-Za-zÀ-ÿ]', '', 'g')) < 2 THEN
        RAISE EXCEPTION 'pedido_invalido: nome';
    END IF;


    -- Validar telefone.
    IF LENGTH(REGEXP_REPLACE(v_tel, '\D', '', 'g')) NOT IN (10, 11) THEN
        RAISE EXCEPTION 'pedido_invalido: telefone';
    END IF;


    -- Validar endereço.
    IF LENGTH(v_end) < 8 THEN
        RAISE EXCEPTION 'pedido_invalido: endereco';
    END IF;


    -- Validar pagamento.
    IF v_pag IS NULL OR v_pag NOT IN ('pix', 'debito', 'dinheiro') THEN
        RAISE EXCEPTION 'pedido_invalido: pagamento';
    END IF;


    -- Validar lista de itens.
    IF JSONB_TYPEOF(p->'itens') IS DISTINCT FROM 'array'
       OR JSONB_ARRAY_LENGTH(p->'itens') NOT BETWEEN 1 AND 50 THEN

        RAISE EXCEPTION 'pedido_invalido: itens';

    END IF;


    -- Percorrer os itens do pedido.
    FOR v_item IN
        SELECT *
        FROM JSONB_ARRAY_ELEMENTS(p->'itens')
    LOOP

        v_slug := v_item->>'slug';

        v_sabor := NULLIF(
            BTRIM(COALESCE(v_item->>'sabor', '')),
            ''
        );

        v_qtd := (v_item->>'quantidade')::INT;


        -- Validar quantidade.
        IF v_qtd IS NULL OR v_qtd NOT BETWEEN 1 AND 99 THEN
            RAISE EXCEPTION 'pedido_invalido: quantidade';
        END IF;


        -- Buscar produto ativo.
        SELECT
            pr.preco,
            pr.nome,
            pr.opcoes
        INTO
            v_preco,
            v_titulo,
            v_opcoes
        FROM public.produtos pr
        WHERE pr.slug = v_slug
          AND pr.ativo;


        -- Se não encontrar produto, verificar promoção.
        IF NOT FOUND THEN

            v_opcoes := NULL;

            SELECT
                pm.preco,
                pm.titulo
            INTO
                v_preco,
                v_titulo
            FROM public.promocoes pm
            WHERE pm.slug = v_slug
              AND pm.ativa
            ORDER BY pm.criado_em DESC
            LIMIT 1;


            IF NOT FOUND THEN
                RAISE EXCEPTION 'pedido_invalido: produto';
            END IF;

        END IF;


        -- Validar sabor ou opção escolhida.
        IF v_opcoes IS NOT NULL
           AND (
               v_sabor IS NULL
               OR v_sabor <> ALL(v_opcoes)
           ) THEN

            RAISE EXCEPTION 'pedido_invalido: sabor';

        END IF;


        IF v_opcoes IS NULL AND v_sabor IS NOT NULL THEN
            RAISE EXCEPTION 'pedido_invalido: sabor';
        END IF;


        -- Calcular total.
        v_total := v_total + (v_preco * v_qtd);


        -- Guardar os dados do item.
        v_linhas := v_linhas || JSONB_BUILD_OBJECT(
            'slug', v_slug,
            'nome',
                CASE
                    WHEN v_sabor IS NULL THEN v_titulo
                    ELSE v_titulo || ' - ' || v_sabor
                END,
            'sabor', v_sabor,
            'preco', v_preco,
            'qtd', v_qtd
        );

    END LOOP;


    -- Validar troco.
    IF v_pag <> 'dinheiro' THEN

        v_troco := NULL;

    ELSIF v_troco IS NOT NULL AND v_troco < v_total THEN

        RAISE EXCEPTION 'pedido_invalido: troco';

    END IF;


    -- Inserir pedido.
    INSERT INTO public.pedidos (
        nome,
        telefone,
        endereco,
        complemento,
        pagamento,
        troco_para,
        total,
        observacao
    )
    VALUES (
        v_nome,
        v_tel,
        v_end,
        NULLIF(BTRIM(COALESCE(p->>'complemento', '')), ''),
        v_pag,
        v_troco,
        v_total,
        NULLIF(BTRIM(COALESCE(p->>'observacao', '')), '')
    )
    RETURNING id, numero
    INTO v_id, v_numero;


    -- Inserir itens do pedido.
    INSERT INTO public.itens_pedido (
        pedido_id,
        produto_slug,
        nome,
        sabor,
        preco_unitario,
        quantidade
    )
    SELECT
        v_id,
        x.slug,
        x.nome,
        x.sabor,
        x.preco,
        x.qtd
    FROM JSONB_TO_RECORDSET(v_linhas)
    AS x(
        slug TEXT,
        nome TEXT,
        sabor TEXT,
        preco NUMERIC,
        qtd INT
    );


    -- Retornar número do pedido.
    RETURN v_numero;

END;

$$;


-- Permissões da função.

REVOKE ALL ON FUNCTION public.criar_pedido(JSONB) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.criar_pedido(JSONB)
TO anon, authenticated;


-- ============================================================
-- 6. DADOS INICIAIS (SEED)
-- ============================================================

-- Produtos iniciais.

INSERT INTO public.produtos (
    slug,
    nome,
    descricao,
    preco,
    secao,
    opcoes,
    ordem
)

SELECT
    v.slug,
    v.nome,
    v.descricao,
    v.preco,
    v.secao,
    v.opcoes,
    v.ordem

FROM (
    VALUES
        ('x-salada', 'X-Salada', 'Descrição curta do lanche', 15.00, 'Sanduíches', NULL::TEXT[], 1),
        ('cheddar', 'Cheddar', 'Descrição curta do lanche', 18.00, 'Sanduíches', NULL, 2),
        ('x-burguer', 'X-Burguer', 'Descrição curta do lanche', 14.00, 'Sanduíches', NULL, 3),
        ('big-tower', 'Big Tower', 'Descrição curta do lanche', 22.00, 'Sanduíches', NULL, 4),
        ('x-frango', 'X-Frango', 'Descrição curta do lanche', 16.00, 'Sanduíches', NULL, 5),
        ('batata-frita', 'Batata Frita', 'Descrição curta do lanche', 16.00, 'Porções', NULL, 6),
        ('nuggets', 'Nuggets', 'Porção com 8', 9.00, 'Porções', NULL, 7),
        ('refri', 'Refri', 'Lata', 6.00, 'Bebidas', NULL, 8),
        (
            'sucos',
            'Sucos',
            'Vários sabores',
            8.50,
            'Bebidas',
            ARRAY[
                'Laranja',
                'Limão',
                'Maracujá',
                'Abacaxi',
                'Acerola',
                'Morango'
            ],
            9
        )

) AS v(
    slug,
    nome,
    descricao,
    preco,
    secao,
    opcoes,
    ordem
)

WHERE NOT EXISTS (
    SELECT 1
    FROM public.produtos
);


-- Promoção inicial.

INSERT INTO public.promocoes (
    slug,
    titulo,
    descricao,
    preco,
    preco_original,
    ativa
)

SELECT
    'combo',
    'X-Salada + Batata',
    'Promoção todo dia',
    24.90,
    31.00,
    TRUE

WHERE NOT EXISTS (
    SELECT 1
    FROM public.promocoes
);


-- ============================================================
-- 7. ATUALIZAR SCHEMA DO SUPABASE
-- ============================================================

NOTIFY pgrst, 'reload schema';


-- ============================================================
-- FIM DO ARQUIVO
-- ============================================================
