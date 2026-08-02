export type ClientType = 'NORMAL' | 'ESPECIAL' | 'CAMINO';

export interface Location {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  clients?: unknown[];
  _count?: { clients?: number };
}

export interface Client {
  id: string;
  fullName: string;
  alias?: string | null;
  type: ClientType;
  locationId: string;
  locationName?: string;
  location?: Location;
  phone?: string | null;
  whatsappConsent: boolean;
  additionalInfo?: string | null;
  isActive: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  sales?: unknown[];
  payments?: unknown[];
  _count?: { sales?: number; payments?: number };
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

export interface UpdateClientRequest extends Partial<CreateClientRequest> {}

export interface CreateLocationRequest { name: string }
export interface UpdateLocationRequest { name?: string }
