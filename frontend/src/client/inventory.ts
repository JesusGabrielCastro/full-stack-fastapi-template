import { CancelablePromise, OpenAPI, request as __request } from './core/OpenAPI';

// Enums
export enum MovementType {
  ENTRADA_COMPRA = "ENTRADA_COMPRA",
  SALIDA_VENTA = "SALIDA_VENTA",
  AJUSTE_CONTEO = "AJUSTE_CONTEO",
  AJUSTE_MERMA = "AJUSTE_MERMA",
  DEVOLUCION_CLIENTE = "DEVOLUCION_CLIENTE",
  DEVOLUCION_PROVEEDOR = "DEVOLUCION_PROVEEDOR",
}

// Types
export type InventoryMovementCreate = {
  product_id: string;
  movement_type: MovementType;
  quantity: number;
  reference_number?: string | null;
  notes?: string | null;
  unit_price?: number | null;
  movement_date?: string | null;
};

export type InventoryMovementPublic = {
  product_id: string;
  movement_type: MovementType;
  quantity: number;
  reference_number?: string | null;
  notes?: string | null;
  unit_price?: number | null;
  movement_date: string;
  id: string;
  total_amount?: number | null;
  stock_before: number;
  stock_after: number;
  created_at: string;
  created_by: string;
};

export type InventoryMovementsPublic = {
  data: Array<InventoryMovementPublic>;
  count: number;
};

// Service
export class InventoryMovementsService {
  public static readInventoryMovements(data: {
    skip?: number;
    limit?: number;
    product_id?: string;
    movement_type?: MovementType;
    start_date?: string;
    end_date?: string;
  } = {}): CancelablePromise<InventoryMovementsPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/inventory-movements/",
      query: {
        skip: data.skip,
        limit: data.limit,
        product_id: data.product_id,
        movement_type: data.movement_type,
        start_date: data.start_date,
        end_date: data.end_date,
      },
    });
  }

  public static readInventoryMovement(data: {
    id: string;
  }): CancelablePromise<InventoryMovementPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: `/api/v1/inventory-movements/${data.id}`,
    });
  }

  public static createInventoryMovement(data: {
    requestBody: InventoryMovementCreate;
  }): CancelablePromise<InventoryMovementPublic> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/inventory-movements/",
      body: data.requestBody,
    });
  }
}
