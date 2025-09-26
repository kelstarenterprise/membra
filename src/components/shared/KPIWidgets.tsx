import { Card, CardContent } from "@/components/ui/card";

type Item = { label: string; value: number | string };
export default function KPIWidgets({ items }: { items: Item[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map((it, idx) => (
        <Card key={idx} className="rounded-2xl border-green-200 shadow-elegant hover-lift transition-all bg-gradient-to-br from-white to-green-50/50">
          <CardContent className="p-6">
            <div className="text-sm text-primary font-semibold uppercase tracking-wide border-accent-purple pl-3">{it.label}</div>
            <div className="text-3xl font-bold text-accent mt-3">{it.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
