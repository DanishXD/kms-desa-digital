import { notFound, redirect } from "next/navigation";
import { SubmitBar } from "@/components/actions";
import { InnovationForm } from "@/components/innovation-form";
import { auth } from "@/auth";
import { getInnovation, listCategories } from "@/server/store";
import type { SessionUser } from "@/server/store";

export default async function ManageInnovationPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user as unknown as SessionUser;
  const item = await getInnovation((await params).id);
  if (!item) notFound();
  if (user.role !== "ADMIN" && item.innovatorId !== user.innovatorId) redirect("/dashboard");
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-extrabold text-brand-900">Kelola: {item.title}</h1>
      <SubmitBar id={item.id} status={item.status} />
      <InnovationForm categories={await listCategories()} editId={item.id} initial={item as unknown as Record<string, string>} />
    </div>
  );
}
