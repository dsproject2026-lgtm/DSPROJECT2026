export interface SuccessResponseMeta {
  method: string;
  path: string;
  timestamp: string;
  statusCode: number;
}

export interface SuccessResponsePayload<TData> {
  success: true;
  message: string;
  data: TData;
  meta: SuccessResponseMeta;
}
