import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { calculateScore } from "@/lib/scoring";
import { assessmentSubmitSchema } from "@/lib/validation";
import { getVillage, listQuestions, saveAssessment } from "@/server/store";
import type { SessionUser } from "@/server/store";

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
    const scored = calculateScore(answers);

    // Skor tetap dihitung untuk siapa pun; hanya akun desa yang menyimpan riwayat.
    const session = await auth().catch(() => null);
    const user = session?.user as unknown as SessionUser | undefined;
    let saved = false;
    let assessmentId: string | undefined;
    if (user?.role === "VILLAGE" && user.villageId) {
      const village = await getVillage(user.villageId).catch(() => null);
      try {
        const created = await saveAssessment(user, {
          villageName: village?.name,
          answers: parsed.data.answers,
          result: { totalScore: scored.totalScore, level: scored.level, recommendations: scored.recommendations },
        });
        saved = true;
        assessmentId = created.id;
      } catch {
        saved = false;
      }
    }

    return NextResponse.json({ ...scored, saved, assessmentId });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Gagal menghitung." }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ items: await listQuestions() });
}
