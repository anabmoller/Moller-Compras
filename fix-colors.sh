#!/bin/bash
set -e

echo "== 1. Definir cores oficiais =="
AM_BLUE="#1F2A44"
AM_MUSTARD="#C8A03A"

echo "== 2. Substituir emerald por mostarda (visual principal) =="

# Substitui emerald em classes Tailwind
grep -rl "emerald" src | while read f; do
  sed -i '' 's/from-emerald-600/from-\[#C8A03A\]/g' "$f" || true
  sed -i '' 's/to-emerald-600/to-\[#C8A03A\]/g' "$f" || true
  sed -i '' 's/to-emerald-800/to-\[#1F2A44\]/g' "$f" || true
  sed -i '' 's/text-emerald-400/text-\[#C8A03A\]/g' "$f" || true
  sed -i '' 's/text-emerald-300/text-\[#C8A03A\]/g' "$f" || true
  sed -i '' 's/border-emerald-500/border-\[#C8A03A\]/g' "$f" || true
  sed -i '' 's/bg-emerald-500/bg-\[#C8A03A\]/g' "$f" || true
  sed -i '' 's/shadow-emerald-600\/20/shadow-black\/20/g' "$f" || true
done

echo "== 3. Ajustar gradientes Analytics para azul + mostarda =="

grep -rl "gradient-to-br" src | while read f; do
  sed -i '' 's/from-\[#C8A03A\]/from-\[#1F2A44\]/g' "$f" || true
done

echo "== 4. Garantir que verde só fique para ACEITE (semafóro) =="

grep -rl "text-green" src | while read f; do
  sed -i '' 's/text-green-600/text-\[#16A34A\]/g' "$f" || true
done

echo "== 5. Melhorar contraste Light Mode =="

grep -rl "bg-white" src | while read f; do
  sed -i '' 's/bg-white/bg-\[#F8F9FB\]/g' "$f" || true
done

echo "== 6. Build =="
npm run build

echo "== 7. Commit e Push =="
git add -A
git commit -m "UI color system: remove emerald, enforce blue + mustard, improve light contrast" || echo "Nada novo"
git push origin main

echo "== DONE =="
echo "Agora rode: npm run dev"
