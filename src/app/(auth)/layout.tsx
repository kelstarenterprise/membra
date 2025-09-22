export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen grid place-items-center bg-gradient-to-b from-white to-gray-100 p-6">
      {children}
    </main>
  );
}
