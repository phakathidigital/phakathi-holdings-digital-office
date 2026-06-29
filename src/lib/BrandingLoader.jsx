import { useEffect } from "react";
import { api } from "@/api/apiClient";
import { applyBranding } from "@/lib/branding";
import { getCompanyBranding } from "@/lib/subsidiaries";

// Silently loads the user's saved branding on app start
export default function BrandingLoader() {
  useEffect(() => {
    api.auth.me()
      .then(user => {
        applyBranding({ ...getCompanyBranding(user?.subsidiary), ...(user?.branding || {}) });
      })
      .catch(() => {});
  }, []);
  return null;
}