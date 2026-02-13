/**
 * Entity types matching Prisma schema models.
 * Decimal fields use number for simplicity; serialize as string when needed for precision.
 */

import type {
  UserRole,
  UserStatus,
  OrderStatus,
  PaymentStatus,
  InventoryType,
  SerialStatus,
  OrderItemStatus,
} from "./enums";

export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole | string;
  bpCode?: string | null;
  companyName?: string | null;
  gstNumber?: string | null;
  panNumber?: string | null;
  address?: string | null;
  priceList?: string | null;
  status: UserStatus | string;
  deviceLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Item {
  id: string;
  itemCode: string;
  itemName: string;
  category: string;
  subcategory?: string | null;
  hsnCode?: string | null;
  inventoryType: InventoryType | string;
  uom: string;
  masterPrice: number;
  aPrice?: number | null;
  bPrice?: number | null;
  cPrice?: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItemImage {
  id: string;
  itemId: string;
  imageType: string;
  imageUrl: string;
  isMaster: boolean;
  uploadedAt: Date;
}

export interface Serial {
  id: string;
  itemId: string;
  serialNumber: string;
  batchNumber?: string | null;
  imageUrl?: string | null;
  quantity: number;
  status: SerialStatus | string;
  dateAdded: Date;
  addedBy?: string | null;
  soldDate?: Date | null;
  soldTo?: string | null;
  soldType?: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  orderDate: Date;
  status: OrderStatus | string;
  totalAmount: number;
  notes?: string | null;
  sapSONumber?: string | null;
  sapDeliveryNumber?: string | null;
  sapInvoiceNumber?: string | null;
  sapPaymentNumber?: string | null;
  paymentStatus?: PaymentStatus | string | null;
  confirmedBy?: string | null;
  confirmedAt?: Date | null;
}

export interface OrderItem {
  id: string;
  orderId: string;
  itemId: string;
  serialId?: string | null;
  quantity: number;
  price: number;
  status: OrderItemStatus | string;
  replacementSerialId?: string | null;
  notes?: string | null;
}
