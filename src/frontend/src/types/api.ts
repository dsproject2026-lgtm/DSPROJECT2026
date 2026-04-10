export interface ApiSuccessResponse<TData> {
  success: true;
  message: string;
  data: TData;
  meta: {
    method: string;
    path: string;
    timestamp: string;
    statusCode: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: unknown;
  };
  meta: {
    method: string;
    path: string;
    timestamp: string;
  };
}
