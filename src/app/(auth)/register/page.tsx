// app/(auth)/register/page.tsx
import RegisterClient from "@/components/admin/RegisterClient";

export default async function Page({
  searchParams,
}: {
  // Next.js new typing: searchParams is a Promise
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const callbackUrlParam = Array.isArray(sp?.callbackUrl)
    ? sp.callbackUrl[0]
    : sp?.callbackUrl;

  const callbackUrl = callbackUrlParam ?? "/member";

  return <RegisterClient callbackUrl={callbackUrl} />;
}
