# MicroPlan

**Plataforma Digital Inteligente de Microplanificación Académica, Gestión del Enfoque y Protección del Descanso para Estudiantes Universitarios (BUAP · Equipo 6).**

---

## Enlaces en Producción

- **App Web / PWA (Vercel):** [https://micro-plan.vercel.app/](https://micro-plan.vercel.app/)
- **Backend API (Render):** [https://microplan-backend.onrender.com/api/health](https://microplan-backend.onrender.com/api/health)
- **APK Android Híbrido (v1.1):**
  - En el repositorio: [`releases/MicroPlan-v1.1-android.apk`](releases/MicroPlan-v1.1-android.apk)
  - Descarga directa: [Descargar MicroPlan-v1.1-android.apk](https://github.com/Oscar18900/MicroPlan/raw/main/releases/MicroPlan-v1.1-android.apk)

---

## Arquitectura Desplegada

| Capa | Tecnología / Servicio | Descripción |
|---|---|---|
| **Frontend (PWA)** | React + TypeScript + Vite + Tailwind + Dexie (IndexedDB) en **Vercel** | Interfaz móvil-first Offline-First con sincronización automática. |
| **Backend (API REST)** | Node.js + Express + Prisma ORM en **Render** | Autenticación JWT + Google OAuth, sincronización de snapshots y telemetría. |
| **Base de Datos** | PostgreSQL en **Supabase** | Persistencia en la nube (materias, horarios, entregas, enfoque, sueño y medallas). |
| **Agente IA Ético** | **Groq API** (`openai/gpt-oss-120b` + fallback local) | Desglosa rúbricas (texto, PDF e imagen/OCR) en micro-metas de 25/50 min sin hacer la tarea. |
| **App Móvil Android** | **Capacitor 7** (Modo Híbrido + Plugins Java nativos) | Carga la PWA de Vercel y agrega capacidades nativas de Android. |

---

## App Android (`MicroPlan-v1.1-android.apk`)

El `.apk` opera en **Modo Híbrido** conectado a [https://micro-plan.vercel.app/](https://micro-plan.vercel.app/):

- **Escudo Nativo Anti-Distracciones (`MicroPlanShield`):** durante un bloque Pomodoro con **Escudo ON**, utiliza `ForegroundService` (`specialUse`) + `UsageStatsManager` + `SYSTEM_ALERT_WINDOW` para detectar si abres otra aplicación y mostrar un aviso calmado encima (*"¿Seguro que quieres salir?"*) con opciones para **← Volver a MicroPlan** o **Salir igualmente** (sin romper la racha).
- **Inicio de sesión nativo con Google (`MicroPlanGoogleAuth`):** integrado con **Android Credential Manager** + Google ID, además de inicio de sesión clásico con correo y contraseña.
- **Actualizaciones automáticas del Frontend:** cualquier mejora en la interfaz publicada en `main` (Vercel) se refleja automáticamente dentro del APK sin necesidad de reinstalarlo (salvo cambios en código nativo Android).

### Cómo instalar y probar en Android

1. Descarga [`MicroPlan-v1.1-android.apk`](https://github.com/Oscar18900/MicroPlan/raw/main/releases/MicroPlan-v1.1-android.apk) en tu teléfono e instálalo (permite instalar desde orígenes desconocidos si Android lo solicita).
2. Abre la app, ve a la pestaña **Focus** y en la tarjeta **Escudo Anti-Distracciones** pulsa **Activar** en los 2 permisos (una sola vez):
   - **1. Acceso a datos de uso**
   - **2. Mostrar sobre otras apps**
   - *(Opcional)* **3. Notificaciones**
3. Inicia un bloque Pomodoro con **Escudo ON** y abre otra app para probar el aviso superpuesto.

---

## Estructura del Repositorio

```text
MicroPlan/
├── MICROPLAN_CONTEXT.md        # Documento maestro funcional, reglas de negocio y casos de uso (CU-01 a CU-14)
├── render.yaml                 # Blueprint de despliegue del Backend en Render
├── frontend/                   # PWA Offline-First (React + TypeScript + Vite + Tailwind + Dexie)
│   ├── capacitor.config.ts     # Configuración híbrida de Capacitor (mx.buap.microplan)
│   ├── vercel.json             # Reglas de enrutamiento SPA para Vercel
│   └── android/                # Proyecto nativo Android (Escudo Overlay + Google Sign-In)
├── backend/                    # API REST (Express + Prisma PostgreSQL + Groq AI + Google OAuth)
├── docs/
│   ├── DEPLOY_GUIDE.md         # Guía de despliegue en Supabase, Render y Vercel
│   └── APK_SHIELD_ROADMAP.md   # Diseño e integración del Escudo nativo en Capacitor
└── releases/
    └── MicroPlan-v1.1-android.apk
```

---

## Estado de las Fases

1. **Prototipo UX/UI (Completado):** Diseño en Figma v2.1 (23 pantallas, 6 secciones y Design System).
2. **Frontend + Procesos Locales (Completado):** PWA Offline-First con IndexedDB, temporizador resiliente, audio ambiente local, gamificación no punitiva y motor local de respaldo.
3. **Backend + Agente IA (Completado):** API REST con Prisma PostgreSQL, autenticación Email + Google OAuth, OCR/PDF y Agente IA ético en Groq.
4. **Despliegue Cloud + APK Android (Completado):** Base de datos en Supabase, Backend en Render, Frontend PWA en Vercel y APK híbrido v1.1 con Escudo nativo y Google Sign-In.

---

## Ejecución local y Documentación

- **Frontend:** entra a `frontend/`, ejecuta `npm install` y `npm run dev -- --host --port 5173` (consulta [`frontend/.env.example`](frontend/.env.example) para apuntar a un backend específico).
- **Backend:** revisa [`backend/README.md`](backend/README.md) y [`backend/.env.example`](backend/.env.example).
- **Despliegue en la nube:** revisa [`docs/DEPLOY_GUIDE.md`](docs/DEPLOY_GUIDE.md).
- **Especificación funcional completa:** revisa [`MICROPLAN_CONTEXT.md`](MICROPLAN_CONTEXT.md).
