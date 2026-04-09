"use client";

import { usePageTransition } from "@/context/transition-context";

interface TransitionLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Drop-in replacement for any nav button/link that should trigger the
 * SVG page transition before navigating.
 *
 * Usage:
 *   <TransitionLink href="/about" className="...">About Me</TransitionLink>
 */
export default function TransitionLink({
  href,
  children,
  className,
  onClick,
}: TransitionLinkProps) {
  const { navigate } = usePageTransition();

  return (
    <button
      onClick={() => {
        onClick?.();
        navigate(href);
      }}
      className={className}
    >
      {children}
    </button>
  );
}
