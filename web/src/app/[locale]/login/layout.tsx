export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-[calc(100vh-5rem)] bg-white md:min-h-[calc(100vh-4.5rem)]">
      <div className="auth-page-geo" aria-hidden />
      {children}
    </div>
  );
}
