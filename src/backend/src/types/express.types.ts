import type { AccessTokenPayload } from './auth.types.js';

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AccessTokenPayload;
  }
}

export {};
