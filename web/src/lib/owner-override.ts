const BUILTIN_OWNER_UIDS = new Set<string>([
  // Temporary emergency owner fallback requested by project owner.
  "CnytrmU4NOhDsfmXK2ziBFQhw2W2",
]);

function splitCsv(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function isForcedOwnerUid(uid: string): boolean {
  if (!uid) return false;
  if (BUILTIN_OWNER_UIDS.has(uid)) return true;

  const fromPublic = splitCsv(process.env.NEXT_PUBLIC_ADMIN_OWNER_UIDS);
  if (fromPublic.includes(uid)) return true;

  const fromServer = splitCsv(process.env.ADMIN_OWNER_UIDS);
  return fromServer.includes(uid);
}

