export interface SystemSettings {
  autoCloseElection: boolean;
  allowImmediateResults: boolean;
  requireEligibilityValidation: boolean;
  maintenanceMode: boolean;
  institutionName: string;
}

export type UpdateSystemSettingsInput = Partial<SystemSettings>;
