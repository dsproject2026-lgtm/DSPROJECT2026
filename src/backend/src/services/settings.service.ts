import { settingsRepository } from '../repositories/settings.repository.js';
import type { Prisma } from '../generated/prisma/client.js';
import type { SystemSettings, UpdateSystemSettingsInput } from '../types/settings.types.js';

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  autoCloseElection: true,
  allowImmediateResults: true,
  requireEligibilityValidation: true,
  maintenanceMode: false,
  institutionName: 'SIVO-UP',
};

function toJsonValue(settings: SystemSettings): Prisma.InputJsonValue {
  return { ...settings };
}

function normalizeSettings(value: unknown): SystemSettings {
  if (!value || typeof value !== 'object') {
    return DEFAULT_SYSTEM_SETTINGS;
  }

  const candidate = value as Partial<SystemSettings>;

  return {
    autoCloseElection:
      typeof candidate.autoCloseElection === 'boolean'
        ? candidate.autoCloseElection
        : DEFAULT_SYSTEM_SETTINGS.autoCloseElection,
    allowImmediateResults:
      typeof candidate.allowImmediateResults === 'boolean'
        ? candidate.allowImmediateResults
        : DEFAULT_SYSTEM_SETTINGS.allowImmediateResults,
    requireEligibilityValidation:
      typeof candidate.requireEligibilityValidation === 'boolean'
        ? candidate.requireEligibilityValidation
        : DEFAULT_SYSTEM_SETTINGS.requireEligibilityValidation,
    maintenanceMode:
      typeof candidate.maintenanceMode === 'boolean'
        ? candidate.maintenanceMode
        : DEFAULT_SYSTEM_SETTINGS.maintenanceMode,
    institutionName:
      typeof candidate.institutionName === 'string' && candidate.institutionName.trim()
        ? candidate.institutionName.trim()
        : DEFAULT_SYSTEM_SETTINGS.institutionName,
  };
}

class SettingsService {
  async getSystemSettings() {
    const record = await settingsRepository.findSystemSettings();
    const settings = normalizeSettings(record?.value);

    if (!record) {
      const created = await settingsRepository.saveSystemSettings(toJsonValue(settings));
      return {
        settings,
        updatedAt: created.updatedAt,
      };
    }

    return {
      settings,
      updatedAt: record.updatedAt,
    };
  }

  async updateSystemSettings(input: UpdateSystemSettingsInput) {
    const current = await this.getSystemSettings();
    const next = normalizeSettings({
      ...current.settings,
      ...input,
    });

    const record = await settingsRepository.saveSystemSettings(toJsonValue(next));

    return {
      settings: next,
      updatedAt: record.updatedAt,
    };
  }
}

export const settingsService = new SettingsService();
