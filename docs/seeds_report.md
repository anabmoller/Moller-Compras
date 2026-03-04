# 📊 RELATÓRIO DE SEEDS DE DADOS REAIS — Módulo Ganado

**Data:** 2026-03-03
**Gerado por:** Claude Code (análise autônoma)
**Branch:** test

---

## 1. Análise de Fontes de Dados

### 1.1 GUIAS_ACTUALIZADAS.xlsx (Fonte Principal)

| Atributo | Valor |
|----------|-------|
| **Sheets** | 3 (data-1772035247106, Hoja1, Hoja2) |
| **Registros únicos** | 4,501 linhas → **2,328 guías únicas** |
| **Colunas** | 35 |
| **Período** | 25/10/2023 a 01/12/2026 |
| **Proveedores únicos** | 302 (id_empresa_origen) |
| **Establecimientos origen** | 289 (cod_establecimiento_origen) |
| **Empresas destino** | 16 |
| **Establecimientos destino** | 17 |
| **Total animales** | **208,138 cabezas** |

**Estrutura por registro:** Cada linha = 1 guía + 1 categoria animal.
Uma guía pode ter 1-3 linhas (uma por categoria).

#### Distribuição por Finalidade

| Finalidad | Animales | Linhas | % |
|-----------|----------|--------|---|
| Engorde | 150,713 | 3,144 | 72.4% |
| Faena | 49,599 | 1,202 | 23.8% |
| Cría | 7,566 | 150 | 3.6% |
| **TOTAL** | **208,138** | **4,496** | **100%** |

> ⚠️ Nota: Dados brutos têm inconsistências no campo `finalidad`: "Cra" (→ Cria), "ENGORDE" (→ Engorde), e um valor de latitude vazado.

#### Distribuição por Categoria Animal

| Categoria | Código | Total Animales | % | Prom/guía |
|-----------|--------|---------------|---|-----------|
| Toros | Tor | 115,413 | 55.5% | 44.0 |
| Destete Macho | DM | 58,533 | 28.1% | 50.8 |
| Terneros | Ter | 32,355 | 15.5% | 48.9 |
| Destete Hembra | DH | 918 | 0.4% | 57.4 |
| Novillos | Nov | 592 | 0.3% | 18.5 |
| Vaquillonas | Vaq | 327 | 0.2% | 25.2 |
| **TOTAL** | | **208,138** | **100%** | |

#### Cross-tab: Finalidad × Categoria

| Finalidad | DH | DM | Novillos | Terneros | Toros | Vaquillonas | TOTAL |
|-----------|---:|---:|--------:|--------:|------:|-----------:|------:|
| Engorde | 160 | 56,440 | 492 | 28,114 | 65,194 | 313 | 150,713 |
| Faena | 0 | 0 | 0 | 0 | 49,599 | 0 | 49,599 |
| Cría | 758 | 1,933 | 0 | 4,241 | 620 | 14 | 7,566 |

> 📌 **Insight:** Faena é 100% Toros. Engorde é diversificado. Cría tem maioria DM+Terneros.

#### Top 10 Proveedores por Volume

| # | Empresa | RUC | Total Animales | Guías |
|---|---------|-----|---------------|-------|
| 1 | RURAL BIOENERGIA S.A | 80050418-6 | 114,184 | 1,365 |
| 2 | CHACOBRAS SA | 80100684-8 | 6,916 | 67 |
| 3 | LA CONSTANCIA E.A.S. | 80141439-3 | 3,118 | 34 |
| 4 | GANADERA TROPICAL S.A. | 80002149-5 | 2,284 | 17 |
| 5 | GAN. FORESTAL STA CATALINA | 80027594-2 | 2,100 | 14 |
| 6 | ISABEL SUSANA BARSZEZ | 441297-4 | 1,836 | 13 |
| 7 | PEDRO TICIANELLI MOLLER | 8717666-1 | 1,634 | 23 |
| 8 | ROSALIA BOGARIN BENITEZ | 4019257-1 | 1,626 | 14 |
| 9 | AGROGANAD. BUENA ESPERANZA | 80025379-5 | 1,600 | 10 |
| 10 | GONI DE VILLASANTI | 370261 | 1,345 | 18 |

> 📌 **Insight:** Rural Bioenergia = 55% de todos os animales (é a empresa principal do grupo).

#### Top Empresas Destino

| Empresa | RUC | Animales Recibidos |
|---------|-----|-------------------|
| RURAL BIOENERGIA S.A | 80050418-6 | ~146,096 |
| FRIGORIFICO CONCEPCION | 80023325-5 | ~42,861 |
| BEEF PARAGUAY S.A | 80028211-6 | ~6,738 |
| CHACOBRAS SA | 80100684-8 | ~6,820 |

---

### 1.2 CSVs de Pesaje (TruTest)

Três arquivos de pesagem eletrônica de gado:

| Arquivo | Local | Registros | Peso Médio | Categoria Dominante |
|---------|-------|-----------|------------|---------------------|
| Pesaje Yby Porã | Yby Pora | 2,441 | 282.7 kg | Desmamante |
| Pesaje Cerro Memby | Cerro Memby | 4,491 | 254.4 kg | Desmamantes |
| Pesaje Santa Clara | Santa Clara / Lusipar | 3,564 | 319.7 kg | Toro |
| **TOTAL** | | **10,496** | **282.6 kg** | |

**Estatísticas de Peso Combinadas:**

| Métrica | Yby Porã | Cerro Memby | Santa Clara |
|---------|----------|-------------|-------------|
| Mín | 1 kg | 75 kg | 176 kg |
| Máx | 550 kg | 678 kg | 490 kg |
| Média | 282.7 kg | 254.4 kg | 319.7 kg |
| Mediana | 283 kg | 233 kg | 317.5 kg |

**Datas de pesagem:** 17-26/Fev/2026 (todas recentes)

**Dados únicos por arquivo:**
- **Yby Porã:** 31 proveedores, 21 comisionistas, raças (Hibrido, Zebu, Nelor)
- **Cerro Memby:** 48 proveedores, 41 est. origem, dados de trazabilidade NAC (OK/NO TRAZADO)
- **Santa Clara:** 149 proveedores, 113 lugares de compra, 1 COTA encontrado (`00211256000729`), preço unitário (média 3.02 USD/kg)

> 📌 **Insight:** Apenas Santa Clara tem "Numero de Cota" (coluna), mas com apenas 1 valor preenchido. Os CSVs são pesagens internas, não vinculadas diretamente às guías SENACSA.

---

### 1.3 Arquivos Excel Auxiliares (Ganaderia_Agro/)

| Arquivo | Tipo | Conteúdo Principal |
|---------|------|--------------------|
| Controle acerto ganado.xlsx | Template | Modelo de acerto/liquidação por animal (custos) |
| Compras Lusipar - Bruto.xlsx | OCR Raw | 132 scans brutos de COTAs (texto OCR) |
| Compras Lusipar - Processado.xlsx | Parsed | 75 compras processadas com COTA/Guia/categorias |
| Teste Cerre Ganado.xlsx | Inventário | 11 sheets de reconciliação Real vs SIGOR |
| Tru-Test Medina.xlsx | Pesaje Individual | 46 animais com IDE, peso, classificação |

**Destaques:**

- **Processado (74 COTAs):** Melhor fonte para movimientos tipo "compra", período Fev-Jun 2025, 3,952 animais totais (DM=1,858 + Ter=1,981 + Tor=58 + Nov=55)
- **Teste Cerre:** 11 establecimientos com balanço Real vs SIGOR (sistema SENACSA). Mostra discrepâncias significativas em alguns meses.
- **Medina:** Pesaje individual com 3 COTAs e 3 Guías específicas, peso médio 152.8 kg (desmamantes jovens)

---

### 1.4 PDFs (Análise Estrutural)

| Arquivo | Tipo |
|---------|------|
| Solicitud De Propuesta Comercial | Template de proposta de venda |
| Propuesta de Venta de Ganado | Proposta para frigorífico |
| Notificación de Terminación | Aviso de ganado pronto para faena |
| CGA-POL-001 Política de Compras | Política interna de compras |
| GUIAS FIDEICOMISO.pdf | Guías de fideicomisso (separado) |

> Os PDFs são documentos de processo/política, não dados transacionais. Sem COTAs adicionais identificados.

---

## 2. Seeds Gerados

### ✅ `supabase/seeds/002_proveedores_reales.sql`
- **50 proveedores ganaderos** (top por volume de animales)
- ON CONFLICT: atualiza `is_ganadero = true` se já existir
- Inclui os 6 proveedores do grupo (Rural Bioenergia, Chacobras, La Constancia, Pedro/Gabriel/Ana Moller)
- Inclui Top 10 externos + 40 adicionais

### ✅ `supabase/seeds/003_establecimientos_reales.sql`
- **Atualiza** 6 establecimientos propios com códigos SENACSA
- **Insere** 5 establecimientos destino (frigoríficos)
- **Insere** 30 establecimientos de origen de proveedores
- Marca frigoríficos em `companies.is_frigorifico`

### ✅ `supabase/seeds/004_movimientos_historicos.sql`
- **20 movimientos representativos:**
  - 15 cerrados (históricos, Jun 2025 - Feb 2026)
  - 1 en_transito (para testar fluxo)
  - 1 pendiente_validacion
  - 1 borrador (sem guia/COTA)
  - 1 recibido (com pesaje de exemplo)
  - 1 validado (pronto para despacho)
- Cada movimiento tem detalle_movimiento_categorias
- Cada movimiento tem movimiento_estados_log
- Usa DO $$ block com subqueries para resolver FKs
- Totaliza ~1,100+ animais no sample

---

## 3. Qualidade dos Dados

### Problemas Identificados

| Problema | Severidade | Ação Tomada |
|----------|------------|-------------|
| `finalidad` com variantes (Cra, ENGORDE) | Média | Normalizado nos seeds |
| Coordenadas corrompidas (valores em bilhões) | Baixa | Ignorado (6% dos registros) |
| RUCs sem formatação consistente | Média | Usado formato original do Excel |
| Datas futuras (2026-12-01) | Baixa | Mantidas (podem ser planejadas) |
| CSVs sem vínculo COTA/Guía | Informativo | Pesajes são dados internos |
| Spelling variants (Bioenerjia, Bella Bista) | Baixa | Mantido spelling do Excel |

### Cobertura de Dados

| Campo | Cobertura |
|-------|-----------|
| nro_guia | 100% |
| nro_cota | 100% (2,329 únicos) |
| empresa_origen (ruc, nombre) | 99.9% |
| establecimiento_origen (código) | 99.9% |
| coordenadas_origen | 94% |
| coordenadas_destino | 99.8% |
| telefono/email empresa | <11% (quase todo NULL) |
| categorias + quantidades | 100% |

---

## 4. Métricas de Trabalho

| Item | Quantidade |
|------|-----------|
| Arquivos analisados | 11 (1 xlsx principal + 3 csv + 5 xlsx auxiliar + 2 pdf) |
| Registros processados | ~20,000+ |
| Seeds criados | 3 arquivos SQL |
| Proveedores no seed | 50 |
| Establecimientos no seed | ~41 |
| Movimientos no seed | 20 (com categorias + estados) |
| Linhas SQL geradas | ~500+ |

---

## 5. Próximos Passos

### Imediato (Ana deve fazer)
1. ✅ Aplicar migration `015_ganado_module.sql` no Supabase SQL Editor
2. 📋 Aplicar seeds na ordem:
   - `002_proveedores_reales.sql`
   - `003_establecimientos_reales.sql`
   - `004_movimientos_historicos.sql`
3. 🧪 Testar frontend → Navegar para 🐄 Ganado e verificar dados

### Curto prazo
4. 🔄 Importar TODOS os 2,328 movimientos (batch script)
5. 🔗 Vincular pesajes dos CSVs com movimientos por COTA/Guía
6. 📊 Deploy Edge Functions `ganado-mutations` no Supabase
7. ✅ Testar fluxo completo: borrador → validado → en_transito → recibido → cerrado

### Médio prazo
8. 📈 Dashboard de estatísticas de ganado
9. 🗺️ Mapa de movimentações (usando coordenadas)
10. 📋 Importação automática de COTAs (scan → BD)
11. ⚖️ Integração TruTest → pesajes_ganado automatizado

---

## 6. Observações Técnicas

### Decisões de Design nos Seeds

1. **ON CONFLICT (ruc) DO UPDATE** — Permite re-executar o seed sem duplicar dados
2. **DO $$ block** — Usado para movimientos para resolver FKs dinamicamente por nome/código
3. **Mix de estados** — Incluímos movimientos em TODOS os estados para testar o frontend
4. **Pesaje de exemplo** — 1 movimiento "recibido" com pesaje para testar a UI de pesajes
5. **Trigger de auto-number** — Deixamos o trigger gerar `MG-2026-001, 002...` automaticamente

### Mapeamento Categorias SENACSA → BD

| Código Excel | Código BD | Nome BD |
|-------------|-----------|---------|
| DM | DM | Destete Macho |
| DH | DH | Destete Hembra |
| Tor | TOR | Torito/Toro |
| Nov | NOV | Novillito/Novillo |
| Vaq | VAQ | Vaquillona/Vaca |
| Ter | TER | Ternero/a |

> ⚠️ **Atenção:** O Excel usa `Tor` mas a migration usa `TOR`. O seed do Cowork usa uppercase. Verificar que os 6 registros existem com o código correto.
