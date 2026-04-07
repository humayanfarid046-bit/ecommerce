/** Map Indian PIN (first 3 digits) to `region_*` i18n keys in admin. */

export function pinToRegionKey(pinRaw: string | undefined): string {
  const pin = (pinRaw ?? "").replace(/\D/g, "").slice(0, 6);
  if (pin.length < 3) return "other";
  const p3 = parseInt(pin.slice(0, 3), 10);
  if (Number.isNaN(p3)) return "other";
  if (p3 >= 110 && p3 <= 119) return "dl";
  if (p3 >= 400 && p3 <= 445) return "mh";
  if (p3 >= 560 && p3 <= 599) return "ka";
  if (p3 >= 600 && p3 <= 643) return "tn";
  if (p3 >= 500 && p3 <= 535) return "tg";
  if (p3 >= 360 && p3 <= 396) return "gj";
  if (p3 >= 200 && p3 <= 285) return "up";
  if (p3 >= 700 && p3 <= 743) return "wb";
  return "other";
}
