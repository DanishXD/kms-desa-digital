import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { claimSchema } from "@/lib/validation";
import { cancelClaim, createClaim, listClaims, moderateClaim } from "@/server/store";
import type { SessionUser } from "@/server/store";

const toUser = (u: unknown) => u as unknown as SessionUser;

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const user = toUser(session.user);
  const { searchParams } = new URL(req.url);
  const items = await listClaims({
    villageId: user.role === "VILLAGE" ? user.villageId : searchParams.get("villageId") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Silakan masuk dulu." }, { status: 401 });
  try {
    const parsed = claimSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    const id = await createClaim(toUser(session.user), parsed.data.innovationId, parsed.data.message);
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Gagal." }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const { id, action, notes } = await req.json() as { id: string; action: "REVIEWING" | "APPROVED" | "REJECTED" | "CANCELLED"; notes?: string };
    const user = toUser(session.user);
    if (action === "CANCELLED") await cancelClaim(user, id);
    else await moderateClaim(user, id, action, notes);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Gagal." }, { status: 400 });
  }
}
