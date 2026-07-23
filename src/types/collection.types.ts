import type { UserRole } from './auth.types';
import type {
  PaymentMethod,
  PaymentStatus,
} from './sale.types';

export interface CollectionAssignment {
  id: string;
  assignedToId: number;
  assignedToName: string;
  assignedToRole: UserRole;
  assignedById: number;
  assignedByName: string;
  assignedAt: string;
}

export interface CollectionDebtSale {
  id: string;
  saleNumber: string;
  date: string;
  dueDate?: string | null;
  total: number;
  paidAmount: number;
  balance: number;
  paymentStatus: PaymentStatus;
  isOverdue: boolean;
  assignment: CollectionAssignment | null;
}

export interface CollectionDebtClient {
  id: string;
  fullName: string;
  alias?: string | null;
  phone?: string | null;
  location: string;
  totalDebt: number;
  totalPaid: number;
  balance: number;
  overdueBalance: number;
  sales: CollectionDebtSale[];
}

export interface CollectionSummary {
  clientsCount: number;
  salesCount: number;
  totalDebt: number;
  totalPaid: number;
  totalBalance: number;
  overdueBalance: number;
  unassignedSalesCount: number;
}

export interface CollectionDebtsResponse {
  clients: CollectionDebtClient[];
  summary: CollectionSummary;
}

export interface CollectionAssignableUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface CreateCollectionPaymentRequest {
  saleId: string;
  clientId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  observations?: string;
}

export interface CollectionPdfResponse {
  pdfUrl: string;
  historyId: string;
}
