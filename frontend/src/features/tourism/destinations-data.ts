import { toTourismSlug } from "./slug";

export type DestinationSeed = {
  country: string;
  region: string;
  name: string;
  slug: string;
};

export type AttractionSeed = {
  destinationSlug: string;
  name: string;
  type: string;
  duration: string;
  bestTime: string;
  description: string;
};

const DESTINATION_ROWS: Omit<DestinationSeed, "slug">[] = [
  { country: "Kenya", region: "Narok", name: "Maasai Mara" },
  { country: "Kenya", region: "Kajiado", name: "Amboseli" },
  { country: "Kenya", region: "Nakuru", name: "Lake Nakuru" },
  { country: "Kenya", region: "Nakuru", name: "Lake Naivasha" },
  { country: "Kenya", region: "Taita-Taveta", name: "Tsavo West" },
  { country: "Kenya", region: "Taita-Taveta", name: "Tsavo East" },
  { country: "Kenya", region: "Nairobi", name: "Nairobi" },
  { country: "Tanzania", region: "Mara", name: "Serengeti" },
  { country: "Tanzania", region: "Arusha", name: "Ngorongoro" },
  { country: "Tanzania", region: "Arusha", name: "Lake Manyara" },
  { country: "Tanzania", region: "Arusha", name: "Arusha" },
];

export const TOURISM_DESTINATIONS: DestinationSeed[] = DESTINATION_ROWS.map((row) => ({
  ...row,
  slug: toTourismSlug(row.name),
}));

export const TOURISM_ATTRACTIONS: AttractionSeed[] = [
  {
    destinationSlug: "maasai-mara",
    name: "Great Wildebeest Migration",
    type: "wildlife",
    duration: "full-day",
    bestTime: "July–October",
    description: "River crossings and predator action on the Mara plains during the Great Migration.",
  },
  {
    destinationSlug: "maasai-mara",
    name: "Game drive",
    type: "activity",
    duration: "half-day",
    bestTime: "Year-round; dry season June–October",
    description: "Morning or afternoon 4x4 game drive for Big Five viewing.",
  },
  {
    destinationSlug: "maasai-mara",
    name: "Maasai village visit",
    type: "cultural",
    duration: "2 hours",
    bestTime: "Year-round",
    description: "Guided visit to a Maasai manyatta with cultural explanation and dance.",
  },
  {
    destinationSlug: "maasai-mara",
    name: "Hot air balloon safari",
    type: "activity",
    duration: "3 hours",
    bestTime: "June–October",
    description: "Dawn balloon flight over the reserve followed by a bush breakfast.",
  },
  {
    destinationSlug: "amboseli",
    name: "Elephant herds",
    type: "wildlife",
    duration: "half-day",
    bestTime: "June–October and January–February",
    description: "Large elephant families on the Amboseli swamps with Kilimanjaro as backdrop.",
  },
  {
    destinationSlug: "amboseli",
    name: "Observation Hill",
    type: "viewpoint",
    duration: "1 hour",
    bestTime: "Year-round; clearest Kilimanjaro views at dawn",
    description: "Panoramic lookout over the park, wetlands, and Mount Kilimanjaro.",
  },
  {
    destinationSlug: "lake-nakuru",
    name: "Lake Nakuru flamingos and rhinos",
    type: "wildlife",
    duration: "half-day",
    bestTime: "Year-round",
    description: "Shores of Lake Nakuru for flamingos, both rhino species, and Rothschild giraffe.",
  },
  {
    destinationSlug: "lake-naivasha",
    name: "Lake Naivasha boat ride",
    type: "activity",
    duration: "1–2 hours",
    bestTime: "Year-round",
    description: "Boat safari for hippos, fish eagles, and shoreline birdlife.",
  },
  {
    destinationSlug: "tsavo-west",
    name: "Mzima Springs",
    type: "attraction",
    duration: "2 hours",
    bestTime: "Year-round",
    description: "Crystal springs with underwater hippo and fish viewing in Tsavo West.",
  },
  {
    destinationSlug: "tsavo-east",
    name: "Red elephants of Tsavo",
    type: "wildlife",
    duration: "half-day",
    bestTime: "June–October",
    description: "Dust-red elephants along the Galana River in Tsavo East.",
  },
  {
    destinationSlug: "serengeti",
    name: "Serengeti endless plains",
    type: "park",
    duration: "full-day",
    bestTime: "June–October (migration); year-round for resident game",
    description: "Open-plain game viewing and seasonal wildebeest migration routes.",
  },
  {
    destinationSlug: "ngorongoro",
    name: "Ngorongoro Crater descent",
    type: "park",
    duration: "full-day",
    bestTime: "June–October",
    description: "Full-day crater floor game drive among dense Big Five populations.",
  },
  {
    destinationSlug: "lake-manyara",
    name: "Lake Manyara game drive",
    type: "park",
    duration: "half-day",
    bestTime: "Year-round",
    description: "Groundwater forest, tree-climbing lions, and flamingo-lined soda lake.",
  },
];

export const REQUIRED_DESTINATION_SLUGS = [
  "maasai-mara",
  "amboseli",
  "serengeti",
  "ngorongoro",
] as const;

/** Infer a destination slug from lodging location or name text. */
export function inferDestinationSlug(text: string): string | null {
  const hay = text.toLowerCase();
  if (hay.includes("ngorongoro")) return "ngorongoro";
  if (hay.includes("serengeti")) return "serengeti";
  if (hay.includes("amboseli")) return "amboseli";
  if (hay.includes("nakuru")) return "lake-nakuru";
  if (hay.includes("naivasha")) return "lake-naivasha";
  if (hay.includes("tsavo west")) return "tsavo-west";
  if (hay.includes("tsavo east")) return "tsavo-east";
  if (hay.includes("manyara")) return "lake-manyara";
  if (hay.includes("mara") || hay.includes("maasai") || hay.includes("masai")) return "maasai-mara";
  if (hay.includes("nairobi")) return "nairobi";
  if (hay.includes("arusha")) return "arusha";
  return null;
}
