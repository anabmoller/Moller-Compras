# Diagnóstico de Reconciliação — Módulo Ganado

**Data:** 2026-03-03
**Objetivo:** Mapear divergências entre o SQL do Cowork (`00_criar_tabelas_ganado.sql`) e nosso código (migration 015 + Edge Function + Frontend) para criar um schema reconciliado.

---

## 1. RESUMO EXECUTIVO

| Métrica | Valor |
|---------|-------|
| Total de tabelas no Cowork | 9 (7 core + comisionistas + animales_individuales) |
| Total de tabelas no 015 | 7 core |
| Colunas que nosso código ESCREVE e Cowork NÃO TEM | **34** |
| Colunas que nosso código LÊ e Cowork NÃO TEM | **30+** |
| Nomes de colunas com mesma semântica mas nome diferente | **12** |
| CHECK constraints incompatíveis | **4** (tipo_operacion, finalidad, estado, tipo_pesaje) |
| Tabelas extras do Cowork (boas) | **2** (comisionistas, animales_individuales) |
| Categorias extras do Cowork | **4** (VACA, VAQUILLA, TORETON, TORO_CRIOLLO) |
| Triggers no 015 ausentes no Cowork | **5** (sync_totals + 4 audit) |
| Colunas extras do Cowork (úteis) | **~15** |

**⚠️ VEREDICTO: Se aplicar o SQL do Cowork sem alteração, 100% das operações de ESCRITA e ~60% das de LEITURA do frontend FALHAM.**

---

## 2. ARQUIVOS ANALISADOS

| Arquivo | Linhas | Papel |
|---------|--------|-------|
| `Downloads/00_criar_tabelas_ganado.sql` | 473 | Schema do Cowork |
| `supabase/migrations/015_ganado_module.sql` | 441 | Nosso schema |
| `supabase/functions/ganado-mutations/index.ts` | 589 | Edge Function (14 ações) |
| `src/constants/ganado.js` | 384 | Data layer (reads + writes) |
| `src/components/ganado/MovimientosScreen.jsx` | — | Tela lista |
| `src/components/ganado/MovimientoCard.jsx` | — | Card resumo |
| `src/components/ganado/MovimientoDetail.jsx` | — | Tela detalhe + pesajes |
| `src/components/ganado/NuevoMovimientoForm.jsx` | — | Formulário criação |

---

## 3. DIVERGÊNCIAS POR TABELA

### 3.1 `categorias_animales`

| Coluna | 015 (Code) | Cowork | Impacto |
|--------|-----------|--------|---------|
| `active` | `BOOLEAN DEFAULT true` | ❌ não existe | 🔴 Frontend faz `.eq("active", true)` → FALHA |
| `activo` | ❌ não existe | `BOOLEAN DEFAULT true` | Cowork usa nome em espanhol |
| `sexo` CHECK | `'macho','hembra','mixto'` | `'macho','hembra','ambos'` | 🟡 Seed usa 'mixto' no 015 |
| `peso_min_kg` | ❌ não existe | `DECIMAL(10,2)` | 🟢 Extra útil do Cowork |
| `peso_max_kg` | ❌ não existe | `DECIMAL(10,2)` | 🟢 Extra útil do Cowork |
| `updated_at` | ❌ não existe | `TIMESTAMPTZ` | 🟢 Extra útil do Cowork |
| Seed | 6 categorias | 10 categorias (+4) | 🟢 Cowork tem mais |

**Categorias extras do Cowork:** VACA, VAQUILLA, TORETON, TORO_CRIOLLO → úteis

---

### 3.2 `companies` extensions

| Coluna | 015 | Cowork | Impacto |
|--------|-----|--------|---------|
| `is_frigorifico` | `BOOLEAN DEFAULT false` | ❌ NÃO ADICIONA | 🔴 Frontend faz `.eq("is_frigorifico", true)` → FALHA |
| `senacsa_code_empresa` | `TEXT` | ❌ NÃO ADICIONA | 🔴 Frontend lê |

**O Cowork esqueceu de estender a tabela `companies`.**

---

### 3.3 `movimientos_ganado` (TABELA PRINCIPAL — MAIS DIVERGÊNCIAS)

#### Colunas que nosso código PRECISA e Cowork NÃO TEM:

| Coluna 015 | Edge Function | Frontend | Status no Cowork |
|------------|---------------|----------|-----------------|
| `establecimiento_origen_id` | WRITE ✅ | READ ✅ | ❌ tem `establishment_origen_id` |
| `empresa_destino_id` | WRITE ✅ | READ ✅ | ❌ tem `company_id` |
| `establecimiento_destino_id` | WRITE ✅ | READ ✅ | ❌ tem `establishment_destino_id` |
| `destino_nombre` | WRITE ✅ | READ ✅ | ❌ não existe |
| `nro_guia` | WRITE ✅ | READ ✅ | ❌ tem `guia_numero` |
| `nro_cota` | WRITE ✅ | READ ✅ | ❌ não existe |
| `fecha_emision` | WRITE ✅ | READ ✅ | ❌ tem `fecha_operacion` |
| `moneda` | WRITE ✅ | READ ✅ | ❌ não existe |
| `marca_verificada` | — | READ ✅ | ❌ não existe |
| `senacsa_verificado` | — | READ ✅ | ❌ não existe |
| `guia_conforme` | — | READ ✅ | ❌ não existe |
| `validated_by` | WRITE ✅ | READ ✅ | ❌ não existe |
| `validated_by_name` | WRITE ✅ | READ ✅ | ❌ não existe |
| `validated_at` | WRITE ✅ | READ ✅ | ❌ não existe |

#### CHECK constraints incompatíveis:

| Campo | 015 (Code) | Cowork | Conflito |
|-------|-----------|--------|----------|
| `tipo_operacion` | `compra, venta, transferencia_interna, consignacion` | `compra, venta, transferencia, inventario` | 🔴 EF escreve `transferencia_interna` → Cowork rejeita |
| `finalidad` | `faena, cria, engorde, remate, exposicion, transito, cambio_titular, otro` | `engorde, cria, faena, exportacion, recria` | 🔴 EF escreve `remate`,`exposicion`,etc → Cowork rejeita |
| `estado` | `..., anulado` | `..., cancelado` | 🔴 EF escreve `anulado` → Cowork rejeita |

#### Colunas extras do Cowork (BOAS, incorporar):

| Coluna Cowork | Valor | Decisão |
|---------------|-------|---------|
| `supplier_id UUID FK` | Link direto ao proveedor | 🟢 Incorporar |
| `fecha_operacion DATE` | Data da operação | 🟢 Incorporar |
| `fecha_transito_inicio DATE` | Início do trânsito | 🟢 Incorporar |
| `fecha_transito_fin DATE` | Fim do trânsito | 🟢 Incorporar |
| `fecha_recepcion DATE` | Data de recepção | 🟢 Incorporar |
| `peso_promedio_kg DECIMAL` | Peso médio agregado | 🟢 Incorporar |
| `guia_senacsa VARCHAR` | Nro guia SENACSA separado | 🟢 Incorporar |
| `precio_por_cabeza DECIMAL` | Preço por cabeça | 🟢 Incorporar |

---

### 3.4 `detalle_movimiento_categorias`

| Coluna | 015 | Cowork | Impacto |
|--------|-----|--------|---------|
| `peso_kg` | `NUMERIC(10,2)` | ❌ tem `peso_total_kg` | 🔴 EF + Frontend usam `peso_kg` |
| `peso_promedio_kg` | `GENERATED ALWAYS AS` | `DECIMAL(10,2)` (manual) | 🟡 015 é auto-calculado (melhor) |
| `precio_por_kg` | `NUMERIC(12,2)` | ❌ tem `precio_unitario` | 🔴 EF + Frontend usam `precio_por_kg` |
| `precio_subtotal` | `NUMERIC(14,2)` | ❌ não existe | 🔴 EF + Frontend usam `precio_subtotal` |

**Trigger `sync_movimiento_totals`:** 015 tem (auto-soma detalle → movimiento). Cowork NÃO tem → sem esse trigger, `cantidad_total` e `peso_total_kg` no movimiento nunca atualizam automaticamente.

---

### 3.5 `movimiento_estados_log`

| Coluna | 015 | Cowork | Impacto |
|--------|-----|--------|---------|
| `comentario` | `TEXT` | ❌ tem `observaciones` | 🔴 EF escreve `comentario`, Frontend lê `l.comentario` |

---

### 3.6 `pesajes_ganado` (MAIOR DIVERGÊNCIA — 20+ colunas diferentes)

#### Colunas que nosso código PRECISA e Cowork NÃO TEM:

| Coluna 015 | EF | Frontend | Cowork |
|------------|-----|----------|--------|
| `detalle_categoria_id` | WRITE | READ | ❌ |
| `hora_pesaje` | WRITE | READ | ❌ |
| `peso_bruto_kg` | WRITE | READ | ❌ (tem `peso_total_kg`) |
| `peso_tara_kg` | WRITE | READ | ❌ |
| `nro_tropa` | WRITE | READ | ❌ |
| `nro_lote` | WRITE | READ | ❌ |
| `categoria_id` | WRITE | READ | ❌ |
| `cantidad_esperada` | WRITE | READ | ❌ |
| `peso_esperado_kg` | WRITE | READ | ❌ |
| `diferencia_cantidad` | GENERATED | READ | ❌ |
| `diferencia_peso_kg` | GENERATED | READ | ❌ |
| `balanza_id` | WRITE | READ | ❌ |
| `balanza_nombre` | WRITE | READ | ❌ |
| `ticket_nro` | WRITE | READ | ❌ |
| `conforme` | WRITE | READ | ❌ |
| `pesado_por` | WRITE | READ | ❌ (tem `created_by`) |
| `pesado_por_nombre` | WRITE | READ | ❌ (tem `created_by_name`) |
| `verificado_por` | WRITE | READ | ❌ |
| `verificado_por_nombre` | WRITE | READ | ❌ |

#### tipo_pesaje CHECK incompatível:

| 015 | Cowork |
|-----|--------|
| `recepcion, despacho, intermedio, verificacion` | `entrada, recepcion, intermedio, salida, control` |

#### Semântica de cálculos diferente:

| Conceito | 015 | Cowork |
|----------|-----|--------|
| peso_neto | `peso_bruto - peso_tara` (GENERATED) | `peso_total * (1 - desbaste%)` (trigger) |
| peso_promedio | `peso_neto / cantidad` (GENERATED) | `peso_total / cantidad` (trigger) |

**Decisão:** 015 é mais preciso (bruto - tara = neto). Cowork usa desbaste %, que é uma aproximação. Podemos ter AMBOS.

#### Coluna extra do Cowork (BOA):

| Coluna | Valor | Decisão |
|--------|-------|---------|
| `desbaste_porcentaje` | Porcentagem de desbaste | 🟢 Incorporar como coluna extra |

---

### 3.7 `movimiento_divergencias`

| Coluna | 015 | Cowork | Impacto |
|--------|-----|--------|---------|
| `tipo` | `TEXT CHECK(...)` | ❌ tem `tipo_divergencia` | 🔴 EF + Frontend |
| `descripcion` | `TEXT NOT NULL` | ❌ não existe | 🔴 EF + Frontend |
| `cantidad_diferencia` | `INTEGER` | ❌ não existe | 🔴 EF + Frontend |
| `peso_diferencia_kg` | `NUMERIC(8,2)` | ❌ não existe | 🔴 EF + Frontend |
| `resolucion` | `TEXT` | ❌ não existe | 🔴 EF + Frontend |
| `resuelto` | `BOOLEAN` | ❌ não existe | 🔴 EF + Frontend |
| `reportado_por` | `UUID FK profiles` | ❌ tem `created_by` | 🔴 Nome diferente |
| `reportado_por_nombre` | `TEXT` | ❌ tem `created_by_name` | 🔴 |

#### Extras do Cowork (BONS):

| Coluna | Valor | Decisão |
|--------|-------|---------|
| `valor_esperado VARCHAR` | Valor esperado genérico | 🟢 Incorporar |
| `valor_recibido VARCHAR` | Valor recebido genérico | 🟢 Incorporar |
| `estado VARCHAR CHECK(pendiente,justificado,ajustado,rechazado)` | Status mais rico que `resuelto BOOLEAN` | 🟢 Incorporar (manter `resuelto` como alias) |
| `justificacion TEXT` | Justificativa separada | 🟢 Incorporar |
| `resolved_at TIMESTAMPTZ` | Timestamp de resolução | 🟢 Incorporar |
| `resolved_by UUID` | Quem resolveu | 🟢 Incorporar |

---

### 3.8 `movimiento_archivos`

| Coluna | 015 | Cowork | Impacto |
|--------|-----|--------|---------|
| `tipo` | `TEXT CHECK(guia_pdf,cota_pdf,foto,otro)` | ❌ tem `tipo_documento` | 🔴 EF + Frontend |
| `nombre` | `TEXT NOT NULL` | ❌ tem `nombre_archivo` | 🔴 EF + Frontend |
| `storage_path` | `TEXT NOT NULL` | ❌ tem `url_archivo` | 🔴 EF + Frontend |
| `mime_type` | `TEXT` | ❌ tem `tipo_archivo` | 🔴 Nome diferente |
| `size_bytes` | `INTEGER` | ❌ tem `tamanho_bytes` | 🔴 Nome diferente |
| tipo_documento CHECK | `guia_pdf,cota_pdf,foto,otro` | `guia_senacsa,factura,romaneio,certificado,foto,otro` | 🟡 Cowork tem mais opções → merge |

---

### 3.9 `comisionistas` (COWORK ONLY — 🟢 INCORPORAR)

```
id UUID PK, nombre VARCHAR UNIQUE, telefono, email, activo, created_at
```
- 18 comisionistas seedados (Ronaldo, Adriano, etc.)
- Frontend NÃO referencia ainda → adicionar depois
- **Decisão:** Criar a tabela mas não bloqueia nada

---

### 3.10 `animales_individuales` (COWORK ONLY — 🟢 INCORPORAR)

```
id, ide (caravana), ide_visual, movimiento_entrada_id, movimiento_salida_id,
categoria_id, proveedor_id, raza, sexo, carimbo, comisionista, lugar_compra,
precio_compra, fecha_nacimiento, fecha_entrada, fecha_salida, peso_entrada_kg,
peso_actual_kg, gdm_desde_entrada, gdm_desde_ultimo, ganancia_peso_total,
ubicacion_actual, potrero_actual, estado, clasificacion, sanitacion, observaciones
```
- Tabela rica para rastreamento individual por caravana
- Frontend NÃO referencia ainda → fase futura
- **Decisão:** Criar a tabela mas não bloqueia nada

---

## 4. TRIGGERS — COMPARAÇÃO

| Trigger | 015 | Cowork | Decisão |
|---------|-----|--------|---------|
| `generate_movimiento_number` | ✅ | ✅ (nome diferente, mesma lógica) | ✅ Usar 015 |
| `update_movimientos_updated_at` | ✅ | ✅ | ✅ Qualquer um |
| `sync_movimiento_totals` | ✅ (auto-soma detalle → mov) | ❌ NÃO TEM | 🔴 OBRIGATÓRIO do 015 |
| `update_pesajes_updated_at` | ✅ (simples) | ✅ (computa pesos) | 🟡 Mesclar |
| `audit_trigger_func` (4 triggers) | ✅ | ❌ NÃO TEM | 🟡 Manter do 015 |

---

## 5. RLS — COMPARAÇÃO

| Aspecto | 015 | Cowork | Decisão |
|---------|-----|--------|---------|
| Padrão SELECT | `FOR SELECT TO authenticated` | `FOR SELECT TO authenticated` | ✅ Igual |
| Padrão INSERT | `FOR INSERT TO service_role` | `FOR INSERT TO service_role` | ✅ Igual |
| Padrão UPDATE | `FOR UPDATE TO service_role` | `FOR ALL TO service_role` (some) | 🟡 015 é mais granular |
| Padrão DELETE | `FOR DELETE TO service_role` | (coberto por FOR ALL) | 🟡 015 é mais explícito |

**Decisão:** Usar padrão do 015 (policies separadas por operação) — mais seguro e auditável.

---

## 6. DECISÕES DE RECONCILIAÇÃO

### Base: Migration 015 (nosso código depende dele)

### Incorporar do Cowork:

| Item | Ação |
|------|------|
| `comisionistas` | Criar tabela + seed 18 nomes |
| `animales_individuales` | Criar tabela (sem seed) |
| 4 categorias extras | INSERT VACA, VAQUILLA, TORETON, TORO_CRIOLLO |
| `peso_min_kg/peso_max_kg` em categorias | ADD COLUMN |
| `updated_at` em categorias | ADD COLUMN |
| `supplier_id` em movimientos | ADD COLUMN + FK |
| `fecha_operacion` em movimientos | ADD COLUMN |
| `fecha_transito_inicio/fin` em movimientos | ADD COLUMN |
| `fecha_recepcion` em movimientos | ADD COLUMN |
| `guia_senacsa` em movimientos | ADD COLUMN |
| `precio_por_cabeza` em movimientos | ADD COLUMN |
| `desbaste_porcentaje` em pesajes | ADD COLUMN |
| `valor_esperado/recibido` em divergencias | ADD COLUMN |
| `estado` (pendiente/justificado/etc) em divergencias | ADD COLUMN |
| `justificacion` em divergencias | ADD COLUMN |
| `resolved_at/resolved_by` em divergencias | ADD COLUMN |

### NÃO incorporar (mantemos do 015):

| Item | Motivo |
|------|--------|
| Nomes em inglês (establishment_*) | Nosso EF usa español (establecimiento_*) |
| `guia_numero` vs `nro_guia` | Nosso EF usa `nro_guia` |
| `cancelado` vs `anulado` | Nosso EF + Frontend usam `anulado` |
| `peso_total_kg` em pesajes | Nosso usa `peso_bruto_kg` (mais preciso: bruto - tara = neto) |
| `FOR ALL TO service_role` | Nosso é mais granular (INSERT/UPDATE/DELETE separados) |
| `observaciones` em estados_log | Nosso usa `comentario` |

---

## 7. COMPONENTES FRONTEND AFETADOS

| Componente | Colunas críticas que usa do 015 |
|------------|-------------------------------|
| `MovimientosScreen.jsx` | estado, cantidadTotal, moneda, precioTotal, nroGuia, nroCota |
| `MovimientoCard.jsx` | fechaEmision, establecimientoOrigenId, destinoNombre, moneda, categorias[] |
| `MovimientoDetail.jsx` | TODAS (pesajes com peso_bruto_kg, conforme, diferencia*, balanza*, etc) |
| `NuevoMovimientoForm.jsx` | tipoOperacion (transferencia_interna), finalidad (8 opções), moneda, etc |
| `ganado.js` (data layer) | `.eq("active", true)` em categorias, `.eq("is_frigorifico", true)` em companies |

---

## 8. PLANO DE AÇÃO RECOMENDADO

### Estratégia: Migration 015 como BASE + Enhancement SQL com adições do Cowork

```
PASSO 1: Aplicar 015_ganado_module.sql no Supabase TEST
         → Cria 7 tabelas compatíveis com Edge Function + Frontend
         → TUDO funciona imediatamente

PASSO 2: Aplicar 016_ganado_enhancements.sql (A CRIAR)
         → Adiciona tabelas: comisionistas, animales_individuales
         → Adiciona categorias extras (VACA, VAQUILLA, TORETON, TORO_CRIOLLO)
         → Adiciona colunas extras do Cowork em tabelas existentes
         → Mantém 100% compatibilidade com código existente

PASSO 3: Deploy Edge Function ganado-mutations

PASSO 4: Rodar seeds (002, 003, 004 + seed-test-data)

PASSO 5: Validar fluxo completo no frontend
```

**Prioridade:** PASSO 1 desbloqueia TODO o frontend. Os outros passos podem ser feitos depois.

---

*Documento gerado automaticamente por análise de 4.500+ linhas de SQL, TypeScript e JSX.*
