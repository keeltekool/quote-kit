import React from "react";

interface QuoteKitLogoProps {
  variant?: "full" | "compact" | "icon";
  theme?: "light" | "dark";
  className?: string;
}

export const QuoteKitLogo: React.FC<QuoteKitLogoProps> = ({
  variant = "full",
  theme = "light",
  className = "",
}) => {
  const isDark = theme === "dark";
  const stroke = isDark ? "#7A94A3" : "#3A5060";
  const checkStroke = isDark ? "#B5C5CF" : "#3A5060";
  const fill = isDark ? "rgba(122,148,163,0.08)" : "rgba(58,80,96,0.05)";
  const lineOpacity = isDark ? "0.3" : "0.35";
  const quoteColor = isDark ? "#D4E0E6" : "#1C2B33";
  const kitColor = isDark ? "#7A94A3" : "#3A5060";

  const DocCheck = ({ s = 34 }: { s?: number }) => (
    <svg width={s * 0.85} height={s} viewBox="0 0 30 40" fill="none">
      <rect x="2" y="2" width="26" height="36" rx="6" fill={fill} stroke={stroke} strokeWidth="2.2" />
      <line x1="10" y1="13" x2="20" y2="13" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" opacity={lineOpacity} />
      <line x1="10" y1="19" x2="16" y2="19" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" opacity={lineOpacity} />
      <path d="M10 27L13.5 30.5L22 23" stroke={checkStroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  if (variant === "icon") return <DocCheck s={36} />;

  const textClass = variant === "compact" ? "text-lg" : "text-xl";
  const iconSize = variant === "compact" ? 28 : 34;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <DocCheck s={iconSize} />
      <span className={`${textClass} font-semibold tracking-tight`}>
        <span style={{ color: quoteColor }}>Quote</span>
        <span style={{ color: kitColor }}>Kit</span>
      </span>
    </div>
  );
};
