export const endpoints = {
  auth: {
    register: '/auth/register',
    loginStart: '/auth/login/start',
    loginFinish: '/auth/login/finish',
    firstAccessStart: '/auth/first-access/start',
    firstAccessFinish: '/auth/first-access/finish',
    passwordRecoveryStart: '/auth/password-recovery/start',
    passwordRecoveryFinish: '/auth/password-recovery/finish',
    changePassword: '/auth/change-password',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  elections: {
    list: '/elections',
    detail: (electionId: string) => `/elections/${electionId}`,
    create: '/elections',
    update: (electionId: string) => `/elections/${electionId}`,
    reopenTie: (electionId: string) => `/elections/${electionId}/reopen-tie`,
    remove: (electionId: string) => `/elections/${electionId}`,
    ballot: (electionId: string) => `/elections/${electionId}/ballot`,
    vote: (electionId: string) => `/elections/${electionId}/votes`,
    myVoteStatus: (electionId: string) => `/elections/${electionId}/votes/me/status`,
    results: (electionId: string) => `/elections/${electionId}/results`,
    candidateUsers: '/elections/candidate-users',
    candidates: {
      list: (electionId: string) => `/elections/${electionId}/candidates`,
      detail: (electionId: string, candidateId: string) =>
        `/elections/${electionId}/candidates/${candidateId}`,
      update: (electionId: string, candidateId: string) =>
        `/elections/${electionId}/candidates/${candidateId}`,
      remove: (electionId: string, candidateId: string) =>
        `/elections/${electionId}/candidates/${candidateId}`,
      approve: (electionId: string, candidateId: string) =>
        `/elections/${electionId}/candidates/${candidateId}/approve`,
      reject: (electionId: string, candidateId: string) =>
        `/elections/${electionId}/candidates/${candidateId}/reject`,
      suspend: (electionId: string, candidateId: string) =>
        `/elections/${electionId}/candidates/${candidateId}/suspend`,
    },
    eligibleVoters: {
      list: (electionId: string) => `/elections/${electionId}/eligible-voters`,
      previewCsv: (electionId: string) => `/elections/${electionId}/eligible-voters/preview-csv`,
      importCsv: (electionId: string) => `/elections/${electionId}/eligible-voters/import-csv`,
      update: (electionId: string, eligibleVoterId: string) =>
        `/elections/${electionId}/eligible-voters/${eligibleVoterId}`,
      updateStatus: (electionId: string, eligibleVoterId: string) =>
        `/elections/${electionId}/eligible-voters/${eligibleVoterId}/status`,
      remove: (electionId: string, eligibleVoterId: string) =>
        `/elections/${electionId}/eligible-voters/${eligibleVoterId}`,
    },
  },
  candidates: {
    me: '/candidates/me',
    updateMine: (electionId: string, candidateId: string) => `/candidates/${electionId}/${candidateId}`,
  },
  positions: {
    list: '/positions',
    create: '/positions',
    detail: (positionId: string) => `/positions/${positionId}`,
    update: (positionId: string) => `/positions/${positionId}`,
    remove: (positionId: string) => `/positions/${positionId}`,
  },
  faculties: {
    list: '/faculties',
    create: '/faculties',
    detail: (facultyId: string) => `/faculties/${facultyId}`,
    update: (facultyId: string) => `/faculties/${facultyId}`,
    remove: (facultyId: string) => `/faculties/${facultyId}`,
    addCourses: (facultyId: string) => `/faculties/${facultyId}/courses`,
  },
  team: {
    list: '/team',
    create: '/team',
    updateStatus: (memberId: string) => `/team/${memberId}/status`,
  },
  audit: {
    list: '/audit',
  },
  settings: {
    system: '/settings',
  },
  health: {
    overview: '/health',
  },
};
