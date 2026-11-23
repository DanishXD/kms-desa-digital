import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { innovationSchema } from "@/lib/validation";
import { createInnovation, getInnovation, listInnovations, updateInnovation } from "@/server/store";
import type { SessionUser } from "@/server/store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const data = await listInnovations({
    q: searchParams.get("q") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
    page: Number(searchParams.get("page") ?? 1),
    perPage: Number(searchParams.get("perPage") ?? 9),
    publishedOnly: searchParams.get("all") !== "1",
  });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Silakan masuk dulu." }, { status: 401 });
  try {
    const parsed = innovationSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    const slug = await createInnovation(session.user as unknown as SessionUser, parsed.data);
    return NextResponse.json({ ok: true, slug });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Gagal." }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const { id, status, ...fields } = await req.json() as { id: string; status?: string } & Record<string, string>;
    const item = await getInnovation(id);
    if (!item) return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });
    await updateInnovation(session.user as unknown as SessionUser, item.id, fields, status);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Gagal." }, { status: 400 });
  }
}
