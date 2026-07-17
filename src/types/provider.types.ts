export interface Provider {
  id: string;
  companyName: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  createdAt?: string;
  updatedAt?: string;

  products?: unknown[];
  purchases?: unknown[];
  _count?: {
    products?: number;
    purchases?: number;
  };
}

export interface CreateProviderRequest {
  companyName: string;
  contactName?: string;
  phone?: string;
  email?: string;
}

export interface UpdateProviderRequest {
  companyName?: string;
  contactName?: string;
  phone?: string;
  email?: string;
}