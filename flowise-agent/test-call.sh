#!/bin/bash
# Test script for Head of Product AI
# Usage: ./test-call.sh <CHATFLOW_ID> [API_KEY]

CHATFLOW_ID="${1:?Usage: ./test-call.sh <CHATFLOW_ID> [API_KEY]}"
API_KEY="${2:-}"
BASE_URL="${FLOWISE_URL:-http://localhost:3000}"

AUTH_HEADER=""
if [ -n "$API_KEY" ]; then
  AUTH_HEADER="-H \"Authorization: Bearer $API_KEY\""
fi

echo "=== Testing Head of Product AI ==="
echo "Endpoint: $BASE_URL/api/v1/prediction/$CHATFLOW_ID"
echo ""

# Test 1: Valid transcript (Portuguese)
echo "--- Test 1: Valid Portuguese transcript ---"
curl -s -X POST "$BASE_URL/api/v1/prediction/$CHATFLOW_ID" \
  -H "Content-Type: application/json" \
  ${API_KEY:+-H "Authorization: Bearer $API_KEY"} \
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

echo ""
echo "--- Test 2: Valid Spanish transcript ---"
curl -s -X POST "$BASE_URL/api/v1/prediction/$CHATFLOW_ID" \
  -H "Content-Type: application/json" \
  ${API_KEY:+-H "Authorization: Bearer $API_KEY"} \
  -d '{
    "question": "Cliente: El problema es que cuando compramos insumos para el feedlot, no tenemos un sistema para comparar precios entre proveedores. Todo se hace por WhatsApp y a veces compramos más caro porque no recordamos la última cotización. Entrevistador: Cuánto estima que pierde? Cliente: Fácil un 10-15% en sobrecostos. En un feedlot de 5000 cabezas, eso es mucha plata.",
    "overrideConfig": {
      "vars": {
        "source": "plaud",
        "date": "2026-03-01",
        "customer_name": "Estancia La Pampa"
      }
    }
  }' | python3 -m json.tool

echo ""
echo "=== Tests complete ==="
