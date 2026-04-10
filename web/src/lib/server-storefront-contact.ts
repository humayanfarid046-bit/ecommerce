import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase-admin";
import type { StorefrontContact } from "@/lib/storefront-contact-types";

/** Single public doc — see `firestore.rules` + `src/lib/firebase/collections.ts`. */
export const STOREFRONT_CONTACT_DOC = "publicStorefront/contact";

export type { StorefrontContact };

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

export function defaultStorefrontContact(): StorefrontContact {
  const phone =
    digitsOnly(process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "") ||
    digitsOnly(process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "");
  const wa =
    digitsOnly(process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "") ||
    phone;
  return {
    supportPhoneE164: phone,
    supportEmail:
      process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ||
      process.env.SUPPORT_EMAIL?.trim() ||
      "",
    whatsappE164: wa,
  };
}

function parseDoc(d: Record<string, unknown> | undefined): Partial<StorefrontContact> {
  if (!d) return {};
  const out: Partial<StorefrontContact> = {};
  if (typeof d.supportPhoneE164 === "string") {
    out.supportPhoneE164 = digitsOnly(d.supportPhoneE164);
  }
  if (typeof d.supportEmail === "string") {
    const em = d.supportEmail.trim().slice(0, 200);
    if (em.length === 0) out.supportEmail = "";
    else if (em.includes("@")) out.supportEmail = em;
  }
  if (typeof d.whatsappE164 === "string") {
    out.whatsappE164 = digitsOnly(d.whatsappE164);
  }
  return out;
}

/** Merges Firestore with env fallbacks (works when Admin SDK is missing or doc empty). */
export async function getStorefrontContactFromFirestore(): Promise<StorefrontContact> {
  const def = defaultStorefrontContact();
  const db = getAdminFirestore();
  if (!db) return def;
  try {
    const snap = await db.doc(STOREFRONT_CONTACT_DOC).get();
    if (!snap.exists) return def;
    const p = parseDoc(snap.data() as Record<string, unknown>);
    return {
      supportPhoneE164: p.supportPhoneE164 ?? def.supportPhoneE164,
      supportEmail: p.supportEmail ?? def.supportEmail,
      whatsappE164: p.whatsappE164 ?? def.whatsappE164,
    };
  } catch {
    return def;
  }
}

export async function saveStorefrontContactToFirestore(
  db: Firestore,
  patch: Partial<StorefrontContact>,
  _actorUid: string
): Promise<StorefrontContact> {
  const cur = await getStorefrontContactFromFirestore();
  const next: StorefrontContact = {
    supportPhoneE164:
      patch.supportPhoneE164 !== undefined
        ? digitsOnly(patch.supportPhoneE164)
        : cur.supportPhoneE164,
    supportEmail:
      patch.supportEmail !== undefined
        ? patch.supportEmail.trim().slice(0, 200)
        : cur.supportEmail,
    whatsappE164:
      patch.whatsappE164 !== undefined
        ? digitsOnly(patch.whatsappE164)
        : cur.whatsappE164,
  };
  await db.doc(STOREFRONT_CONTACT_DOC).set(
    {
      supportPhoneE164: next.supportPhoneE164,
      supportEmail: next.supportEmail,
      whatsappE164: next.whatsappE164,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  return next;
}
