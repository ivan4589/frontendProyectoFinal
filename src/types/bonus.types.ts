export interface BonusRule {
  id: string;
  subCategoryId: string;
  minimumQuantity: number;
  bonusQuantity: number;
  isActive: boolean;
  validFrom?: string | null;
  validUntil?: string | null;
  subCategory?: {id: string; name: string};
}
export interface BonusAllocation {productId: string;quantity: number}
export interface SaleBonus extends BonusAllocation {
  id: string;
  productName: string;
  subCategoryId: string;
  subCategoryName: string;
  returnedQuantity: number;
}
