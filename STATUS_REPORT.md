# YPOTI Compras - Status Report

**Fecha**: 28 de febrero de 2026
**Branch**: `refactor/cleanup`
**Estado**: Funcional - En produccion

---

## Migracion Completada: localStorage → Supabase

La aplicacion fue migrada completamente de un backend localStorage a Supabase (PostgreSQL + Auth + Edge Functions + Realtime).

### Fases Completadas

#### FASE 1: Fix Login + Edge Functions (Commit: 35cc627)
- Corregido login frontend que colgaba por lock interno de supabase-js
- Implementado login via fetch directo a Auth REST API
- Token store a nivel de modulo para Edge Functions
- Patron `recreateClient()` para escapar sesiones stale
- Todas las llamadas Edge Function usan fetch directo (bypass supabase.functions.invoke)

#### FASE 2/3: Tests + Debug (Commit: 3c697f0)
- Corregido mapeo de campos item (name/nombre, quantity/cantidad, unitPrice/precioUnitario)
- Corregido display de comentarios (author/autor, createdAt/fecha)
- Corregido campo note → reason en guardado de notas
- Corregido display de urgencia/prioridad
- Corregido calculo de total items con campos duales
- Corregido display de presupuesto (planned vs amount)
- Corregido mapeo Ypoti manager (fabiano → paulo)

#### FASE 4: Mejoras UX (Commit: 57fcf96)
- Dropdown de proveedores con datos de parametros admin + opcion "Otro"
- Precio historico: sugiere ultimo precio de compra del producto
- Corregido preview de aprobacion (s.label en vez de s.role)

#### FASE 5: Calidad de Codigo (Commit: 1c2234a)
- Eliminados 10 console.log/warn de debug
- Mantenidos 23 console.error legitimos
- Agregado favicon SVG (Y rojo, brand YPOTI)
- Reemplazados alert() por banners de error en admin screens
- BudgetManagementScreen y ParametersScreen con error handling visual

#### FASE 6: Documentacion
- README.md con setup, arquitectura, modulos, flujo de aprobacion
- STATUS_REPORT.md (este archivo)

---

## Arquitectura Actual

### Frontend (React + Vite)
- **AuthContext**: Login/logout con Supabase Auth (fetch directo)
- **AppContext**: Estado global + Realtime subscriptions
- **queries.js**: Todas las queries Supabase + invocacion Edge Functions
- **supabase.js**: Cliente Supabase + token store

### Backend (Supabase)
- **4 Edge Functions**: admin-data, admin-users, request-mutations, request-workflow
- **approvalEngine.ts**: Motor de aprobacion server-side
- **RLS**: Row Level Security en todas las tablas
- **Realtime**: Postgres Changes en tabla requests

### Tablas Supabase
- `profiles` - Usuarios (linked a auth.users)
- `requests` - Solicitudes de compra
- `request_items` - Items de cada solicitud
- `quotations` - Cotizaciones
- `comments` - Comentarios en solicitudes
- `approval_steps` - Pasos de aprobacion
- `approval_history` - Historial de acciones de aprobacion
- `establishments` - Establecimientos
- `sectors` - Sectores
- `product_types` - Tipos de producto
- `suppliers` - Proveedores
- `companies` - Empresas del grupo
- `budgets` - Presupuestos por area

---

## Notas Tecnicas

### Patron Token Store
El login via fetch directo almacena el JWT en una variable de modulo (`_storedToken`). Esto evita la dependencia del SDK interno de supabase-js que puede colgarse. Todas las Edge Functions usan este token.

### Campos Duales (Backward Compat)
Algunos componentes manejan campos en espanol (era localStorage) e ingles (era Supabase) con patron `it.name || it.nombre`. Esto permite compatibilidad con items creados client-side y datos DB.

### Build
```
npm run build → 515 KB (136 KB gzip)
Vite 6.4.1, React 18.3.1, supabase-js 2.98.0
```

---

## Pendientes / Mejoras Futuras

1. **Code splitting**: Bundle de 515 KB puede reducirse con dynamic imports
2. **Tests**: No hay tests unitarios ni E2E
3. **PWA**: Agregar service worker para offline support
4. **Notificaciones push**: Para aprobaciones pendientes
5. **Auditoria**: Logs de acciones de admin (ya existe approval_history)
6. **Mobile**: Verificar responsive en mas dispositivos
7. **Budget atomicity**: Consumo de presupuesto no es transaccional (race condition teorica)
8. **Inventario Supabase**: Migrar INVENTORY_ITEMS de constante frontend a tabla Supabase
