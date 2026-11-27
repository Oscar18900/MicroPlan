import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import authRoutes from './routes/auth';
import syncRoutes from './routes/sync';
import aiRoutes from './routes/ai';
import telemetryRoutes from './routes/telemetry';

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: '4mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'microplan-backend',
    groqConfigured: Boolean(process.env.GROQ_API_KEY),
    groqModel: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    googleClientId: process.env.GOOGLE_CLIENT_ID?.trim() || null,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api', syncRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/telemetry', telemetryRoutes);

app.listen(port, '0.0.0.0', () => {
  console.log(`MicroPlan Backend running on http://0.0.0.0:${port}`);
});
