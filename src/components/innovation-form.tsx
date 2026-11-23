"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, btnPrimary, inputCls } from "@/components/ui";

const FIELDS: [string, string, "input" | "textarea"][] = [
  ["title", "Judul inovasi", "input"],
  ["shortDescription", "Deskripsi singkat (maks 300)", "input"],
  ["description", "Deskripsi lengkap", "textarea"],
  ["problem", "Masalah yang diselesaikan", "textarea"],
  ["solution", "Solusi", "textarea"],
  ["benefits", "Manfaat", "textarea"],
  ["implementation", "Tahapan implementasi", "textarea"],
  ["technology", "Teknologi yang dipakai", "input"],
  ["requirements", "Syarat adopsi desa", "input"],
  ["estimatedCost", "Estimasi biaya", "input"],
  ["impact", "Dampak yang diharapkan", "textarea"],
];

export function InnovationForm({ categories, initial, editId }: {
  categories: { id: string; name: string }[];
  initial?: Record<string, string>;
  editId?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>({ title: "", shortDescription: "", description: "", categoryId: categories[0]?.id ?? "", problem: "", solution: "", benefits: "", implementation: "", technology: "", requirements: "", estimatedCost: "", impact: "", ...initial });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form
      className="space-y-4 rounded-3xl bg-white p-6 ring-1 ring-brand-100"
      onSubmit={async (e) => {
        e.preventDefault(); setLoading(true); setError("");
        try {
          const method = editId ? "PATCH" : "POST";
          const r = await fetch("/api/innovations", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(editId ? { id: editId, ...form } : form) });
          const j = await r.json();
          if (!r.ok) throw new Error(j.error ?? "Gagal menyimpan.");
          router.push("/dashboard");
          router.refresh();
        } catch (err) { setError(err instanceof Error ? err.message : "Gagal."); setLoading(false); }
      }}
    >
      <Field label="Kategori">
        <select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} className={inputCls}>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      {FIELDS.map(([k, label, kind]) => (
        <Field key={k} label={label}>
          {kind === "input"
            ? <input value={form[k] ?? ""} onChange={(e) => set(k, e.target.value)} className={inputCls} required={["title", "shortDescription", "description"].includes(k)} />
            : <textarea value={form[k] ?? ""} onChange={(e) => set(k, e.target.value)} rows={3} className={inputCls} required={k === "description"} />}
        </Field>
      ))}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={loading} className={btnPrimary}>{loading ? "Menyimpan…" : editId ? "Simpan Perubahan" : "Simpan sebagai Draf"}</button>
    </form>
  );
}
