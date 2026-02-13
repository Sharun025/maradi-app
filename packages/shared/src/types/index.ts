/**
 * Shared types for Maradi app.
 * Derived from Prisma schema and used across web, mobile, and API layers.
 */

// Entity types
export type { User, Item, ItemImage, Serial, Order, OrderItem } from "./entities";

// Enums (each exports both the const object and its type)
export {
  UserRole,
  UserStatus,
  OrderStatus,
  PaymentStatus,
  InventoryType,
  SerialStatus,
  OrderItemStatus,
  ImageType,
  AuditStatus,
  DiscrepancyType,
  NotificationType,
} from "./enums";

// API response types
export type {
  ApiResponse,
  PaginationParams,
  PaginatedResponse,
} from "./api";

// DTO types
export type {
  CreateUserDto,
  UpdateUserDto,
  CreateItemDto,
  UpdateItemDto,
  CreateItemImageDto,
  CreateSerialDto,
  UpdateSerialDto,
  CreateOrderDto,
  UpdateOrderDto,
  CreateOrderItemDto,
  AddOrderItemDto,
  UpdateOrderItemDto,
} from "./dtos";
