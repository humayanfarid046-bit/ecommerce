export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-b from-slate-50 via-white to-slate-50 md:min-h-[calc(100vh-4.5rem)]">
      {children}
    </div>
  );
}
