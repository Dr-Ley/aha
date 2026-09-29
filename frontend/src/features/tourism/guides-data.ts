export type GuideSeed = {
  companyId: "aha";
  name: string;
  type: "employee" | "contractor";
  languages: string[];
  certifications: string[];
  status: "active";
};

export const AHA_GUIDES: GuideSeed[] = [
  {
    companyId: "aha",
    name: "Peter Guide",
    type: "employee",
    languages: ["English", "Swahili"],
    certifications: ["KPSGA silver"],
    status: "active",
  },
];
