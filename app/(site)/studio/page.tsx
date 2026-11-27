import type { Metadata } from "next";
import { StudioBuilder } from "@/components/studio/studio-builder";

export const metadata: Metadata = {
  title: "Studio",
  description:
    "Build a production-ready AI employee in six steps: identity, mind, tools, knowledge, guardrails and deployment.",
  alternates: { canonical: "/studio" },
};

export default function StudioPage() {
  return <StudioBuilder />;
}
