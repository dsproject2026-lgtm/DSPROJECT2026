export interface SystemSettings {
  autoCloseElection: boolean;
  allowImmediateResults: boolean;
  requireEligibilityValidation: boolean;
  maintenanceMode: boolean;
  institutionName: string;
}

export interface SystemSettingsResponse {
  settings: SystemSettings;
  updatedAt: string;
}

export type UpdateSystemSettingsInput = Partial<SystemSettings>;
