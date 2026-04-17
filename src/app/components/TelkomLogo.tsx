import React from "react";
import telkomLogoSrc from "../../assets/telkom-logo.png";

interface TelkomLogoProps {
  size?: number;
  className?: string;
  /** Jika true, bungkus dengan background putih rounded (cocok untuk sidebar gelap) */
  withBg?: boolean;
}

export function TelkomLogo({ size = 40, className = "", withBg = false }: TelkomLogoProps) {
  if (withBg) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl overflow-hidden bg-white ${className}`}
        style={{ width: size, height: size, padding: 3 }}
      >
        <img
          src={telkomLogoSrc}
          alt="Telkom Indonesia"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </div>
    );
  }

  return (
    <img
      src={telkomLogoSrc}
      alt="Telkom Indonesia"
      className={className}
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
}
