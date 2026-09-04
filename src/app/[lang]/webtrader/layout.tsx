import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { hasLocale } from "@/dictionaries";

export default async function WebTraderLayout(props: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();

  const session = await getSession();
  if (!session) redirect(`/${lang}/login`);

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0b1120]">
      {props.children}
    </div>
  );
}
