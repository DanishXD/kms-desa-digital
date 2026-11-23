import { redirect } from "next/navigation";
import { InnovationForm } from "@/components/innovation-form";
import { auth } from "@/auth";
import { listCategories } from "@/server/store";

export default async function NewInnovationPage() {
  const session = await auth();
  const role = (session?.user as unknown as { role?: string } | undefined)?.role;
  if (!session?.user) redirect("/login?callbackUrl=/dashboard/innovations/new");
  if (role !== "INNOVATOR") redirect("/dashboard");
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-extrabold text-brand-900">Buat Inovasi Baru</h1>
      <p className="text-sm text-gray-500">Tersimpan sebagai draf — ajukan dari halaman Kelola setelah siap.</p>
      <InnovationForm categories={await listCategories()} />
    </div>
  );
}
