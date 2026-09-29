export type VehicleSeed = {
  companyId: "aha";
  ownership: "owned";
  type: string;
  capacity: number;
  registration: string;
  status: "available";
};

/** AHA's three company-owned safari vehicles. */
export const AHA_OWNED_VEHICLES: VehicleSeed[] = [
  {
    companyId: "aha",
    ownership: "owned",
    type: "landcruiser",
    capacity: 7,
    registration: "KDA 001A",
    status: "available",
  },
  {
    companyId: "aha",
    ownership: "owned",
    type: "landcruiser",
    capacity: 7,
    registration: "KDA 002B",
    status: "available",
  },
  {
    companyId: "aha",
    ownership: "owned",
    type: "safari_van",
    capacity: 9,
    registration: "KDA 003C",
    status: "available",
  },
];

export const SAMPLE_VEHICLE_PROVIDER = {
  name: "Nairobi Safari Fleet Hire",
  contact: { phone: "+254700000001", email: "hire@example.com" },
};
