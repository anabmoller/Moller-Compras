-- ============================================================
-- MODELO DE BANCO DE DADOS - MÓDULO GANADEIRO
-- AM Soluciones / Ypoti
-- ============================================================

-- 1. FAZENDAS (Establecimientos)
CREATE TABLE fazendas (
    id              SERIAL PRIMARY KEY,
    nome            VARCHAR(200) NOT NULL,
    tipo            VARCHAR(20) NOT NULL CHECK (tipo IN ('PROPRIA', 'PROVEDOR', 'FRIGORIFICO')),
    latitude        DECIMAL(10, 6),
    longitude       DECIMAL(10, 6),
    departamento    VARCHAR(100),
    distrito        VARCHAR(100),
    cod_senacsa      BIGINT,
    proprietario    VARCHAR(200),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_fazendas_tipo ON fazendas(tipo);
CREATE INDEX idx_fazendas_nome ON fazendas(nome);

-- 2. PROVEDORES (Empresas fornecedoras)
CREATE TABLE provedores (
    id              SERIAL PRIMARY KEY,
    nome            VARCHAR(300) NOT NULL,
    ruc             VARCHAR(30),
    telefone        VARCHAR(50),
    email           VARCHAR(200),
    endereco        TEXT,
    total_compras   INTEGER DEFAULT 0,
    total_animales  INTEGER DEFAULT 0,
    primeira_compra DATE,
    ultima_compra   DATE,
    ativo           BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_provedores_nome ON provedores(nome);
CREATE INDEX idx_provedores_ruc ON provedores(ruc);

-- 3. COMPRAS
CREATE TABLE compras (
    id              SERIAL PRIMARY KEY,
    fecha           DATE NOT NULL,
    id_provedor     INTEGER REFERENCES provedores(id),
    id_fazenda_origem INTEGER REFERENCES fazendas(id),
    id_fazenda_destino INTEGER REFERENCES fazendas(id),
    categoria       VARCHAR(50) NOT NULL,
    cantidad_animales INTEGER NOT NULL CHECK (cantidad_animales > 0),
    modalidad       VARCHAR(30),
    precio_unitario DECIMAL(15, 2),
    precio_total    DECIMAL(18, 2),
    peso_total_kg   DECIMAL(12, 2),
    peso_promedio_kg DECIMAL(8, 2),
    costo_flete     DECIMAL(15, 2),
    costo_comision  DECIMAL(15, 2),
    intermediario   VARCHAR(200),
    fletero         VARCHAR(200),
    nro_factura     VARCHAR(50),
    departamento    VARCHAR(100),
    distrito        VARCHAR(100),
    pais            VARCHAR(30) DEFAULT 'PARAGUAY',
    sola_marca      VARCHAR(10),
    ano             INTEGER,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_compras_fecha ON compras(fecha);
CREATE INDEX idx_compras_provedor ON compras(id_provedor);
CREATE INDEX idx_compras_destino ON compras(id_fazenda_destino);
CREATE INDEX idx_compras_categoria ON compras(categoria);

-- 4. COTAS (Agrupador de guías)
CREATE TABLE cotas (
    id              SERIAL PRIMARY KEY,
    nro_cota        BIGINT NOT NULL UNIQUE,
    fecha_emision   DATE,
    total_guias     INTEGER DEFAULT 0,
    total_animales  INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_cotas_nro ON cotas(nro_cota);

-- 5. GUIAS
CREATE TABLE guias (
    id              SERIAL PRIMARY KEY,
    nro_guia        BIGINT NOT NULL,
    id_cota         INTEGER REFERENCES cotas(id),
    fecha_emision   DATE,
    finalidad       VARCHAR(30) CHECK (finalidad IN ('ENGORDE', 'FAENA', 'CRIA')),
    id_empresa_origen INTEGER,
    ruc_origen      VARCHAR(30),
    id_establecimiento_origen INTEGER REFERENCES fazendas(id),
    cod_origen      BIGINT,
    id_empresa_destino INTEGER,
    ruc_destino     VARCHAR(30),
    id_establecimiento_destino INTEGER REFERENCES fazendas(id),
    cod_destino     BIGINT,
    categoria       VARCHAR(50),
    cod_categoria   VARCHAR(10),
    cantidad_animales INTEGER NOT NULL CHECK (cantidad_animales > 0),
    id_compra       INTEGER REFERENCES compras(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_guias_nro ON guias(nro_guia);
CREATE INDEX idx_guias_cota ON guias(id_cota);
CREATE INDEX idx_guias_fecha ON guias(fecha_emision);
CREATE INDEX idx_guias_destino ON guias(id_establecimiento_destino);
CREATE INDEX idx_guias_compra ON guias(id_compra);

-- 6. MOVIMENTACOES (Trazabilidad operacional)
CREATE TABLE movimentacoes (
    id              SERIAL PRIMARY KEY,
    tipo            VARCHAR(30) NOT NULL CHECK (tipo IN ('COMPRA', 'VENTA', 'TRASLADO_INTERNO', 'ENTRADA', 'SALIDA')),
    descricao       TEXT,
    fecha_creacion  DATE,
    fecha_completado DATE,
    fecha_embarque  DATE,
    id_fazenda_destino INTEGER REFERENCES fazendas(id),
    cantidad_animales INTEGER,
    categoria       VARCHAR(50),
    responsavel     VARCHAR(200),
    intermediario   VARCHAR(200),
    status          VARCHAR(30),
    prioridad       VARCHAR(20),
    notas           TEXT,
    id_asana        BIGINT,
    id_compra       INTEGER REFERENCES compras(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_movs_tipo ON movimentacoes(tipo);
CREATE INDEX idx_movs_fecha ON movimentacoes(fecha_creacion);
CREATE INDEX idx_movs_destino ON movimentacoes(id_fazenda_destino);

-- 7. ANIMAIS (Rastreabilidad individual - futura)
CREATE TABLE animais (
    id              SERIAL PRIMARY KEY,
    codigo_brinco   VARCHAR(30),
    categoria       VARCHAR(50),
    sexo            VARCHAR(10),
    raca            VARCHAR(50),
    id_fazenda_atual INTEGER REFERENCES fazendas(id),
    id_compra_entrada INTEGER REFERENCES compras(id),
    id_guia_entrada INTEGER REFERENCES guias(id),
    fecha_entrada   DATE,
    peso_entrada_kg DECIMAL(8, 2),
    id_guia_salida  INTEGER REFERENCES guias(id),
    fecha_salida    DATE,
    motivo_salida   VARCHAR(50),
    ativo           BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_animais_fazenda ON animais(id_fazenda_atual);
CREATE INDEX idx_animais_compra ON animais(id_compra_entrada);
CREATE INDEX idx_animais_brinco ON animais(codigo_brinco);

-- 8. VIEWS ÚTEIS PARA O APP

-- View: resumo por fazenda
CREATE VIEW vw_resumo_fazendas AS
SELECT
    f.id, f.nome, f.tipo, f.latitude, f.longitude,
    COALESCE(SUM(c.cantidad_animales), 0) AS total_animales_comprados,
    COUNT(DISTINCT c.id) AS total_compras,
    COUNT(DISTINCT c.id_provedor) AS provedores_distintos
FROM fazendas f
LEFT JOIN compras c ON c.id_fazenda_destino = f.id
GROUP BY f.id, f.nome, f.tipo, f.latitude, f.longitude;

-- View: resumo por provedor
CREATE VIEW vw_resumo_provedores AS
SELECT
    p.id, p.nome, p.ruc,
    COUNT(c.id) AS n_compras,
    SUM(c.cantidad_animales) AS total_animales,
    MIN(c.fecha) AS primera_compra,
    MAX(c.fecha) AS ultima_compra,
    AVG(c.cantidad_animales) AS avg_animales_por_compra
FROM provedores p
LEFT JOIN compras c ON c.id_provedor = p.id
GROUP BY p.id, p.nome, p.ruc;

-- View: rastreabilidad completa
CREATE VIEW vw_trazabilidad AS
SELECT
    g.nro_guia, g.fecha_emision, g.finalidad, g.categoria, g.cantidad_animales,
    fo.nome AS fazenda_origen, fd.nome AS fazenda_destino,
    p.nome AS empresa_origen,
    co.nro_cota
FROM guias g
LEFT JOIN fazendas fo ON fo.id = g.id_establecimiento_origen
LEFT JOIN fazendas fd ON fd.id = g.id_establecimiento_destino
LEFT JOIN provedores p ON p.id = g.id_empresa_origen
LEFT JOIN cotas co ON co.id = g.id_cota;
