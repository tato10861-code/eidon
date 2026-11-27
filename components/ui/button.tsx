import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-lime text-void hover:bg-[#dcff8f] shadow-[0_0_0_1px_rgba(203,255,90,0.25),0_10px_40px_-12px_rgba(203,255,90,0.45)]",
  secondary:
    "bg-white/[0.05] text-snow border border-white/10 hover:bg-white/[0.09] hover:border-white/20",
  ghost: "text-mist hover:text-snow hover:bg-white/[0.05]",
  outline: "border border-lime/30 text-lime hover:bg-lime/10 hover:border-lime/50",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px] gap-1.5 rounded-full",
  md: "h-11 px-5 text-sm gap-2 rounded-full",
  lg: "h-12 px-6 text-[15px] gap-2 rounded-full",
};

const base =
  "inline-flex items-center justify-center font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap";

type Common = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

type LinkProps = Common & {
  href: string;
} & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">;

type ButtonProps = Common & {
  href?: undefined;
} & Omit<ComponentProps<"button">, "className" | "children">;

export function Button(props: LinkProps | ButtonProps) {
  const { variant = "primary", size = "md", className, children } = props;
  const classes = cn(base, variants[variant], sizes[size], className);

  if ("href" in props && props.href) {
    const { href, variant: _v, size: _s, className: _c, children: _ch, ...rest } = props;
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  const { variant: _v, size: _s, className: _c, children: _ch, ...rest } = props as ButtonProps;
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
