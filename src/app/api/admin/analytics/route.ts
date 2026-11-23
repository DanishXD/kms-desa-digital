import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { analytics, dashboardStats, recentActivity } from "@/server/store";

export async function GET() {
  const session = await auth();
  const role = (session?.user as unknown as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Khusus admin." }, { status: 403 });
  const [stats, charts, activity] = await Promise.all([dashboardStats(), analytics(), recentActivity()]);
  return NextResponse.json({ stats, charts, activity });
}
