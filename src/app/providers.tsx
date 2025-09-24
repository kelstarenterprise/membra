"use client";

import { SessionProvider } from "next-auth/react";
import { BannerProvider } from "@/components/providers/banner-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <BannerProvider>
        {children}
      </BannerProvider>
    </SessionProvider>
  );
}
