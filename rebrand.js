const fs = require("fs");
const path = require("path");

const AM_BLUE = "#1F2A44";
const AM_BLUE_DARK = "#0F172A";
const AM_MUSTARD = "#C8A03A";
const AM_MUSTARD_DARK = "#A67C00";

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      walk(full, callback);
    } else {
      callback(full);
    }
  });
}

console.log("==[1] Fix favicon ==");

// Garantir public/
if (!fs.existsSync("public")) fs.mkdirSync("public");

fs.writeFileSync(
  "public/favicon.svg",
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="${AM_BLUE}"/>
  <rect x="2" y="2" width="60" height="60" rx="12"
        fill="none" stroke="${AM_MUSTARD}" stroke-opacity="0.55" stroke-width="2"/>
  <text x="32" y="41" text-anchor="middle"
        font-family="Inter, system-ui, sans-serif"
        font-size="22" font-weight="800"
        fill="${AM_MUSTARD}">AMs</text>
</svg>`
);

// Limpar duplicatas no index.html
if (fs.existsSync("index.html")) {
  let html = fs.readFileSync("index.html", "utf8");
  html = html.replace(/<link rel="icon"[^>]*>/g, "");
  html = html.replace("</head>", `  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n</head>`);
  fs.writeFileSync("index.html", html);
}

console.log("==[2] Rebrand UI ==");

walk("src", file => {
  if (!file.endsWith(".jsx") && !file.endsWith(".js")) return;

  let content = fs.readFileSync(file, "utf8");

  // Y → AMs
  content = content.replace(/>Y</g, ">AMs<");

  // emerald → mustard/blue
  content = content.replace(/text-emerald-\d+/g, `text-[${AM_MUSTARD_DARK}]`);
  content = content.replace(/bg-emerald-\d+/g, `bg-[${AM_BLUE}]`);
  content = content.replace(/border-emerald-\d+/g, `border-[${AM_MUSTARD}]`);
  content = content.replace(/from-emerald-\d+/g, `from-[${AM_BLUE}]`);
  content = content.replace(/to-emerald-\d+/g, `to-[${AM_BLUE_DARK}]`);

  // reforçar contraste botão azul
  content = content.replace(
    /bg-\[#1F2A44\]/g,
    `bg-[#1F2A44] hover:bg-[#162033] shadow-md shadow-black/20`
  );

  fs.writeFileSync(file, content);
});

console.log("==[DONE]==");
