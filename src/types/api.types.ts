export interface ApiErrorResponse {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SelectOption {
  label: string;
  value: string;
}