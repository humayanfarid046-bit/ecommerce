/**
 * Firestore layout — keep in sync with `web/firestore.rules` + `web/firestore.indexes.json`.
 *
 * ### Customers (signed-in app users)
 * - `users/{uid}/profile/account` — role, accessScope, displayName, phone (see profile-firestore)
 * - `users/{uid}/orders/{orderId}` — checkout orders; client may create; status updates via Admin SDK / APIs
 * - `users/{uid}/profile/addresses|cart|compare|paymentHistory|recentlyViewed|wishlist|delivery` — client sync where rules allow
 * - `users/{uid}/wallet/snapshot` — wallet balance (wallet-firestore)
 *
 * ### Delivery partners
 * - Same `users/{uid}/profile/account` with `role: DELIVERY_PARTNER`
 * - `users/{uid}/profile/delivery` — duty online, lastLat, lastLng (written via PATCH /api/delivery/dashboard)
 * - Assigned orders: `collectionGroup("orders")` queries with `deliveryPartnerId == uid` (see firestore.indexes.json)
 * - `riderWallets/{uid}` — COD / online aggregates (Admin SDK only; rules deny client)
 *
 * ### Admin / catalog
 * - `publicCatalog/manifest` — storefront catalog (Admin API POST; GET /api/catalog for shoppers)
 * - `publicStorefront/{docId}` — e.g. `contact`; public read; Admin API write
 * - `systemConfig/deliveryOps` — rider token TTL etc. (Admin SDK only; no client access)
 *
 * ### Inventory (Admin SDK / APIs only — rules deny client)
 * - `inventoryVariants`, `inventoryMovements`, `inventoryReservations`, `purchaseOrders`, `goodsReceipts`,
 *   `stockTransfers`, `inventoryAlerts`, `inventorySnapshots`
 */

export const PROFILE_SEGMENT = "account";
export const WALLET_DOC_ID = "snapshot";
