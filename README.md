# YPOTI Compras

Sistema de gestion de solicitudes de compra para el Grupo YPOTI. Aplicacion web progresiva (PWA-ready) construida con React + Supabase.

## Stack

- **Frontend**: React 18 + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions + Realtime)
- **Estilo**: CSS-in-JS (inline styles con tema centralizado)
- **Auth**: Supabase Auth con login por usuario/contrasena

## Requisitos

- Node.js 18+
- Cuenta Supabase con proyecto configurado
- Supabase CLI (para deploy de Edge Functions)

## Setup

```bash
# 1. Clonar e instalar
git clone <repo-url>
cd ypoti-compras
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con las credenciales de Supabase

# 3. Desarrollo local
npm run dev

# 4. Build para produccion
npm run build
npm run preview   # para verificar el build
```

## Variables de Entorno

| Variable | Descripcion |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave anonima (anon key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (solo para scripts de migracion) |
| `YPOTI_DEFAULT_PASSWORD` | Contrasena por defecto para nuevos usuarios |

## Arquitectura

```
src/
  components/         # Componentes React
    admin/            # Pantallas de administracion
    common/           # Componentes reutilizables
    requests/         # Solicitudes de compra
  constants/          # Datos de referencia y configuracion
    approvalConfig.js # Motor de aprobacion (frontend)
    budgets.js        # Presupuestos (CRUD via Edge Functions)
    parameters.js     # Parametros admin (CRUD via Edge Functions)
    users.js          # Gestion de usuarios (CRUD via Edge Functions)
    index.js          # Constantes UI (STATUS_FLOW, PRIORITY, INVENTORY)
  context/            # React Context providers
    AppContext.jsx     # Estado global + Realtime subscriptions
    AuthContext.jsx    # Autenticacion Supabase + sesion
  lib/                # Utilidades
    queries.js        # Queries Supabase + invocacion Edge Functions
    supabase.js       # Cliente Supabase + token store
  styles/             # Tema visual
supabase/
  functions/          # Edge Functions (Deno)
    _shared/          # Codigo compartido (approvalEngine.ts, cors.ts)
    admin-data/       # CRUD parametros y presupuestos
    admin-users/      # CRUD usuarios (auth + profiles)
    request-mutations/# Crear/actualizar solicitudes
    request-workflow/ # Confirmar, aprobar, rechazar, avanzar estado
```

## Modulos

1. **Dashboard** - Vista principal con solicitudes filtradas por estado
2. **Nueva Solicitud** - Formulario de 3 pasos con catalogo SAP
3. **Detalle de Solicitud** - Vista completa con aprobaciones, items, comentarios
4. **Inventario** - Catalogo de productos SAP agrupado por tipo
5. **Analytics** - Metricas y graficos de solicitudes
6. **Configuracion** - Perfil y preferencias
7. **Admin: Usuarios** - Gestion de usuarios y roles
8. **Admin: Presupuestos** - Presupuestos por establecimiento/sector
9. **Admin: Parametros** - Establecimientos, sectores, tipos, proveedores
10. **Admin: Aprobaciones** - Visualizacion del flujo de aprobacion

## Flujo de Aprobacion

Las solicitudes siguen un flujo automatico basado en reglas:

1. **Gerente de Area** - Siempre requerido (segun establecimiento)
2. **Director/CFO** - Requerido si monto >= Gs 5.000.000
3. **Overbudget** - Requerido si monto >= Gs 50.000.000 o excede presupuesto
4. **Veterinario** - Requerido si sector es Veterinaria/Farmacia

## Roles

| Rol | Permisos |
|-----|----------|
| `admin` | Acceso completo |
| `diretoria` | Aprobacion de alto nivel, analytics |
| `gerente` | Aprobacion de solicitudes, analytics |
| `lider` | Aprobacion a nivel de area |
| `comprador` | Gestion de cotizaciones y OC |
| `solicitante` | Crear y seguir solicitudes propias |

## Edge Functions

Deploy con Supabase CLI:

```bash
# Deploy todas las funciones
supabase functions deploy admin-data
supabase functions deploy admin-users
supabase functions deploy request-mutations
supabase functions deploy request-workflow
```

## Realtime

El sistema usa Supabase Realtime para mantener sincronizados todos los usuarios conectados. Los cambios en la tabla `requests` se propagan automaticamente a todos los dashboards abiertos.
