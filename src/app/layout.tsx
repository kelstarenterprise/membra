import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Revolution For Prosperity - Member Portal",
  description: "Official membership platform for Revolution For Prosperity (RFP) members. Manage your registration, dues, activities, and stay connected with the party. Moruo ke Bophelo.",
  keywords: "Revolution For Prosperity, RFP, Lesotho politics, membership portal, political party, member management",
  authors: [{ name: "Revolution For Prosperity" }],
  openGraph: {
    title: "RFP Member Portal - Revolution For Prosperity",
    description: "Official membership platform for Revolution For Prosperity members. Join the movement - Moruo ke Bophelo.",
    siteName: "RFP Member Portal",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RFP Member Portal - Revolution For Prosperity",
    description: "Official membership platform for Revolution For Prosperity members. Join the movement - Moruo ke Bophelo.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
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
