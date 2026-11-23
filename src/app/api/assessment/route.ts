import { NextResponse } from "next/server";
import { calculateScore } from "@/lib/scoring";
import { assessmentSubmitSchema } from "@/lib/validation";
import { listQuestions } from "@/server/store";

export async function POST(req: Request) {
  try {
    const parsed = assessmentSubmitSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Jawaban belum lengkap." }, { status: 400 });
    const questions = await listQuestions();
    const byId = new Map(questions.map((q) => [q.id, q]));
    const answers = parsed.data.answers.map((a) => {
      const q = byId.get(a.questionId);
      if (!q) throw new Error("Pertanyaan tidak dikenal.");
      return { questionId: a.questionId, category: q.category, value: a.value, weight: q.weight };
    });
    return NextResponse.json(calculateScore(answers));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Gagal menghitung." }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ items: await listQuestions() });
}
