import KPIWidgets from "@/components/shared/KPIWidgets";

export default function AdminView() {
  return (
    <div className="space-y-6">
      {/* Header Section with Professional Background */}
      <div className="bg-gradient-to-r from-blue-800 via-blue-700 to-blue-800 rounded-xl p-6 shadow-sm border border-blue-600">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-blue-100"></p>
        </div>
      </div>

      <KPIWidgets
        items={[
          { label: "Active Members", value: 128 },
          { label: "Pending Approvals", value: 6 },
          { label: "Dues Posted (Aug)", value: "GHS 8,450" },
          { label: "Payments (Aug)", value: "GHS 6,120" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Recent Members
          </h3>
          <p className="text-blue-600">
            Latest member registrations and activities
          </p>
        </div>
        <div className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Recent Payments
          </h3>
          <p className="text-blue-600">Latest dues and payment transactions</p>
        </div>
      </div>
    </div>
  );
}
