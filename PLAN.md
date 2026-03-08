# PLAN: Entity/Company Visibility Scope — Fix Across All Modules

## 1. ROOT CAUSE

The system has **no entity-scoped access control**. All entity/company/establishment selectors fetch the full unfiltered list from Supabase and display it to every user regardless of their allowed scope.

### Specific causes:

**A) Junction tables exist but are never queried by the app**
- `user_establishments` (user ↔ establishment N:N) — exists in DB since migration 005
- `user_fiscal_entities` (user ↔ fiscal_entity N:N) — exists in DB since migration 006
- **Neither table is queried anywhere in the frontend or Edge Functions**

**B) Profile has only a single `establishment` string field**
- `profiles.establishment` stores ONE establishment name (text, not FK)
- This was designed as a "primary" assignment, not a scope limiter
- The N:N junction tables were meant to be the canonical scope source but were never wired up

**C) All entity getters return unfiltered global lists**
- `getEstablishments()` → returns ALL active establishments (including cattle providers, grain providers, industries)
- `getCompanies()` → returns ALL companies
- `getSuppliers()` → returns ALL suppliers
- `getFrigorificos()` → returns ALL frigoríficos
- `getGanaderos()` → returns ALL ganaderos
- None of these accept a user parameter or filter by scope

**D) RLS policies are role-based only, not entity-scoped**
- Establishments, companies, suppliers: `USING (true)` for all authenticated users
- Requests: filtered by `created_by` or `can_view_all_requests()` role check — no entity dimension
- Ganado module: migration 018 has an explicit comment: `"Future: scope by establishment via user_establishments junction"`

**E) No centralized scope service/hook exists**
- `permissions.js` only handles module-level access and `created_by` filtering
- No `useUserScope()`, `useAllowedEntities()`, or similar hook
- Each component independently calls `getEstablishments()` etc. with no filtering

---

## 2. SCHEMA MAP

### Current Tables (Relevant)

```
profiles (id, username, name, role, establishment[single text], ...)
  ↓ auth identity (profiles.id = auth.users.id)

users (legacy table, being phased out)

establishments (id, name, email, active, tipo_entidad, regimen_control, ...)
  ↑ used in: selectors, ganado forms, dashboards, filters

companies (id, name, ruc, is_frigorifico, senacsa_code_empresa, active)
  ↑ used in: ganado destination, frigorífico selectors

suppliers (id, name, ruc, is_ganadero, senacsa_code_proveedor, category, active, ...)
  ↑ used in: ganadero selectors, quotation forms

fiscal_entities (id, legal_name, ruc, billing_address_reference, active)
  ↑ used in: purchase request billing entity

user_establishments (user_id FK→users, establishment_id FK→establishments, is_default)
  ⚠️ EXISTS BUT UNUSED — FK points to legacy `users` table, not `profiles`

user_fiscal_entities (user_id FK→users, fiscal_entity_id FK→fiscal_entities, is_default)
  ⚠️ EXISTS BUT UNUSED — same FK issue
```

### Entity Type Taxonomy (in `establishments` table via `tipo_entidad`)
- `establecimiento` → farms/estancias under our management
- `proveedor_ganado` → cattle suppliers
- `proveedor_granos` → grain suppliers
- `industria` → industrial entities (frigoríficos etc.)

### Fiscal Entities (seeded — 6 entities)
- Rural Bioenergia S.A., La Constancia EAS, Chacobras S.A., Pedro Moller, Gabriel Moller, Ana Moller

### Hardcoded Approximation (to be replaced)
`establecimientos.js` defines `ACTIVE_PROVIDERS` = [Rural Energia, Chacobras, Beatriz, Gabriel, Pedro, La Constancia] — a hardcoded list that approximates what should be the user's per-user scope.

---

## 3. AFFECTED MODULES / SCREENS / COMPONENTS / QUERIES

### Data Layer (fetch + cache)
| File | Issue |
|------|-------|
| `src/constants/parameters.js` | `getEstablishments()`, `getCompanies()`, `getSuppliers()` return ALL records |
| `src/constants/ganado.js` | `getGanaderos()`, `getFrigorificos()` return ALL records |
| `src/constants/establecimientos.js` | `ACTIVE_PROVIDERS` is hardcoded, not per-user |
| `src/lib/permissions.js` | `buildRecordsFilter()` only filters by `created_by`, not entity |
| `src/context/AuthContext.jsx` | Profile load doesn't fetch user's allowed entities |
| `src/context/AppContext.jsx` | `loadAll()` doesn't initialize entity scope |

### Forms (entity selectors)
| File | Selector | Issue |
|------|----------|-------|
| `src/components/requests/RequestStepItems.jsx` | Establishment dropdown | Shows ALL establishments |
| `src/components/ganado/NuevoMovimientoForm.jsx` | Origin/Destination establishment, Frigorífico | Shows ALL |
| `src/components/requests/NewRequestForm.jsx` | Approval preview uses ESTABLISHMENT_COMPANY map | Not scoped |
| `src/components/admin/BudgetManagementScreen.jsx` | Establishment filter | Shows ALL |
| `src/components/admin/UserManagementScreen.jsx` | Establishment filter | Shows ALL |

### Dashboards & Filters
| File | Filter | Issue |
|------|--------|-------|
| `src/components/requests/Dashboard.jsx` | `filterEstablishment` dropdown | Shows ALL |
| `src/components/ganado/MovimientosScreen.jsx` | `filterEstablishment` dropdown | Shows ALL |
| `src/components/ganado/RebanhoAtivo.jsx` | Herd data by establishment | Fetches ALL |
| `src/components/ganado/AnimalsScreen.jsx` | Animal list by establishment | Fetches ALL |
| `src/components/dashboard/PanelGeneral.jsx` | KPI by establishment | Shows ALL |
| `src/components/inventory/InventoryScreen.jsx` | Product list | No entity filter |
| `src/components/dashboard/MateriaPrimaDashboard.jsx` | Raw materials | No entity filter |
| `src/components/dashboard/CombustibleDashboard.jsx` | Fuel | No entity filter |

### Admin Screens (should remain unscoped for admins)
| File | Note |
|------|------|
| `src/components/admin/ParametersScreen.jsx` | Master data editor — stays unfiltered |

### Edge Functions (no scope validation)
| File | Issue |
|------|-------|
| `supabase/functions/_shared/auth.ts` | `getCallerProfile()` doesn't load user entities |
| `supabase/functions/request-mutations/index.ts` | No entity scope validation on creation |
| `supabase/functions/ganado-mutations/index.ts` | No entity scope validation |

### Database / RLS
| Table | Current Policy | Issue |
|-------|---------------|-------|
| `establishments` | `USING(true)` | All authenticated see all |
| `companies` | `USING(true)` | All authenticated see all |
| `suppliers` | `USING(true)` | All authenticated see all |
| `fiscal_entities` | `USING(true)` | All authenticated see all |
| `requests` | Role-based only | No entity dimension |
| `movimientos_ganado` | `USING(true)` | Explicitly deferred in migration 018 |

---

## 4. IMPLEMENTATION PLAN

### Phase 1: Database Migration — Fix Junction Tables & Seed Scope Data

**New migration: `026_entity_scope.sql`**

1. **Fix FK references**: `user_establishments.user_id` and `user_fiscal_entities.user_id` currently reference `users(id)`. Add parallel FK to `profiles(id)` (the auth source of truth) or migrate the FK entirely.

2. **Seed junction data** for all 21 existing users based on business rules:
   - **Ana Beatriz** (admin) → all 6 fiscal entities + all group establishments
   - **Pedro** → Rural Bioenergia, Chacobras, La Constancia, Pedro Moller
   - **Gabriel** → Rural Bioenergia, Chacobras, La Constancia, Gabriel Moller
   - **Other users** → map from their `profiles.establishment` field to matching establishment + default fiscal entity
   - Set `is_default = true` for each user's primary entity

3. **Create Postgres function** `get_user_scope(p_user_id UUID)` returning:
   ```sql
   RETURNS TABLE (
     establishment_ids UUID[],
     fiscal_entity_ids UUID[]
   )
   ```
   - Queries both junction tables
   - If no rows exist → returns empty arrays (fail closed)

### Phase 2: Auth Context — Load User Scope on Login

**File: `src/context/AuthContext.jsx`**

4. After `loadProfile(userId)` succeeds, load the user's entity scope:
   ```js
   // Fetch from user_establishments + user_fiscal_entities
   const userEstablishments = await supabase
     .from('user_establishments')
     .select('establishment_id, is_default')
     .eq('user_id', userId);

   const userFiscalEntities = await supabase
     .from('user_fiscal_entities')
     .select('fiscal_entity_id, is_default')
     .eq('user_id', userId);
   ```

5. Add to `currentUser` object:
   ```js
   allowedEstablishmentIds: [...],   // UUID[]
   allowedFiscalEntityIds: [...],    // UUID[]
   defaultEstablishmentId: '...',    // UUID or null
   defaultFiscalEntityId: '...',     // UUID or null
   ```

### Phase 3: Centralized Scope Hook — `useEntityScope()`

**New file: `src/hooks/useEntityScope.js`**

6. Create a React hook that:
   - Reads `currentUser` from AuthContext (specifically the `allowedEstablishmentIds` and `allowedFiscalEntityIds`)
   - Filters the cached global lists from `parameters.js` and `ganado.js`
   - Exposes:
     ```js
     {
       scopedEstablishments,     // only user's allowed establishments
       scopedFiscalEntities,     // only user's allowed fiscal entities
       scopedFrigorificos,       // frigoríficos relevant to scope
       scopedGanaderos,          // cattle suppliers relevant to scope
       isInScope(entityId),      // check if entity is in user's scope
       defaultEstablishment,     // user's default establishment object
       defaultFiscalEntity,      // user's default fiscal entity object
       hasScope,                 // boolean: user has at least one entity
       loading,                  // scope data is loading
     }
     ```
   - Filtering logic:
     - `scopedEstablishments` = `getEstablishments().filter(e => allowedEstablishmentIds.includes(e._uuid))`
     - `scopedFiscalEntities` = `getFiscalEntities().filter(e => allowedFiscalEntityIds.includes(e.id))`
     - `scopedFrigorificos` and `scopedGanaderos` are **not** user-scoped (they are external entities) — they stay global but filtered by `active` status only
   - Edge case handling:
     - No scope entries → `hasScope = false`, show warning UI
     - Loading state → show skeleton/spinner

### Phase 4: Wire Up All Selectors & Filters

Replace direct `getEstablishments()` calls with scoped versions from the hook:

| # | File | Change |
|---|------|--------|
| 7 | `RequestStepItems.jsx` | Establishment dropdown → `scopedEstablishments` |
| 8 | `NuevoMovimientoForm.jsx` | Origin establishment → `scopedEstablishments`; Destination establishment → `scopedEstablishments` (minus origin); Frigorífico → `scopedFrigorificos` (global, no change) |
| 9 | `Dashboard.jsx` (requests) | Establishment filter → `scopedEstablishments` |
| 10 | `MovimientosScreen.jsx` | Establishment filter → `scopedEstablishments` |
| 11 | `PanelGeneral.jsx` | KPI establishment filter → `scopedEstablishments` |
| 12 | `RebanhoAtivo.jsx` | Herd establishment filter → `scopedEstablishments` |
| 13 | `AnimalsScreen.jsx` | Animal establishment filter → `scopedEstablishments` |

**Admin screens stay unscoped** (ParametersScreen, UserManagement, BudgetManagement) — they are already gated behind `manage_settings` permission.

**Rule**: Operational screens use scoped data. Admin screens use global data.

### Phase 5: Edge Function Scope Validation

14. **`supabase/functions/_shared/auth.ts`** — extend `getCallerProfile()` to load user's establishment IDs and fiscal entity IDs from junction tables. Add to `CallerProfile` type.

15. **`request-mutations`** — on create/update, validate that `establishment_id` and `fiscal_entity_id` are in caller's scope (or caller is admin).

16. **`ganado-mutations`** — on create, validate that `establecimiento_origen_id` is in caller's scope.

### Phase 6: Query-Level Scope Defaults

17. **`fetchAllRequests()`** — currently returns all (RLS-permitted) requests. No change needed since RLS already filters by `created_by` for non-admin roles. But for admin users who should only see their entities' requests, add optional `establishment_ids` filter.

18. **`fetchMovimientos()`** — add optional establishment scope filter parameter so dashboards default to user's scope.

19. **`fetchHatoData()`** — already accepts `establishmentId`; ensure components pass user's default.

20. **Metrics RPC `get_ganado_metrics`** — already accepts `p_establecimiento_id`; components should pass scope.

---

## 5. RISKS & MIGRATION CONCERNS

### Data Migration
- **Junction table FKs reference `users` (legacy), not `profiles`**: Must handle carefully. Option A: alter FK to reference `profiles(id)`. Option B: keep FK as-is but ensure user IDs in junction match profile IDs (they should, since both reference `auth.users.id`). Going with Option B is safest — IDs should already match.
- **Seeding junction data**: Must correctly map existing users to entities. If wrong, users lose access. Mitigation: seed based on known business rules + `profiles.establishment` field, provide admin UI to adjust mappings later.
- **Users with no junction rows**: Fail closed — show empty state + admin contact message. Never fall back to showing all entities.

### Backward Compatibility
- `getEstablishments()` stays unchanged (returns global list). The new `useEntityScope()` hook wraps it with filtering. Existing admin code that calls `getEstablishments()` directly continues working.
- Components need access to React context (for the hook). All affected components already render inside `<AuthProvider>`, so this works naturally.

### Performance
- 2 extra small queries on login (junction tables with < 50 rows). Negligible impact.
- Filtering is client-side against already-cached arrays. Zero additional API calls during runtime.

### Theme / Mobile / Layout
- Changes are purely data/logic — zero CSS changes.
- Selectors keep existing styling; only their option lists change.
- No regression risk for dark/light theme or mobile layout.

### Scope of External Entities
- **Frigoríficos and ganaderos are NOT user-scoped** — they are external business entities. All users who can access the ganado module should see the same list of cattle suppliers and slaughterhouses.
- **Establishments and fiscal entities ARE user-scoped** — these determine which internal operations a user can perform.

---

## 6. TEST CASES

### TC1: Ana Beatriz (admin, linked to all 6 fiscal entities + all establishments)
- [ ] Fiscal entity selectors: sees Rural Bioenergia, Chacobras, La Constancia, Ana Moller, Gabriel Moller, Pedro Moller
- [ ] Establishment selectors: sees all group establishments (Ypoti, Cerro Memby, etc.)
- [ ] Does NOT see random cattle suppliers in fiscal entity / establishment dropdowns
- [ ] Admin screens (Parameters, Users, Budgets): still sees full unfiltered lists
- [ ] Can create requests for any of her linked establishments

### TC2: Pedro (partial scope: Rural Bioenergia, Chacobras, La Constancia, Pedro Moller)
- [ ] Establishment selectors: shows only his linked establishments
- [ ] Fiscal entity selectors: shows only his 4 linked entities
- [ ] Cannot create requests for establishments outside his scope
- [ ] Dashboard/filters only list his scoped establishments
- [ ] Ganado module: origin selector shows only his establishments

### TC3: Rural Bioenergia Employee (single entity)
- [ ] Sees only "Rural Bioenergia" in fiscal entity selector
- [ ] Sees only establishments linked to them
- [ ] Request form pre-selects their single entity (no dropdown needed)
- [ ] Cannot switch to other companies

### TC4: User with Single Entity
- [ ] Selector pre-fills automatically
- [ ] All data filtered to that entity
- [ ] No dropdown shown (or shown disabled with single option)

### TC5: User with Multiple Entities
- [ ] All linked entities appear in dropdown
- [ ] Default entity is pre-selected
- [ ] Can switch between entities

### TC6: User with No Valid Entity Mapping
- [ ] Graceful empty state: "No hay entidades asignadas. Contacte al administrador."
- [ ] Cannot create requests or movements
- [ ] Does not crash or show empty dropdown

### Cross-Module Consistency
- [ ] Same entities appear across: purchase forms, ganado forms, dashboard filters, movement filters
- [ ] No cattle providers (`is_ganadero`) appear in operational entity selectors
- [ ] No operational entities leak into cattle supplier selectors
- [ ] Frigoríficos remain globally visible to all ganado-module users

---

## 7. DELIVERABLE ORDER

1. **Migration** `026_entity_scope.sql` — fix FKs, seed junction data, create scope function
2. **Hook** `src/hooks/useEntityScope.js` — centralized scope filtering
3. **AuthContext** update — load user scope on login
4. **Wire up** all 7+ selector/filter components
5. **Edge Function** validation updates
6. **Query-level** scope defaults for dashboards
7. **Test** all 6 user scenarios across all modules
