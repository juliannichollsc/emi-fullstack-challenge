// Tasks 6 & 8 — tipos de transporte / error compartidos.
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ApiError {
  message: string;
  cause?: unknown;
}

export interface AsyncResource<T> {
  status: AsyncStatus;
  data: T | null;
  error: ApiError | null;
}

export const emptyResource = <T,>(): AsyncResource<T> => ({
  status: 'idle',
  data: null,
  error: null,
});
