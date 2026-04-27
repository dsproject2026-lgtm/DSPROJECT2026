import { prisma } from '../lib/prisma.js';
import type { Prisma } from '../generated/prisma/client.js';

const SETTINGS_KEY = 'system';

class SettingsRepository {
  async findSystemSettings() {
    return prisma.appSetting.findUnique({
      where: { key: SETTINGS_KEY },
      select: {
        key: true,
        value: true,
        updatedAt: true,
      },
    });
  }

  async saveSystemSettings(value: Prisma.InputJsonValue) {
    return prisma.appSetting.upsert({
      where: { key: SETTINGS_KEY },
      create: {
        key: SETTINGS_KEY,
        value,
      },
      update: {
        value,
      },
      select: {
        key: true,
        value: true,
        updatedAt: true,
      },
    });
  }
}

export const settingsRepository = new SettingsRepository();
