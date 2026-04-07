/**
 * Firestore layout — keep in sync with `web/firestore.rules` + `web/firestore.indexes.json`.
 * Documented in repo: `docs/PROJECT_STRUCTURE.md`
 *
 * users/{uid}/orders/{orderId}     — user-order-firestore
 * users/{uid}/profile/account       — profile-firestore (PROFILE_SEGMENT)
 * users/{uid}/profile/addresses     — addresses-firestore
 * users/{uid}/profile/cart          — cart-firestore
 * users/{uid}/profile/compare       — compare-firestore
 * users/{uid}/profile/paymentHistory — payment-history-firestore
 * users/{uid}/profile/recentlyViewed — recent-firestore
 * users/{uid}/profile/wishlist      — wishlist-firestore
 * users/{uid}/wallet/snapshot       — wallet-firestore
 */

export const PROFILE_SEGMENT = "account";
export const WALLET_DOC_ID = "snapshot";
