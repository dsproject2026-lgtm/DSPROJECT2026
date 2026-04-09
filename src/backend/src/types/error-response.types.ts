export interface ErrorResponseMeta {
  method: string;
  path: string;
  timestamp: string;
}

export interface ErrorResponsePayload {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: unknown;
    stack?: string;
  };
  meta: ErrorResponseMeta;
}
