import { readFileSync, writeFileSync } from 'fs';

const csv = readFileSync('/Users/ana/Downloads/2026-02-27 - grupo-moller.csv', 'utf8');
const lines = csv.split('\n');

function norm(s) { return (s||'').trim().replace(/\s+/g,' '); }
function titleCase(s) {
  return norm(s).split(' ').map(w => {
    if (w.length <= 2 && ['de','da','do','y','e'].includes(w.toLowerCase())) return w.toLowerCase();
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }).join(' ');
}

function genUsername(first, last) {
  const f = norm(first).split(/\s+/)[0].toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z]/g,'');
  let l = norm(last).split(/\s+/)[0].toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z]/g,'');
  if (!l) l = 'x';
  return f + '.' + l;
}

function genAvatar(first, last) {
  const f = norm(first).charAt(0).toUpperCase();
  const l = norm(last).charAt(0).toUpperCase() || 'X';
  return f + l;
}

function assignRole(pos) {
  const p = (pos||'').toUpperCase();
  if (p.includes('PRESIDENTE') || p.includes('CEO')) return 'admin';
  if (p.includes('GERENTE') || p.includes('DIRETOR') || p.includes('DIRECTOR')) return 'gerente';
  // Administrative roles should be comprador even if they have SUPERVISOR/ENCARGAD prefix
  if (p.includes('ADMINISTRATI') || p.includes('CONTAB') || p.includes('ANALISTA') ||
      p.includes('PAGOS') || p.includes('DEPÓSITO') || p.includes('DEPOSITO') ||
      p.includes('BASCULERO') || p.includes('ASISTENTE ADM') || p.includes('ASISTENTE CONFINAMENTO')) return 'comprador';
  // Operational leaders
  if (p.includes('SUPERVISOR') || p.includes('COORDENADOR') || p.includes('COORDINADOR') ||
      p.includes('CAPATAZ') || p.includes('ENCARGAD') || p.includes('JEFE') ||
      p.includes('LÍDER') || p.includes('LIDER') || p.includes('REGENTE')) return 'lider';
  return 'solicitante';
}

function mapEstab(dept) {
  const d = (dept||'').toUpperCase().trim();
  if (!d || d === 'DIRECTORY_INTERNAL') return 'General';
  if (d.startsWith('YPOTI') || d.includes('CONFINAMENTO') || d.includes('RECRIA') ||
      d.includes('COMPOSTAJE') || d.includes('MAQUINARIA') || d.includes('FABRICA') ||
      d.includes('RONDA') || d.includes('DISTRIBUI') || d.includes('OPERACIONAL') ||
      d.includes('MANTENIMIENTO') || d.includes('SOPORTE')) return 'Ypoti';
  if (d.includes('ORO VERDE')) return 'Oro Verde';
  if (d.includes('SANTA MARIA')) return 'Santa Maria';
  if (d.includes('CIELO AZUL')) return 'Cielo Azul';
  if (d.includes('YBY POR') || d.includes('YBY_POR')) return 'Ybypora';
  if (d.includes('CERRO MEMBY')) return 'Cerro Memby';
  if (d.includes('SANTA CLARA')) return 'Santa Clara';
  if (d.includes('LUSIPAR')) return 'Lusipar';
  // For corporate departments, assign based on known roles
  if (d.includes('FINANCIERO') || d.includes('CONTROLADORIA') || d.includes('CONTABILIDAD') ||
      d.includes('ADMINISTRATIVO') || d.includes('SOSTENIBILIDAD') || d.includes('COMERCIAL') ||
      d.includes('INFORMÁTICA') || d.includes('06 OPERATIVO')) return 'General';
  return 'General';
}

const SKIP = ['PUESTO LIBRE','PUESTO VACANTE','ME GUSTA','COMPRAS GENERALES','TECNICO TI','ASISTENTE COMPRAS'];
const seen = new Set();
const employees = [];

// First pass: org chart (lines 119-268, 1-indexed → indices 118-267)
for (let i = 118; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  const f = line.split(';').map(s => s.replace(/^"|"$/g,'').trim());
  const [first, last, email, alias, position, supervisor, dept, subDept] = f;

  const full = norm(`${first} ${last}`).toUpperCase();
  if (SKIP.some(s => full.includes(s))) continue;
  if (!first || !first.trim()) continue;
  if (last && last.toLowerCase() === 'checar') continue;

  // Handle parenthetical nicknames: remove "(NENE)", "(JHONNY)", "(ALCIDES)"
  const cleanLast = (last||'').replace(/\s*\(.*?\)\s*/g, '').trim();

  if (!seen.has(full)) {
    seen.add(full);
    employees.push({ first: norm(first), last: norm(cleanLast), position: norm(position), dept: norm(dept) });
  }
}

// Second pass: flat list (lines 2-118) for entries not in org chart
for (let i = 1; i < 118 && i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  const f = line.split(';').map(s => s.replace(/^"|"$/g,'').trim());
  const [first, last, email, alias, position] = f;

  if (!first || !first.trim()) continue;
  const full = norm(`${first} ${last}`).toUpperCase();
  if (SKIP.some(s => full.includes(s))) continue;
  if (!seen.has(full)) {
    seen.add(full);
    employees.push({ first: norm(first), last: norm(last||''), position: norm(position||''), dept: 'directory_internal' });
  }
}

// Generate users with unique usernames
const usernameCount = {};
let uid = 1;

const users = employees.map(emp => {
  let username = genUsername(emp.first, emp.last);
  // Handle collisions
  if (usernameCount[username]) {
    usernameCount[username]++;
    username = username + usernameCount[username];
  } else {
    usernameCount[username] = 1;
  }

  const role = assignRole(emp.position);
  let estab = mapEstab(emp.dept);

  // For known managers, override establishment based on their known scope
  const fullUpper = `${emp.first} ${emp.last}`.toUpperCase();
  if (fullUpper.includes('MAURICIO') && fullUpper.includes('MOLLER')) { estab = 'General'; }
  if (fullUpper.includes('RONEI')) { estab = 'General'; }
  if (fullUpper.includes('ANA BEATRIZ')) { estab = 'General'; }
  if (fullUpper.includes('ANA KARINA')) { estab = 'General'; }
  if (fullUpper.includes('GABRIEL') && fullUpper.includes('MOLLER')) { estab = 'General'; }
  if (fullUpper.includes('LUCAS') && fullUpper.includes('ENRICO')) { estab = 'General'; }
  if (fullUpper.includes('FABIANO')) { estab = 'General'; }
  if (fullUpper.includes('PAULO') && fullUpper.includes('BECKER')) { estab = 'General'; }
  if (fullUpper.includes('PEDRO') && fullUpper.includes('MOLLER')) { estab = 'General'; }

  // Special username overrides to match existing logins
  if (fullUpper.includes('ANA KARINA') && fullUpper.includes('TICIANELLI')) username = 'ana.karina';
  if (fullUpper.includes('LAURA') && fullUpper.includes('RIVAS')) username = 'laura.rivas';
  if (fullUpper.includes('PAULO') && fullUpper.includes('BECKER')) username = 'paulo';
  if (fullUpper.includes('FABIANO') && fullUpper.includes('SQUERUQUE')) username = 'fabiano';
  if (fullUpper.includes('MAURICIO') && fullUpper.includes('MOLLER')) username = 'mauricio';
  if (fullUpper.includes('GABRIEL') && fullUpper.includes('MOLLER') && !fullUpper.includes('VILLALBA')) username = 'gabriel';
  if (fullUpper.includes('GUILLERMO') && fullUpper.includes('CACERES')) username = 'guillermo';
  if (fullUpper === 'ANAHI RAQUEL AGUIRRE DE LEIVA') username = 'anahi';
  if (fullUpper === 'KELIN BRADSHAV') username = 'kelin';
  if (fullUpper === 'RONEI FERREIRA') username = 'ronei';

  return {
    id: `u${String(uid++).padStart(3,'0')}`,
    name: titleCase(`${emp.first} ${emp.last}`),
    email: username,
    password: process.env.YPOTI_DEFAULT_PASSWORD || 'changeme',
    role,
    establishment: estab,
    position: titleCase(emp.position || 'Empleado'),
    avatar: genAvatar(emp.first, emp.last),
    active: true,
  };
});

// Output as JS module
const output = `// ============================================================
// YPOTI — USUARIOS DEFAULT (generado desde grupo-moller.csv)
// Total: ${users.length} empleados
// ============================================================

export const DEFAULT_USERS = ${JSON.stringify(users, null, 2)};
`;

writeFileSync('/Users/ana/Desktop/Claud Code/src/constants/defaultUsers.js', output);
console.log(`Generated ${users.length} users`);

// Also print role summary
const roleCounts = {};
users.forEach(u => { roleCounts[u.role] = (roleCounts[u.role]||0) + 1; });
console.log('Roles:', JSON.stringify(roleCounts));

const estabCounts = {};
users.forEach(u => { estabCounts[u.establishment] = (estabCounts[u.establishment]||0) + 1; });
console.log('Establishments:', JSON.stringify(estabCounts));
