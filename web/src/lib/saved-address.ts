export type AddressLabel = "Home" | "Work" | "Office" | "Other";

export type SavedAddress = {
  id: string;
  label: AddressLabel;
  line1: string;
  line2?: string;
  city: string;
  pin: string;
  /** Filled from PIN lookup (demo). */
  state?: string;
  /** Pinned on map (user) — synced to admin for delivery zones (demo). */
  lat?: number;
  lng?: number;
};
