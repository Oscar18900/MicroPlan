# Microplan — Documento Maestro de Contexto, Reglas de Negocio y Casos de Uso (v2.1)

> **Propósito de este archivo:** Servir como única fuente de verdad funcional, UX/UI y técnica para desarrollar el MVP completo (**Frontend + Procesos Locales del Teléfono + Backend + Agente IA de Microplanificación + Despliegue**) en un chat nuevo sin perder contexto ni gastar tokens re-explicando el proyecto.

---

## 1. Visión del Proyecto y Objetivos SMART

- **Nombre:** Microplan — Plataforma Digital Inteligente de Microplanificación Académica, Gestión del Enfoque y Protección del Descanso.
- **Contexto académico:** Proyectos de I+D · Facultad de Ciencias de la Computación (BUAP) · Equipo 6 (Angel Alfonso García Zárate [PM], Oscar Acuña Gamez, Shai Bañuelos García, Paulina Ramírez Dorantes y Erasmo Aguilar Gasca).
- **Problema central:** Estudiantes universitarios (18–25 años) sufren parálisis ante entregas grandes, distracciones durante el estudio y *"procrastinación vengativa de la hora de dormir"* por no tener tiempo libre diurno protegido.
- **Metas SMART del MVP y Piloto (50+ estudiantes):**
  1. **Microplanificación inteligente:** Registro en **< 1 min**; reducir al menos **60%** el bloqueo percibido al iniciar entregas.
  2. **Gestión del enfoque:** Reducir al menos **40%** las interrupciones por distracciones/redes durante bloques de estudio.
  3. **Protección del descanso:** Lograr que al menos **75%** de los usuarios activos mantengan rutinas de sueño **>= 7 horas diarias** (con piso absoluto de emergencia >= 6h) y bloque de ocio diurno protegido.
  4. **Adopción y usabilidad:** Puntaje **SUS > 80/100** y adopción semanal **>= 70%**.

---

## 2. Fuente de Verdad Visual (Figma v2.1)

- **URL del archivo educativo final:** https://www.figma.com/design/VvHfj5jf1xazxJMPsqwTrN/microplan?node-id=2-246
- **Páginas del archivo:**
  1. `📦 Archivo Original (Stitch)` — respaldo histórico (no usar para desarrollo).
  2. `🎨 Design System — Microplan` — tokens y componentes (`BottomNav`, `Button`, `Badge`).
  3. `📱 Prototipo Completo v2 (Microplan)` — **23 pantallas** en **6 secciones**, con transiciones interactivas cableadas y 2 *Flow Starting Points*.

### Sistema Visual y Tokens
- **Estética:** Minimalista, modo claro limpio, baja fricción cognitiva, cero sobreestimulación.
- **Paleta:**
  - Fondos: Canvas `#FAF8FF`, Tarjetas `#FFFFFF`, Superficie sutil `#F2F3FF`, Muted `#EAEDFF`, Borde `#E5E7F3`.
  - Textos: Primario `#131B2E`, Secundario `#434655`, Atenuado `#737686`.
  - Marca / Enfoque: Azul `#2563EB` (Deep `#004AC6`, Soft `#E5EEFF`).
  - Bienestar / Ocio / Descanso: Teal `#006A63` (Soft `#E2F7F5`), Éxito `#117E3B` (Soft `#E6F7EC`).
  - Alertas: Advertencia ámbar `#B15106` (Soft `#FFFBEB`), Toque de queda / Peligro `#BA1A1A` (Soft `#FFDAD6`).
  - Materias: Azul `#2563EB`, Morado `#7C3AED`, Teal `#0D9488`, Ámbar `#D97706`, Rosa `#E11D48`.
- **Tipografía:** `Plus Jakarta Sans` (títulos y cifras) + `Inter` (cuerpo y controles).

### Mapa de las 23 Pantallas
- **01 · Autenticación y Onboarding (< 1 min):**
  - `01.1 Login` (incluye `Continuar con Google`)
  - `01.2 Registro` (incluye `Registrarse con Google`)
  - `01.3 Onboarding 1/4 — Perfil y Sueño` (carrera, semestre, meta >= 7h, alerta y límite dormir)
  - `01.4 Onboarding 2/4 — Materias y Horario` (registro inicial de materias y turno base)
  - `01.5 Onboarding 3/4 — Ocio Protegido` (bloque diurno inmune a tareas)
  - `01.6 Onboarding 4/4 — Demo Microplan IA` (muestra interactiva rápida y omitible)
- **02 · Dashboard (Inicio):**
  - `02.1 Dashboard (Inicio)` — Nivel/XP, Racha semanal, 3 KPIs rápidos, **1 sola tarjeta héroe "Siguiente Paso"** (`Iniciar en Focus`), y recordatorio compacto de Ocio Protegido. **No duplica la lista completa de tareas.**
- **03 · Plan (Única fuente de entregas y micro-metas):**
  - `03.1 Plan (Principal)` — filtro por Materias, medidor de Capacidad Diaria + alerta de sobrecarga (`Rebalancear`), CTA `+ Nueva Entrega`, entregas expandibles con checkbox directo (sin Pomodoro) o botón `▶` hacia Focus.
  - `03.2 Plan — Nueva Entrega (< 1 min)` — selección de Materia de lista registrada, título, fecha límite, textarea de instrucciones/rúbrica + adjuntar PDF o foto de indicaciones + aviso ético IA (sin plantillas forzadas).
  - `03.3 Plan — Revisión Desglose IA` — trazabilidad del archivo/instrucciones, badge de respeto a horario/ocio/sueño, bloques editables y confirmación.
  - `03.4 Plan — Gestión de Materias` — alta/edición de materias con color y acceso al horario semanal.
  - `03.5 Plan — Rebalanceo Inteligente` — comparativa *Antes vs. Después* cuando un día supera el límite saludable.
  - `03.6 Plan — Analizando Rúbrica IA` — estado de carga sereno paso a paso mientras el agente procesa PDF/indicaciones.
  - `03.7 Plan — Estado Vacío` — vista calmada cuando el estudiante no tiene entregas activas.
- **04 · Focus:**
  - `04.1 Focus (Sesión Activa)` — temporizador adaptativo (`25m | 45m | 50m | 5m Pausa`), chip opcional/descartable (`×`) de micro-meta vinculada, Escudo de Fricción Consciente y sonido ambiente.
  - `04.2 Focus — Bloque Completado` — hoja no punitiva (`+35 XP · Racha protegida`): marcar completada, tomar pausa 5 min, o extender +25 min.
  - `04.3 Focus — Pausa Regenerativa (5 min)` — temporizador teal de descanso con sugerencias sin pantalla.
  - `04.4 Focus — Aviso Escudo (Al intentar salir)` — modal de fricción consciente al intentar salir/cambiar de ventana durante un bloque activo.
- **05 · Wellness:**
  - `05.1 Wellness (Descanso y Balance)` — gráfica semanal de sueño vs meta >= 7h, tarjeta de Ocio Diurno Blindado, balance macro de energía del día (`Clases`, `Estudio`, `Ocio`, `Sueño`) y check-in matutino de sueño. **Sin lista de tareas ni botones Pomodoro.**
  - `05.2 Wellness — Alerta Nocturna (10:30 PM)` — tarjeta nocturna calmo con saldo pendiente reprogramable a mañana + Modo Emergencia configurable.
- **06 · Perfil:**
  - `06.1 Perfil (Principal)` — identidad, resumen de medallas, acceso prominente al Horario Semanal, configuración de Higiene de Sueño, Rigidez (`Suave / Equilibrado / Estricto`), **Modo Emergencia configurable (`+30m | +45m | +60m`, máx. 2/sem)** y Guías Rápidas.
  - `06.2 Perfil — Horario Semanal de Clases` — cuadrícula visual `Lun–Vie (08:00–20:00)` con clases por color y franja fija de Ocio Protegido.
  - `06.3 Perfil — Medallas y Guías Rápidas` — tablero 2×3 de logros + 4 guías rápidas (< 30s).

---

## 3. Reglas de Negocio Inmutables (Sin Contradicciones)

### 3.1 Sistema de Rachas (`Streak`) — No Punitivo
La racha mide **constancia saludable**, nunca perfeccionismo tóxico:
- **Cómo suma +1 día la racha (al cierre del día / toque de queda):**
  - El usuario cumplió al menos **1 avance académico** (completar >= 1 bloque en Focus **o** marcar >= 1 micro-meta directo en Plan) **O** no tenía micro-metas programadas para ese día (día libre/al día), **Y**
  - Respetó su descanso nocturno (se desconectó antes de su hora límite de dormir **o** reprogramó su saldo pendiente a las 10:30 PM **o** usó Modo Emergencia dentro de su límite configurado sin invadir las 6h mínimas de sueño).
- **Qué NO rompe la racha (aclarado explícitamente en UI):**
  - **Pausar, descartar o no terminar un bloque Pomodoro (`04.4`):** simplemente pausa/descarta el bloque actual y no otorga los `+35 XP` de bloque completado, pero **NO rompe la racha**.
  - **Usar `Reprogramar pendiente y Dormir` en la alerta de las 10:30 PM (`05.2`):** mueve el bloque pendiente al siguiente hueco libre del día siguiente y **mantiene la racha**.
  - **Usar `Modo Emergencia` dentro del límite configurado (`+30m / +45m / +60m`) y del cupo semanal (máx. 2 veces/semana):** mantiene la racha siempre que detenga la sesión antes de invadir el piso mínimo de 6h de sueño.
- **Cuándo SÍ se reinicia la racha a `0`:**
  1. El estudiante **excede su límite de Modo Emergencia / invade el piso mínimo de 6h de sueño** (estudiar de madrugada rompiendo el toque de queda infranqueable o gastar más de 2 emergencias semanales).
  2. Termina el día teniendo **micro-metas pendientes para hoy** sin haber completado ninguna ni haberlas reprogramado antes de dormir.

### 3.2 Sistema de XP, Niveles y Medallas
- **Ganancia de XP:**
  - `+35 XP`: Completar un bloque de enfoque en `Focus` (25m / 45m / 50m).
  - `+15 XP`: Marcar una micro-meta como completada directamente en `Plan` (para tareas rápidas o hechas fuera de la app).
  - `+20 XP`: Bono diario de Higiene de Sueño (registrar check-in matutino >= 7h o desconectarse antes del toque de queda).
  - `+25 XP`: Completar todas las micro-metas de una entrega.
- **Niveles:** Curva progresiva simple: `XP_necesario(nivel) = nivel * 350` (Ej.: Nivel 1 → 350 XP, Nivel 4 → 1,500 XP acumulados).
- **Medallas (6 iniciales en `06.3`):**
  1. *Racha 5 Días:* 5 días consecutivos cumpliendo la regla de racha.
  2. *Sueño 7h+:* 5 noches registrando >= 7h de sueño o desconexión a tiempo.
  3. *Escudo Zen:* 10 bloques completados en Focus sin salir de la app (`04.4` no disparado).
  4. *Planificador IA:* 3 entregas desglosadas y confirmadas con el agente IA.
  5. *Racha 14 Días:* 14 días consecutivos de racha.
  6. *Semestre Zen:* 4 semanas cumpliendo ocio diurno protegido y cero trasnochos fuera de emergencia.

### 3.3 Separación de Responsabilidades entre Plan y Focus
- **En `Plan` (`03.1`)** el usuario puede:
  - Tachar el checkbox de una micro-meta directamente (ideal si ya la hizo en clase, en papel o sin cronómetro) → suma `+15 XP`.
  - Pulsar `▶` en la micro-meta para abrir `Focus` con ese título pre-vinculado como chip opcional.
- **En `Focus` (`04.1`)** el usuario puede:
  - Trabajar en **modo libre** (sin tarea vinculada; el chip se puede quitar con `×`) o con una micro-meta vinculada.
  - Elegir duración (`25m`, `45m`, `50m`, `5m Pausa`) y sonido ambiente local (`Silencio`, `Ruido Blanco`, `Lluvia` generados con Web Audio / audio local).

### 3.4 Escudo Anti-Distracción (Fricción Consciente Realista)
- **La app NO bloquea el sistema operativo** (ni Android/iOS/Web permiten bloquear otras apps sin permisos intrusivos de MDM/accesibilidad).
- **Cómo funciona realmente:**
  1. Al activar `Escudo: ON` durante una sesión en `04.1`, la app activa un listener de salida/cambio de contexto:
     - En **Web/PWA:** `document.visibilitychange`, `window.blur`, `beforeunload` y bloqueo suave de navegación interna entre pestañas de la app.
     - En **Móvil nativo/híbrido:** `AppState` (`active` → `background`/`inactive`) + botón físico Atrás / cambio de ruta.
  2. Si el usuario intenta cambiar de pestaña dentro de la app o regresar desde segundo plano antes de terminar el bloque, se muestra **`04.4 · Aviso Escudo`**:
     - Informa cuánto tiempo falta y el costo cognitivo de interrumpir (~15 min en recuperar foco).
     - Aclara que salir pausa el bloque (sin los `+35 XP`) pero no rompe la racha.
     - Ofrece **3 salidas:** `Volver a mi enfoque`, `Pausar bloque y salir al Inicio`, o `Descartar este bloque`.
  3. Sugiere opcionalmente activar **No Molestar** del teléfono para silenciar notificaciones externas.

### 3.5 Higiene de Sueño, Ocio Protegido y Modo Emergencia Configurable
- **Meta de sueño:** `7.0h`, `7.5h` (default) o `8.0h` (mínimo saludable = `7.0h`).
- **Alerta nocturna (default `10:30 PM`)** y **Hora límite para dormir (default `11:00 PM`)**: calculadas coherentemente con la hora de despertar del horario de clases.
- **Rigidez del Escudo y Toque de Queda (en `06.1`):**
  - `Suave`: avisos informativos, permite posponer 15 min antes de mostrar `05.2`.
  - `Equilibrado` *(default)*: muestra `04.4` al intentar salir de Focus y abre `05.2` a las 10:30 PM.
  - `Estricto`: bloquea iniciar nuevos bloques en Focus después de la hora de alerta nocturna (salvo Modo Emergencia activo).
- **Modo Emergencia configurable (en `06.1` y aplicado en `05.2`):**
  - Duración máxima configurable: **`+30m` | `+45m` *(default)* | `+60m`**.
  - Cupo máximo: **2 usos por semana** (para exámenes o entregas críticas reales).
  - **Piso absoluto innegociable:** Incluso con Modo Emergencia activo, la app garantiza al menos **6.0 horas de sueño** antes del primer bloque de clase del día siguiente; si se rebasa ese límite, la racha se reinicia y se muestra una sugerencia calma de descanso.

### 3.6 Contrato Ético y Técnico del Agente IA de Microplanificación
- **Entradas al agente (`03.2`):**
  1. `subject` (materia seleccionada de la lista registrada).
  2. `title` (título de la entrega — el agente infiere automáticamente si es ensayo, práctica, código, examen, exposición, etc., **sin obligar plantillas**).
  3. `dueDate` (fecha límite).
  4. `instructionsText` (texto pegado por el usuario) **y/o** `attachment` (PDF o imagen/foto de la rúbrica/indicaciones).
  5. Contexto del estudiante: `weeklySchedule` (clases), `protectedLeisure` (`17:00–18:00`), `dailyCapacityHours` (default `3.0h`), `sleepCurfew` (`22:30`), y carga ya agendada en los días disponibles.
- **Restricción ética estricta (System Prompt del Agente):**
  - **Prohibido hacer la tarea:** El agente NO debe redactar ensayos, resolver ejercicios, generar código entregable ni responder guías.
  - **Única función:** Extraer entregables/criterios de la rúbrica, estimar tiempos realistas en bloques de **25 o 50 min**, redactar títulos accionables de micro-metas (ej. *"Definir esquema SQL y 3 endpoints principales"*) y distribuirlas en huecos libres reales.
- **Salida estructurada (JSON):**
  - `inferredType` (`practice | essay | exam | presentation | project`)
  - `totalEstimatedMinutes` y `totalBlocks`
  - `microTasks[]`: `{ title, dayDate, suggestedTimeSlot, estimatedMinutes, blocksCount, rationale }`
  - `warnings[]`: aviso si la fecha está demasiado próxima y se sugiere activar rebalanceo (`03.5`).

---

## 4. Catálogo Completo de Casos de Uso (CU-01 a CU-14)

| ID | Caso de Uso | Pantalla(s) Figma | Flujo Principal y Reglas Clave |
|---|---|---|---|
| **CU-01** | Iniciar sesión / Registro (Email o Google) | `01.1`, `01.2` | Autentica vía email/password o Google OAuth. Usuarios nuevos pasan a `01.3`; recurrentes directo a `02.1`. |
| **CU-02** | Onboarding guiado (< 1 min) | `01.3`–`01.6` | 4 pasos omitibles (`Omitir`): perfil y sueño >= 7h, materias iniciales + turno, ocio diurno protegido y demo IA. |
| **CU-03** | Consultar estado, XP, racha y siguiente paso | `02.1` | Muestra Nivel/XP, racha semanal, 3 KPIs y **solo 1 tarjeta "Siguiente Paso"** (`▶ Iniciar en Focus`). |
| **CU-04** | Gestionar materias y horario semanal | `03.4`, `06.2` | CRUD de materias con color + cuadrícula `Lun–Vie (08:00–20:00)` con clases y franja protegida de ocio. |
| **CU-05** | Crear entrega con instrucciones/PDF + Agente IA | `03.2`, `03.6`, `03.3` | Usuario elige materia, título, fecha, pega indicaciones o sube PDF/foto -> `03.6` procesa -> `03.3` permite editar/quitar/reordenar pasos y confirmar. |
| **CU-06** | Crear entrega y micro-metas manuales | `03.2`, `03.1` | Flujo `Prefiero agregar mis pasos manualmente` crea la entrega y abre la edición directa en `03.1`. |
| **CU-07** | Completar micro-meta directo (sin Focus) | `03.1` | Checkbox en `03.1` marca hecha la micro-meta (`+15 XP`), actualiza barra de capacidad del día y el Siguiente Paso de `02.1`. |
| **CU-08** | Rebalancear sobrecarga diaria | `03.1`, `03.5` | Si un día excede `dailyCapacityHours` (3.0h), `03.1` muestra alerta y `03.5` compara *Antes vs. Después* para mover bloques a días ligeros con 1 clic. |
| **CU-09** | Sesión de enfoque adaptativa (libre o vinculada) | `04.1` | Temporizador `25/45/50m`, chip opcional descartable (`×`), sonido ambiente local y registro preciso de minutos netos. |
| **CU-10** | Fricción consciente al intentar salir de Focus | `04.4` | Detecta cambio de ventana/app/ruta con bloque activo -> muestra `04.4` aclarando que pausa sin romper racha. |
| **CU-11** | Cierre de bloque y pausa regenerativa | `04.2`, `04.3` | Al llegar a `00:00`, suma `+35 XP`, permite marcar micro-meta hecha, iniciar `Pausa 5m` (`04.3`) o extender `+25m`. |
| **CU-12** | Monitorear sueño, ocio y balance energético | `05.1` | Gráfica semanal vs meta 7h+, check-in rápido matutino (`6h / 7h / 7.5h / 8h+`), tarjeta de Ocio Blindado y balance macro del día. |
| **CU-13** | Alerta nocturna (10:30 PM), reprogramación o Emergencia | `05.2` | A la hora de alerta nocturna ofrece `Reprogramar y Dormir` (mantiene racha) o `Modo Emergencia` según límite configurado en `06.1`. |
| **CU-14** | Configurar reglas, rigidez, medallas y guías | `06.1`, `06.3` | Editar meta de sueño, toque de queda, rigidez (`Suave/Equilibrado/Estricto`), límite emergencia (`+30/+45/+60m`), ver medallas y guías < 30s. |

---

## 5. Procesos Locales del Teléfono vs. Backend Cloud

### Procesos que deben ejecutarse localmente en el teléfono / cliente (PWA o App Móvil)
1. **Motor de Temporizador Resiliente (`Focus` & `Pausa`):**
   - No depender solo de `setInterval` (que se congela en segundo plano). Guardar `startedAt`, `durationSec`, `pausedRemainingSec` en almacenamiento local (`IndexedDB` / `AsyncStorage` / `localStorage`) y calcular el tiempo restante con `Date.now() - startedAt`.
2. **Escudo de Fricción Consciente (`04.4`):**
   - Listeners nativos/web de cambio de visibilidad (`visibilitychange`, `AppState`, guardas de router) para disparar `04.4` y registrar eventos de distracción para telemetría.
3. **Motor de Audio Ambiente Offline:**
   - Reproducción local de Ruido Blanco y Lluvia (archivos ligeros cacheados en Service Worker / assets locales) sin consumir datos ni depender de red.
4. **Notificaciones Locales Programadas + Respaldo Push:**
   - Programar localmente alertas para inicio de **Ocio Protegido (`17:00`)**, **Alerta Nocturna (`22:30`)**, **Fin de bloque Focus** y **Recordatorio de Siguiente Paso**, sincronizadas con Web Push / FCM como respaldo.
5. **Cola Offline (Offline-First):**
   - Permitir marcar micro-metas, registrar horas de sueño y completar bloques de Focus sin internet, encolando mutaciones para sincronizar con el backend al recuperar conexión.

### Procesos del Backend Cloud + Agente IA
1. **Autenticación y Perfil:** Email/Password + Google OAuth (JWT / sesión segura).
2. **Persistencia y Sincronización en Tiempo Real:** Base de datos en la nube con materias, horario semanal, entregas, micro-metas, sesiones de enfoque, bitácora de sueño, XP, rachas y medallas.
3. **Agente IA de Microplanificación (`/ai/breakdown` y `/ai/rebalance`):**
   - Parseo de PDF (extracción de texto) o imagen de rúbrica (OCR/Vision multimodal).
   - Validación de restricciones de agenda (clases + ocio protegido + capacidad diaria + hora límite de sueño).
   - Generación de JSON estructurado con pasos accionables (nunca resolviendo la tarea).
4. **Motor de Telemetría para Validación Piloto (BUAP):**
   - Registro anonimizado de métricas exigidas en el Acta: tasa de finalización de micro-metas, reducción de sesiones en madrugada, promedio de horas de descanso, interrupciones evitadas y adopción semanal.

---

## 6. Modelo de Datos Resumido y Contratos API Clave

### Entidades principales
- `User`: `id, name, email, authProvider, career, semester, xp, level, currentStreak, bestStreak, lastStreakDate`
- `UserWellnessConfig`: `userId, sleepGoalHours (7.0-8.0), curfewAlertTime ("22:30"), bedtimeLimitTime ("23:00"), shieldRigidity ("soft"|"balanced"|"strict"), emergencyMinutes (30|45|60), emergencyWeeklyQuota (2), emergencyUsedThisWeek, dailyCapacityMinutes (180), leisureDays[], leisureStart ("17:00"), leisureEnd ("18:00"), leisureTags[]`
- `Subject`: `id, userId, name, colorHex`
- `ClassBlock`: `id, userId, subjectId, dayOfWeek (1-5), startTime, endTime, label`
- `Delivery`: `id, userId, subjectId, title, inferredType, dueDate, instructionsText, attachmentMeta, createdVia ("ai"|"manual"), status ("active"|"completed")`
- `MicroTask`: `id, deliveryId, userId, title, scheduledDate, scheduledSlot, estimatedMinutes, blocksCount, status ("pending"|"completed"|"rescheduled"), completedVia ("focus"|"direct"|null), completedAt`
- `FocusSession`: `id, userId, microTaskId (nullable), plannedMinutes, actualMinutes, completed (bool), exitInterruptionsCount, ambientSound, startedAt, endedAt`
- `SleepLog`: `id, userId, date, sleptHours, respectedCurfew (bool), usedEmergency (bool), emergencyMinutesUsed`
- `BadgeUnlock`: `id, userId, badgeCode, unlockedAt`

### Endpoints mínimos del Backend
- `POST /auth/register`, `POST /auth/login`, `POST /auth/google`
- `GET/PUT /profile/config` (sueño, ocio, rigidez, emergencia)
- `CRUD /subjects`, `CRUD /schedule/blocks`
- `GET /dashboard` (calcula nivel, racha, 3 KPIs y 1 único `nextStep`)
- `CRUD /deliveries` & `PATCH /microtasks/:id` (completar directo / reprogramar)
- `POST /ai/breakdown` (`multipart/form-data` o JSON con texto + PDF/imagen → devuelve propuesta editable)
- `POST /ai/rebalance` (analiza sobrecarga diaria y propone movimientos *Antes vs. Después*)
- `POST /focus/sessions/start`, `POST /focus/sessions/:id/complete`, `POST /focus/sessions/:id/interrupt`
- `GET /wellness/summary`, `POST /wellness/sleep-checkin`, `POST /wellness/curfew-action` (`reschedule_sleep` | `activate_emergency`)

---

## 7. Guía de Arranque para el Siguiente Chat (Fase 2: Implementación)

Al abrir un **chat nuevo** en esta carpeta (`microplan`), inicia con un mensaje breve como:

> *"Lee `MICROPLAN_CONTEXT.md` y el diseño en Figma (`https://www.figma.com/design/VvHfj5jf1xazxJMPsqwTrN/microplan?node-id=2-246`). Vamos a iniciar la Fase 2: define conmigo la arquitectura técnica (stack Frontend móvil/PWA + Backend + modelo del Agente IA) y comencemos por el Frontend y los procesos locales del teléfono."*
