const KEY = "libas_upi_wallet_v1";

export type UpiLinks = {
  phonepe: string;
  gpay: string;
  genericUpi: string;
};

const defaults: UpiLinks = {
  phonepe: "",
  gpay: "",
  genericUpi: "",
};

export function readUpiLinks(): UpiLinks {
  if (typeof window === "undefined") return { ...defaults };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaults };
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return { ...defaults };
  }
}

export function writeUpiLinks(p: Partial<UpiLinks>) {
  if (typeof window === "undefined") return;
  try {
    const cur = readUpiLinks();
    localStorage.setItem(KEY, JSON.stringify({ ...cur, ...p }));
  } catch {
    /* ignore */
  }
}
