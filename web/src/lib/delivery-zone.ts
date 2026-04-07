/** Area-based delivery fee (demo). Murshidabad zone vs rest. */

const FREE_ABOVE = 500;

export function zoneDeliveryFeeRupees(city: string): number {
  const c = city.trim().toLowerCase();
  if (!c) return 50;
  if (c.includes("murshidabad")) return 20;
  return 50;
}

export function deliveryFeeForCheckout(
  itemTotalRupees: number,
  city: string
): number {
  if (itemTotalRupees === 0) return 0;
  if (itemTotalRupees >= FREE_ABOVE) return 0;
  return zoneDeliveryFeeRupees(city);
}
