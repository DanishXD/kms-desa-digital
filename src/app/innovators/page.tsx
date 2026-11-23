import { InnovatorCard } from "@/components/cards";
import { listInnovators } from "@/server/store";

export const metadata = { title: "Inovator" };

export default async function InnovatorsPage() {
  const items = await listInnovators();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-900">Inovator</h1>
        <p className="text-sm text-gray-500">{items.length} inovator terdaftar</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((n) => <InnovatorCard key={n.id} n={n} />)}
      </div>
    </div>
  );
}
