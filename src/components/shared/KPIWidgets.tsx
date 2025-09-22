import { Card, CardContent } from "@/components/ui/card";

type Item = { label: string; value: number | string };
export default function KPIWidgets({ items }: { items: Item[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((it, idx) => (
        <Card key={idx} className="rounded-2xl">
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">{it.label}</div>
            <div className="text-2xl font-semibold mt-1">{it.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
