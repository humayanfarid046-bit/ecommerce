import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center bg-white p-8 text-slate-900">
      <p className="text-lg font-extrabold">404 — Page not found</p>
      <Link href="/" className="mt-4 font-bold text-[#0066ff] hover:underline">
        Go home
      </Link>
    </div>
  );
}
