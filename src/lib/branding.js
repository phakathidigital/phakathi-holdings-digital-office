// Converts a hex colour to HSL string for CSS variables
function hexToHsl(hex) {
  if (!hex || !hex.startsWith("#") || hex.length < 7) return null;
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export const DEFAULT_BRANDING = {
  primaryHex: "#171717",
  accentHex: "#f5f5f5",
  bgHex: "#ffffff",
  font: "Inter, system-ui, sans-serif",
  radius: "0.5rem",
  orgName: "Phakathi Holdings",
  orgTagline: "Digital Office",
};

export function applyBranding(branding = {}) {
  const b = { ...DEFAULT_BRANDING, ...branding };
  const root = document.documentElement;

  const primaryHsl = hexToHsl(b.primaryHex);
  const accentHsl = hexToHsl(b.accentHex);
  const bgHsl = hexToHsl(b.bgHex);

  // Derive foreground (contrast) from background lightness
  const bgL = bgHsl ? parseInt(bgHsl.split("%")[0].split(" ")[2] || "100") : 100;
  const fgHsl = bgL > 50 ? "0 0% 3.9%" : "0 0% 98%";
  const primaryFgHsl = (() => {
    const pL = primaryHsl ? parseInt(primaryHsl.split("%")[0].split(" ")[2] || "10") : 10;
    return pL > 50 ? "0 0% 9%" : "0 0% 98%";
  })();

  if (primaryHsl) {
    root.style.setProperty("--primary", primaryHsl);
    root.style.setProperty("--primary-foreground", primaryFgHsl);
    root.style.setProperty("--ring", primaryHsl);
    root.style.setProperty("--sidebar-primary", primaryHsl);
  }
  if (accentHsl) {
    root.style.setProperty("--accent", accentHsl);
    root.style.setProperty("--secondary", accentHsl);
    root.style.setProperty("--muted", accentHsl);
  }
  if (bgHsl) {
    root.style.setProperty("--background", bgHsl);
    root.style.setProperty("--card", bgHsl);
    root.style.setProperty("--popover", bgHsl);
    root.style.setProperty("--foreground", fgHsl);
    root.style.setProperty("--card-foreground", fgHsl);
    root.style.setProperty("--popover-foreground", fgHsl);
  }
  if (b.radius) {
    root.style.setProperty("--radius", b.radius);
  }
  if (b.font) {
    document.body.style.fontFamily = b.font;
  }

  // Store org name/tagline for sidebar to read
  if (b.orgName) root.setAttribute("data-org-name", b.orgName);
  if (b.orgTagline) root.setAttribute("data-org-tagline", b.orgTagline);
}

export function loadSavedBranding() {
  // Called on app boot — reads from user profile if available
  // The actual call happens in BrandingLoader component
}