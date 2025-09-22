import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GuestView() {
  return (
    <div className="bg-white border rounded-2xl p-6 max-w-md w-full text-center space-y-3">
      <h1 className="text-lg font-semibold">Welcome to MembershipManager</h1>
      <p className="text-sm text-gray-600">
        Please sign in to see your dashboard.
      </p>
      <div className="flex justify-center">
        <Link href="/login">
          <Button>Go to Login</Button>
        </Link>
      </div>
    </div>
  );
}
