# Relatório do Pipeline de Dados — Módulo Ganadeiro

## 1. Resumo Executivo

Pipeline completo de ETL (Extract, Transform, Load) para preparação dos dados do módulo ganadeiro do aplicativo AM Soluciones. Três bases de dados foram processadas, consolidadas e modeladas para uso no app.

**Bases processadas:**

| Base | Registros | Após Limpeza | Função |
|------|-----------|-------------|--------|
| COMPRAS DE DESMAMANTES | 2.655 | 2.547 | Histórico completo de compras de gado (2017–2023) |
| GUIAS ACTUALIZADAS | 2.452 | 2.448 | Guias de traslado/venda emitidas pelo SENACSA |
| TRAZABILIDAD | 504 | 259 | Tasks operacionais do Asana (embarques, guias, movimentações) |

**Totais:**
- 192.502 animais em 2.547 compras (COMPRAS)
- 114.019 animais em 2.448 guias (GUIAS)
- 259 movimentações operacionais (TRAZABILIDAD)

---

## 2. Inspeção e Relação entre Bases

### COMPRAS DE DESMAMANTES
Base principal de transações. Cada linha = uma compra de lote de animais. Contém dados financeiros (preço, frete, comissão), logísticos (peso, flete), e geográficos (departamento, distrito). Período: 2017–2023.

### GUIAS ACTUALIZADAS
Dados oficiais do SENACSA (sistema SIAP). Cada guia = autorização de movimentação de animais entre estabelecimentos. Contém coordenadas GPS de origem/destino, números de cota, empresa, RUC. Período: 2023–2026.

### TRAZABILIDAD
Export do Asana com tasks operacionais: solicitações de guia, programação de embarques, entradas de compras. Funciona como log operacional que complementa as outras bases.

### Relações identificadas:
- **Fazenda destino** conecta as 3 bases (YPOTI, LUSIPAR, CIELO AZUL, etc.)
- **Número de guia/cota** na GUIAS se relaciona operacionalmente com TRAZABILIDAD
- **Provedor** em COMPRAS = **empresa_origen** em GUIAS (via nome/RUC)
- **Categoria animal** presente em COMPRAS e GUIAS com nomenclaturas diferentes

---

## 3. Regras de Limpeza Aplicadas

| Regra | Registros Afetados |
|-------|-------------------|
| Remoção de colunas vazias (COMPRAS) | 42 colunas |
| Padronização PROPRIETARIO (5 variantes → 1) | ~857 registros |
| Padronização CATEGORIA (14 → 10 categorias) | ~435 registros |
| Padronização nomes de destino (trailing spaces, typos) | ~22 registros |
| Parse de datas COMPRAS (DD/MM/YYYY) | 0 erros |
| Parse de valores numéricos formato PY (1.234.567,89) | vários campos |
| Remoção de duplicatas COMPRAS | 108 registros |
| Correção finalidad GUIAS (valor era coordenada) | 1 registro |
| Padronização finalidad (CRA → CRIA) | 22 registros |
| Coordenadas fora do range Paraguai | 3 registros |
| Remoção de duplicatas GUIAS | 4 registros |
| Filtro seções relevantes TRAZABILIDAD | 245 registros removidos |

---

## 4. Modelo de Dados Final

### Entidades

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   FAZENDAS   │     │  PROVEDORES  │     │    COTAS     │
│──────────────│     │──────────────│     │──────────────│
│ id (PK)      │     │ id (PK)      │     │ id (PK)      │
│ nome         │     │ nome         │     │ nro_cota     │
│ tipo         │     │ ruc          │     │ total_guias  │
│ lat/lng      │     │ total_compras│     │ total_animais│
│ departamento │     │ ativo        │     └──────┬───────┘
└──────┬───────┘     └──────┬───────┘            │
       │                    │                    │
       │    ┌───────────────┴────────┐     ┌─────┴────────┐
       ├────┤      COMPRAS           │     │    GUIAS      │
       │    │────────────────────────│     │──────────────│
       │    │ id (PK)               │     │ id (PK)      │
       │    │ fecha                 │     │ nro_guia     │
       │    │ id_provedor (FK)      │     │ id_cota (FK) │
       │    │ id_fazenda_destino(FK)│     │ id_est_orig  │
       │    │ categoria             │     │ id_est_dest  │
       │    │ cantidad_animales     │     │ categoria    │
       │    │ precio/peso/flete     │     │ cantidad     │
       │    └───────────┬───────────┘     │ id_compra(FK)│
       │                │                 └──────────────┘
       │    ┌───────────┴───────────┐
       ├────┤   MOVIMENTACOES       │
       │    │───────────────────────│
       │    │ id (PK)              │
       │    │ tipo                 │
       │    │ id_fazenda_destino   │
       │    │ cantidad_animales    │
       │    │ id_compra (FK)       │
       │    └───────────────────────┘
       │
       │    ┌───────────────────────┐
       └────┤      ANIMAIS          │
            │───────────────────────│
            │ id (PK)              │
            │ codigo_brinco        │
            │ id_fazenda_atual(FK) │
            │ id_compra_entrada(FK)│
            │ id_guia_entrada (FK) │
            └───────────────────────┘
```

### Decisões de Modelagem

1. **Fazendas** unifica estabelecimentos próprios e de provedores. O campo `tipo` distingue (PROPRIA/PROVEDOR/FRIGORIFICO).
2. **Provedores** são entidades separadas de fazendas. Um provedor pode ter múltiplas fazendas de origem.
3. **Cotas** agrupam guias. Cada cota pode ter múltiplas guias, e cada guia pertence a uma cota.
4. **Guias** linkam opcionalmente a uma compra (quando a guia foi gerada para uma compra específica).
5. **Animais** é uma tabela para rastreabilidade individual futura. Atualmente os dados são por lote.
6. **Movimentacoes** registra o log operacional (Asana) com link para compras quando aplicável.

---

## 5. Insights Analíticos

### Volume de Compras
- **192.502 animais** em 2.547 compras (2017–2023)
- Média de **75,6 animais/compra**, mediana de 54
- Categoria dominante: DESMAMANTES MACHOS (87% do volume)

### Top 5 Provedores (por volume)
1. BPECUARIA S.A. — 59 compras
2. GANADERA RP S.A. — 35 compras
3. GANADERA TROPICAL S.A. — 29 compras
4. SAN JORGE AGROPECUARIA S.A. — 23 compras
5. JUSTINO COLMAN MERCADO — 23 compras

### Distribuição por Destino
| Destino | Compras | Animais |
|---------|---------|---------|
| LUSIPAR | 1.069 | ~80.000 |
| YPOTI | 813 | ~60.000 |
| CIELO AZUL | 184 | ~13.000 |
| YBY PORÃ | 175 | ~12.000 |
| SANTA MARIA | 152 | ~10.000 |

### Geolocalização
- 228 fazendas georreferenciadas (212 origem + 16 destino)
- Concentração em: Concepción, San Pedro, Amambay, Pte. Hayes
- 63 fazendas sem coordenadas (provedores menores)

### Inconsistências Detectadas
- 112 guias com números duplicados (mesmo nro_guia em diferentes cotas)
- 112 cotas com registros duplicados
- PROPRIETARIO tinha 5 grafias diferentes (todas = RURAL BIOENERGIA S.A.)
- CATEGORIA tinha 14 variantes (consolidadas em 10)

---

## 6. Arquivos Entregues

```
ganado_pipeline/
├── data/
│   ├── fazendas.csv              (280 fazendas)
│   ├── provedores.csv            (1.324 provedores)
│   ├── compras.csv               (2.547 compras normalizadas)
│   ├── guias.csv                 (2.448 guias normalizadas)
│   ├── movimentacoes.csv         (259 movimentações)
│   ├── base_consolidada_compras.csv (base completa limpa)
│   ├── geo_fazendas_origen.csv   (212 fazendas com coords)
│   ├── geo_fazendas_destino.csv  (16 destinos com coords)
│   ├── analytics.json            (análises automáticas)
│   └── cleaning_log.json         (log de limpeza)
├── geo/
│   ├── fazendas.geojson          (228 features)
│   └── mapa_fazendas.html        (mapa interativo Leaflet)
├── scripts/
│   ├── etl_pipeline.py           (pipeline completo)
│   └── database_model.sql        (modelo SQL com views)
└── docs/
    └── RELATORIO_PIPELINE.md     (este documento)
```

---

## 7. Sugestões para o Módulo Ganadeiro

1. **Dashboard de Compras**: gráfico temporal de volume/preço por ano, filtros por destino e categoria.
2. **Mapa de Provedores**: usar o GeoJSON para visualizar de onde vêm os animais, com filtros dinâmicos.
3. **Alerta de Guias Duplicadas**: checagem automática ao registrar nova guia.
4. **Rastreabilidade por Lote**: cada compra gera um "lote" rastreável até a saída (venda/faena).
5. **Ranking de Provedores**: score baseado em frequência, volume, e custos médios.
6. **Módulo de Peso/Ganho**: registrar peso na entrada e acompanhar ganho diário por lote/fazenda.
7. **Integração SENACSA**: automatizar importação de guias (já temos o formato).
8. **Alertas de Embarque**: notificações baseadas nas datas previstas de TRAZABILIDAD.
