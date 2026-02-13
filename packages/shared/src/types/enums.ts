/**
 * Enum types derived from Prisma schema string fields.
 * These represent the allowed values for status, role, and type fields.
 */

export const UserRole = {
  ADMIN: "admin",
  USER: "user",
  CUSTOMER: "customer",
  VENDOR: "vendor",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const OrderStatus = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentStatus = {
  PENDING: "pending",
  PAID: "paid",
  PARTIAL: "partial",
  OVERDUE: "overdue",
} as const;

export type PaymentStatus =
  (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const InventoryType = {
  SERIALIZED: "serialized",
  NON_SERIALIZED: "non_serialized",
  BATCH: "batch",
} as const;

export type InventoryType =
  (typeof InventoryType)[keyof typeof InventoryType];

export const SerialStatus = {
  AVAILABLE: "available",
  RESERVED: "reserved",
  SOLD: "sold",
  DEFECTIVE: "defective",
  RETURNED: "returned",
} as const;

export type SerialStatus = (typeof SerialStatus)[keyof typeof SerialStatus];

export const OrderItemStatus = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  PARTIAL: "partial",
  CANCELLED: "cancelled",
} as const;

export type OrderItemStatus =
  (typeof OrderItemStatus)[keyof typeof OrderItemStatus];

export const ImageType = {
  PRIMARY: "primary",
  GALLERY: "gallery",
  THUMBNAIL: "thumbnail",
} as const;

export type ImageType = (typeof ImageType)[keyof typeof ImageType];

export const AuditStatus = {
  DRAFT: "draft",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  APPROVED: "approved",
} as const;

export type AuditStatus = (typeof AuditStatus)[keyof typeof AuditStatus];

export const DiscrepancyType = {
  MISSING: "missing",
  SURPLUS: "surplus",
  DAMAGED: "damaged",
  MISMATCH: "mismatch",
} as const;

export type DiscrepancyType =
  (typeof DiscrepancyType)[keyof typeof DiscrepancyType];

export const NotificationType = {
  ORDER: "order",
  INVENTORY: "inventory",
  PAYMENT: "payment",
  SYSTEM: "system",
} as const;

export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];
