import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatPanel } from "@/components/chat/chat-panel";
import { employees, getEmployee } from "@/lib/employees";

export const dynamicParams = false;

export function generateStaticParams() {
  return employees.map((employee) => ({ slug: employee.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const employee = getEmployee(slug);
  return {
    title: employee ? `${employee.name} — AI employee` : "Employee not found",
    robots: { index: false, follow: false },
  };
}

export default async function EmbedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const employee = getEmployee(slug);
  if (!employee) notFound();

  return (
    <div className="container-page flex h-[calc(100vh-3.5rem)] flex-col py-4">
      <ChatPanel employee={employee} variant="full" className="min-h-0 flex-1" />
    </div>
  );
}
