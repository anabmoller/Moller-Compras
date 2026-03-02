#!/usr/bin/env bash
set -euo pipefail

AM_BLUE="#1F2A44"
AM_BLUE_DARK="#0F172A"
AM_MUSTARD="#C8A03A"
AM_MUSTARD_DARK="#A67C00"

echo "==[1] Fix favicon + title icons =="

# garantir public/
mkdir -p public

# favicon AMs (azul + mostarda)
cat > public/favicon.svg <<EOF
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="${AM_BLUE}"/>
  <rect x="2" y="2" width="60" height="60" rx="12" fill="none" stroke="${AM_MUSTARD}" stroke-opacity="0.55" stroke-width="2"/>
  <text x="32" y="41" text-anchor="middle"
        font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
        font-size="22" font-weight="800" fill="${AM_MUSTARD}">AMs</text>
</svg>
EOF

# remover duplicata do link de favicon e garantir 1 linha
if [ -f index.html ]; then
  LINE='<link rel="icon" type="image/svg+xml" href="/favicon.svg" />'
  # remove todas ocorrências e reinsere uma vez (evita duplicadas)
  perl -0777 -i -pe "s/\\Q$LINE\\E\\s*//g; s#</head>#$LINE\\n</head>#s" index.html
fi

echo "==[2] Trocar 'Y' por 'AMs' em auth/layout =="

# Troca literal em spans do auth + layout
grep -rl '>Y<' src/components/auth 2>/dev/null | xargs -I{} sed -i '' 's/>Y</>AMs</g' {} || true
grep -rl '>Y<' src/components/layout 2>/dev/null | xargs -I{} sed -i '' 's/>Y</>AMs</g' {} || true

# Também pega casos com "Y" dentro do logo (mais amplo, mas só em layout/auth)
perl -pi -e 's/(>)(\s*)Y(\s*)(<)/$1$2AMs$3$4/g' src/components/auth/*.jsx 2>/dev/null || true
perl -pi -e 's/(>)(\s*)Y(\s*)(<)/$1$2AMs$3$4/g' src/components/layout/*.jsx 2>/dev/null || true

echo "==[3] Padronizar logo (azul + mostarda + borda) no auth (Login/ChangePassword) =="

# Ajusta o "quadrado" do logo (bg azul, borda mostarda, sombra neutra)
for f in src/components/auth/LoginScreen.jsx src/components/auth/ChangePasswordScreen.jsx; do
  [ -f "$f" ] || continue

  # bg do quadrado do logo -> azul
  perl -pi -e "s/bg-\\[#1F2A44\\]/bg-\\[${AM_BLUE}\\]/g" "$f"

  # adiciona ring/borda mostarda no wrapper do logo (w-14 h-14 rounded-xl ...)
  perl -0777 -i -pe "s/(w-14 h-14 rounded-xl [^\"]*)/\\1 ring-1 ring-\\[${AM_MUSTARD}\\]\\/50/g" "$f"

  # texto do logo -> mostarda (e um pouco menor p/ caber AMs)
  perl -pi -e "s/text-white text-2xl/text-\\[${AM_MUSTARD}\\] text-xl/g" "$f"

  # sombra verde -> sombra neutra
  perl -pi -e "s/shadow-emerald-[0-9]+\\/[0-9]+/shadow-black\\/20/g; s/shadow-emerald-[0-9]+/shadow-black\\/20/g" "$f"

  # botão submit: força contraste (light mode estava ficando escuro)
  # troca "text-white" por "!text-white" e adiciona borda mostarda leve
  perl -0777 -i -pe "s/(type=\\\"submit\\\"[^>]*className=\\{`[^`]*?)text-white/\\1!text-white/g" "$f"
  perl -0777 -i -pe "s/(type=\\\"submit\\\"[^>]*className=\\{`[^`]*?)border-none/\\1border border-\\[${AM_MUSTARD}\\]\\/35/g" "$f"
done

echo "==[4] Remover verde da UI (emerald -> mostarda/azul) exceto onde você quiser manter como 'aceite' =="

# Regra geral:
# - textos emerald -> mostarda escura (melhor contraste no branco)
# - bg emerald -> azul institucional
# - bordas emerald -> mostarda suave
# - gradientes emerald -> azul (mantém marca consistente)
# OBS: isso pode trocar até lugares que você queria verde. Depois a gente repõe só nos 'aceites'.
FILES=$(grep -RIl "emerald-" src 2>/dev/null || true)
if [ -n "${FILES:-}" ]; then
  while IFS= read -r f; do
    [ -f "$f" ] || continue
    perl -pi -e "s/text-emerald-[0-9]+/text-\\[${AM_MUSTARD_DARK}\\]/g" "$f"
    perl -pi -e "s/border-emerald-[0-9]+\\/([0-9]+)/border-\\[${AM_MUSTARD}\\]\\/\\1/g" "$f"
    perl -pi -e "s/border-emerald-[0-9]+/border-\\[${AM_MUSTARD}\\]/g" "$f"
    perl -pi -e "s/bg-emerald-[0-9]+\\/([0-9]+)/bg-\\[${AM_BLUE}\\]\\/\\1/g" "$f"
    perl -pi -e "s/bg-emerald-[0-9]+/bg-\\[${AM_BLUE}\\]/g" "$f"
    perl -pi -e "s/from-emerald-[0-9]+/from-\\[${AM_BLUE}\\]/g; s/to-emerald-[0-9]+/to-\\[${AM_BLUE_DARK}\\]/g" "$f"
    perl -pi -e "s/shadow-emerald-[0-9]+\\/[0-9]+/shadow-black\\/10/g; s/shadow-emerald-[0-9]+/shadow-black\\/10/g" "$f"
  done <<< "$FILES"
fi

echo "==[5] Garantir textos principais (casos clássicos) =="

# Se sobrar "YPOTI" visível em layout/auth, troca para AM Soluciones
grep -RIl ">YPOTI<" src 2>/dev/null | xargs -I{} perl -pi -e 's/>YPOTI</>AM Soluciones</g' {} || true
grep -RIl "YPOTI Compras" src index.html 2>/dev/null | xargs -I{} perl -pi -e 's/YPOTI Compras/AM Soluciones/g' {} || true

echo "==[6] Build + git =="

npm run build

git status
git add -A
git commit -m "Rebrand UI: AM Soluciones (favicon, AMs logo, mustard/blue, contrast)" || echo "Nada novo para commitar."
git push origin main

echo "==[DONE]=="
echo "Agora rode: npm run dev"
echo "Depois, no Chrome: Hard Refresh (Cmd+Shift+R) pra atualizar favicon."
