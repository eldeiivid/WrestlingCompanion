import type { CSSProperties } from "react";
import type { BrandOption } from "../../types/career-setup/careerSetup.types";

export function careerSetupTheme(brand?: BrandOption): CSSProperties {
  return {
    "--setup-accent": brand?.primary_color && /^#[0-9a-f]{6}$/i.test(brand.primary_color)
      ? brand.primary_color : "#C99A4E",
    "--setup-background": brand?.background_url
      ? `url(${JSON.stringify(brand.background_url)})` : "none",
  } as CSSProperties;
}
