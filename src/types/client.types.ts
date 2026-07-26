export type ClientType = 'NORMAL' | 'ESPECIAL' | 'CAMINO';

export interface Location {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  clients?: unknown[];
  _count?: {
    clients?: number;
  };
}

export interface Client {
  id: string;
  fullName: string;
  alias?: string | null;
  type: ClientType;
  locationId: string;
  location?: Location;
  phone?: string | null;
  whatsappConsent: boolean;
  additionalInfo?: string | null;
  createdAt?: string;
  updatedAt?: string;
  sales?: unknown[];
  payments?: unknown[];
  _count?: {
    sales?: number;
    payments?: number;
  };
}

export interface CreateClientRequest {
  fullName: string;
  alias?: string;
  type: ClientType;
  locationId: string;
  phone?: string;
  whatsappConsent?: boolean;
  additionalInfo?: string;
}

export interface UpdateClientRequest {
  fullName?: string;
  alias?: string;
  type?: ClientType;
  locationId?: string;
  phone?: string;
  whatsappConsent?: boolean;
  additionalInfo?: string;
}

export interface CreateLocationRequest {
  name: string;
}

export interface UpdateLocationRequest {
  name?: string;
}
