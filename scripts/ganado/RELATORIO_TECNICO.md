# RELATÓRIO TÉCNICO — Módulo de Ganado (YPOTI)
**Data:** 2026-03-03
**Branch:** `test`
**Escopo:** Completar modelo de dados, Edge Functions, data layer e UI para movimentação de ganado

---

## 1. O QUE FOI CONCLUÍDO

### 1.1 Migration SQL (`015_ganado_module.sql`)
**Estado anterior:** 6 tabelas implementadas, faltava a 7ª (pesajes)

**Concluído:**
- Adicionada tabela `pesajes_ganado` — 7ª e última tabela do modelo
- 5 índices para pesajes (movimiento_id, fecha, categoria, detalle, tipo)
- Trigger `update_pesajes_updated_at` para atualização automática
- Colunas GENERATED ALWAYS AS (STORED) para:
  - `peso_neto_kg` = bruto - tara
  - `peso_promedio_kg` = neto / quantidade
  - `diferencia_cantidad` = pesado - esperado
  - `diferencia_peso_kg` = neto - esperado
- RLS habilitado + 4 policies (select/insert/update/delete)
- Audit trigger reutilizando `audit_trigger_func()` existente
- CHECK constraints para tipo_pesaje: recepcion, despacho, intermedio, verificacion

**As 7 tabelas completas:**
| # | Tabela | Linhas DDL | Finalidade |
|---|--------|-----------|------------|
| 1 | `categorias_animales` | ~15 | Lookup: DM, DH, TOR, NOV, VAQ, TER |
| 2 | `movimientos_ganado` | ~55 | Tabela principal de movimentos |
| 3 | `detalle_movimiento_categorias` | ~18 | N categorias por movimento |
| 4 | `movimiento_divergencias` | ~15 | Discrepâncias/divergências |
| 5 | `movimiento_archivos` | ~14 | PDFs, fotos anexadas |
| 6 | `movimiento_estados_log` | ~12 | Histórico de mudanças de estado |
| 7 | `pesajes_ganado` | ~62 | Registros de pesagem (nova) |

**Total migration:** 440 linhas

---

### 1.2 Edge Functions (`ganado-mutations/index.ts`)
**Estado anterior:** 11 actions implementadas

**Adicionadas 3 novas actions:**

| Action | Descrição | Validações |
|--------|-----------|------------|
| `add-pesaje` | Cria registro de pesagem | Verifica estado (validado/en_transito/recibido), sanitiza todos os campos |
| `update-pesaje` | Atualiza campos do pesaje | Permissão create_movimiento_ganado, suporta verificadoPor |
| `delete-pesaje` | Remove pesaje por ID | Permissão create_movimiento_ganado |

**Total: 14 actions** no endpoint único com dispatch por `action`:
create, update, validate, advance-status, add-categories, update-category, remove-category, add-divergence, resolve-divergence, add-attachment, anular, add-pesaje, update-pesaje, delete-pesaje

**Total arquivo:** 589 linhas

---

### 1.3 Data Layer (`constants/ganado.js`)
**Adições:**
- `transformPesaje(row)` — mapeia snake_case → camelCase para 30 campos
- `fetchSingleMovimiento()` — agora faz 6 queries paralelas (adicionou pesajes_ganado)
- `addPesaje(movimientoUuid, pesaje)` — via Edge Function
- `updatePesaje(pesajeId, updates)` — via Edge Function
- `deletePesaje(pesajeId)` — via Edge Function
- `fetchPesajesByMovimiento(movimientoUuid)` — query direta para relatórios

**Total arquivo:** 383 linhas

---

### 1.4 Frontend — MovimientoDetail.jsx
**Adições (seção de Pesajes completa):**
- Importação de `addPesaje`, `deletePesaje`
- Estado do formulário de pesaje (11 campos)
- Handler `handleAddPesaje()` com envio ao Edge Function
- Handler `handleDeletePesaje()` com remoção
- `pesajeResumen` (useMemo) — resumo de reconciliação pesaje vs guía
- Controle `canAddPesaje` — permite pesaje em estados validado/en_transito/recibido
- UI completa:
  - Card de reconciliação (verde/amarelo baseado em conformidade)
  - Formulário de novo pesaje (9 inputs + checkbox conforme)
  - Lista de pesajes com tipo, pesos, diferenças, tropa, ticket, balanza
  - Botão de eliminar pesaje

**Total arquivo:** 904 linhas (antes: ~601)

---

### 1.5 Scripts de Validação e Teste

| Arquivo | Linhas | Descrição |
|---------|--------|-----------|
| `validate-schema.sql` | 126 | 10 queries de validação (tabelas, integridade, RLS, triggers, reconciliação) |
| `seed-test-data.sql` | 155 | 3 movimentos de teste com categorias, pesajes, divergências, status log |

**Seed data criado:**
1. **Mov 1 (Cerrado):** Compra/faena, 120 cabezas (80 NOV + 40 VAQ), 2 pesajes, status log completo
2. **Mov 2 (En tránsito):** Venta/engorde, 50 cabezas (30 DM + 20 NOV)
3. **Mov 3 (Borrador):** Compra/cría, 25 VAQ, 1 divergência (falta guía SENACSA)

---

## 2. PROBLEMAS ENCONTRADOS

### 2.1 Ausência de dados históricos no repositório
- **Busca realizada:** Todo o projeto foi escaneado recursivamente
- **Resultado:** Nenhum CSV, Excel ou PDF de dados de ganado dentro do repo
- **Arquivos externos encontrados:** `/Users/ana/Desktop/PDR/` contém Excel files, mas são de compras/combustíveis, não específicos de ganado
- **Impacto:** Não foi possível executar parsing/consolidação de dados históricos
- **Recomendação:** Providenciar arquivos de dados reais (guías SENACSA, planilhas de pesagens históricas) para análise

### 2.2 Frontend não tinha seção de pesajes
- O data layer já retornava pesajes via `fetchSingleMovimiento` mas o `MovimientoDetail.jsx` não renderizava esses dados
- **Resolvido:** Adicionada seção completa de pesajes com formulário, lista e reconciliação

### 2.3 Sem testes automatizados
- Não existem testes unitários ou de integração para o módulo de ganado
- Edge Functions não possuem test suite
- **Recomendação:** Criar testes pelo menos para validações críticas (status flow, reconciliação)

---

## 3. DECISÕES TÉCNICAS

### 3.1 Colunas GENERATED (computed)
Escolhi usar `GENERATED ALWAYS AS ... STORED` para 4 colunas em `pesajes_ganado`:
- **Vantagem:** Dados sempre consistentes, sem possibilidade de erro no cálculo
- **Tradeoff:** Colunas não podem ser atualizadas diretamente
- **Justificativa:** peso_neto, peso_promedio e diferenças são derivados puros — nunca devem ser editados manualmente

### 3.2 Tipo pesaje como CHECK constraint (não tabela de lookup)
Os 4 tipos de pesaje (recepcion, despacho, intermedio, verificacion) são fixos e improváveis de mudar. Usar CHECK constraint é mais simples e performante que uma tabela de lookup adicional.

### 3.3 Pesaje permitido em 3 estados
`add-pesaje` permite pesagem nos estados `validado`, `en_transito` e `recibido`:
- **validado:** Para pesagem de despacho na origem
- **en_transito:** Para pesagens intermediárias
- **recibido:** Para pesagem de recepção no destino (caso mais comum)

### 3.4 Reconciliação no frontend (não trigger)
O cálculo de diferença pesaje vs guía é feito via `useMemo` no frontend, não via trigger no banco. Razão: a reconciliação é uma visualização, não precisa ser persistida separadamente — os dados brutos já estão nas colunas GENERATED de cada pesaje.

### 3.5 RLS pattern consistente
Mantive o padrão existente: `authenticated` pode SELECT, apenas `service_role` pode INSERT/UPDATE/DELETE. Todas as escritas passam pelas Edge Functions que validam permissões via `hasPermission()`.

---

## 4. MÉTRICAS DO TRABALHO

| Métrica | Valor |
|---------|-------|
| Arquivos modificados | 8 |
| Arquivos criados | 3 (2 scripts SQL + este relatório) |
| Linhas adicionadas (git diff) | ~1.378 |
| Linhas removidas | ~95 |
| Tabelas no modelo | 7 (completo) |
| Edge Function actions | 14 (completo) |
| Data layer functions | 15+ exports |

---

## 5. PRÓXIMOS PASSOS RECOMENDADOS

### Prioridade Alta
1. **Importar dados históricos** — Providenciar CSVs/Excel com guías, pesajes e lotes reais para popular o banco
2. **Testar em staging** — Executar a migration 015 no ambiente de teste e validar com `validate-schema.sql`
3. **Seed de teste** — Rodar `seed-test-data.sql` para ter dados de demonstração

### Prioridade Média
4. **Relatórios de pesagem** — Criar view/componente dedicado para relatório de reconciliação (pesaje vs guía por período)
5. **Upload de arquivos** — Integrar Supabase Storage para upload de guías PDF e fotos
6. **Impressão de guía** — Template para gerar guía SENACSA em PDF
7. **Notificações** — Alertar quando pesaje tem divergência significativa (>5% peso)

### Prioridade Baixa
8. **Dashboard Ganado** — Gráficos de tendência (cabezas/mes, peso promedio, precios)
9. **Filtros avançados** — Busca por rango de fechas, categorías, estado de pesaje
10. **Testes automatizados** — Jest para data layer, Deno test para Edge Functions
11. **Exportação** — Excel/CSV dos movimentos com detalhes de pesaje

### Considerações de Segurança
- Todas as escritas passam por Edge Functions (service_role) com sanitização
- RLS impede acesso direto via anon client
- Campos de texto sanitizados via `sanitizeText`, `sanitizeName`, `sanitizeMultiline`
- Campos numéricos validados via `sanitizeNumber` com limites min/max

---

## 6. ESTRUTURA FINAL DE ARQUIVOS DO MÓDULO

```
src/
  components/ganado/
    MovimientosScreen.jsx     (200 linhas) — Lista com KPIs e filtros
    MovimientoCard.jsx        (~80 linhas) — Card compacto para lista
    MovimientoDetail.jsx      (904 linhas) — Detalhe completo + pesajes
    NuevoMovimientoForm.jsx   (506 linhas) — Wizard 3 passos
  constants/
    ganado.js                 (383 linhas) — Data layer completo

supabase/
  migrations/
    015_ganado_module.sql     (440 linhas) — 7 tabelas + triggers + RLS
  functions/
    ganado-mutations/
      index.ts                (589 linhas) — 14 actions CRUD

scripts/ganado/
  validate-schema.sql         (126 linhas) — 10 validações
  seed-test-data.sql          (155 linhas) — 3 movimentos de teste
  RELATORIO_TECNICO.md        (este arquivo)
```

---

*Relatório gerado automaticamente durante sessão de trabalho autônomo.*
*Branch: test | Nenhum commit em main | Nenhum deploy realizado.*
