// =============================================================================
// productHelper.ts — Helper to map backend icons and colors to frontend visuals
// Imports configurations from products.ts and executes lookup logic.
// =============================================================================

import { PRODUCTS_CONFIG, FALLBACK_PRODUCT_VISUAL, ProductVisual } from "../config/products";

export type { ProductVisual };

/**
 * Returns the corresponding visual assets (emoji, color classes, description) for a backend iconName key.
 */
export function getProductVisual(iconName: string): ProductVisual {
  if (!iconName) return FALLBACK_PRODUCT_VISUAL;
  
  // Clean key to match map
  const cleanKey = iconName.toLowerCase().trim();
  
  // If it's already an emoji (e.g. mock data fallback), return it as is
  if (cleanKey.match(/[\uD800-\uDFFF\u2600-\u27BF]/) || cleanKey.length === 1 || cleanKey.length === 2) {
    return {
      emoji: iconName,
      colorClass: "bg-amber-100 border-amber-300 text-amber-800",
      description: FALLBACK_PRODUCT_VISUAL.description,
    };
  }
  
  return PRODUCTS_CONFIG[cleanKey] || FALLBACK_PRODUCT_VISUAL;
}
