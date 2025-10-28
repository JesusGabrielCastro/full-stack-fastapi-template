// Tipos extendidos que agregan campos del backend actualizado
import type { ProductPublic as GeneratedProductPublic, UserPublic as GeneratedUserPublic } from './types.gen';

// Extender ProductPublic con campos del backend actualizado
export interface ProductPublic extends Omit<GeneratedProductPublic, 'price' | 'stock'> {
  sku: string;
  unit_price: number;
  sale_price: number;
  unit_of_measure: string;
  min_stock: number;
  current_stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// Extender ProductCreate con campos nuevos
export interface ProductCreate {
  name: string;
  description?: string | null;
  category_id?: string | null;
  sku: string;
  unit_price: number;
  sale_price: number;
  unit_of_measure: string;
  min_stock: number;
  is_active?: boolean;
}

// Extender ProductUpdate con campos nuevos
export interface ProductUpdate {
  name?: string | null;
  description?: string | null;
  category_id?: string | null;
  sku?: string | null;
  unit_price?: number | null;
  sale_price?: number | null;
  unit_of_measure?: string | null;
  min_stock?: number | null;
  is_active?: boolean | null;
}

// Extender UserPublic con campo role
export interface UserPublic extends GeneratedUserPublic {
  role: 'ADMINISTRADOR' | 'VENDEDOR' | 'AUXILIAR';
}

// Extender UserCreate con campo role
export interface UserCreate {
  email: string;
  password: string;
  full_name?: string | null;
  role: 'ADMINISTRADOR' | 'VENDEDOR' | 'AUXILIAR';
  is_active?: boolean;
  is_superuser?: boolean;
}

// Extender UserUpdate con campo role
export interface UserUpdate {
  email?: string | null;
  password?: string | null;
  full_name?: string | null;
  role?: 'ADMINISTRADOR' | 'VENDEDOR' | 'AUXILIAR' | null;
  is_active?: boolean | null;
  is_superuser?: boolean | null;
}
