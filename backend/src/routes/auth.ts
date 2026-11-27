import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { buildUserSnapshot, currentWeekStartMonday } from '../lib/snapshot';
import { requireAuth, signAuthToken } from '../middleware/auth';

const router = Router();

const RegisterSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().transform((e) => e.toLowerCase()),
  password: z.string().min(6).max(128),
});

const LoginSchema = z.object({
  email: z.string().trim().email().transform((e) => e.toLowerCase()),
  password: z.string().min(1),
});

const GoogleAuthSchema = z.object({
  idToken: z.string().min(10),
});

function resolveRoleForEmail(email: string): 'admin' | 'student' {
  const admins = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase()) ? 'admin' : 'student';
}

router.post('/register', async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Revisa tu nombre, correo y contraseña (mínimo 6 caracteres).' });
    return;
  }

  const { name, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'Ya existe una cuenta registrada con ese correo.' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const role = resolveRoleForEmail(email);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      authProvider: 'local',
      role,
      wellnessConfig: {
        create: {
          emergencyWeekStart: currentWeekStartMonday(),
        },
      },
      telemetry: {
        create: {
          eventType: 'user_registered',
          metaJson: JSON.stringify({ provider: 'local' }),
        },
      },
    },
  });

  const token = signAuthToken({ userId: user.id, email: user.email, role });
  const snapshot = await buildUserSnapshot(user.id);
  res.status(201).json({ token, snapshot });
});

router.post('/login', async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Ingresa un correo y contraseña válidos.' });
    return;
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    res.status(401).json({ error: 'Credenciales incorrectas o cuenta creada con Google.' });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Contraseña incorrecta.' });
    return;
  }

  const role = user.role === 'admin' ? 'admin' : 'student';
  const token = signAuthToken({ userId: user.id, email: user.email, role });
  const snapshot = await buildUserSnapshot(user.id);
  res.json({ token, snapshot });
});

router.post('/google', async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    res.status(503).json({
      error: 'Falta configurar GOOGLE_CLIENT_ID en backend/.env para usar Google OAuth real.',
    });
    return;
  }

  const parsed = GoogleAuthSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Token de Google inválido.' });
    return;
  }

  try {
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: parsed.data.idToken,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      res.status(401).json({ error: 'No se pudo verificar el perfil de Google.' });
      return;
    }

    const email = payload.email.toLowerCase();
    const name = payload.name || email.split('@')[0];
    const googleSub = payload.sub;

    let user = await prisma.user.findFirst({
      where: { OR: [{ googleSub }, { email }] },
    });

    if (!user) {
      const role = resolveRoleForEmail(email);
      user = await prisma.user.create({
        data: {
          name,
          email,
          authProvider: 'google',
          googleSub,
          role,
          wellnessConfig: {
            create: {
              emergencyWeekStart: currentWeekStartMonday(),
            },
          },
          telemetry: {
            create: {
              eventType: 'user_registered',
              metaJson: JSON.stringify({ provider: 'google' }),
            },
          },
        },
      });
    } else if (!user.googleSub) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleSub },
      });
    }

    const role = user.role === 'admin' ? 'admin' : 'student';
    const token = signAuthToken({ userId: user.id, email: user.email, role });
    const snapshot = await buildUserSnapshot(user.id);
    res.json({ token, snapshot });
  } catch (err) {
    console.error('Google OAuth verify error:', err);
    res.status(401).json({ error: 'La verificación con Google falló o expiró.' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const snapshot = await buildUserSnapshot(req.authUser!.userId);
  if (!snapshot) {
    res.status(404).json({ error: 'Usuario no encontrado.' });
    return;
  }
  res.json({ snapshot });
});

export default router;
