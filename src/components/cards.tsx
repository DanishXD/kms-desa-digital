import Link from "next/link";
import type { InnovationFull } from "@/server/store";
import { CategoryBand, IconArrow, IconHome, IconUsers, categoryChip } from "./icons";
import { Badge } from "./ui";

export function InnovationCard({ item }: { item: InnovationFull }) {
  return (
    <Link href={`/innovations/${item.slug}`} className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-brand-100 transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      <CategoryBand slug={item.categorySlug} className="h-24" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <span className={"truncate rounded-full px-2.5 py-0.5 text-xs font-semibold " + categoryChip(item.categorySlug)}>{item.categoryName}</span>
          <Badge status={item.status} />
        </div>
        <h3 className="mt-2.5 font-bold leading-snug group-hover:text-brand-700">{item.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-gray-500">{item.shortDescription}</p>
        <p className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-400">
          <span className="truncate">oleh <b className="text-gray-600">{item.innovatorName}</b> · {item.claimCount} adopsi</span>
          <IconArrow className="h-4 w-4 shrink-0 text-brand-400 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
        </p>
      </div>
    </Link>
  );
}

export function VillageCard({ v }: { v: { id: string; name: string; regency: string; province: string; description?: string | null; claimCount?: number } }) {
  return (
    <Link href={`/villages/${v.id}`} className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-100 transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      <p className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
        <IconHome className="h-6 w-6" />
      </p>
      <h3 className="mt-3 font-bold group-hover:text-brand-700">{v.name}</h3>
      <p className="text-sm text-gray-500">{v.regency}, {v.province}</p>
      {v.description && <p className="mt-1 line-clamp-2 text-sm text-gray-500">{v.description}</p>}
      {!!v.claimCount && <p className="mt-3 inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">{v.claimCount} inovasi diadopsi</p>}
    </Link>
  );
}

export function InnovatorCard({ n }: { n: { id: string; name: string; organization?: string | null; location?: string | null; innovationCount?: number } }) {
  return (
    <Link href={`/innovators/${n.id}`} className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-100 transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      <p className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-accent-400 to-amber-500 text-brand-900">
        <IconUsers className="h-6 w-6" />
      </p>
      <h3 className="mt-3 font-bold group-hover:text-brand-700">{n.name}</h3>
      {n.organization && <p className="text-sm font-medium text-gray-600">{n.organization}</p>}
      <p className="mt-1 text-xs text-gray-400">{n.location ?? ""}{n.innovationCount != null ? ` · ${n.innovationCount} inovasi tayang` : ""}</p>
    </Link>
  );
}
