import type { StorefrontContact } from "@/lib/storefront-contact-types";

const empty: StorefrontContact = {
  supportPhoneE164: "",
  supportEmail: "",
  whatsappE164: "",
};

/** Client-side: same payload as server `getStorefrontContactFromFirestore` (via API). */
export async function fetchStorefrontContact(): Promise<StorefrontContact> {
  try {
    const res = await fetch("/api/storefront/contact", { cache: "no-store" });
    const j = (await res.json().catch(() => ({}))) as {
      contact?: StorefrontContact;
    };
    if (!res.ok || !j.contact) return empty;
    return {
      supportPhoneE164: (j.contact.supportPhoneE164 ?? "").replace(/\D/g, ""),
      supportEmail: (j.contact.supportEmail ?? "").trim(),
      whatsappE164: (j.contact.whatsappE164 ?? "").replace(/\D/g, ""),
    };
  } catch {
    return empty;
  }
}

export function whatsappHref(contact: StorefrontContact, presetText: string): string {
  const n = contact.whatsappE164.replace(/\D/g, "");
  if (!n) return "https://wa.me/";
  return `https://wa.me/${n}?text=${encodeURIComponent(presetText)}`;
}
