import { AdminUsers } from "@/components/admin/admin-users";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const sp = await searchParams;
  const raw = sp.q;
  const q = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");
  return <AdminUsers initialQuery={q} />;
}
