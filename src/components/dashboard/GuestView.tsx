import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GuestView() {
  return (
    <div className="max-w-lg w-full space-y-6">
      {/* Header Section with Professional Background */}
      <div className="bg-gradient-to-r from-blue-800 via-blue-700 to-blue-800 rounded-2xl p-8 shadow-lg border border-blue-600 text-center">
        <h1 className="text-2xl font-bold text-white mb-3">Welcome to MembershipManager</h1>
        <p className="text-blue-100 mb-6">
          Please sign in to access your personalized dashboard and manage your membership.
        </p>
        <div className="flex justify-center">
          <Link href="/login">
            <Button className="bg-white text-blue-800 hover:bg-blue-50 px-6 py-3 font-semibold shadow-md">
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Membership Benefits</h3>
          <p className="text-xs text-blue-600">Access exclusive events and member resources</p>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Easy Management</h3>
          <p className="text-xs text-blue-600">Track dues, payments, and stay connected</p>
        </div>
      </div>
    </div>
  );
}
