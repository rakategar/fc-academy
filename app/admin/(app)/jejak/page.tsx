import { JejakView } from "@/components/views/JejakView";
import { requireStaff } from "@/lib/scope";

export const metadata = { title: "Jejak Perubahan" };

export default async function Page({ searchParams }: { searchParams: Promise<{ semua?: string; hal?: string; tab?: string }> }) {
  const [scope, sp] = await Promise.all([requireStaff("admin"), searchParams]);
  return <JejakView scope={scope} sp={sp} />;
}
