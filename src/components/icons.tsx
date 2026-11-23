// Ikon SVG garis (stroke) — pengganti emoji agar terlihat profesional.
// Semua ikon: 24x24, stroke currentColor, ..) tidak dependensi eksternal.
import { cn } from "@/lib/utils";

function Svg({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {children}
    </svg>
  );
}

export const IconSprout = ({ className }: { className?: string }) => (
  <Svg className={className}><path d="M7 20h10" /><path d="M12 20v-9" /><path d="M12 11c0-4 3-7 8-7 0 4-3 7-8 7Z" /><path d="M12 11c0-4-3-7-8-7 0 4 3 7 8 7Z" /></Svg>
);
export const IconHome = ({ className }: { className?: string }) => (
  <Svg className={className}><path d="M3 11.5 12 3l9 8.5" /><path d="M5.5 10.5V20h5v-6h3v6h5v-9.5" /></Svg>
);
export const IconUsers = ({ className }: { className?: string }) => (
  <Svg className={className}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.4 3.4-5.5 6.5-5.5s5.7 2.1 6.5 5.5" /><circle cx="17" cy="9" r="2.5" /><path d="M16.5 14.6c2.6.7 4.4 2.7 5 5.4" /></Svg>
);
export const IconChat = ({ className }: { className?: string }) => (
  <Svg className={className}><path d="M4 5h16v11H9.5L4 20V5Z" /><path d="M8 9.5h8M8 12.5h5" /></Svg>
);
export const IconSearch = ({ className }: { className?: string }) => (
  <Svg className={className}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4-4" /></Svg>
);
export const IconArrow = ({ className }: { className?: string }) => (
  <Svg className={className}><path d="M4 12h15" /><path d="m13 6 6 6-6 6" /></Svg>
);
export const IconDrop = ({ className }: { className?: string }) => (
  <Svg className={className}><path d="M12 3c3.2 4.2 6 7.2 6 10.2a6 6 0 1 1-12 0C6 10.2 8.8 7.2 12 3Z" /></Svg>
);
export const IconBolt = ({ className }: { className?: string }) => (
  <Svg className={className}><path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z" /></Svg>
);
export const IconCart = ({ className }: { className?: string }) => (
  <Svg className={className}><path d="M3 4h2l2.4 11.2h11.2L21 8H7" /><circle cx="9.5" cy="19.5" r="1.3" /><circle cx="17" cy="19.5" r="1.3" /></Svg>
);
export const IconBank = ({ className }: { className?: string }) => (
  <Svg className={className}><rect x="3" y="6.5" width="18" height="11" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6.5 9.5h.01M17.5 14.5h.01" /></Svg>
);
export const IconDb = ({ className }: { className?: string }) => (
  <Svg className={className}><ellipse cx="12" cy="5.5" rx="7.5" ry="2.5" /><path d="M4.5 5.5v13c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5v-13" /><path d="M4.5 12c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5" /></Svg>
);
export const IconGov = ({ className }: { className?: string }) => (
  <Svg className={className}><path d="M3 21h18" /><path d="M5 21V9.5L12 5l7 4.5V21" /><path d="M9 21v-5h6v5" /><path d="M9 12h.01M15 12h.01M12 9.5h.01" /></Svg>
);
export const IconPin = ({ className }: { className?: string }) => (
  <Svg className={className}><path d="M12 21.5s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11Z" /><circle cx="12" cy="10.5" r="2.5" /></Svg>
);
export const IconHeart = ({ className }: { className?: string }) => (
  <Svg className={className}><path d="M12 20.5S4 15.5 4 9.8A4.3 4.3 0 0 1 8.3 5.5c1.6 0 2.9.9 3.7 2.1a4.5 4.5 0 0 1 3.7-2.1A4.3 4.3 0 0 1 20 9.8c0 5.7-8 10.7-8 10.7Z" /></Svg>
);
export const IconInbox = ({ className }: { className?: string }) => (
  <Svg className={className}><path d="M3.5 13 5.5 6h13l2 7v6.5h-17V13Z" /><path d="M3.5 13h5.2l1.2 2h4.2l1.2-2h5.2" /></Svg>
);
export const IconCheck = ({ className }: { className?: string }) => (
  <Svg className={className}><path d="m4.5 12.5 5 5L19.5 7" /></Svg>
);
export const IconX = ({ className }: { className?: string }) => (
  <Svg className={className}><path d="M6 6l12 12M18 6 6 18" /></Svg>
);
export const IconSend = ({ className }: { className?: string }) => (
  <Svg className={className}><path d="M21 3 10.5 13.5" /><path d="M21 3 14 21l-3.5-7.5L3 10 21 3Z" /></Svg>
);
export const IconChart = ({ className }: { className?: string }) => (
  <Svg className={className}><path d="M4 20V4" /><path d="M4 20h16" /><path d="M8.5 16v-5M13 16V7.5M17.5 16v-3" /></Svg>
);

// Pemetaan kategori → ikon + aksen warna (Tailwind classes statis agar terdeteksi JIT).
export const CATEGORY_STYLE: Record<string, { icon: (p: { className?: string }) => React.ReactNode; chip: string; band: string; glyph: string }> = {
  "smart-farming": { icon: IconSprout, chip: "bg-emerald-50 text-emerald-700", band: "from-emerald-500 to-green-600", glyph: "text-emerald-200" },
  "agri-food-ecommerce": { icon: IconCart, chip: "bg-amber-50 text-amber-700", band: "from-amber-500 to-orange-500", glyph: "text-amber-200" },
  "e-government": { icon: IconGov, chip: "bg-blue-50 text-blue-700", band: "from-blue-600 to-sky-500", glyph: "text-blue-200" },
  "e-tourism": { icon: IconPin, chip: "bg-rose-50 text-rose-700", band: "from-rose-500 to-pink-500", glyph: "text-rose-200" },
  "financial-services": { icon: IconBank, chip: "bg-yellow-50 text-yellow-800", band: "from-yellow-500 to-amber-600", glyph: "text-yellow-200" },
  "information-system": { icon: IconDb, chip: "bg-indigo-50 text-indigo-700", band: "from-indigo-500 to-violet-500", glyph: "text-indigo-200" },
  "local-infrastructure": { icon: IconBolt, chip: "bg-orange-50 text-orange-700", band: "from-orange-500 to-red-500", glyph: "text-orange-200" },
  "resource-management": { icon: IconDrop, chip: "bg-cyan-50 text-cyan-700", band: "from-cyan-500 to-teal-500", glyph: "text-cyan-200" },
  "community-economic": { icon: IconUsers, chip: "bg-violet-50 text-violet-700", band: "from-violet-500 to-purple-500", glyph: "text-violet-200" },
  "social-service": { icon: IconHeart, chip: "bg-pink-50 text-pink-700", band: "from-pink-500 to-rose-400", glyph: "text-pink-200" },
};

export function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  const entry = CATEGORY_STYLE[slug];
  if (!entry) return <IconSprout className={className} />;
  const I = entry.icon;
  return <I className={className} />;
}

export function categoryChip(slug: string): string {
  return CATEGORY_STYLE[slug]?.chip ?? "bg-brand-50 text-brand-700";
}

export function CategoryBand({ slug, className }: { slug: string; className?: string }) {
  const entry = CATEGORY_STYLE[slug];
  const I = entry?.icon ?? IconSprout;
  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-br", entry?.band ?? "from-brand-500 to-brand-700", className)}>
      <I className={cn("absolute -right-3 -top-3 h-24 w-24 rotate-12 opacity-30", entry?.glyph ?? "text-white")} />
      <I className="absolute bottom-2 left-3 h-7 w-7 text-white/90" />
    </div>
  );
}
