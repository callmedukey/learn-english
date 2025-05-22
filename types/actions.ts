export interface ActionResponse<T = unknown, D = unknown> {
  success: boolean;
  message: string;
  errors?: {
    [K in keyof T]?: string[] | null;
  };
  inputs?: T;
  data?: D;
}
