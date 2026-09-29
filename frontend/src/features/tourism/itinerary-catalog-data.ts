export type DestinationContentSeed = {
  slug: string;
  description: string;
  seoTitle: string;
  metaDescription: string;
  image: string;
  published: boolean;
};

export const DESTINATION_CONTENT: DestinationContentSeed[] = [
  {
    slug: "nairobi",
    description:
      "Kenya's capital is the usual safari gateway: Wilson and Jomo Kenyatta airports, city lodges, and Nairobi National Park on the urban fringe.",
    seoTitle: "Nairobi Safari Gateway | Kenya Tours",
    metaDescription:
      "Start a Kenya safari in Nairobi — city lodges, airport transfers, and Nairobi National Park game viewing before heading to the Mara or Amboseli.",
    image: "/destination_maasai_mara1.png",
    published: true,
  },
  {
    slug: "maasai-mara",
    description:
      "The Maasai Mara is Kenya's flagship reserve: open grassland, big cats, and the Great Migration river crossings from July to October.",
    seoTitle: "Maasai Mara Safari | Wildlife & Migration",
    metaDescription:
      "Plan a Maasai Mara safari with game drives, optional balloon flights, and lodges near the reserve gates or inside the Mara Triangle.",
    image: "/destination_maasai_mara1.png",
    published: true,
  },
  {
    slug: "amboseli",
    description:
      "Amboseli is known for large elephant herds on open swamps with Mount Kilimanjaro as the backdrop on clear mornings.",
    seoTitle: "Amboseli National Park Safari | Elephants & Kilimanjaro",
    metaDescription:
      "Visit Amboseli for elephant viewing, Observation Hill, and Kilimanjaro views on a Kenya safari itinerary.",
    image: "/destination_maasai_mara1.png",
    published: true,
  },
  {
    slug: "lake-nakuru",
    description:
      "Lake Nakuru National Park combines a soda lake, rhino sanctuary woodland, and easy access from Nairobi on a compact Kenya circuit.",
    seoTitle: "Lake Nakuru National Park | Flamingos & Rhinos",
    metaDescription:
      "Add Lake Nakuru to a Kenya safari for rhino tracking, flamingo shoreline, and Rothschild giraffe in a compact national park.",
    image: "/destination_maasai_mara1.png",
    published: true,
  },
  {
    slug: "tsavo-east",
    description:
      "Tsavo East is a vast dry park famous for red-dust elephants along the Galana River and open-country game drives.",
    seoTitle: "Tsavo East National Park Safari",
    metaDescription:
      "Explore Tsavo East on a Kenya safari for red elephants, riverine game, and spacious landscapes between Nairobi and the coast.",
    image: "/destination_maasai_mara1.png",
    published: true,
  },
  {
    slug: "tsavo-west",
    description:
      "Tsavo West offers volcanic hills, Mzima Springs, and diverse habitats on the western side of the greater Tsavo ecosystem.",
    seoTitle: "Tsavo West National Park | Mzima Springs",
    metaDescription:
      "Discover Tsavo West — Mzima Springs, rhino country, and scenic hills on a southern Kenya safari circuit.",
    image: "/destination_maasai_mara1.png",
    published: true,
  },
];

export const PARK_FEE_SEEDS: Array<{
  destinationSlug: string;
  name: string;
  adultUsd: number;
  childUsd: number;
  infantUsd: number;
  adultUsdLow?: number;
  childUsdLow?: number;
  adultKes?: number;
  childKes?: number;
}> = [
  { destinationSlug: "nairobi", name: "Nairobi National Park fee", adultUsd: 50, childUsd: 25, infantUsd: 0 },
  {
    destinationSlug: "maasai-mara",
    name: "Maasai Mara park entrance",
    adultUsd: 200,
    childUsd: 100,
    infantUsd: 0,
    adultUsdLow: 100,
    childUsdLow: 50,
    adultKes: 5000,
    childKes: 2500,
  },
  { destinationSlug: "amboseli", name: "Amboseli park fee", adultUsd: 60, childUsd: 30, infantUsd: 0 },
  { destinationSlug: "lake-nakuru", name: "Lake Nakuru park fee", adultUsd: 60, childUsd: 30, infantUsd: 0 },
  { destinationSlug: "tsavo-east", name: "Tsavo East park fee", adultUsd: 60, childUsd: 30, infantUsd: 0 },
  { destinationSlug: "tsavo-west", name: "Tsavo West park fee", adultUsd: 60, childUsd: 30, infantUsd: 0 },
];

export const ACTIVITY_SEEDS: Array<{
  destinationSlug: string;
  attractionName?: string;
  name: string;
  adultUsd: number;
  childUsd: number;
}> = [
  { destinationSlug: "maasai-mara", attractionName: "Game drive", name: "Shared game drive", adultUsd: 0, childUsd: 0 },
  { destinationSlug: "maasai-mara", attractionName: "Hot air balloon safari", name: "Hot air balloon safari", adultUsd: 450, childUsd: 350 },
  { destinationSlug: "maasai-mara", attractionName: "Maasai village visit", name: "Maasai village visit", adultUsd: 30, childUsd: 15 },
  { destinationSlug: "amboseli", attractionName: "Observation Hill", name: "Observation Hill visit", adultUsd: 0, childUsd: 0 },
  { destinationSlug: "amboseli", name: "Amboseli game drive", adultUsd: 0, childUsd: 0 },
  { destinationSlug: "lake-nakuru", name: "Lake Nakuru game drive", adultUsd: 0, childUsd: 0 },
  { destinationSlug: "nairobi", name: "Nairobi National Park game drive", adultUsd: 40, childUsd: 20 },
  { destinationSlug: "tsavo-east", name: "Tsavo East game drive", adultUsd: 0, childUsd: 0 },
  { destinationSlug: "tsavo-west", attractionName: "Mzima Springs", name: "Mzima Springs visit", adultUsd: 0, childUsd: 0 },
];

export const TRANSFER_SEEDS: Array<{
  name: string;
  fromLabel: string;
  toLabel: string;
  destinationSlug?: string;
  amountUsd: number;
  vehicleType: string;
}> = [
  {
    name: "JKIA – Nairobi hotel transfer",
    fromLabel: "JKIA",
    toLabel: "Nairobi hotel",
    destinationSlug: "nairobi",
    amountUsd: 50,
    vehicleType: "safari_van",
  },
  {
    name: "Nairobi – Maasai Mara road transfer",
    fromLabel: "Nairobi",
    toLabel: "Maasai Mara",
    destinationSlug: "maasai-mara",
    amountUsd: 180,
    vehicleType: "landcruiser",
  },
];

export const TRANSPORT_SEEDS: Array<{
  name: string;
  vehicleType: string;
  dailyRateUsd: number;
  capacity: number;
}> = [
  { name: "Safari Land Cruiser", vehicleType: "landcruiser", dailyRateUsd: 230, capacity: 7 },
  { name: "Safari van", vehicleType: "safari_van", dailyRateUsd: 120, capacity: 8 },
];

export const EXTRA_ACCOMMODATION_SEEDS: Array<{
  slug: string;
  name: string;
  location: string;
  destinationSlug: string;
  type: "lodge" | "tented-camp" | "luxury-cottage";
  priceFrom: number;
  description: string;
  badges: string[];
}> = [
  {
    slug: "amboseli-sopa-lodge",
    name: "Amboseli Sopa Lodge",
    location: "Amboseli National Park",
    destinationSlug: "amboseli",
    type: "lodge",
    priceFrom: 160,
    description: "Lodge on the edge of Amboseli with Kilimanjaro views and easy park access.",
    badges: ["Mid-range", "Kilimanjaro views"],
  },
  {
    slug: "lake-nakuru-sopa-lodge",
    name: "Lake Nakuru Sopa Lodge",
    location: "Lake Nakuru National Park",
    destinationSlug: "lake-nakuru",
    type: "lodge",
    priceFrom: 140,
    description: "Hillside lodge overlooking Lake Nakuru woodland and the soda lake.",
    badges: ["Mid-range"],
  },
  {
    slug: "nairobi-house",
    name: "Nairobi transit lodge",
    location: "Nairobi",
    destinationSlug: "nairobi",
    type: "lodge",
    priceFrom: 90,
    description: "Practical overnight lodge for arrivals and departures in Nairobi.",
    badges: ["Budget", "Airport access"],
  },
  {
    slug: "ashnil-aruba-lodge",
    name: "Ashnil Aruba Lodge",
    location: "Tsavo East National Park",
    destinationSlug: "tsavo-east",
    type: "lodge",
    priceFrom: 150,
    description: "Lodge beside Aruba Dam in Tsavo East, well placed for red-elephant country.",
    badges: ["Mid-range"],
  },
  {
    slug: "kilaguni-serena-safari-lodge",
    name: "Kilaguni Serena Safari Lodge",
    location: "Tsavo West National Park",
    destinationSlug: "tsavo-west",
    type: "lodge",
    priceFrom: 220,
    description: "Classic Tsavo West lodge with a waterhole viewpoint and access to Mzima Springs.",
    badges: ["Luxury"],
  },
];
