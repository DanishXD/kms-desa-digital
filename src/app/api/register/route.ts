import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/validation";
import { registerUser } from "@/server/store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid." }, { status: 400 });
    const user = await registerUser(parsed.data.name, parsed.data.email, parsed.data.password, parsed.data.role);
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, role: user.role } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Gagal mendaftar." }, { status: 400 });
  }
}
