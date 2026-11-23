"use client";
import { useState } from "react";
import { Badge, btnPrimary, inputCls } from "@/components/ui";
import { listQuestions } from "@/server/store";

type Q = Awaited<ReturnType<typeof listQuestions>>[number];
const LABELS = ["Belum ada", "Rencana", "Sebagian", "Baik", "Optimal"];

export function AssessmentWizard({ questions, canSave }: { questions: Q[]; canSave: boolean }) {
  const [villageName, setVillageName] = useState("");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ totalScore: number; level: string; interpretation: string; recommendations: { category: string; advice: string }[]; saved?: boolean; assessmentId?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const done = questions.length > 0 && questions.every((q) => answers[q.id] !== undefined);

  return (
    <div className="space-y-4">
      <input value={villageName} onChange={(e) => setVillageName(e.target.value)} placeholder="Nama desamu (opsional)" className={inputCls + " max-w-sm"} aria-label="Nama desa" />
      <p className="text-xs text-gray-500">{canSave ? "Hasil akan tersimpan ke riwayat desa." : "Masuk sebagai akun desa untuk menyimpan riwayat."}</p>
      {questions.map((q, i) => (
        <fieldset key={q.id} className="rounded-2xl bg-white p-4 ring-1 ring-brand-100">
          <legend className="px-1 text-sm font-bold">{i + 1}. {q.text} <span className="ml-1 rounded bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">{q.category}</span></legend>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={q.text}>
            {LABELS.map((label, v) => (
              <button key={v} type="button" role="radio" aria-checked={answers[q.id] === v}
                onClick={() => setAnswers((a) => ({ ...a, [q.id]: v }))}
                className={"rounded-lg border px-3 py-1.5 text-xs font-semibold " + (answers[q.id] === v ? "border-brand-600 bg-brand-600 text-white" : "hover:bg-brand-50")}>
                {v} · {label}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
      <button disabled={!done || loading} className={btnPrimary + " w-full md:w-auto"}
        onClick={async () => {
          setLoading(true);
          const r = await fetch("/api/assessment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ villageName, answers: questions.map((q) => ({ questionId: q.id, value: answers[q.id] })) }) });
          setResult(await r.json());
          setLoading(false);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}>
        {loading ? "Menghitung…" : "Lihat Hasil Assessment"}
      </button>
      {!done && <p className="text-xs text-gray-500">{Object.keys(answers).length}/{questions.length} pertanyaan terjawab.</p>}
      {result && (
        <div className="rounded-3xl bg-brand-900 p-6 text-white">
          <p className="text-sm text-brand-100">Skor kesiapan digital</p>
          <p className="text-5xl font-extrabold">{result.totalScore}<span className="text-xl">/100</span></p>
          <p className="mt-2"><Badge status={result.level === "HIGH" ? "APPROVED" : result.level === "MEDIUM" ? "PENDING" : "REJECTED"} /> <span className="font-bold">{result.level}</span></p>
          <p className="mt-2 text-sm text-brand-100">{result.interpretation}</p>
          <p className="mt-2 text-xs text-brand-100">{result.saved ? "Tersimpan ke riwayat desa" : "Masuk sebagai akun desa untuk menyimpan riwayat."}</p>
          {result.recommendations.length > 0 && (
            <ul className="mt-3 space-y-2 text-sm">
              {result.recommendations.map((r) => <li key={r.category} className="rounded-xl bg-white/10 p-3"><b>{r.category}:</b> {r.advice}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
