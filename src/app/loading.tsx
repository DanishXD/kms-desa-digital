import { cn } from "@/lib/utils";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8" aria-busy="true" aria-live="polite">
      <div className="space-y-4">
        <div className={cn("h-8 w-48 animate-pulse rounded bg-brand-100")} />
        <div className={cn("h-4 w-3/4 animate-pulse rounded bg-brand-100")} />
        <div className="grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-brand-50" />
          ))}
        </div>
      </div>
    </div>
  );
}
