# Hoja de Ruta: Escudo Anti-Distracciones Nativo en APK (Capacitor Android)

En la versión **PWA Web (Fase 2)**, los navegadores móviles no permiten por seguridad bloquear otras aplicaciones instaladas (TikTok, Instagram, WhatsApp). Por ello, `frontend/src/services/shieldBridge.ts` implementa el **Escudo de Fricción Consciente**:
1. Bloquea salidas entre pestañas internas de MicroPlan cuando hay un bloque Focus activo con Escudo ON.
2. Detecta cuando el estudiante minimiza la app o cambia de pestaña (`document.visibilitychange`) y al regresar muestra el modal **`04.4 · Aviso Escudo`** indicando el tiempo fuera y el costo cognitivo (~15 min).

## Cómo escalar a bloqueo real al compilar el `.apk` (Fase 4 con Capacitor)

1. **Envolver el proyecto con Capacitor:**
   - `npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/app`
   - `npx cap init MicroPlan mx.buap.microplan --web-dir dist`
   - `npx cap add android`
2. **Plugin nativo Android para detección de apps externas:**
   - Implementar un plugin Capacitor en Kotlin que reemplace `WebPwaShieldBridge` usando:
     - `@capacitor/app` (`App.addListener('appStateChange')`) para detectar salida de MicroPlan en tiempo real.
     - **`UsageStatsManager`** (`PACKAGE_USAGE_STATS`) en un `ForegroundService` mientras dura el bloque Pomodoro para identificar si el paquete en primer plano pertenece a la lista configurable de distractores (redes sociales / juegos).
     - **`SYSTEM_ALERT_WINDOW`** o **Notificación Full-Screen / Overlay calmado** mostrando la pantalla `04.4 · Aviso Escudo` sobre la app distractora con opción de volver a MicroPlan sin romper la racha.
     - **`NotificationManager.setInterruptionFilter`** (opcional, con permiso del usuario) para activar **No Molestar** automáticamente al iniciar Focus.
