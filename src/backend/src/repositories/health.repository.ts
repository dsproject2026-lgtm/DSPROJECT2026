import { prisma } from '../lib/prisma.js';

class HealthRepository {
  async pingDatabase() {
    await prisma.$queryRawUnsafe('SELECT 1');
  }
}

export const healthRepository = new HealthRepository();
