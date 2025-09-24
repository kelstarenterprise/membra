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
        className="min-h-screen bg-blue-50/30 text-blue-950 font-sans"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
