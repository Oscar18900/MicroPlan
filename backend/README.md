# MicroPlan Backend (Fase 3)

API REST en **Node.js + TypeScript + Express + Prisma** con **Agente IA de Microplanificación en Groq** y sincronización **Offline-First**.

## Arranque local (SQLite)

```bash
cd backend
npm install
npx prisma db push
npm run db:seed
npm run dev
```

- Salud del servidor: `http://localhost:4000/api/health`
- Cuenta Admin de pruebas creada por el seed: `admin@microplan.buap.mx` / `AdminMicroPlan2026!` (habilita el panel `Lab` en la app).

## Activar Google OAuth real

1. Entra a [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → **Crear credenciales → ID de cliente de OAuth** (Aplicación web).
2. En **Orígenes autorizados de JavaScript**, agrega:
   - `http://localhost:5173`
   - Tu URL final de Vercel en producción (cuando despliegues en Fase 4).
3. Copia el **ID de cliente** (`*.apps.googleusercontent.com`) y pégalo en `GOOGLE_CLIENT_ID` dentro de `backend/.env` (y reinicia el backend).

## Migrar a Supabase PostgreSQL en Fase 4 (1 cambio)

1. En `prisma/schema.prisma`, cambia `provider = "sqlite"` por `provider = "postgresql"`.
2. En `.env` (o variables de Render), cambia `DATABASE_URL` por tu URI de conexión de Supabase PostgreSQL.
3. Ejecuta `npx prisma db push && npm run db:seed`.
