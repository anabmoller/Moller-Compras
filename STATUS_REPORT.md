# YPOTI Compras - Status Report

**Fecha**: 28 de febrero de 2026
**Branch**: `refactor/cleanup`
**Estado**: Funcional - En producción

---

## Migración Completada: localStorage → Supabase

La aplicación fue migrada completamente de un backend localStorage a Supabase (PostgreSQL + Auth + Edge Functions + Realtime).

### Fases Completadas (v1)

#### FASE 1: Fix Login + Edge Functions (Commit: 35cc627)
- Corregido login frontend que colgaba por lock interno de supabase-js
- Implementado login via fetch directo a Auth REST API
- Token store a nivel de módulo para Edge Functions
- Patrón `recreateClient()` para escapar sesiones stale
- Todas las llamadas Edge Function usan fetch directo (bypass supabase.functions.invoke)

#### FASE 2/3: Tests + Debug (Commit: 3c697f0)
- Corregido mapeo de campos item (name/nombre, quantity/cantidad, unitPrice/precioUnitario)
- Corregido display de comentarios (author/autor, createdAt/fecha)
- Corregido campo note → reason en guardado de notas
- Corregido display de urgencia/prioridad
- Corregido cálculo de total items con campos duales
- Corregido display de presupuesto (planned vs amount)
- Corregido mapeo Ypoti manager (fabiano → paulo)

#### FASE 4: Mejoras UX (Commit: 57fcf96)
- Dropdown de proveedores con datos de parámetros admin + opción "Otro"
- Precio histórico: sugiere último precio de compra del producto
- Corregido preview de aprobación (s.label en vez de s.role)

#### FASE 5: Calidad de Código (Commit: 1c2234a)
- Eliminados 10 console.log/warn de debug
- Mantenidos 23 console.error legítimos
- Agregado favicon SVG (Y rojo, brand YPOTI)
- Reemplazados alert() por banners de error en admin screens
- BudgetManagementScreen y ParametersScreen con error handling visual

#### FASE 6: Documentación
- README.md con setup, arquitectura, módulos, flujo de aprobación
- STATUS_REPORT.md (este archivo)

---

### Fases Completadas (v2 — Post-Testing Corrections)

#### FASE 1 v2: JWT Auth Fix Solidificado (Commit: db4003f)
- Limpieza de localStorage stale antes de inicializar supabase-js client
- Previene warnings de "orphaned lock" al inicio

#### FASE 2 v2: Datos Organizacionales Correctos
- Manager mappings verificados (Ypoti→paulo, Cerro Memby→fabiano, etc.)
- Director mappings verificados por empresa

#### FASE 3 v2: Terminología Autorización vs Aprobación (Commit: db4003f)
- Paso 1 "Autorización — Gerente de Área" (el gerente **autoriza** la necesidad operativa)
- Paso 2 "Aprobación — Director / CFO" (el director **aprueba** el gasto, solo si >= ₲5M)
- Actualizado en: ApprovalActions, ApprovalFlow, ApprovalConfigScreen, SettingsScreen
- Roles actualizados: gerente "Autorización de solicitudes", diretoria "Aprobación de alto nivel"
- Ambos motores de aprobación (cliente + servidor) actualizados

#### FASE 4 v2: Correcciones de Lógica (Commit: 292e960)
- 4.1: Eliminado dropdown "Asignar cotización a" del formulario (siempre va al comprador)
- 4.2: Gerente Responsable en Parámetros → dropdown de usuarios con rol gerente
- 4.3: Director en Parámetros → dropdown de usuarios con rol diretoria
- 4.4: Dropdown de proveedores: sin RUC, ordenado por categoría (primero los de la misma categoría del producto)

#### FASE 5 v2: Mejoras Visuales (Commit: b6e8b5e)
- Íconos de sector y tipo de producto en dropdowns, tarjetas y detalle de solicitud
- Corregidos acentos españoles en toda la UI (Configuración, Gestión, Parámetros, Descripción, Catálogo, Versión, Sesión, etc.)
- Modales ya tenían overflow correcto (max-height + scroll) de trabajo previo

#### FASE 6 v2: Build Final + Documentación
- `npm run build` → 516 KB (136 KB gzip) — zero errors
- Verificado: NO hay service_role key en el bundle
- STATUS_REPORT.md actualizado (este archivo)

---

## Arquitectura Actual

### Frontend (React + Vite)
- **AuthContext**: Login/logout con Supabase Auth (fetch directo)
- **AppContext**: Estado global + Realtime subscriptions
- **queries.js**: Todas las queries Supabase + invocación Edge Functions
- **supabase.js**: Cliente Supabase + token store (con limpieza de stale sessions)

### Backend (Supabase)
- **4 Edge Functions**: admin-data, admin-users, request-mutations, request-workflow
- **approvalEngine.ts**: Motor de aprobación server-side
- **RLS**: Row Level Security en todas las tablas
- **Realtime**: Postgres Changes en tabla requests

### Tablas Supabase
- `profiles` - Usuarios (linked a auth.users)
- `requests` - Solicitudes de compra
- `request_items` - Items de cada solicitud
- `quotations` - Cotizaciones
- `comments` - Comentarios en solicitudes
- `approval_steps` - Pasos de aprobación
- `approval_history` - Historial de acciones de aprobación
- `establishments` - Establecimientos
- `sectors` - Sectores
- `product_types` - Tipos de producto
- `suppliers` - Proveedores
- `companies` - Empresas del grupo
- `budgets` - Presupuestos por área

---

## Notas Técnicas

### Patrón Token Store
El login via fetch directo almacena el JWT en una variable de módulo (`_storedToken`). Esto evita la dependencia del SDK interno de supabase-js que puede colgarse. Todas las Edge Functions usan este token.

### Limpieza de localStorage Stale
Antes de crear el cliente supabase-js, se limpia cualquier token stale de localStorage para prevenir "orphaned lock" warnings del SDK.

### Campos Duales (Backward Compat)
Algunos componentes manejan campos en español (era localStorage) e inglés (era Supabase) con patrón `it.name || it.nombre`. Esto permite compatibilidad con items creados client-side y datos DB.

### Autorización vs Aprobación
- **Autorización** (Paso 1): El Gerente de Área valida la necesidad operativa. Siempre requerido.
- **Aprobación** (Paso 2): El Director/CFO autoriza el gasto. Solo si monto >= ₲5.000.000.
- **Overbudget** (Paso 3): Aprobación adicional si excede presupuesto o >= ₲50.000.000.

### Build
```
npm run build → 516 KB (136 KB gzip)
Vite 6.4.1, React 18.3.1, supabase-js 2.98.0
No service_role key in bundle ✓
```

---

## Pendientes / Mejoras Futuras

1. **Code splitting**: Bundle de 516 KB puede reducirse con dynamic imports
2. **Tests**: No hay tests unitarios ni E2E
3. **PWA**: Agregar service worker para offline support
4. **Notificaciones push**: Para aprobaciones pendientes
5. **Auditoría**: Logs de acciones de admin (ya existe approval_history)
6. **Mobile**: Verificar responsive en más dispositivos
7. **Budget atomicity**: Consumo de presupuesto no es transaccional (race condition teórica)
8. **Inventario Supabase**: Migrar INVENTORY_ITEMS de constante frontend a tabla Supabase
