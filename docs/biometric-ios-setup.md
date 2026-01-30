# Face ID / Código del teléfono (iOS)

La app usa `@capgo/capacitor-native-biometric` para desbloquear con Face ID o código del dispositivo en iOS.

## Configuración en Xcode

Si tenés un proyecto iOS (p. ej. `ios/` creado con `npx cap add ios`), agregá en **Info.plist**:

```xml
<key>NSFaceIDUsageDescription</key>
<string>Usamos Face ID para desbloquear la app y acceder a tus datos de forma segura.</string>
```

En Xcode: **App** → **Info** → **Custom iOS Target Properties** → **+** → `Privacy - Face ID Usage Description` = `Usamos Face ID para desbloquear la app...`.

## Flujo

- **Login**: Opción “Desbloquear con Face ID o código la próxima vez” (solo iOS).
- **Configuración**: Toggle “Desbloquear con Face ID o código” para activar/desactivar.
- **Al abrir la app**: Si está activo, se pide Face ID o código antes de entrar.
- **Cerrar sesión**: Se borran las credenciales guardadas y se hace sign out.

## Dependencias

- `@capgo/capacitor-native-biometric`
- `@capacitor/core` (vía `@capacitor/haptics`)

Después de instalar el plugin, ejecutá `npx cap sync` si usás Capacitor CLI.
