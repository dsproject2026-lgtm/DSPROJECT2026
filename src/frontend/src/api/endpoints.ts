export const endpoints = {
  auth: {
    register: '/auth/register',
    loginStart: '/auth/login/start',
    loginFinish: '/auth/login/finish',
    firstAccessStart: '/auth/first-access/start',
    firstAccessFinish: '/auth/first-access/finish',
    passwordRecoveryStart: '/auth/password-recovery/start',
    passwordRecoveryFinish: '/auth/password-recovery/finish',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  elections: {
    list: '/elections',
  },
  health: {
    overview: '/health',
  },
};
