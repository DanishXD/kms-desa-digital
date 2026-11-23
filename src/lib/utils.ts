import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

// MongoDB ObjectId = 24 karakter hex. Diperlukan sebelum memakai nilai dari URL
// sebagai kolom `id` Prisma, karena Prisma melempar P2023 untuk string lain.
const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;
export function isObjectId(value: string): boolean {
  return OBJECT_ID_RE.test(value);
}

export function formatDate(d: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draf", SUBMITTED: "Diajukan", UNDER_REVIEW: "Ditinjau",
  APPROVED: "Disetujui", REJECTED: "Ditolak", REVISION_REQUIRED: "Revisi",
  PUBLISHED: "Tayang", PENDING: "Menunggu", REVIEWING: "Ditinjau",
  CANCELLED: "Dibatalkan",
};
export function statusLabel(s: string): string {
  return STATUS_LABEL[s] ?? s;
}
