import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { markNotificationsRead, userNotifications } from "@/server/store";
import type { SessionUser } from "@/server/store";

const toUser = (u: unknown) => u as unknown as SessionUser;

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const user = toUser(session.user);
  const items = await userNotifications(user.id);
  const unread = items.filter((n) => !n.read).length;
  return NextResponse.json({ items, unread });
}

export async function PATCH() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const user = toUser(session.user);
  await markNotificationsRead(user.id);
  return NextResponse.json({ ok: true });
}
