// Tipos para Inventory Movements basados en el backend
export enum MovementType {
  ENTRADA_COMPRA = "ENTRADA_COMPRA",
  SALIDA_VENTA = "SALIDA_VENTA",
  AJUSTE_CONTEO = "AJUSTE_CONTEO",
  AJUSTE_MERMA = "AJUSTE_MERMA",
  DEVOLUCION_CLIENTE = "DEVOLUCION_CLIENTE",
  DEVOLUCION_PROVEEDOR = "DEVOLUCION_PROVEEDOR",
}

// Mapeo de tipos de movimiento para el UI
export const movementTypeConfig = {
  [MovementType.ENTRADA_COMPRA]: {
    label: "Compra",
    color: "green",
    group: "entrada",
  },
  [MovementType.DEVOLUCION_CLIENTE]: {
    label: "Devolución Cliente",
    color: "cyan",
    group: "entrada",
  },
  [MovementType.SALIDA_VENTA]: {
    label: "Venta",
    color: "red",
    group: "salida",
  },
  [MovementType.AJUSTE_CONTEO]: {
    label: "Ajuste Conteo",
    color: "orange",
    group: "ajuste",
  },
  [MovementType.AJUSTE_MERMA]: {
    label: "Merma",
    color: "volcano",
    group: "ajuste",
  },
  [MovementType.DEVOLUCION_PROVEEDOR]: {
    label: "Devolución Proveedor",
    color: "purple",
    group: "ajuste",
  },
};
