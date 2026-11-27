# MicroPlan

**Plataforma Digital Inteligente de Microplanificación Académica, Gestión del Enfoque y Protección del Descanso para Estudiantes Universitarios (BUAP · Equipo 6).**

## Estructura del Repositorio

```text
MicroPlan/
├── MICROPLAN_CONTEXT.md   # Documento maestro funcional, reglas de negocio y casos de uso (CU-01 a CU-14)
├── frontend/              # PWA Offline-First (React + TypeScript + Vite + Tailwind + IndexedDB/Dexie)
└── backend/               # (Fase 3) API REST + Base de Datos Cloud + Agente IA de Microplanificación
```

## Fases del Proyecto

1. **Prototipo (Completado):** Diseño UX/UI en Figma v2.1 (23 pantallas, 6 secciones, Design System).
2. **Frontend + Procesos Locales del Teléfono (En curso):** PWA instalable 100% funcional Offline-First con IndexedDB, temporizador resiliente, audio ambiente offline, escudo anti-distracción, gamificación no punitiva y motor local de microplanificación.
3. **Backend + Agente IA:** Autenticación real (Email + Google OAuth), sincronización en la nube y Agente IA multimodal para desglose de rúbricas (PDF/imagen).
4. **Despliegue:** Publicación en la nube (y empaquetado opcional a APK con Capacitor).

## Cómo ejecutar la PWA localmente

```bash
cd frontend
npm install
npm run dev -- --host --port 5173
```

- **En PC:** `http://localhost:5173`
- **En celular (mismo Wi-Fi):** `http://<TU_IP_LOCAL>:5173` (puedes agregarla a pantalla de inicio como app).
