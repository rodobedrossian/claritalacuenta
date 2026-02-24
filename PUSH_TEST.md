# Cómo probar Push Notifications en Android (paso a paso)

## Requisitos previos

- Proyecto Firebase con app Android agregada y `google-services.json` en el proyecto nativo (lovable-ios/android/app/).
- Secrets en Supabase: `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY`.
- Migración `push_tokens` aplicada en Supabase (Dashboard → SQL o `supabase db push`).
- Edge Functions desplegadas: `send-push-notification`, `register-push-token`.

---

## Parte 1: Ejecutar la app en el emulador

1. **Abrir el proyecto nativo (lovable-ios)** en tu máquina (donde está la carpeta `android/`).
2. **Build de la web (este repo):**
   - En **claritalacuenta-main**: `npm run build`.
   - Copiar el contenido de `dist/` a la carpeta que usa Capacitor como `webDir` en lovable-ios (por ejemplo `www/`) o ejecutar `npx cap sync` desde lovable-ios si está configurado para tomar el build de este repo.
3. **Sincronizar Capacitor:** desde lovable-ios ejecutar `npx cap sync android`.
4. **Abrir Android Studio:** `npx cap open android` (desde lovable-ios).
5. **Emulador con Google Play:** En Android Studio, crear o elegir un AVD que tenga **Play Store** (por ejemplo "Pixel 6" con API 34 y sistema "Google Play"). FCM no funciona bien en imágenes sin Play.
6. **Ejecutar la app:** Botón Run (triángulo verde) o `Ctrl+R` / `Cmd+R`. Esperar a que instale y abra la app en el emulador.

---

## Parte 2: Iniciar sesión y obtener el token

1. En la app del emulador, **iniciar sesión** con un usuario de prueba (el mismo que usarás para enviar la notificación).
2. Una vez dentro del dashboard (o cualquier pantalla después de login), el código registra push y envía el token al backend.
3. **Ver el token (para comprobar que llegó):**
   - **Opción A – Consola del WebView:** Si tienes acceso a la consola del WebView (Chrome remote debugging o logs de Capacitor), buscar el log `[Push] Token: ...` y copiar el valor.
   - **Opción B – Variable global:** En la app, abrir la consola (si está disponible en desarrollo) y ejecutar `window.__FCM_TOKEN__`; el token queda guardado ahí tras el registro.
4. **Comprobar que el token se guardó en Supabase:**  
   Supabase Dashboard → **Table Editor** → tabla **push_tokens**. Deberías ver una fila con tu `user_id`, `platform` = `android` y el `token` (largo). Si no hay fila, revisar que la Edge Function `register-push-token` esté desplegada y que no haya errores en **Edge Functions → Logs**.

---

## Parte 3: Enviar una notificación de prueba

### Opción A – Supabase Dashboard (rápido)

1. Ir a **Supabase Dashboard** del proyecto.
2. **Edge Functions** → elegir **send-push-notification**.
3. Pulsar **Invoke** / **Run**.
4. En el **body** poner (reemplazando `TU_USER_ID` por el UUID del usuario con el que iniciaste sesión):

```json
{
  "user_id": "TU_USER_ID",
  "title": "Test Android",
  "body": "Notificación de prueba desde Supabase",
  "type": "test"
}
```

5. Ejecutar. En la respuesta deberías ver algo como `"sent": 1` (o más si hay varios dispositivos).
6. En el **emulador**, la app puede estar en primer o segundo plano: en unos segundos debería aparecer la notificación.

### Opción B – cURL (terminal)

1. Obtener la **URL del proyecto** y la **anon key**: Supabase Dashboard → **Settings** → **API**.
2. En terminal:

```bash
curl -X POST "https://TU_PROJECT_REF.supabase.co/functions/v1/send-push-notification" \
  -H "Authorization: Bearer TU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"TU_USER_ID","title":"Test Android","body":"Notificación de prueba","type":"test"}'
```

3. Sustituir `TU_PROJECT_REF`, `TU_ANON_KEY` y `TU_USER_ID`.
4. Revisar la respuesta y la notificación en el emulador.

---

## Parte 4: Si no llega la notificación

1. **Permisos:** En el emulador (Android 13+), **Settings → Apps → tu app → Notifications** y comprobar que estén permitidas.
2. **Token en BD:** Confirmar en **push_tokens** que existe una fila para ese `user_id` y `platform = android` con el token actual.
3. **FCM credentials:** En Supabase → **Edge Functions** → **send-push-notification** → **Secrets**, verificar que existan `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY` y que el JSON de la cuenta de servicio sea el correcto.
4. **Logs:** En **Edge Functions → send-push-notification → Logs** ver si hay errores al enviar (OAuth, FCM, etc.).
5. **Probar solo FCM (sin tu backend):** En [Firebase Console](https://console.firebase.google.com) → **Mensajería** → **Crear campaña** → **Notificaciones** → **Enviar mensaje de prueba** y pegar el token. Si ahí no llega, el problema es Firebase/emulador/app; si ahí llega y desde Supabase no, el problema es la Edge Function o los secrets.

---

## Resumen de flujo

1. App (Android) abre → usuario logueado → `initPushNotifications` → Capacitor registra con FCM → llega el token.
2. Listener `registration` → llama a `register-push-token` con ese token → se guarda en **push_tokens**.
3. Tú (o el admin) llaman a **send-push-notification** con `user_id` → la función lee **push_tokens** (android) y **push_subscriptions** (web), envía por FCM y/o Web Push.
4. El dispositivo recibe la notificación.

Si en algún paso algo falla, usar los pasos de la Parte 4 para acotar el fallo.
