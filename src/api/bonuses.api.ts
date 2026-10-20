import { api } from './axios';
import type { BonusRule } from '../types/bonus.types';

export async function getBonusRules(): Promise<BonusRule[]> {
  const {data}=await api.get<BonusRule[]>('/bonus-rules');
  return data;
}
export async function createBonusRule(rule:{subCategoryId:string;minimumQuantity:number;bonusQuantity:number;isActive:boolean}):Promise<BonusRule> {
  const {data}=await api.post<BonusRule>('/bonus-rules',rule);
  return data;
}
export async function updateBonusRule(id:string,changes:Partial<Pick<BonusRule,'subCategoryId'|'minimumQuantity'|'bonusQuantity'|'isActive'>>):Promise<BonusRule> {
  const {data}=await api.patch<BonusRule>(`/bonus-rules/${id}`,changes);
  return data;
}
