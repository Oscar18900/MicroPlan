import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getWeekStartMonday(): string {
  const dt = new Date();
  const day = dt.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  dt.setDate(dt.getDate() + diff);
  return dt.toISOString().slice(0, 10);
}

async function main() {
  const adminEmail = 'admin@microplan.buap.mx';
  const passwordHash = await bcrypt.hash('AdminMicroPlan2026!', 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'admin',
      passwordHash,
      onboardingCompleted: true,
    },
    create: {
      name: 'Administrador MicroPlan',
      email: adminEmail,
      passwordHash,
      authProvider: 'local',
      role: 'admin',
      career: 'Ing. en Ciencias de la Computación (BUAP)',
      semester: '7°+',
      xp: 0,
      level: 1,
      currentStreak: 0,
      bestStreak: 0,
      onboardingCompleted: true,
    },
  });

  await prisma.userWellnessConfig.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      sleepGoalHours: 7.5,
      curfewAlertTime: '22:30',
      bedtimeLimitTime: '23:00',
      shieldRigidity: 'balanced',
      emergencyMinutes: 45,
      emergencyWeeklyQuota: 2,
      emergencyUsedThisWeek: 0,
      emergencyWeekStart: getWeekStartMonday(),
      dailyCapacityMinutes: 180,
      leisureDaysJson: JSON.stringify([1, 2, 3, 4, 5]),
      leisureStart: '17:00',
      leisureEnd: '18:00',
      leisureTagsJson: JSON.stringify(['Paseo', 'Gym', 'Videojuegos']),
    },
  });

  console.log(`Admin seeded cleanly: ${admin.email} (role=${admin.role})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
