import { Card, CardContent } from "@/components/ui/card";

type Item = { label: string; value: number | string };
export default function KPIWidgets({ items }: { items: Item[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((it, idx) => (
        <Card key={idx} className="rounded-2xl border-blue-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="text-sm text-blue-600 font-medium">{it.label}</div>
            <div className="text-2xl font-bold text-blue-900 mt-2">{it.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
