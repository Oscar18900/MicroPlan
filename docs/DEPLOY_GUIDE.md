# Guía de Despliegue en la Nube — MicroPlan

Arquitectura 100% gratuita (Tier Free):
- **Base de Datos:** Supabase PostgreSQL (500 MB)
- **Backend API + Agente IA:** Render (Free Web Service)
- **Frontend PWA:** Vercel (HTTPS automático)

---

## Paso 1: Base de Datos en Supabase (PostgreSQL)

1. Crea una cuenta/proyecto gratuito en [Supabase Dashboard](https://supabase.com/dashboard) (guarda la contraseña de la BD que elijas).
2. En la barra superior del proyecto haz clic en **Connect** → **ORMs / Connection String** → selecciona **Session pooler** (host `aws-0-<region>.pooler.supabase.com`, puerto `5432`).
   - *¿Por qué Session pooler?* Funciona sobre IPv4 (necesario en Render Free) y además es compatible con `npx prisma db push`.
3. Copia la URI, reemplaza `[YOUR-PASSWORD]` por tu contraseña (codificando caracteres especiales si los hay) y agrega `?sslmode=require` al final:
   ```text
   postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-0-<REGION>.pooler.supabase.com:5432/postgres?sslmode=require
   ```
4. Colócala como `DATABASE_URL` en `backend/.env` y ejecuta desde `backend/`:
   ```bash
   npx prisma db push
   npm run db:seed
   ```

---

## Paso 2: Backend API en Render

1. Entra a [Render Dashboard](https://dashboard.render.com/) → **New +** → **Blueprint** (o **Web Service**) y conecta el repositorio `Oscar18900/MicroPlan`.
   - El archivo `render.yaml` en la raíz ya configura `rootDir: backend`, `buildCommand`, `startCommand` (`npm run start:prod`) y `healthCheckPath: /api/health`.
2. Configura las variables de entorno pendientes (`sync: false`):
   - `DATABASE_URL`: tu URI Session Pooler de Supabase.
   - `JWT_SECRET`: un texto aleatorio largo (32+ caracteres).
   - `GROQ_API_KEY`: tu llave de Groq (`gsk_...`).
   - `GOOGLE_CLIENT_ID`: tu Client ID de Google OAuth (`*.apps.googleusercontent.com`).
3. Despliega y verifica que `https://<tu-servicio>.onrender.com/api/health` devuelva `"ok": true` y `"dbOk": true`.

---

## Paso 3: Frontend PWA en Vercel + Google OAuth

1. Entra a [Vercel](https://vercel.com/) → **Add New Project** → importa `Oscar18900/MicroPlan`.
2. Configura:
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Vite`
   - **Environment Variable:** `VITE_API_URL` = `https://<tu-servicio>.onrender.com/api`
3. Despliega y copia tu URL final de Vercel (`https://<tu-app>.vercel.app`).
4. En [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials), abre tu ID de cliente OAuth y agrega tu URL de Vercel (`https://<tu-app>.vercel.app`) en **Orígenes autorizados de JavaScript**.
