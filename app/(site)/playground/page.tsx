import type { Metadata } from "next";
import { Playground } from "@/components/playground/playground";

export const metadata: Metadata = {
  title: "Playground",
  description:
    "Put an Eidon AI employee to work. Inspect every thought, tool call and guardrail check in real time.",
  alternates: { canonical: "/playground" },
};

export default function PlaygroundPage() {
  return <Playground />;
}
