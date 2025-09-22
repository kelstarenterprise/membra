import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "MEMBRA",
  description: "Club administration made simple",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body
        className="min-h-screen bg-gray-50 text-gray-900 font-sans"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
