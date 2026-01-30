
# Plan: Crear Página de Política de Privacidad

## Resumen

Voy a crear una página de Política de Privacidad profesional y accesible desde el footer de la landing page.

---

## Cambios a Realizar

### 1. Nueva Página: `src/pages/Privacy.tsx`

Crear una página con el contenido legal de privacidad, incluyendo:

- **Header** con título "Política de Privacidad"
- **Secciones del documento:**
  - Información que recopilamos
  - Cómo usamos tu información
  - Almacenamiento y seguridad de datos
  - Tus derechos sobre tus datos
  - Cookies y tecnologías similares
  - Cambios a esta política
  - Contacto

- **Diseño:** Estilo limpio y legible, consistente con la landing
- **Navegación:** Botón para volver a la landing

---

### 2. Agregar Ruta en `src/App.tsx`

```tsx
import Privacy from "./pages/Privacy";
// ...
<Route path="/privacy" element={<Privacy />} />
```

---

### 3. Actualizar Footer en `src/components/landing/FooterCTA.tsx`

Agregar enlace a la política de privacidad en el footer:

```tsx
<div className="flex items-center gap-4">
  <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
    Política de privacidad
  </Link>
</div>
```

El footer quedará con esta estructura:
- Logo + nombre (izquierda)
- Link "Política de privacidad" (centro)
- Copyright (derecha)

---

## Contenido de la Política

El documento incluirá secciones estándar adaptadas al contexto de una app de finanzas personales:

1. **Qué datos recopilamos** - Email, nombre, transacciones financieras
2. **Cómo los usamos** - Funcionalidad de la app, mejoras del servicio
3. **Seguridad** - Encriptación, almacenamiento seguro
4. **Tus derechos** - Acceso, rectificación, eliminación de datos
5. **Cookies** - Uso de cookies para sesión
6. **Contacto** - Cómo comunicarse para consultas

---

## Resultado Visual

```
┌────────────────────────────────────────────────────────┐
│  [Logo] Clarita la cuenta                              │
├────────────────────────────────────────────────────────┤
│                                                        │
│         Política de Privacidad                         │
│                                                        │
│  Última actualización: Enero 2026                      │
│                                                        │
│  1. Información que recopilamos                        │
│  ─────────────────────────────                         │
│  En Clarita la cuenta, recopilamos...                  │
│                                                        │
│  2. Cómo usamos tu información                         │
│  ─────────────────────────────                         │
│  Utilizamos tus datos para...                          │
│                                                        │
│  [... más secciones ...]                               │
│                                                        │
│  ← Volver a la página principal                        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Archivos Afectados

| Archivo | Acción |
|---------|--------|
| `src/pages/Privacy.tsx` | Crear |
| `src/App.tsx` | Agregar ruta `/privacy` |
| `src/components/landing/FooterCTA.tsx` | Agregar link en footer |
