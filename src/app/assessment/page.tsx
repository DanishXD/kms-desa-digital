import { AssessmentWizard } from "@/components/assessment-wizard";
import { listQuestions } from "@/server/store";

export const metadata = { title: "Assessment Kesiapan Digital", description: "Ukur kesiapan digital desamu dalam 7 pertanyaan." };

export default async function AssessmentPage() {
  const questions = await listQuestions();
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-900">Assessment Kesiapan Digital Desa</h1>
        <p className="text-sm text-gray-500">7 pertanyaan · ±3 menit · skor 0–100 + rekomendasi prioritas.</p>
      </div>
      <AssessmentWizard questions={questions} />
    </div>
  );
}
