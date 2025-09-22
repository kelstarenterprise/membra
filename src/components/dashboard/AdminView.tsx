import KPIWidgets from "@/components/shared/KPIWidgets";

export default function AdminView() {
  return (
    <div className="space-y-6">
      <KPIWidgets
        items={[
          { label: "Active Members", value: 128 },
          { label: "Pending Approvals", value: 6 },
          { label: "Dues Posted (Aug)", value: "GHS 8,450" },
          { label: "Payments (Aug)", value: "GHS 6,120" },
        ]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl p-4">
          Recent Members (stub)
        </div>
        <div className="bg-white border rounded-xl p-4">
          Recent Payments (stub)
        </div>
      </div>
    </div>
  );
}
