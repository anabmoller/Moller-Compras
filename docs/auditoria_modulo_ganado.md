# AUDITORIA MÓDULO GANADO — 2026-03-03

**Autor:** Claude Code (agente de código)
**Solicitante:** Cowork (agente de planejamento)
**Branch:** `test`
**Supabase TEST:** `ebvethperccycxpaksrr` — Todas tabelas ganado ❌ (nenhuma existe)

---

## 1. INVENTÁRIO DE ARQUIVOS

### 1.1 Arquivos no Projeto (`/Users/ana/Desktop/ClaudeCode/`)

| # | Arquivo | Tipo | Linhas | Tabelas que usa |
|---|---------|------|--------|-----------------|
| 1 | `supabase/migrations/015_ganado_module.sql` | Migration | 441 | categorias_animales, movimientos_ganado, detalle_movimiento_categorias, movimiento_divergencias, movimiento_archivos, movimiento_estados_log, pesajes_ganado + extensions em suppliers e companies |
| 2 | `supabase/migrations/016_ganado_enhancements.sql` | Migration | 256 | comisionistas (NOVA), animales_individuales (NOVA) + ADD COLUMNs em categorias_animales, movimientos_ganado, pesajes_ganado, movimiento_divergencias, movimiento_archivos |
| 3 | `supabase/functions/ganado-mutations/index.ts` | Edge Function | 589 | movimientos_ganado (WRITE), detalle_movimiento_categorias (WRITE), movimiento_divergencias (WRITE), movimiento_archivos (WRITE), movimiento_estados_log (WRITE), pesajes_ganado (WRITE) |
| 4 | `src/constants/ganado.js` | Data Layer | 384 | categorias_animales (READ), suppliers (READ), companies (READ), movimientos_ganado (READ), detalle_movimiento_categorias (READ), movimiento_divergencias (READ), movimiento_archivos (READ), movimiento_estados_log (READ), pesajes_ganado (READ) |
| 5 | `src/components/ganado/MovimientosScreen.jsx` | UI - Lista | — | movimientos_ganado (READ via ganado.js) |
| 6 | `src/components/ganado/MovimientoCard.jsx` | UI - Card | — | movimientos_ganado (READ via ganado.js) |
| 7 | `src/components/ganado/MovimientoDetail.jsx` | UI - Detalhe | — | Todas tabelas (READ via ganado.js) |
| 8 | `src/components/ganado/NuevoMovimientoForm.jsx` | UI - Form | — | movimientos_ganado (WRITE via EF), detalle_movimiento_categorias (WRITE via EF) |
| 9 | `scripts/ganado/seed-test-data.sql` | Seed | 155 | movimientos_ganado, detalle_movimiento_categorias |
| 10 | `scripts/ganado/validate-schema.sql` | Validação | — | information_schema queries |
| 11 | `supabase/seeds/002_proveedores_reales.sql` | Seed | — | suppliers (50 registros) |
| 12 | `supabase/seeds/003_establecimientos_reales.sql` | Seed | — | establishments (~41 registros) |
| 13 | `supabase/seeds/004_movimientos_historicos.sql` | Seed | — | movimientos_ganado (20 movimentos históricos) |

### 1.2 Arquivos do Cowork (`/Users/ana/Desktop/Tudo boi/`)

| # | Arquivo | Tipo | Tamanho | Descrição |
|---|---------|------|---------|-----------|
| 14 | `00_criar_tabelas_ganado.sql` | Schema SQL | 18K (473 linhas) | Schema completo do Cowork (9 tabelas) |
| 15 | `files (3)/01_fase1-3_estrutura_base.sql` | Seed | 5.9K | Categorias extras + 50 proveedores + comisionistas |
| 16 | `files (3)/02_fase4-6_movimientos_pesajes.sql` | Seed | 10K | 5 movimentos + detalhes + pesajes de dados reais |
| 17 | `files (3)/03_fase7_animales_individuales.sql` | Schema+Seed | 8K | Tabela animales_individuales + views + função GDM |
| 18 | `files (3)/import_animales.sql` | Importação | **5.9MB** | SQL de importação massiva (~37.544 animais) |
| 19 | `files (3)/plano-incremental-ganado.md` | Documentação | 16K | Plano incremental em 8 fases |
| 20 | `Especificacao_Modulo_Gado_MVP.txt` | Especificação | 5K | Requisitos funcionais do MVP |
| 21 | `Arquitetura_Tecnica_Modulo_Gado_MVP.txt` | Especificação | 5.2K | Arquitetura técnica (modelo de dados) |
| 22 | `prompt_claude_code_auditoria_ganado.md` | Prompt | 5.4K | Este pedido de auditoria |

### 1.3 Arquivos Mencionados Mas NÃO ENCONTRADOS

| Arquivo | Mencionado em | Status |
|---------|---------------|--------|
| `import_animals.py` | plano-incremental-ganado.md | ❌ Não existe (script Python descrito no plano mas não criado) |

### 1.4 Detalhamento por Arquivo Crítico

#### ARQUIVO: `supabase/migrations/015_ganado_module.sql` (linhas 1-441)
- **Tipo**: Migration SQL
- **Tabelas que CRIA**: categorias_animales (L16-26), movimientos_ganado (L39-96), movimiento_divergencias (L133-147), movimiento_archivos (L152-163), detalle_movimiento_categorias (L168-184), movimiento_estados_log (L222-231), pesajes_ganado (L238-298)
- **Tabelas que ESTENDE**: suppliers (L8-9: `is_ganadero`, `senacsa_code_proveedor`), companies (L12-13: `is_frigorifico`, `senacsa_code_empresa`)
- **Triggers que CRIA**: `generate_movimiento_number` (L99-122), `sync_movimiento_totals` (L190-219), `update_pesajes_updated_at` (L307-319), `update_movimientos_updated_at` (L322-334), 5x `audit_trigger_func` (L337-367, L434-440)
- **Seeds**: 6 categorias SENACSA (L29-36)
- **RLS**: 17 policies (L369-431) — padrão SELECT→authenticated, INSERT/UPDATE/DELETE→service_role
- **Dependências**: tabelas `profiles`, `establishments`, `companies`, `suppliers` devem existir; função `audit_trigger_func()` deve existir

#### ARQUIVO: `supabase/functions/ganado-mutations/index.ts` (linhas 1-589)
- **Tipo**: Deno Edge Function (service_role)
- **14 Ações**: create (L61-121), update (L126-175), add-categories (L180-218), update-category (L223-247), remove-category (L252-268), validate (L273-308), advance-status (L313-346), add-divergence (L351-369), resolve-divergence (L374-390), add-attachment (L395-414), anular (L419-456), add-pesaje (L461-516), update-pesaje (L521-553), delete-pesaje (L559-576)
- **Colunas que ESCREVE em `movimientos_ganado`**: `tipo_operacion`, `finalidad`, `establecimiento_origen_id`, `empresa_destino_id`, `establecimiento_destino_id`, `destino_nombre`, `cantidad_total`, `peso_total_kg`, `nro_guia`, `nro_cota`, `fecha_emision`, `precio_por_kg`, `precio_total`, `moneda`, `observaciones`, `estado`, `created_by`, `created_by_name`, `validated_by`, `validated_by_name`, `validated_at`
- **Colunas que ESCREVE em `detalle_movimiento_categorias`**: `movimiento_id`, `categoria_id`, `cantidad`, `peso_kg`, `precio_por_kg`, `precio_subtotal`, `observaciones`
- **Colunas que ESCREVE em `pesajes_ganado`**: `movimiento_id`, `detalle_categoria_id`, `fecha_pesaje`, `hora_pesaje`, `cantidad_pesada`, `peso_bruto_kg`, `peso_tara_kg`, `nro_tropa`, `nro_lote`, `categoria_id`, `tipo_pesaje`, `cantidad_esperada`, `peso_esperado_kg`, `balanza_id`, `balanza_nombre`, `ticket_nro`, `conforme`, `observaciones`, `pesado_por`, `pesado_por_nombre`, `verificado_por`, `verificado_por_nombre`
- **Colunas que ESCREVE em `movimiento_divergencias`**: `movimiento_id`, `tipo`, `descripcion`, `cantidad_diferencia`, `peso_diferencia_kg`, `reportado_por`, `reportado_por_nombre`, `resuelto`, `resolucion`
- **Colunas que ESCREVE em `movimiento_archivos`**: `movimiento_id`, `tipo`, `nombre`, `storage_path`, `mime_type`, `size_bytes`, `uploaded_by`, `uploaded_by_name`
- **Colunas que ESCREVE em `movimiento_estados_log`**: `movimiento_id`, `estado_anterior`, `estado_nuevo`, `comentario`, `changed_by`, `changed_by_name`
- **Status flow hardcoded** (L19-26): `borrador → pendiente_validacion → validado → en_transito → recibido → cerrado` + `anulado`
- **Dependências**: `../_shared/cors.ts`, `../_shared/auth.ts`, `../_shared/sanitize.ts`

#### ARQUIVO: `src/constants/ganado.js` (linhas 1-384)
- **Tipo**: Data Layer (reads via Supabase anon client, writes via Edge Function)
- **Colunas que LÊ de `categorias_animales`**: `id`, `codigo`, `nombre`, `descripcion`, `sexo`, `edad_min_meses`, `edad_max_meses` — filtrado por `.eq("active", true)` (L54)
- **Colunas que LÊ de `suppliers`**: `id`, `name`, `ruc`, `senacsa_code_proveedor`, `phone`, `email` — filtrado por `.eq("is_ganadero", true)` (L55)
- **Colunas que LÊ de `companies`**: `id`, `name`, `ruc`, `senacsa_code_empresa` — filtrado por `.eq("is_frigorifico", true)` (L56)
- **`transformMovimiento()` (L133-205)**: Lê `movimiento_number`, `tipo_operacion`, `finalidad`, `establecimiento_origen_id`, `empresa_destino_id`, `establecimiento_destino_id`, `destino_nombre`, `cantidad_total`, `peso_total_kg`, `nro_guia`, `nro_cota`, `fecha_emision`, `precio_por_kg`, `precio_total`, `moneda`, `estado`, `marca_verificada`, `senacsa_verificado`, `guia_conforme`, `observaciones`, `created_by`, `created_by_name`, `validated_by_name`, `validated_at`, `created_at`, `updated_at`
- **`transformPesaje()` (L101-131)**: Lê `id`, `movimiento_id`, `detalle_categoria_id`, `fecha_pesaje`, `hora_pesaje`, `cantidad_pesada`, `peso_bruto_kg`, `peso_tara_kg`, `peso_neto_kg`, `peso_promedio_kg`, `nro_tropa`, `nro_lote`, `categoria_id`, `tipo_pesaje`, `cantidad_esperada`, `peso_esperado_kg`, `diferencia_cantidad`, `diferencia_peso_kg`, `balanza_id`, `balanza_nombre`, `ticket_nro`, `conforme`, `observaciones`, `pesado_por_nombre`, `verificado_por_nombre`, `created_at`, `updated_at`
- **De divergencias**: `id`, `tipo`, `descripcion`, `cantidad_diferencia`, `peso_diferencia_kg`, `resolucion`, `resuelto`, `reportado_por_nombre`, `created_at`
- **De archivos**: `id`, `tipo`, `nombre`, `storage_path`, `mime_type`, `size_bytes`, `uploaded_by_name`, `created_at`
- **De estados_log**: `id`, `estado_anterior`, `estado_nuevo`, `comentario`, `changed_by_name`, `created_at`

#### ARQUIVO: `Tudo boi/00_criar_tabelas_ganado.sql` (473 linhas)
- **Tipo**: Schema SQL (Cowork)
- **Tabelas que CRIA**: categorias_animales, comisionistas, movimientos_ganado, detalle_movimiento_categorias, movimiento_estados_log, pesajes_ganado, movimiento_divergencias, movimiento_archivos, animales_individuales
- **NOTA**: Usa nomes de colunas DIFERENTES do Edge Function e Frontend (ver Seção 2)

---

## 2. MAPEAMENTO DE DIVERGÊNCIAS

### Fontes comparadas:
- **015**: `supabase/migrations/015_ganado_module.sql` (441 linhas)
- **CW**: `Tudo boi/00_criar_tabelas_ganado.sql` (473 linhas)
- **SPEC**: `Especificacao_Modulo_Gado_MVP.txt` + `Arquitetura_Tecnica_Modulo_Gado_MVP.txt`

### 2.1 `categorias_animales`

| Coluna | Migration 015 (L16-26) | SQL Cowork | Especificação | Status |
|--------|------------------------|------------|---------------|--------|
| `active` | `BOOLEAN DEFAULT true` (L24) | ❌ não existe (usa `activo`) | N/A | ❌ CRÍTICO — ganado.js L54: `.eq("active", true)` |
| `activo` | ❌ não existe | `BOOLEAN DEFAULT true` | N/A | ⚠️ CONFLITO — nome em espanhol |
| `sexo` CHECK | `'macho','hembra','mixto'` (L21) | `'macho','hembra','ambos'` | N/A | ⚠️ CONFLITO — seed 015 usa 'mixto' para TER |
| `peso_min_kg` | ❌ não existe | `DECIMAL(10,2)` | N/A | 🆕 NOVO — útil do Cowork |
| `peso_max_kg` | ❌ não existe | `DECIMAL(10,2)` | N/A | 🆕 NOVO — útil do Cowork |
| `updated_at` | ❌ não existe | `TIMESTAMPTZ` | N/A | 🆕 NOVO — útil do Cowork |
| Seeds | 6 categorias (L29-36) | 10 categorias | N/A | 🆕 NOVO — Cowork tem +4 extras |

### 2.2 `suppliers` extensions

| Coluna | Migration 015 (L8-9) | SQL Cowork | Especificação | Status |
|--------|----------------------|------------|---------------|--------|
| `is_ganadero` | `BOOLEAN DEFAULT false` (L8) | ❌ NÃO ADICIONA | N/A (suppliers pré-existente) | ❌ CRÍTICO — ganado.js L55: `.eq("is_ganadero", true)` |
| `senacsa_code_proveedor` | `TEXT` (L9) | ❌ NÃO ADICIONA | N/A | ❌ CRÍTICO — ganado.js L73 lê |

### 2.3 `companies` extensions

| Coluna | Migration 015 (L12-13) | SQL Cowork | Especificação | Status |
|--------|------------------------|------------|---------------|--------|
| `is_frigorifico` | `BOOLEAN DEFAULT false` (L12) | ❌ NÃO ADICIONA | N/A | ❌ CRÍTICO — ganado.js L56: `.eq("is_frigorifico", true)` |
| `senacsa_code_empresa` | `TEXT` (L13) | ❌ NÃO ADICIONA | N/A | ❌ CRÍTICO — ganado.js L82 lê |

### 2.4 `movimientos_ganado` (MAIS DIVERGÊNCIAS)

| Coluna | Migration 015 | SQL Cowork | Especificação | Status |
|--------|---------------|------------|---------------|--------|
| `establecimiento_origen_id` | `UUID FK` (L58) | ❌ usa `establishment_origen_id` | "origin_farm_id" | ❌ CRÍTICO — EF L75 escreve, ganado.js L139 lê |
| `empresa_destino_id` | `UUID FK companies` (L61) | ❌ usa `company_id` | "destination_farm_id" | ❌ CRÍTICO — EF L76, ganado.js L140 |
| `establecimiento_destino_id` | `UUID FK` (L62) | ❌ usa `establishment_destino_id` | N/A | ❌ CRÍTICO — EF L77, ganado.js L141 |
| `destino_nombre` | `TEXT` (L63) | ❌ não existe | N/A | ❌ CRÍTICO — EF L78, ganado.js L142 |
| `nro_guia` | `TEXT` (L44) | ❌ usa `guia_numero` | "guide_number" | ❌ CRÍTICO — EF L81, ganado.js L163 |
| `nro_cota` | `TEXT` (L45) | ❌ não existe | "cota_number" | ❌ CRÍTICO — EF L82, ganado.js L164 |
| `fecha_emision` | `DATE NOT NULL` (L46) | ❌ usa `fecha_operacion` | "issue_date" | ❌ CRÍTICO — EF L83, ganado.js L159 |
| `moneda` | `TEXT CHECK(PYG,USD,BRL)` (L72) | ❌ não existe | N/A | ❌ CRÍTICO — EF L86, ganado.js L162 |
| `marca_verificada` | `BOOLEAN` (L81) | ❌ não existe | N/A | ❌ CRÍTICO — ganado.js L164 lê |
| `senacsa_verificado` | `BOOLEAN` (L82) | ❌ não existe | N/A | ❌ CRÍTICO — ganado.js L165 lê |
| `guia_conforme` | `BOOLEAN` (L83) | ❌ não existe | N/A | ❌ CRÍTICO — ganado.js L166 lê |
| `validated_by` | `UUID FK` (L91) | ❌ não existe | "approved_by" | ❌ CRÍTICO — EF L296 escreve |
| `validated_by_name` | `TEXT` (L92) | ❌ não existe | N/A | ❌ CRÍTICO — EF L297 escreve |
| `validated_at` | `TIMESTAMPTZ` (L93) | ❌ não existe | "approved_at" | ❌ CRÍTICO — EF L298 escreve |
| `tipo_operacion` CHECK | `compra,venta,transferencia_interna,consignacion` (L53-54) | `compra,venta,transferencia,inventario` | "PURCHASE,INTERNAL_TRANSFER,SALE" | ❌ CRÍTICO — EF L73 escreve `transferencia_interna` → CW rejeita |
| `finalidad` CHECK | `faena,cria,engorde,remate,exposicion,transito,cambio_titular,otro` (L49-52) | `engorde,cria,faena,exportacion,recria` | N/A | ❌ CRÍTICO — EF L74 escreve `remate`,`exposicion` → CW rejeita |
| `estado` CHECK | `...,anulado` (L75-78) | `...,cancelado` | "SOLICITADA...NÃO_CONFORME" | ❌ CRÍTICO — EF L445 escreve `anulado` → CW rejeita |
| `supplier_id` | ❌ não existe | `UUID FK suppliers` | N/A | 🆕 NOVO — útil do Cowork |
| `fecha_operacion` | ❌ não existe | `DATE` | N/A | 🆕 NOVO — útil do Cowork |
| `fecha_transito_inicio` | ❌ não existe | `DATE` | N/A | 🆕 NOVO — útil do Cowork |
| `fecha_transito_fin` | ❌ não existe | `DATE` | N/A | 🆕 NOVO — útil do Cowork |
| `fecha_recepcion` | ❌ não existe | `DATE` | N/A | 🆕 NOVO — útil do Cowork |
| `guia_senacsa` | ❌ não existe | `VARCHAR` | N/A | 🆕 NOVO — útil do Cowork |
| `precio_por_cabeza` | ❌ não existe | `DECIMAL` | N/A | 🆕 NOVO — útil do Cowork |
| `peso_promedio_kg` | ❌ não existe | `DECIMAL` | N/A | 🆕 NOVO — útil do Cowork |
| `comisionista_id` | ❌ não existe | ❌ não existe | N/A | 🆕 NOVO — adicionado no 016 |

### 2.5 `detalle_movimiento_categorias`

| Coluna | Migration 015 (L168-184) | SQL Cowork | Especificação | Status |
|--------|--------------------------|------------|---------------|--------|
| `peso_kg` | `NUMERIC(10,2)` (L173) | ❌ usa `peso_total_kg` | N/A | ❌ CRÍTICO — EF L103, ganado.js L152 |
| `peso_promedio_kg` | `GENERATED ALWAYS AS (peso_kg/cantidad)` (L174-178) | `DECIMAL(10,2)` (manual) | N/A | ⚠️ CONFLITO — 015 auto-calcula (melhor) |
| `precio_por_kg` | `NUMERIC(12,2)` (L179) | ❌ usa `precio_unitario` | N/A | ❌ CRÍTICO — EF L104, ganado.js L153 |
| `precio_subtotal` | `NUMERIC(14,2)` (L180) | ❌ não existe | N/A | ❌ CRÍTICO — EF L105, ganado.js L154 |

### 2.6 `movimiento_estados_log`

| Coluna | Migration 015 (L222-231) | SQL Cowork | Especificação | Status |
|--------|--------------------------|------------|---------------|--------|
| `comentario` | `TEXT` (L227) | ❌ usa `observaciones` | N/A | ❌ CRÍTICO — EF L41 escreve, ganado.js L199 lê |

### 2.7 `pesajes_ganado` (MAIOR NÚMERO DE DIVERGÊNCIAS — 20+ colunas)

| Coluna | Migration 015 (L238-298) | SQL Cowork | Especificação | Status |
|--------|--------------------------|------------|---------------|--------|
| `detalle_categoria_id` | `UUID FK` (L243) | ❌ não existe | N/A | ❌ CRÍTICO — EF L486 escreve |
| `hora_pesaje` | `TIME` (L247) | ❌ não existe | N/A | ❌ CRÍTICO — EF L488 escreve |
| `peso_bruto_kg` | `NUMERIC NOT NULL` (L249) | ❌ usa `peso_total_kg` | "peso bascula" | ❌ CRÍTICO — EF L490 escreve, ganado.js L109 lê |
| `peso_tara_kg` | `NUMERIC DEFAULT 0` (L250) | ❌ não existe | N/A | ❌ CRÍTICO — EF L491 escreve |
| `peso_neto_kg` | `GENERATED (bruto-tara)` (L251) | ❌ calculado diferente | N/A | ❌ CRÍTICO — ganado.js L111 lê |
| `peso_promedio_kg` | `GENERATED (neto/cantidad)` (L252-256) | trigger-based | N/A | ⚠️ CONFLITO — semânticas diferentes |
| `nro_tropa` | `TEXT` (L259) | ❌ não existe | N/A | ❌ CRÍTICO — EF L492 escreve |
| `nro_lote` | `TEXT` (L260) | ❌ não existe | N/A | ❌ CRÍTICO — EF L493 escreve |
| `categoria_id` | `UUID FK` (L263) | ❌ não existe | N/A | ❌ CRÍTICO — EF L494 escreve |
| `tipo_pesaje` CHECK | `recepcion,despacho,intermedio,verificacion` (L264-266) | `entrada,recepcion,intermedio,salida,control` | N/A | ❌ CRÍTICO — EF L495 escreve `despacho`,`verificacion` → CW rejeita |
| `cantidad_esperada` | `INTEGER` (L269) | ❌ não existe | "esperado vs real" | ❌ CRÍTICO — EF L497 escreve |
| `peso_esperado_kg` | `NUMERIC` (L270) | ❌ não existe | "esperado vs real" | ❌ CRÍTICO — EF L498 escreve |
| `diferencia_cantidad` | `GENERATED` (L271-275) | ❌ não existe | "diferença" | ❌ CRÍTICO — ganado.js L119 lê |
| `diferencia_peso_kg` | `GENERATED` (L276-280) | ❌ não existe | "diferença" | ❌ CRÍTICO — ganado.js L120 lê |
| `balanza_id` | `TEXT` (L283) | ❌ não existe | "bascula" | ❌ CRÍTICO — EF L499 escreve |
| `balanza_nombre` | `TEXT` (L284) | ❌ não existe | N/A | ❌ CRÍTICO — EF L500 escreve |
| `ticket_nro` | `TEXT` (L285) | ❌ não existe | N/A | ❌ CRÍTICO — EF L501 escreve |
| `conforme` | `BOOLEAN` (L288) | ❌ não existe | N/A | ❌ CRÍTICO — EF L502 escreve |
| `pesado_por` | `UUID FK` (L292) | ❌ usa `created_by` | N/A | ❌ CRÍTICO — EF L504 escreve |
| `pesado_por_nombre` | `TEXT` (L293) | ❌ usa `created_by_name` | N/A | ❌ CRÍTICO — EF L505 escreve |
| `verificado_por` | `UUID FK` (L294) | ❌ não existe | N/A | ❌ CRÍTICO — EF L539 escreve |
| `verificado_por_nombre` | `TEXT` (L295) | ❌ não existe | N/A | ❌ CRÍTICO — EF L540 escreve |
| `desbaste_porcentaje` | ❌ não existe | `DECIMAL(5,2)` | N/A | 🆕 NOVO — útil do Cowork |

### 2.8 `movimiento_divergencias`

| Coluna | Migration 015 (L133-147) | SQL Cowork | Especificação | Status |
|--------|--------------------------|------------|---------------|--------|
| `tipo` | `TEXT CHECK(cantidad,peso,categoria,marca,documento,otro)` (L136-138) | ❌ usa `tipo_divergencia` | "type" | ❌ CRÍTICO — EF L357, ganado.js L175 |
| `descripcion` | `TEXT NOT NULL` (L139) | ❌ não existe | "description" | ❌ CRÍTICO — EF L358, ganado.js L177 |
| `cantidad_diferencia` | `INTEGER` (L140) | ❌ não existe | "diferença" | ❌ CRÍTICO — EF L359, ganado.js L178 |
| `peso_diferencia_kg` | `NUMERIC(8,2)` (L141) | ❌ não existe | N/A | ❌ CRÍTICO — EF L360, ganado.js L179 |
| `resolucion` | `TEXT` (L142) | ❌ não existe | N/A | ❌ CRÍTICO — EF L382, ganado.js L180 |
| `resuelto` | `BOOLEAN` (L143) | ❌ não existe | "status (RESOLVED)" | ❌ CRÍTICO — EF L381, ganado.js L181 |
| `reportado_por` | `UUID FK` (L144) | ❌ usa `created_by` | N/A | ❌ CRÍTICO — EF L361 |
| `reportado_por_nombre` | `TEXT` (L145) | ❌ usa `created_by_name` | N/A | ❌ CRÍTICO — ganado.js L182 |
| `valor_esperado` | ❌ não existe | `VARCHAR` | N/A | 🆕 NOVO — útil do Cowork |
| `valor_recibido` | ❌ não existe | `VARCHAR` | N/A | 🆕 NOVO — útil do Cowork |
| `estado_divergencia` | ❌ não existe | `CHECK(pendiente,justificado,ajustado,rechazado)` | N/A | 🆕 NOVO — complementa `resuelto` |
| `justificacion` | ❌ não existe | `TEXT` | "justificativa" | 🆕 NOVO — útil do Cowork |
| `resolved_at` | ❌ não existe | `TIMESTAMPTZ` | "resolved_at" | 🆕 NOVO — útil do Cowork |
| `resolved_by` | ❌ não existe | `UUID FK` | "resolvido_por" | 🆕 NOVO — útil do Cowork |

### 2.9 `movimiento_archivos`

| Coluna | Migration 015 (L152-163) | SQL Cowork | Especificação | Status |
|--------|--------------------------|------------|---------------|--------|
| `tipo` | `TEXT CHECK(guia_pdf,cota_pdf,foto,otro)` (L155) | ❌ usa `tipo_documento` | N/A | ❌ CRÍTICO — EF L401, ganado.js L186 |
| `nombre` | `TEXT NOT NULL` (L156) | ❌ usa `nombre_archivo` | N/A | ❌ CRÍTICO — EF L402, ganado.js L187 |
| `storage_path` | `TEXT NOT NULL` (L157) | ❌ usa `url_archivo` | N/A | ❌ CRÍTICO — EF L403, ganado.js L188 |
| `mime_type` | `TEXT` (L158) | ❌ usa `tipo_archivo` | N/A | ❌ CRÍTICO — EF L404, ganado.js L189 |
| `size_bytes` | `INTEGER` (L159) | ❌ usa `tamanho_bytes` | N/A | ❌ CRÍTICO — EF L405, ganado.js L190 |
| `uploaded_by` | `UUID FK` (L160) | ❌ usa `created_by` | N/A | ⚠️ CONFLITO — nome diferente |
| `uploaded_by_name` | `TEXT` (L161) | ❌ usa `created_by_name` | N/A | ⚠️ CONFLITO — nome diferente |
| tipo CHECK extras | `guia_pdf,cota_pdf,foto,otro` | `guia_senacsa,factura,romaneio,certificado,foto,otro` | "upload guia, bascula" | 🆕 NOVO — CW tem +4 tipos |

### 2.10 `comisionistas` (Somente Cowork)

| Aspecto | Migration 015 | SQL Cowork | Status |
|---------|---------------|------------|--------|
| Tabela inteira | ❌ não existe | ✅ Cria (id, nombre, telefono, email, activo) | 🆕 NOVO — criar |
| Seed | N/A | 18 comisionistas reais | 🆕 NOVO — incorporar |
| Frontend | Não referencia | N/A | ✅ Sem impacto |

### 2.11 `animales_individuales` (Somente Cowork)

| Aspecto | Migration 015 | SQL Cowork | Especificação | Status |
|---------|---------------|------------|---------------|--------|
| Tabela inteira | ❌ não existe | ✅ Cria (26 colunas) | "Animal" (id, brinco, status) | 🆕 NOVO — criar |
| Frontend | Não referencia | N/A | N/A | ✅ Sem impacto atual |
| Importação | N/A | `import_animales.sql` (5.9MB, ~37.544 registros) | N/A | 🆕 Fase futura |

### 2.12 Triggers — Comparação

| Trigger | 015 | Cowork | SPEC | Status |
|---------|-----|--------|------|--------|
| `generate_movimiento_number` (L99-122) | ✅ MG-YYYY-NNN | ✅ (nome diferente, mesma lógica) | N/A | ✅ OK — usar 015 |
| `sync_movimiento_totals` (L190-219) | ✅ Auto-soma detalle→mov | ❌ NÃO TEM | N/A | ❌ CRÍTICO — obrigatório |
| `update_movimientos_updated_at` (L322-334) | ✅ | ✅ | N/A | ✅ OK |
| `update_pesajes_updated_at` (L307-319) | ✅ simples | ✅ (computa pesos) | N/A | ⚠️ CONFLITO — 015 é mais simples |
| `audit_trigger_func` × 5 (L337-367, L434-440) | ✅ | ❌ NÃO TEM | "logs imutáveis" | ❌ CRÍTICO — spec exige |

### 2.13 Especificação vs Implementação

A Especificação MVP define conceitos de alto nível que mapeiam para nossa implementação:

| Conceito SPEC | Implementação 015 | Status |
|---------------|-------------------|--------|
| "Ordem Genérica" (COMPRA/MOVIMENTO/VENDA) | `movimientos_ganado.tipo_operacion` | ✅ Mapeado |
| Estados: SOLICITADA→APROVADA→EM_EXECUÇÃO→RECEPCIONADA→REGULARIZADA→ENCERRADA | `estado`: borrador→pendiente_validacion→validado→en_transito→recibido→cerrado | ✅ Equivalente (nomes adaptados ao espanhol) |
| NÃO_CONFORME | `anulado` + `movimiento_divergencias` | ✅ Coberto |
| "Guia" (número, cota, data_emissão) | `nro_guia`, `nro_cota`, `fecha_emision` | ✅ Mapeado |
| "Incidente" (diferença, peso, responsável) | `movimiento_divergencias` | ✅ Mapeado |
| "Evento imutável" | `movimiento_estados_log` + `audit_trigger_func` | ✅ Mapeado |
| "Animal" (brinco, status) | `animales_individuales` (Cowork) | 🆕 Fase futura |
| "Lote" (fazenda, categoria) | `detalle_movimiento_categorias` | ✅ Parcialmente mapeado |
| "Checkpoint EMBARQUE/RECEPÇÃO" | `pesajes_ganado` (tipo_pesaje: despacho/recepcion) | ✅ Mapeado |
| "Ordem de Frete" | ❌ Não implementado em nenhuma fonte | ⏳ Futuro |
| "Dashboard Diretoria" | ❌ Não implementado | ⏳ Futuro |
| "Inventário Antifraude/Baseline" | ❌ Não implementado | ⏳ Futuro |

---

## 3. ANÁLISE DE IMPACTO

### 3.1 Cenário A: Aplicar Migration 015 (sem Cowork)

| O que FUNCIONA | O que NÃO funciona |
|----------------|-------------------|
| ✅ Todas 14 ações do Edge Function (0 mudanças) | ❌ Faltam tabelas: comisionistas, animales_individuales |
| ✅ Todas leituras do ganado.js (0 mudanças) | ❌ Faltam colunas extras: supplier_id, fecha_operacion, etc. |
| ✅ Todas 4 telas UI (0 mudanças) | ❌ Faltam 4 categorias extras (VACA, VAQUILLA, etc.) |
| ✅ Todos 5 triggers + 5 audit triggers | ❌ Sem dados de peso min/max em categorias |
| ✅ Todas 17 RLS policies | ❌ Sem import de 37.544 animais individuais |
| ✅ Seeds 002/003/004 + seed-test-data | |
| **Esforço de adaptação: 0 arquivos** | **Faltam features futuras (não bloqueantes)** |

### 3.2 Cenário B: Aplicar SQL Cowork (sem 015)

| O que FUNCIONA | O que QUEBRA |
|----------------|-------------|
| ✅ Tabelas comisionistas e animales_individuales | ❌ **100% das escritas** do Edge Function FALHAM (34+ colunas com nomes diferentes) |
| ✅ 10 categorias (vs 6) | ❌ **~60% das leituras** do ganado.js FALHAM (30+ colunas) |
| ✅ Importação de 37.544 animais | ❌ **4 CHECK constraints** incompatíveis (tipo_operacion, finalidad, estado, tipo_pesaje) |
| | ❌ Faltam: `destino_nombre`, `moneda`, `marca_verificada`, `senacsa_verificado`, `guia_conforme`, `nro_cota`, `validated_*` |
| | ❌ Falta trigger `sync_movimiento_totals` (cantidad_total nunca atualiza) |
| | ❌ Faltam 5 audit triggers (SPEC exige "logs imutáveis") |
| | ❌ Faltam extensões em `suppliers` e `companies` |
| **Esforço de adaptação: 4 arquivos (589+384+4 telas = ~1.400 linhas)** | **Reescrever TODO o código existente** |

### 3.3 Cenário C (RECOMENDADO): Migration 015 como base + Enhancement 016

| O que FUNCIONA | Custo |
|----------------|-------|
| ✅ **Tudo** do Cenário A (0 código para mudar) | Aplicar 2 SQLs no SQL Editor (~3 min) |
| ✅ **Mais** tabelas extras do Cowork (comisionistas, animales_individuales) | 016 já existe e foi criado |
| ✅ **Mais** colunas extras do Cowork (supplier_id, datas, etc.) | Colunas são ADD COLUMN (não-destrutivas) |
| ✅ **Mais** categorias extras (VACA, VAQUILLA, TORETON, TORO_CRIOLLO) | |
| ✅ Compatibilidade 100% com EF + Frontend + Seeds | |
| **Esforço de adaptação: 0 arquivos de código** | **Melhor dos 3 cenários** |

### 3.4 Impacto das Divergências de CHECK Constraints

| Constraint | Valor 015 (código usa) | Valor CW (rejeitaria) | Impacto se usar CW |
|------------|----------------------|----------------------|---------------------|
| `tipo_operacion` | `transferencia_interna` | aceita `transferencia` apenas | EF L73: `m.tipoOperacion` → rejeição quando UI envia "transferencia_interna" |
| `finalidad` | `remate`, `exposicion`, `transito`, `cambio_titular` | aceita `exportacion`, `recria` apenas | EF L74: `m.finalidad` → rejeição de 4 opções do dropdown da UI |
| `estado` | `anulado` | aceita `cancelado` | EF L445: `.update({estado: "anulado"})` → rejeição PostgreSQL |
| `tipo_pesaje` | `despacho`, `verificacion` | aceita `entrada`, `salida`, `control` | EF L495-496 → rejeição de 2 tipos de pesaje |

### 3.5 Impacto das Colunas GENERATED ALWAYS AS

O 015 usa `GENERATED ALWAYS AS (STORED)` para 4 colunas em `pesajes_ganado`:
- `peso_neto_kg` = `peso_bruto_kg - peso_tara_kg`
- `peso_promedio_kg` = `(peso_bruto_kg - peso_tara_kg) / cantidad_pesada`
- `diferencia_cantidad` = `cantidad_pesada - cantidad_esperada`
- `diferencia_peso_kg` = `peso_neto_kg - peso_esperado_kg`

E 1 em `detalle_movimiento_categorias`:
- `peso_promedio_kg` = `peso_kg / cantidad`

**Se usar CW**: Estas colunas não existem como GENERATED → cálculos precisariam ser feitos no código → mais complexidade e risco de inconsistência.

---

## 4. PLANO DE AÇÃO

### 4.1 Decisão de Schema Base

**✅ RECOMENDAÇÃO: Usar Migration 015 como base.**

**Justificativas:**
1. **Zero mudanças de código**: 589 linhas de Edge Function + 384 linhas de data layer + 4 componentes UI continuam funcionando sem alteração
2. **Compatibilidade total com seeds existentes**: 002, 003, 004, seed-test-data
3. **Colunas GENERATED**: Cálculos automáticos de peso neto/promedio/diferenças são mais robustos que cálculo manual
4. **Trigger sync_movimiento_totals**: Auto-agregação de detalle→movimiento é obrigatória para o frontend
5. **Audit triggers**: Especificação exige "logs imutáveis" → 015 tem 5 audit triggers, CW tem 0
6. **RLS granular**: 015 tem policies separadas por operação (mais seguro que `FOR ALL`)
7. **Colunas extras do CW**: Podem ser adicionadas via `ADD COLUMN` sem conflito (016 já faz isso)

### 4.2 Lista de Alterações Necessárias

| # | Arquivo | Ação | Motivo |
|---|---------|------|--------|
| 1 | `supabase/migrations/015_ganado_module.sql` | **MANTER** (aplicar no SQL Editor) | Base do Edge Function + Frontend. Cria 7 tabelas + extensões + triggers + RLS |
| 2 | `supabase/migrations/016_ganado_enhancements.sql` | **MANTER** (aplicar após 015) | Adiciona comisionistas, animales_individuales, categorias extras, colunas extras do Cowork |
| 3 | `supabase/functions/ganado-mutations/index.ts` | **NÃO ALTERAR** | 100% compatível com 015 |
| 4 | `src/constants/ganado.js` | **NÃO ALTERAR** | 100% compatível com 015 |
| 5 | `src/components/ganado/*.jsx` (4 telas) | **NÃO ALTERAR** | 100% compatível com 015 |
| 6 | `Tudo boi/00_criar_tabelas_ganado.sql` | **NÃO APLICAR** | Incompatível com código existente |
| 7 | `Tudo boi/files (3)/01_fase1-3_estrutura_base.sql` | **NÃO APLICAR** diretamente | Dados já incorporados no 016 (categorias extras, comisionistas) |
| 8 | `Tudo boi/files (3)/02_fase4-6_movimientos_pesajes.sql` | **AVALIAR** | Seed com 5 movimentos de dados reais — útil mas usa colunas do 016 (supplier_id, fecha_operacion). Precisa adaptar |
| 9 | `Tudo boi/files (3)/03_fase7_animales_individuales.sql` | **PARCIALMENTE INCORPORADO** no 016 | Tabela + views + função GDM. Views e função GDM podem ser adicionadas depois |
| 10 | `Tudo boi/files (3)/import_animales.sql` | **FASE FUTURA** | 5.9MB de dados — requer animales_individuales (016) + tabela de importação |
| 11 | `supabase/seeds/002_proveedores_reales.sql` | **APLICAR** (após 015) | 50 suppliers reais com is_ganadero |
| 12 | `supabase/seeds/003_establecimientos_reales.sql` | **APLICAR** (após 015) | ~41 establishments reais |
| 13 | `supabase/seeds/004_movimientos_historicos.sql` | **APLICAR** (após 015+016) | 20 movimentos históricos |
| 14 | `scripts/ganado/seed-test-data.sql` | **APLICAR** (após 015) | 3 movimentos de teste com detalhes |

### 4.3 Ordem de Execução

```
PASSO 1: [ ] Aplicar 015_ganado_module.sql no SQL Editor do Supabase TEST
         → Cria 7 tabelas + extensões suppliers/companies + 6 categorias + triggers + RLS
         → Verificar com queries da seção 5.1

PASSO 2: [ ] Aplicar 016_ganado_enhancements.sql no SQL Editor
         → Adiciona comisionistas (18 seed) + animales_individuales
         → Adiciona 4 categorias extras + peso_min/max
         → Adiciona colunas extras em movimientos/pesajes/divergencias/archivos
         → Verificar com queries da seção 5.2

PASSO 3: [ ] Deploy Edge Function ganado-mutations
         → npx supabase functions deploy ganado-mutations --project-ref ebvethperccycxpaksrr
         → Testar: curl -X POST com action "create"

PASSO 4: [ ] Aplicar seeds (nesta ordem):
         a) 002_proveedores_reales.sql
         b) 003_establecimientos_reales.sql
         c) seed-test-data.sql (3 movimentos de teste)
         d) 004_movimientos_historicos.sql (20 movimentos)
         → Verificar contagens na seção 5.3

PASSO 5: [ ] Validar fluxo completo no Frontend
         → Criar movimiento borrador
         → Adicionar categorias
         → Avançar status (borrador → validado → en_transito → recibido)
         → Adicionar pesaje
         → Registrar divergência
         → Adicionar arquivo
         → Anular um movimiento

PASSO 6: [ ] (FUTURO) Importação de animais individuais
         → Requer: 016 aplicado (animales_individuales exists)
         → Adaptar import_animales.sql ou criar script Python
         → ~37.544 registros
```

### 4.4 Itens NÃO Incorporados do Cowork (Justificativa)

| Item do Cowork | Motivo da não-incorporação |
|----------------|--------------------------|
| Nomes `establishment_*` (inglês) | Código usa `establecimiento_*` (espanhol) — EF L75,77 |
| `guia_numero` | Código usa `nro_guia` — EF L81 |
| `cancelado` (estado) | Código usa `anulado` — EF L445 |
| `peso_total_kg` em pesajes | Código usa `peso_bruto_kg` (bruto-tara=neto é mais preciso) — EF L490 |
| `FOR ALL TO service_role` (RLS) | 015 é mais granular: INSERT/UPDATE/DELETE separados |
| `observaciones` em estados_log | Código usa `comentario` — EF L41, ganado.js L199 |
| `activo` em categorias | Código usa `active` — ganado.js L54 |
| Trigger de cálculo de peso em pesajes | 015 usa GENERATED ALWAYS AS (mais seguro que trigger) |
| Views `vw_animales_*` | Úteis mas não bloqueantes — podem ser adicionadas depois |
| Função `calcular_gdm_animal()` | Útil mas não bloqueante — pode ser adicionada depois |

---

## 5. QUERIES DE VALIDAÇÃO

### 5.1 Após PASSO 1 (Migration 015)

```sql
-- Verificar que as 7 tabelas existem
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'categorias_animales', 'movimientos_ganado',
    'detalle_movimiento_categorias', 'movimiento_divergencias',
    'movimiento_archivos', 'movimiento_estados_log', 'pesajes_ganado'
  )
ORDER BY table_name;
-- ✅ Esperado: 7 linhas

-- Verificar extensões em suppliers e companies
SELECT column_name FROM information_schema.columns
WHERE table_name = 'suppliers' AND column_name IN ('is_ganadero', 'senacsa_code_proveedor');
-- ✅ Esperado: 2 linhas

SELECT column_name FROM information_schema.columns
WHERE table_name = 'companies' AND column_name IN ('is_frigorifico', 'senacsa_code_empresa');
-- ✅ Esperado: 2 linhas

-- Verificar categorias seedadas
SELECT codigo, nombre, active FROM categorias_animales ORDER BY codigo;
-- ✅ Esperado: 6 linhas (DH, DM, NOV, TER, TOR, VAQ)

-- Verificar colunas GENERATED em pesajes
SELECT column_name, generation_expression
FROM information_schema.columns
WHERE table_name = 'pesajes_ganado' AND is_generated = 'ALWAYS';
-- ✅ Esperado: 4 linhas (peso_neto_kg, peso_promedio_kg, diferencia_cantidad, diferencia_peso_kg)

-- Verificar trigger sync_movimiento_totals
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_table = 'detalle_movimiento_categorias'
  AND trigger_name = 'trg_sync_movimiento_totals';
-- ✅ Esperado: 1 linha

-- Verificar RLS ativo
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('movimientos_ganado', 'pesajes_ganado', 'categorias_animales')
ORDER BY tablename, policyname;
-- ✅ Esperado: 11 policies (movimientos: 4, pesajes: 4, categorias: 1 + 2 mais se houver)

-- Testar RLS com role anon (deve dar erro de escrita)
SET ROLE authenticated;
SELECT COUNT(*) FROM categorias_animales; -- ✅ Deve funcionar
SET ROLE anon;
INSERT INTO movimientos_ganado (finalidad, tipo_operacion) VALUES ('engorde', 'compra'); -- ❌ Deve falhar
RESET ROLE;
```

### 5.2 Após PASSO 2 (Migration 016)

```sql
-- Verificar tabelas extras
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('comisionistas', 'animales_individuales')
ORDER BY table_name;
-- ✅ Esperado: 2 linhas

-- Verificar comisionistas seedados
SELECT COUNT(*) as total FROM comisionistas;
-- ✅ Esperado: 18

-- Verificar categorias extras
SELECT codigo, nombre FROM categorias_animales
WHERE codigo IN ('VACA', 'VAQUILLA', 'TORETON', 'TORO_CRIOLLO')
ORDER BY codigo;
-- ✅ Esperado: 4 linhas

-- Total de categorias
SELECT COUNT(*) FROM categorias_animales;
-- ✅ Esperado: 10

-- Verificar colunas extras em movimientos_ganado
SELECT column_name FROM information_schema.columns
WHERE table_name = 'movimientos_ganado'
  AND column_name IN ('supplier_id', 'fecha_operacion', 'fecha_transito_inicio',
                       'fecha_transito_fin', 'fecha_recepcion', 'guia_senacsa',
                       'precio_por_cabeza', 'peso_promedio_kg', 'comisionista_id')
ORDER BY column_name;
-- ✅ Esperado: 9 linhas

-- Verificar coluna extra em pesajes
SELECT column_name FROM information_schema.columns
WHERE table_name = 'pesajes_ganado' AND column_name = 'desbaste_porcentaje';
-- ✅ Esperado: 1 linha

-- Verificar colunas extras em divergencias
SELECT column_name FROM information_schema.columns
WHERE table_name = 'movimiento_divergencias'
  AND column_name IN ('valor_esperado', 'valor_recibido', 'estado_divergencia',
                       'justificacion', 'resolved_at', 'resolved_by')
ORDER BY column_name;
-- ✅ Esperado: 6 linhas

-- Verificar tipo CHECK expandido em archivos
-- (tentar inserir tipo 'guia_senacsa' — deve funcionar)
-- INSERT INTO movimiento_archivos (movimiento_id, tipo, nombre, storage_path)
-- VALUES ('...', 'guia_senacsa', 'test', 'test'); -- Deve aceitar

-- Contagem total de colunas por tabela
SELECT table_name,
       (SELECT COUNT(*) FROM information_schema.columns c
        WHERE c.table_name = t.table_name AND c.table_schema = 'public') as colunas
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN (
    'categorias_animales', 'comisionistas', 'movimientos_ganado',
    'detalle_movimiento_categorias', 'movimiento_estados_log',
    'pesajes_ganado', 'movimiento_divergencias', 'movimiento_archivos',
    'animales_individuales'
  )
ORDER BY table_name;
```

### 5.3 Após PASSO 4 (Seeds)

```sql
-- Contagens esperadas
SELECT 'categorias_animales' as tabela, COUNT(*) as total FROM categorias_animales
UNION ALL SELECT 'suppliers (ganaderos)', COUNT(*) FROM suppliers WHERE is_ganadero = true
UNION ALL SELECT 'comisionistas', COUNT(*) FROM comisionistas
UNION ALL SELECT 'establishments', COUNT(*) FROM establishments
UNION ALL SELECT 'movimientos_ganado', COUNT(*) FROM movimientos_ganado
UNION ALL SELECT 'detalle_categorias', COUNT(*) FROM detalle_movimiento_categorias
UNION ALL SELECT 'pesajes_ganado', COUNT(*) FROM pesajes_ganado
ORDER BY tabela;

-- ✅ Esperados mínimos:
-- categorias_animales:      10
-- suppliers (ganaderos):    47+ (do seed 002)
-- comisionistas:            18
-- establishments:           10+ (do seed 003)
-- movimientos_ganado:       23+ (3 teste + 20 históricos)
-- detalle_categorias:       6+ (dos movimentos teste)
-- pesajes_ganado:           variável
```

### 5.4 Após PASSO 5 (Validação de Fluxo)

```sql
-- Verificar que o fluxo de status funciona
SELECT estado, COUNT(*)
FROM movimientos_ganado
GROUP BY estado
ORDER BY estado;

-- Verificar auto-geração de número
SELECT movimiento_number, estado
FROM movimientos_ganado
WHERE movimiento_number LIKE 'MG-2026-%'
ORDER BY movimiento_number;

-- Verificar sync de totais (trigger sync_movimiento_totals)
SELECT m.movimiento_number, m.cantidad_total, m.peso_total_kg,
       SUM(d.cantidad) as sum_cantidad, SUM(d.peso_kg) as sum_peso
FROM movimientos_ganado m
LEFT JOIN detalle_movimiento_categorias d ON d.movimiento_id = m.id
GROUP BY m.id, m.movimiento_number, m.cantidad_total, m.peso_total_kg
HAVING m.cantidad_total != COALESCE(SUM(d.cantidad), 0);
-- ✅ Esperado: 0 linhas (totais devem estar sincronizados)
```

---

## RESUMO EXECUTIVO

| Métrica | Valor |
|---------|-------|
| Total de arquivos analisados | **22** (13 projeto + 9 Cowork) |
| Divergências ❌ CRÍTICAS | **~50** (colunas que código escreve/lê e CW não tem) |
| Divergências ⚠️ CONFLITO | **~10** (nomes diferentes, mesma semântica) |
| Itens 🆕 NOVOS do Cowork | **~20** (tabelas, colunas, categorias extras) |
| Cenário recomendado | **C: 015 base + 016 enhancements** |
| Arquivos de código a alterar | **0** |
| SQLs a aplicar | **2** (015 + 016) + seeds |
| Tempo estimado de execução | **~15 minutos** (SQL Editor + deploy EF + seeds) |

---

*Documento gerado por Claude Code com base na análise de 22 arquivos totalizando ~8.000 linhas de SQL, TypeScript e JSX.*
*Todas as referências de linha (Lxx) referem-se aos arquivos conforme lidos em 2026-03-03.*
