# Head of Product AI — Flowise Agent

Analyzes livestock customer conversation transcripts (tl;dv, Plaud) and returns structured product insights as strict JSON.

---

## Architecture

```
┌─────────────┐     POST /api/v1/prediction/{id}     ┌──────────────────┐
│   Zapier     │ ──────────────────────────────────── │    Flowise       │
│  (Webhook)   │                                      │   (Docker)       │
└─────────────┘                                       │                  │
                                                      │  ┌────────────┐ │
                                                      │  │ LLM Chain  │ │
                                                      │  │            │ │
                                                      │  │ Prompt ──► │ │
                                                      │  │ Claude ──► │ │
                                                      │  │ Parser ──► │ │
                                                      │  └────────────┘ │
                                                      └────────┬───────┘
                                                               │ JSON
                                                               ▼
                                                      ┌──────────────────┐
                                                      │  Zapier → Notion │
                                                      │  (DB item)       │
                                                      └──────────────────┘
```

**How it works:**
1. Flowise exposes every chatflow as a REST endpoint: `POST /api/v1/prediction/{chatflowId}`
2. Zapier sends transcript data as the `question` field (the chatflow's input)
3. The LLM Chain pipes: **Prompt Template** → **Claude (Anthropic)** → **Structured Output Parser**
4. Flowise returns parsed JSON → Zapier maps fields to Notion database columns

No custom server needed. Flowise's built-in API handles HTTP, auth, and routing.

---

## 1. Setup — Local (Docker)

### Prerequisites
- Docker Desktop installed on Mac
- Anthropic API key

### Start Flowise

```bash
cd flowise-agent

# Create your .env from the example
cp .env.example .env
# Edit .env — set a strong FLOWISE_PASSWORD

# Start
docker compose up -d

# Check it's running
docker compose logs -f flowise
```

Flowise UI: **http://localhost:3000**

Log in with the credentials from `.env`.

### Configure Anthropic API Key

1. In Flowise UI → **Credentials** (left sidebar, key icon)
2. Click **Add Credential** → select **ChatAnthropic**
3. Name: `Anthropic Production`
4. Paste your `ANTHROPIC_API_KEY`
5. Save

### Import the Chatflow

1. In Flowise UI → **Chatflows** (left sidebar)
2. Click **+** (top right) → **Load Chatflow**
3. Upload `chatflow-head-of-product-ai.json`
4. The canvas should show 4 nodes wired together:
   - **ChatAnthropic** (model)
   - **Prompt Template** (the analysis prompt)
   - **Structured Output Parser** (enforces JSON schema)
   - **LLM Chain** (orchestrator)

### Wire the Credential

1. Click the **ChatAnthropic** node
2. In the **Credential** dropdown, select `Anthropic Production`
3. Verify model: `claude-sonnet-4-20250514` (or upgrade to `claude-opus-4-20250514` for deeper analysis)
4. Temperature: `0.1` (keep it deterministic)
5. Click **Save Chatflow** (top right)

### Get the Chatflow ID

After saving, the URL will look like:
```
http://localhost:3000/canvas/{CHATFLOW_ID}
```
Copy that `CHATFLOW_ID` — you'll need it for API calls.

### (Optional) Set an API Key for the Chatflow

1. Click **Settings** icon (gear) on the chatflow
2. Under **API Key**, create or assign one
3. This protects the endpoint — Zapier will include it as `Authorization: Bearer {key}`

---

## 2. Chatflow Nodes Explained

| # | Node | Purpose |
|---|------|---------|
| 1 | **ChatAnthropic** | Claude LLM. Model: `claude-sonnet-4-20250514`, temp: 0.1, max tokens: 4096 |
| 2 | **Prompt Template** | Contains the full system prompt with `{transcript}`, `{source}`, `{date}`, `{customer_name}` variables |
| 3 | **Structured Output Parser** | Validates output against the JSON schema. `autoFix: true` asks Claude to retry if malformed |
| 4 | **LLM Chain** | Connects model → prompt → parser. Exposes as prediction API endpoint |

### Wiring

```
ChatAnthropic ────► LLM Chain (model input)
Prompt Template ──► LLM Chain (prompt input)
Output Parser ────► LLM Chain (outputParser input)
```

---

## 3. Prompt Template Variables

The Prompt Template uses 4 variables. When calling the API, pass them via `overrideConfig`:

| Variable | Source | Required |
|----------|--------|----------|
| `transcript` | Maps to `question` (the main input) | Yes |
| `source` | `overrideConfig.vars.source` | Yes |
| `date` | `overrideConfig.vars.date` | Yes |
| `customer_name` | `overrideConfig.vars.customer_name` | No |

**Important:** Flowise's prediction API accepts `question` as the primary input. We use it for the transcript. The other variables go in `overrideConfig`.

---

## 4. Calling the API — curl Examples

### Basic call (transcript as question)

```bash
curl -s -X POST http://localhost:3000/api/v1/prediction/YOUR_CHATFLOW_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FLOWISE_API_KEY" \
  -d '{
    "question": "Cliente: Eu perco muito tempo registrando a movimentação de gado manualmente. Às vezes erro os números e só descubro no final do mês. Entrevistador: Como você faz hoje? Cliente: Tudo numa planilha Excel. Meu peão anota no papel e eu digito depois. Já perdi boi por causa de erro de contagem. Entrevistador: Qual o impacto? Cliente: Mês passado tive uma diferença de 12 cabeças. Isso são quase 60 mil reais em gado que não sei onde está.",
    "overrideConfig": {
      "vars": {
        "source": "tldv",
        "date": "2026-03-04",
        "customer_name": "Fazenda São Jorge"
      }
    }
  }' | python3 -m json.tool
```

### Expected response

```json
{
  "summary": "O cliente da Fazenda São Jorge relata perdas significativas por erros na contabilização manual de movimentação de gado. A operação depende de anotações em papel e digitação posterior em Excel, resultando em discrepâncias de inventário.",
  "pain_point": "Erros frequentes na contagem e registro manual de movimentação de gado, causando discrepâncias de inventário que só são descobertas no final do mês.",
  "current_workaround": "Peão anota movimentações em papel, proprietário digita manualmente em planilha Excel posteriormente.",
  "business_impact": "Diferença de 12 cabeças em um único mês, representando aproximadamente R$ 60.000 em gado não rastreado.",
  "software_opportunity": "Sistema de registro digital de movimentação de gado em tempo real com validação automática de contagens e alertas de discrepância.",
  "suggested_feature": "Movimentação Digital de Gado — registro por celular no campo com contagem assistida e reconciliação automática de inventário.",
  "product_module": "Ganado",
  "priority": "High",
  "customer_quote": "Mês passado tive uma diferença de 12 cabeças. Isso são quase 60 mil reais em gado que não sei onde está.",
  "tags": ["ganado", "movimentacao", "rastreabilidade", "inventario", "registro_manual"]
}
```

### Error scenario (empty transcript)

```bash
curl -s -X POST http://localhost:3000/api/v1/prediction/YOUR_CHATFLOW_ID \
  -H "Content-Type: application/json" \
  -d '{"question": ""}' | python3 -m json.tool
```

Returns standard Flowise error JSON with status code.

---

## 5. Zapier Integration

### Step 1: Trigger — tl;dv or Plaud

**Option A: tl;dv**
- Trigger: "New Recording" or "New Transcript" in tl;dv
- Output fields: `transcript`, `meeting_date`, `participants`

**Option B: Plaud**
- Trigger: "New Transcription" in Plaud
- Output fields: `transcript`, `date`, `title`

**Option C: Google Drive (fallback)**
- If tl;dv/Plaud lack a Zapier trigger, export transcripts to Google Drive
- Trigger: "New File in Folder" → read file content

### Step 2: Action — Webhooks by Zapier (POST)

Configure:
| Field | Value |
|-------|-------|
| **URL** | `http://YOUR_SERVER:3000/api/v1/prediction/YOUR_CHATFLOW_ID` |
| **Method** | POST |
| **Content Type** | `application/json` |
| **Headers** | `Authorization: Bearer YOUR_FLOWISE_API_KEY` |
| **Body** | See below |

**Body (raw JSON):**
```json
{
  "question": "{{transcript from step 1}}",
  "overrideConfig": {
    "vars": {
      "source": "tldv",
      "date": "{{meeting_date from step 1}}",
      "customer_name": "{{participant_name from step 1}}"
    }
  }
}
```

Replace `tldv` with `plaud` if using Plaud trigger.

### Step 3: Action — Notion "Create Database Item"

Map the webhook response fields to Notion columns:

| Notion Column | Zapier Mapping | Notion Property Type |
|---------------|----------------|---------------------|
| Name / Title | `summary` | Title |
| Pain Point | `pain_point` | Rich Text |
| Current Workaround | `current_workaround` | Rich Text |
| Business Impact | `business_impact` | Rich Text |
| Software Opportunity | `software_opportunity` | Rich Text |
| Suggested Feature | `suggested_feature` | Rich Text |
| Module | `product_module` | Select |
| Priority | `priority` | Select |
| Customer Quote | `customer_quote` | Rich Text |
| Tags | `tags` (join with comma) | Multi-select |
| Source | `source` (from step 1) | Select |
| Date | `date` (from step 1) | Date |
| Customer | `customer_name` (from step 1) | Rich Text |

**Tip:** In Zapier, use a Formatter step to join the `tags` array into comma-separated text before mapping to Notion multi-select.

---

## 6. JSON Output Schema

```json
{
  "summary": "",
  "pain_point": "",
  "current_workaround": "",
  "business_impact": "",
  "software_opportunity": "",
  "suggested_feature": "",
  "product_module": "",
  "priority": "Low | Medium | High",
  "customer_quote": "",
  "tags": []
}
```

On error, Flowise returns:
```json
{
  "error": "Error message description"
}
```

---

## 7. Future Enhancements (RAG + Multi-Agent)

### Adding RAG (Knowledge Base)

To add context from past transcripts, product docs, or roadmap:

1. Add a **Pinecone** or **Chroma** vector store node
2. Add a **Document Loaders** node (PDF, text files, Notion)
3. Add a **Recursive Character Text Splitter**
4. Switch from **LLM Chain** to **Conversational Retrieval QA Chain**
5. Wire: Document Loader → Splitter → Vector Store → Retrieval Chain

This lets the agent reference prior insights when analyzing new transcripts.

### Multi-Agent Pipeline

Future agents to add as separate chatflows:

| Agent | Purpose |
|-------|---------|
| **Head of Product AI** (this one) | Transcript → structured insight |
| **Prioritizer Agent** | Batch of insights → ranked backlog |
| **Deduplication Agent** | Compare new insight vs existing → flag duplicates |
| **Roadmap Writer Agent** | Group of insights → PRD draft |

Chain them via Zapier: output of one → input of next.

---

## 8. Production Hardening

See `PRODUCTION.md` for detailed notes.
