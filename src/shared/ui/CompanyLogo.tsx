type CompanyLogoProps = {
  src: string;
  name: string;
  hoverColor?: string;
  className?: string;
};

// Mask, not `filter: grayscale`, same technique as FooterPlayground's social chip icons: any logo shape, any
// internal fill structure, works as a mask source. Rest color is `bg-ink/30` (gray via opacity, not a separate
// gray token, matching the rest of the site's ink-alpha convention); hoverColor defaults to solid black, override
// per logo once brand colors are decided.
export function CompanyLogo({ src, name, hoverColor = "#0a0908", className = "" }: CompanyLogoProps) {
  return (
    <span
      role="img"
      aria-label={name}
      className={`inline-block bg-ink/30 transition-colors duration-300 ease-[cubic-bezier(0.65,0,0.35,1)] hover:bg-[var(--company-logo-hover)] ${className}`}
      style={{
        ["--company-logo-hover" as string]: hoverColor,
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
      }}
    />
  );
}
