export const SUBSIDIARIES = [
  "Phakathi Holdings",
  "Empoweryst",
  "Micky Mouse School / Baby Geniuses",
  "Phakathi Capital",
  "Key Experts",
  "Kaelo Education",
  "Kaelo",
  "Synergex Health",
];

export const SUBSIDIARY_OPTIONS_WITH_ALL = ["All", ...SUBSIDIARIES];

export const SUBSIDIARY_ALIASES = {
  "Kaello Education Co.": "Kaelo Education",
  "Mickey Mouse Schools": "Micky Mouse School / Baby Geniuses",
  "Synergex Healthcare": "Synergex Health",
};

export const COMPANY_TEAM_MEMBERS = {
  "Phakathi Holdings": [
    "Mr Tshepo Phakathi — Group CEO",
    "Lorraine Sekwati — HR",
    "Meriam Malatji — Bookkeeper / Accountant",
    "Phathtshedzo Rakhunwana — Web, Graphics, and System Developer",
    "Thuli Thabethe — Office Coordinator",
    "Percity Mavimbela — Operations Manager",
  ],
  Empoweryst: [
    "Sarah Ngwenya — Administrator",
    "Lesedi Lucy Motloung — Senior BBBEE Consultant",
    "Molato Moloko — Senior BBBEE Consultant",
  ],
};

export const COMPANY_BRANDING_DEFAULTS = {
  "Phakathi Holdings": { primaryHex: "#171717", accentHex: "#f5f5f5", bgHex: "#ffffff", orgName: "Phakathi Holdings", orgTagline: "Shared Services & Group Alignment" },
  Empoweryst: { primaryHex: "#15803d", accentHex: "#dcfce7", bgHex: "#ffffff", orgName: "Empoweryst", orgTagline: "Skills, Funding & Execution" },
  "Micky Mouse School / Baby Geniuses": { primaryHex: "#f97316", accentHex: "#ffedd5", bgHex: "#ffffff", orgName: "Baby Geniuses", orgTagline: "Early Childhood Education" },
  "Phakathi Capital": { primaryHex: "#1d4ed8", accentHex: "#dbeafe", bgHex: "#ffffff", orgName: "Phakathi Capital", orgTagline: "Investment Engine" },
  "Key Experts": { primaryHex: "#7c3aed", accentHex: "#ede9fe", bgHex: "#ffffff", orgName: "Key Experts", orgTagline: "Technology Enablement" },
  "Kaelo Education": { primaryHex: "#0f766e", accentHex: "#ccfbf1", bgHex: "#ffffff", orgName: "Kaelo Education", orgTagline: "Training & Education Assets" },
  Kaelo: { primaryHex: "#0891b2", accentHex: "#cffafe", bgHex: "#ffffff", orgName: "Kaelo", orgTagline: "Education Investment Platform" },
  "Synergex Health": { primaryHex: "#be123c", accentHex: "#ffe4e6", bgHex: "#ffffff", orgName: "Synergex Health", orgTagline: "Healthcare Training & Wellness" },
};

export const MONDAY_ALIGNMENT_ATTENDEES = {
  "Phakathi Holdings": ["Mr Tshepo Phakathi", "Lorraine Sekwati", "Meriam Malatji", "Phathtshedzo Rakhunwana", "Thuli Thabethe", "Percity Mavimbela"],
  Empoweryst: ["Sarah Ngwenya", "Lesedi Lucy Motloung", "Molato Moloko"],
};

export const MONDAY_ALIGNMENT_AGENDA = `1. Opening and weekly alignment
2. Group strategy and education mission check-in
3. Subsidiary updates: Empoweryst, Micky Mouse School / Baby Geniuses, Phakathi Capital, Key Experts, Kaelo Education, Kaelo, Synergex Health
4. Performance, project management, and execution blockers
5. Action items, owners, and follow-up deadlines
6. Closing and next Monday commitments`;

export function normalizeSubsidiary(value) { return SUBSIDIARY_ALIASES[value] || value || ""; }
export function getCompanyBranding(subsidiary) { return COMPANY_BRANDING_DEFAULTS[normalizeSubsidiary(subsidiary)] || COMPANY_BRANDING_DEFAULTS["Phakathi Holdings"]; }
export function getCompanyTeamMembers(subsidiary) { return COMPANY_TEAM_MEMBERS[normalizeSubsidiary(subsidiary)] || []; }
export function getNextMonday(date = new Date()) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = (8 - day) % 7 || 7;
  next.setDate(next.getDate() + diff);
  return next.toISOString().split("T")[0];
}
