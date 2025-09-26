import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GuestView() {
  return (
    <div className="max-w-lg w-full space-y-6">
      {/* Header Section with Professional Background */}
      <div className="bg-gradient-to-r from-green-600 via-green-500 to-green-600 rounded-2xl p-8 shadow-elegant border border-green-700 text-center">
        <h1 className="text-3xl font-bold text-white mb-3 tracking-wide">Welcome to MEMBERSHIP MANAGER</h1>
        <p className="text-green-50 mb-6 text-lg">
          Please sign in to access your personalized dashboard and manage your membership.
        </p>
        <div className="flex justify-center">
          <Link href="/login">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 font-bold shadow-elegant-hover transition-all">
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white border border-green-200 rounded-xl p-6 shadow-elegant hover-lift transition-all">
          <h3 className="text-sm font-semibold text-primary mb-3 border-accent-purple pl-3">Membership Benefits</h3>
          <p className="text-sm text-accent">Access exclusive events and member resources</p>
        </div>
        <div className="bg-white border border-green-200 rounded-xl p-6 shadow-elegant hover-lift transition-all">
          <h3 className="text-sm font-semibold text-primary mb-3 border-accent-purple pl-3">Easy Management</h3>
          <p className="text-sm text-accent">Track dues, payments, and stay connected</p>
        </div>
      </div>
    </div>
  );
}
