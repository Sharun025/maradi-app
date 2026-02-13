/**
 * Data Transfer Object (DTO) types for API request bodies.
 * These define the shape of data sent to create or update entities.
 */

import type {
  UserRole,
  UserStatus,
  OrderStatus,
  InventoryType,
  SerialStatus,
  OrderItemStatus,
  ImageType,
} from "./enums";

// ---------------------------------------------------------------------------
// User DTOs
// ---------------------------------------------------------------------------

export interface CreateUserDto {
  email: string;
  password: string;
  role: UserRole | string;
  bpCode?: string;
  companyName?: string;
  gstNumber?: string;
  panNumber?: string;
  address?: string;
  priceList?: string;
  status?: UserStatus | string;
  deviceLimit?: number;
}

export interface UpdateUserDto {
  email?: string;
  password?: string;
  role?: UserRole | string;
  bpCode?: string;
  companyName?: string;
  gstNumber?: string;
  panNumber?: string;
  address?: string;
  priceList?: string;
  status?: UserStatus | string;
  deviceLimit?: number;
}

// ---------------------------------------------------------------------------
// Item DTOs
// ---------------------------------------------------------------------------

export interface CreateItemDto {
  itemCode: string;
  itemName: string;
  category: string;
  subcategory?: string;
  hsnCode?: string;
  inventoryType: InventoryType | string;
  uom: string;
  masterPrice: number;
  aPrice?: number;
  bPrice?: number;
  cPrice?: number;
  isActive?: boolean;
}

export interface UpdateItemDto {
  itemCode?: string;
  itemName?: string;
  category?: string;
  subcategory?: string;
  hsnCode?: string;
  inventoryType?: InventoryType | string;
  uom?: string;
  masterPrice?: number;
  aPrice?: number;
  bPrice?: number;
  cPrice?: number;
  isActive?: boolean;
}

// ---------------------------------------------------------------------------
// ItemImage DTOs
// ---------------------------------------------------------------------------

export interface CreateItemImageDto {
  itemId: string;
  imageType: ImageType | string;
  imageUrl: string;
  isMaster?: boolean;
}

// ---------------------------------------------------------------------------
// Serial DTOs
// ---------------------------------------------------------------------------

export interface CreateSerialDto {
  itemId: string;
  serialNumber: string;
  batchNumber?: string;
  imageUrl?: string;
  quantity?: number;
  status: SerialStatus | string;
}

export interface UpdateSerialDto {
  serialNumber?: string;
  batchNumber?: string;
  imageUrl?: string;
  quantity?: number;
  status?: SerialStatus | string;
}

// ---------------------------------------------------------------------------
// Order DTOs
// ---------------------------------------------------------------------------

export interface CreateOrderItemDto {
  itemId: string;
  serialId?: string;
  quantity: number;
  price: number;
  status?: OrderItemStatus | string;
  notes?: string;
}

export interface CreateOrderDto {
  customerId: string;
  orderDate: string; // ISO date string
  status?: OrderStatus | string;
  notes?: string;
  items: CreateOrderItemDto[];
}

export interface UpdateOrderDto {
  orderDate?: string; // ISO date string
  status?: OrderStatus | string;
  notes?: string;
  sapSONumber?: string;
  sapDeliveryNumber?: string;
  sapInvoiceNumber?: string;
  sapPaymentNumber?: string;
  paymentStatus?: string;
}

export interface AddOrderItemDto {
  itemId: string;
  serialId?: string;
  quantity: number;
  price: number;
  status?: OrderItemStatus | string;
  notes?: string;
}

export interface UpdateOrderItemDto {
  quantity?: number;
  price?: number;
  status?: OrderItemStatus | string;
  replacementSerialId?: string;
  notes?: string;
}
