/**
 * API client for Maradi mobile app.
 * Uses EXPO_PUBLIC_API_URL for base URL (e.g. https://your-domain.com or http://localhost:3000).
 */
import { useAuthStore } from "@/store/auth";

const getBaseUrl = () => {
  const url =
    typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL;
  return url || "http://localhost:3000";
};

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string; status?: number }> {
  const token = useAuthStore.getState().token;
  const baseUrl = getBaseUrl().replace(/\/$/, "");
  const url = path.startsWith("http") ? path : `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers: { ...headers, ...(options.headers as object) },
    });
    const text = await res.text();
    const data = text ? (JSON.parse(text) as T) : undefined;

    if (!res.ok) {
      const errMsg =
        (data as { error?: string; message?: string })?.error ??
        (data as { message?: string })?.message ??
        `Request failed: ${res.status}`;
      return { error: errMsg, status: res.status };
    }
    return { data, status: res.status };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    return { error: msg };
  }
}

/** GET item by itemCode */
export async function getItemByCode(itemCode: string) {
  return apiFetch<{
    id: string;
    itemCode: string;
    itemName: string;
    category: string;
    subcategory?: string;
    masterPrice: number;
  }>(`/api/items/${encodeURIComponent(itemCode)}`);
}

/** GET serial by serial number (for duplicate check) */
export async function getSerialByNumber(serialNumber: string) {
  return apiFetch<{ id: string; serialNumber: string; itemId: string }>(
    `/api/serials/${encodeURIComponent(serialNumber)}`
  );
}

/** POST create serial record */
export async function createSerial(body: {
  itemId: string;
  serialNumber: string;
  batchNumber?: string;
  quantity?: number;
  imageUrl?: string;
}) {
  return apiFetch<{ id: string; serialNumber: string }>("/api/serials", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** GET /api/orders - List orders with optional status filter */
export async function getOrders(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  if (params?.limit) sp.set("limit", String(params.limit));
  if (params?.offset) sp.set("offset", String(params.offset));
  const q = sp.toString();
  return apiFetch<{
    items: OrderListItem[];
    total: number;
    limit: number;
    offset: number;
  }>(`/api/orders${q ? `?${q}` : ""}`);
}

/** GET /api/orders/[orderId] - Get single order */
export async function getOrder(orderId: string) {
  return apiFetch<OrderDetail>(`/api/orders/${orderId}`);
}

/** GET /api/serials/available - List available serials for item */
export async function getAvailableSerials(itemId: string) {
  return apiFetch<{
    items: AvailableSerial[];
    total: number;
  }>(`/api/serials/available?itemId=${encodeURIComponent(itemId)}`);
}

/** PUT /api/orders/[orderId]/confirm - Confirm order with item actions */
export async function confirmOrder(
  orderId: string,
  payload: {
    notes?: string;
    itemActions: Array<
      | { orderItemId: string; action: "confirm" }
      | { orderItemId: string; action: "replace"; replacementSerialId: string }
      | {
          orderItemId: string;
          action: "suggest";
          replacementItemId: string;
          replacementSerialId: string;
        }
      | { orderItemId: string; action: "reject" }
    >;
  }
) {
  return apiFetch<OrderDetail>(`/api/orders/${orderId}/confirm`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/** GET /api/items - List items for suggest flow */
export async function getItems(params?: { category?: string }) {
  const sp = new URLSearchParams();
  if (params?.category) sp.set("category", params.category);
  const q = sp.toString();
  return apiFetch<ItemListItem[]>(`/api/items${q ? `?${q}` : ""}`);
}

/** GET /api/items/browse - List items with available count for customer browsing */
export async function getBrowseItems(params?: {
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.category) sp.set("category", params.category);
  if (params?.subcategory) sp.set("subcategory", params.subcategory);
  if (params?.minPrice != null) sp.set("minPrice", String(params.minPrice));
  if (params?.maxPrice != null) sp.set("maxPrice", String(params.maxPrice));
  if (params?.limit) sp.set("limit", String(params.limit));
  if (params?.offset) sp.set("offset", String(params.offset));
  const q = sp.toString();
  return apiFetch<BrowseItem[]>(`/api/items/browse${q ? `?${q}` : ""}`);
}

/** GET /api/serials/recent - Serials added today */
export async function getRecentSerials() {
  return apiFetch<{
    items: RecentSerial[];
    totalAddedToday: number;
  }>("/api/serials/recent");
}

/** GET /api/cart - Get current user's cart */
export async function getCart() {
  return apiFetch<CartItem[]>(`/api/cart`);
}

/** POST /api/cart/add - Add serial to cart (qty=1 per serial) */
export async function addToCart(serialId: string) {
  return apiFetch<{ id: string; serialId: string; quantity: number }>(
    "/api/cart/add",
    {
      method: "POST",
      body: JSON.stringify({ serialId, quantity: 1 }),
    }
  );
}

// Customer browsing types
export interface BrowseItem {
  id: string;
  itemCode: string;
  itemName: string;
  category: string;
  subcategory?: string | null;
  masterPrice: number;
  aPrice?: number | null;
  bPrice?: number | null;
  cPrice?: number | null;
  thumbnailUrl?: string | null;
  availableCount: number;
}

export interface RecentSerial {
  id: string;
  serialNumber: string;
  imageUrl?: string | null;
  item: {
    id: string;
    itemCode: string;
    itemName: string;
    masterPrice: number;
    thumbnailUrl?: string | null;
  };
}

export interface CartItem {
  id: string;
  serialId: string;
  quantity: number;
  serial: { id: string; serialNumber: string; imageUrl?: string | null };
}

// Order types (match API response shape)
export interface OrderListItem {
  id: string;
  orderNumber: string;
  customerId: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  notes?: string | null;
  customer?: {
    id: string;
    email: string;
    companyName?: string | null;
    bpCode?: string | null;
  };
  items?: OrderItemListItem[];
}

export interface OrderItemListItem {
  id: string;
  orderId: string;
  itemId: string;
  serialId?: string | null;
  quantity: number;
  price: number;
  status: string;
  replacementSerialId?: string | null;
  notes?: string | null;
  item?: { id: string; itemCode: string; itemName: string; masterPrice: number };
  serial?: {
    id: string;
    serialNumber: string;
    imageUrl?: string | null;
    status: string;
  };
}

export interface OrderDetail extends OrderListItem {
  customer: {
    id: string;
    email: string;
    companyName?: string | null;
    bpCode?: string | null;
  };
  items: OrderItemListItem[];
}

export interface AvailableSerial {
  id: string;
  serialNumber: string;
  imageUrl?: string | null;
  batchNumber?: string | null;
  status: string;
  item: { id: string; itemCode: string; itemName: string; masterPrice: number };
}

export interface ItemListItem {
  id: string;
  itemCode: string;
  itemName: string;
  category: string;
  masterPrice: number;
}

/** Upload image - returns { url } */
export async function uploadImage(
  uri: string,
  folder: "serials" | "master-items" | "batches",
  itemCode?: string
): Promise<{ data?: { url: string }; error?: string }> {
  const token = useAuthStore.getState().token;
  const baseUrl = getBaseUrl().replace(/\/$/, "");
  const url = `${baseUrl}/api/upload`;

  const formData = new FormData();
  formData.append("folder", folder);
  if (itemCode) formData.append("itemCode", itemCode);
  formData.append("file", {
    uri,
    name: "image.jpg",
    type: "image/jpeg",
  } as unknown as Blob);

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });
    const json = (await res.json()) as { url?: string; message?: string };
    if (!res.ok) {
      return { error: json?.message ?? `Upload failed: ${res.status}` };
    }
    return { data: { url: json.url! } };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Upload failed",
    };
  }
}
