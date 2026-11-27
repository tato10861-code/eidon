import type { Metadata } from "next";
import { Mail, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Eyebrow, SectionHeading } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Eidon workspace.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="container-page py-14">
      <div className="mx-auto max-w-md">
        <Reveal>
          <div className="flex justify-center">
            <Eyebrow>Workspace access</Eyebrow>
          </div>
          <h1 className="mt-5 text-center font-display text-[clamp(2.2rem,5vw,3.2rem)] leading-none tracking-[-0.025em] text-snow">
            Sign in to <span className="italic text-lime">your workspace.</span>
          </h1>
          <p className="mt-4 text-center text-[13px] leading-relaxed text-fog">
            Eidon uses passwordless magic links. Enter your work email and we will send a sign-in
            link. No passwords to remember.
          </p>
        </Reveal>

        <form
          action="/api/auth/magic-link"
          method="post"
          className="mt-8 flex flex-col gap-3 rounded-[24px] border border-white/[0.08] bg-[#090c12]/70 p-6"
        >
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-fog/60">
              Work email
            </span>
            <input
              type="email"
              name="email"
              required
              placeholder="you@company.com"
              className="h-11 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 text-[13px] text-snow placeholder:text-fog/45 transition-colors focus:border-lime/40 focus:outline-none"
            />
          </label>
          <Button type="submit" className="w-full">
            <Mail className="size-4" aria-hidden="true" />
            Send magic link
          </Button>
          <p className="text-center font-mono text-[9.5px] leading-relaxed text-fog/50">
            By continuing you agree to the Terms and Privacy Policy.
          </p>
        </form>

        <div className="mt-6 rounded-xl border border-amber-300/20 bg-amber-300/[0.05] px-4 py-3">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-amber-200" aria-hidden="true" />
            <p className="text-[11.5px] leading-relaxed text-amber-100/90">
              Authentication requires a configured Supabase project (free tier). Without it, this
              form returns a demo notice. See{" "}
              <code className="font-mono text-[10px]">.env.example</code>.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <SectionHeading
            title="No workspace yet?"
            accent="Create one free."
            subtitle="Start with the Starter plan and your first AI employee today."
          />
          <Button href="/studio" variant="secondary" className="mt-6">
            Build your first employee
          </Button>
        </div>
      </div>
    </div>
  );
}
