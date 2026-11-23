import { NextResponse } from "next/server";
import { prisma } from "@/server/store";

export async function GET() {
  const p = await prisma().catch(() => null);
  if (!p) {
    return NextResponse.json({ ok: true, mode: "demo" });
  }
  try {
    await p.$runCommandRaw({ ping: 1 });
    return NextResponse.json({ ok: true, mode: "db" });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
