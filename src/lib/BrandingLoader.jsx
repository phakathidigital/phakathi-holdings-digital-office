import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { applyBranding } from "@/lib/branding";
import { getCompanyBranding } from "@/lib/subsidiaries";

// Silently loads the user's saved branding on app start
export default function BrandingLoader() {
  useEffect(() => {
    base44.auth.me()
      .then(user => {
        applyBranding({ ...getCompanyBranding(user?.subsidiary), ...(user?.branding || {}) });
      })
      .catch(() => {});
  }, []);
  return null;
}