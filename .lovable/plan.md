

# Plan: Admin Backoffice para Clarita la cuenta

## Resumen

Implementar un panel de administracion completamente separado de la app principal, con login exclusivo para admins, dashboard con metricas de usuarios y proteccion por rol en `app_metadata`.

---

## Arquitectura

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    ┌──────────────────────────────────────────────────────────────────┐     │
│    │              get-admin-users Edge Function                        │     │
│    │                                                                   │     │
│    │  1. Validar JWT del usuario                                       │     │
│    │  2. Verificar app_metadata.role === 'admin'                       │     │
│    │  3. Si no es admin -> 403 Forbidden                               │     │
│    │  4. Usar SERVICE_ROLE_KEY para:                                   │     │
│    │     - auth.admin.listUsers()                                      │     │
│    │     - COUNT(*) de transactions, credit_cards, savings_entries     │     │
│    │                                                                   │     │
│    └──────────────────────────────────────────────────────────────────┘     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                             FRONTEND                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    /admin                         /admin/dashboard                           │
│    ┌─────────────────────┐       ┌─────────────────────────────────────┐    │
│    │   AdminAuth.tsx      │──────▶│   AdminDashboard.tsx                 │    │
│    │                      │       │                                      │    │
│    │   - Email + Password │  OK   │   ┌─────────┐ ┌─────────┐ ┌───────┐ │    │
│    │   - Sin signup       │ admin │   │ Total   │ │ Activos │ │Activos│ │    │
│    │   - Sin Face ID      │──────▶│   │ Usuarios│ │  7 dias │ │30 dias│ │    │
│    │                      │       │   └─────────┘ └─────────┘ └───────┘ │    │
│    └─────────────────────┘       │                                      │    │
│              │                    │   ┌──────────────────────────────┐  │    │
│              │ NO admin           │   │  Tabla de Usuarios           │  │    │
│              ▼                    │   │  - Email, Nombre             │  │    │
│    ┌─────────────────────┐       │   │  - Fecha alta, Ultimo login  │  │    │
│    │ "No tenes permisos" │       │   │  - Transacciones, Tarjetas   │  │    │
│    │   + auto-logout     │       │   └──────────────────────────────┘  │    │
│    └─────────────────────┘       └─────────────────────────────────────┘    │
│                                                                              │
│    AdminLayout.tsx (wrapper)                                                 │
│    - Verifica session                                                        │
│    - Verifica app_metadata.role === 'admin'                                  │
│    - Si no es admin -> redirect a /admin                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Paso 1: Designar usuario admin en la base de datos

Ejecutar manualmente en el SQL Editor de Cloud (una sola vez):

```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'TU_EMAIL_ADMIN@ejemplo.com';
```

Esto agrega `{ "role": "admin" }` al `app_metadata` del usuario, que se incluye automaticamente en el JWT.

---

## Paso 2: Edge Function `get-admin-users`

**Archivo:** `supabase/functions/get-admin-users/index.ts`

**Logica:**

1. Validar JWT con `supabase.auth.getUser()`
2. Verificar `user.app_metadata?.role === 'admin'`
3. Si no es admin, responder `403 Forbidden`
4. Crear cliente con `SUPABASE_SERVICE_ROLE_KEY` para:
   - `supabaseAdmin.auth.admin.listUsers({ page, perPage: 50 })`
   - Consultas de conteo por usuario (sin RLS)
5. Devolver array de usuarios con:
   - `id`, `email`, `full_name`, `created_at`, `last_sign_in_at`
   - `transactions_count`, `credit_cards_count`, `savings_entries_count`
6. Calcular metricas agregadas:
   - Total usuarios
   - Activos ultimos 7 dias
   - Activos ultimos 30 dias

**Config en `supabase/config.toml`:**

```toml
[functions.get-admin-users]
# Sin verify_jwt = false - debe validar JWT en codigo
```

---

## Paso 3: Estructura de archivos

```text
src/
├── pages/
│   └── admin/
│       ├── AdminAuth.tsx        # Login exclusivo admin
│       └── AdminDashboard.tsx   # Dashboard con metricas
├── components/
│   └── admin/
│       └── AdminLayout.tsx      # Proteccion por rol admin
```

---

## Paso 4: Componentes Frontend

### 4.1 AdminLayout.tsx

- Wrapper para rutas `/admin/*` (excepto `/admin` login)
- Verifica sesion con `supabase.auth.getSession()`
- Verifica `session.user.app_metadata?.role === 'admin'`
- Si no hay sesion -> redirect a `/admin`
- Si no es admin -> mostrar mensaje + boton para salir
- Si es admin -> renderizar `<Outlet />`

### 4.2 AdminAuth.tsx

- Formulario simple: email + password
- Sin opcion de registro (solo login)
- Sin Face ID ni biometria
- Al hacer login:
  - Verificar `user.app_metadata?.role === 'admin'`
  - Si no es admin: logout inmediato, mostrar error
  - Si es admin: navigate a `/admin/dashboard`
- Estilo desktop, fondo limpio, card centrada

### 4.3 AdminDashboard.tsx

**Header:**
- Titulo "Backoffice - Clarita la cuenta"
- Boton "Cerrar sesion"

**Cards de resumen:**
| Card | Valor |
|------|-------|
| Total Usuarios | Conteo total |
| Activos (7 dias) | Usuarios con `last_sign_in_at` >= hace 7 dias |
| Activos (30 dias) | Usuarios con `last_sign_in_at` >= hace 30 dias |

**Tabla de usuarios:**
| Columna | Origen |
|---------|--------|
| Email | `user.email` |
| Nombre | `user.user_metadata.full_name` |
| Fecha Alta | `user.created_at` |
| Ultimo Login | `user.last_sign_in_at` |
| Transacciones | COUNT de `transactions` |
| Tarjetas | COUNT de `credit_cards` |
| Entradas Ahorro | COUNT de `savings_entries` |

**Paginacion:**
- Mostrar 50 usuarios por pagina
- Botones Anterior/Siguiente

**Estilo:**
- Diseño desktop (no optimizado para mobile)
- Reutilizar componentes existentes: `Card`, `Table`, `Button`, `Badge`

---

## Paso 5: Rutas en App.tsx

Agregar **fuera** del `ProtectedLayout` (antes del catch-all):

```tsx
import AdminAuth from "./pages/admin/AdminAuth";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLayout from "./components/admin/AdminLayout";

// En Routes:
<Route path="/admin" element={<AdminAuth />} />
<Route element={<AdminLayout />}>
  <Route path="/admin/dashboard" element={<AdminDashboard />} />
</Route>
```

Las rutas admin quedan completamente separadas del flujo de usuarios normales:
- No usan `ProtectedLayout` (sin BiometricGate)
- No aparecen en navegacion de la app
- Solo accesibles por URL directa

---

## Seguridad

| Capa | Proteccion |
|------|-----------|
| Edge Function | Verifica `app_metadata.role === 'admin'` en cada request |
| AdminLayout | Verifica rol antes de renderizar dashboard |
| AdminAuth | Hace logout inmediato si el usuario no es admin |
| Rutas | Separadas del `ProtectedLayout` de usuarios normales |
| Navegacion | Admin no aparece en la UI de la app |

---

## Metricas a mostrar (Fase 1)

| Metrica | Fuente |
|---------|--------|
| Total usuarios | `auth.admin.listUsers()` |
| Email, nombre | `user.email`, `user.user_metadata.full_name` |
| Fecha de alta | `user.created_at` |
| Ultimo login | `user.last_sign_in_at` |
| Transacciones | `COUNT(*) FROM transactions WHERE user_id = ...` |
| Tarjetas de credito | `COUNT(*) FROM credit_cards WHERE user_id = ...` |
| Entradas de ahorro | `COUNT(*) FROM savings_entries WHERE user_id = ...` |
| Activos 7/30 dias | Usuarios con `last_sign_in_at` en el rango |

---

## Archivos a crear/modificar

| Archivo | Accion |
|---------|--------|
| `supabase/functions/get-admin-users/index.ts` | Crear |
| `supabase/config.toml` | Agregar config de funcion |
| `src/pages/admin/AdminAuth.tsx` | Crear |
| `src/pages/admin/AdminDashboard.tsx` | Crear |
| `src/components/admin/AdminLayout.tsx` | Crear |
| `src/App.tsx` | Agregar rutas admin |

---

## Consideraciones adicionales

1. **Paginacion**: `listUsers` soporta `page` y `perPage`; para mas de 50 usuarios se implementa paginacion en el dashboard

2. **Escalabilidad**: Los counts por usuario se hacen en la edge function con service role (sin RLS), eficiente para menos de 1000 usuarios

3. **No requiere migraciones**: Solo usa `app_metadata` existente en `auth.users`

4. **Acceso oculto**: La ruta `/admin` no esta linkeada en ninguna parte de la app

