export interface User {
  id: string;
  email: string;
  password: string; // In production, this is hashed!
  name: string;
  role: "customer" | "staff" | "admin";
  avatar?: string;
  createdAt: string;
}

// Mock users for testing
export const mockUsers: User[] = [
  {
    id: "user-1",
    email: "traveller@example.com",
    password: "password123", // Never store plain text in production!
    name: "John Traveller",
    role: "customer",
    avatar: "JT",
    createdAt: "2024-01-15",
  },
  {
    id: "user-2",
    email: "sarah.safari@email.com",
    password: "safari2024",
    name: "Sarah Safari",
    role: "customer",
    avatar: "SS",
    createdAt: "2024-02-20",
  },
  {
    id: "staff-1",
    email: "guide@africahomeadventure.com",
    password: "staffpass123",
    name: "Peter Guide",
    role: "staff",
    avatar: "PG",
    createdAt: "2023-06-10",
  },
  {
    id: "admin-1",
    email: "admin@africahomeadventure.com",
    password: "adminpass123",
    name: "Admin User",
    role: "admin",
    avatar: "AU",
    createdAt: "2023-01-01",
  },
];

// Helper function to authenticate (mock)
export function authenticateUser(email: string, password: string): User | null {
  const user = mockUsers.find(
    (u) => u.email === email && u.password === password
  );
  return user || null;
}

// Helper to check if email exists
export function emailExists(email: string): boolean {
  return mockUsers.some((u) => u.email === email);
}

export type TourType = "private" | "group"
export type TourTier = "budget" | "luxury"


export interface Tour {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  destination: string;
  countries: ("Kenya" | "Tanzania")[]
  duration: string;
  days: number;
  price: number;
  originalPrice?: number;
  /** Multiple images for tour card (hover on desktop, slideshow on mobile). First image is primary. */
  image: string[];
  gallery?: string[];
  description: string;
  longDescription: string;
  highlights: string[];
  included: string[];
  excluded: string[];
  itinerary: { day: number; title: string; description: string }[];
  rating: number;
  reviewCount: number;
  departing: string;
  difficulty: "Easy" | "Moderate" | "Challenging";
  type: TourType;
  tier: TourTier;
  recommended?: boolean;
  groupSize: string;
  featured?: boolean;
}

export interface Testimonial {
  id: string;
  name: string;
  country: string;
  avatar: string;
  rating: number;
  text: string;
  tour: string;
}

export interface Accomodations {
  id: string
  slug: string
  name: string
  location: string
  country: "Kenya" | "Tanzania"
  image: string
  description: string
  amenities: string[]
  priceFrom: number
  badges: string[]
  recommended?: boolean
  type: "lodge" | "tented-camp" | "luxury-cottage"
}

export const CURRENCIES = [
  { code: "USD", symbol: "$", label: "US Dollar", rate: 1 },
  { code: "KES", symbol: "KSh", label: "Kenyan Shilling", rate: 129.5 },
  { code: "GBP", symbol: "\u00a3", label: "British Pound", rate: 0.79 },
  { code: "EUR", symbol: "\u20ac", label: "Euro", rate: 0.92 },
  { code: "JPY", symbol: "\u00a5", label: "Japanese Yen", rate: 149.8 },
] as const

export type CurrencyCode = (typeof CURRENCIES)[number]["code"]

const IMG = {
  destination_maasai_mara1: "/destination_maasai_mara1.png",
  destination_maasai_mara2: "/savannah.png",
  destination_maasai_mara: "/destination_maasai_mara2.png",
  destination_maasai_mara3: "/bufalloes.png",
  destination_maasai_mara4: "/bufalloes-in-african.png",
  destination_ewc_luxury_tent: "/ewc-luxury-tent.png",
  destination_maasai_mara5: "/bufalloes-in-african.png",
  ewc_superior_tent: "/EWC_superior_tent.png",
  ewc_deluxe_room: "/ewc-deluxe-room.png",
  masaiMara: "/balloon_safari1.png",
  lion_feast2: "/lion_feast2.png",
  amboseli1: "/amboseli1.png",
  amboseli2: "/amboseli2.png",
  landcruiser1: "/landcruiser1.png",
  tour_jeep: "/tour_jeep.png",
  safari_lions: "/safari_lions.png",
  hippos: "/hippos.png",
  fun: "/fun.png",
  zebras: "/zebras.png",
  safari: "/safari.png",
  gamedrive1: "/gamedrive1.png",
  maasai_village: "/maasai_village.png",
  superior2_tented_camp: "/superior2-tented-camp.png",
  nakuru:
    "https://i.pinimg.com/1200x/a3/e4/3b/a3e43b613d9e9012465be81f6ea8d20d.jpg",
  amboseli: "/amboseli_elephants.png",
  serengeti:
    "https://i.pinimg.com/1200x/21/22/c4/2122c4de122825863beba78c53078804.jpg",
  ngorongoro:
    "https://i.pinimg.com/736x/71/75/64/717564b36cbc33a6e8c33edce55b2251.jpg",
  elephant_herd: "/elephant_herd.png",
  mara_river: "/mara_river2.png",
  safari3: "/van2_safari.png",
};

export const tours: Tour[] = [
  {
    id: "1",
    slug: "3-day-masai-mara-safari",
    title: "3-Day Masai Mara Safari",
    shortTitle: "Masai Mara Safari",
    destination: "Masai Mara",
    countries: ["Kenya"],
    duration: "3 Days / 2 Nights",
    days: 3,
    price: 650,
    originalPrice: 780,
    image: [IMG.destination_maasai_mara, IMG.destination_ewc_luxury_tent, IMG.destination_maasai_mara4, IMG.hippos],
    gallery: [IMG.masaiMara, IMG.destination_ewc_luxury_tent, IMG.destination_maasai_mara4, IMG.destination_maasai_mara2],
    description:
      "Experience the iconic Masai Mara, home to the Big Five and the Great Wildebeest Migration. A perfect introduction to African safari.",
    longDescription:
      "The Masai Mara National Reserve is Kenya's most popular game reserve, famous for its exceptional population of wildlife including the Big Five. This 3-day safari offers an immersive experience in one of Africa's greatest wildlife destinations. You'll witness predators on the hunt, vast herds of herbivores, and stunning African sunsets that will stay with you forever.",
    highlights: [
      "Big Five game viewing",
      "Masai village cultural visit",
      "Sunrise and sunset game drives",
      "Expert English-speaking guide",
    ],
    included: [
      "Return transport from Nairobi in 4x4 Land Cruiser",
      "Full board accommodation",
      "All park entrance fees",
      "Professional driver-guide",
      "Game drives as per itinerary",
      "Bottled drinking water",
    ],
    excluded: [
      "International flights",
      "Travel insurance",
      "Personal expenses",
      "Tips and gratuities",
      "Balloon safari (optional)",
    ],
    itinerary: [
      {
        day: 1,
        title: "Nairobi to Masai Mara",
        description:
          "Early morning departure from Nairobi. Drive through the Great Rift Valley with a stop at the escarpment viewpoint. Arrive at Masai Mara by lunchtime. Afternoon game drive until sunset.",
      },
      {
        day: 2,
        title: "Full Day in Masai Mara",
        description:
          "Full day of game drives in the reserve. Morning drive to spot predators, return for lunch, then afternoon drive exploring different parts of the reserve. Optional Masai village visit.",
      },
      {
        day: 3,
        title: "Masai Mara to Nairobi",
        description:
          "Early morning game drive for final wildlife spotting. After breakfast, depart for Nairobi arriving in the late afternoon.",
      },
    ],
    rating: 4.9,
    reviewCount: 287,
    departing: "Daily",
    difficulty: "Easy",
    groupSize: "2-7 persons",
    type: "private",
    tier: "budget",
    recommended: true,
    featured: true,
  },
  {
    id: "2",
    slug: "5-day-nakuru-naivasha-masai-mara",
    title: "5-Day Nakuru, Naivasha & Masai Mara Safari",
    shortTitle: "Nakuru & Mara Safari",
    destination: "Lake Nakuru, Lake Naivasha, Masai Mara",
    countries: ["Kenya"],
    duration: "5 Days / 4 Nights",
    days: 5,
    price: 1050,
    originalPrice: 1250,
    image: [IMG.nakuru, IMG.elephant_herd, IMG.superior2_tented_camp, IMG.lion_feast2, IMG.mara_river],
    gallery: [IMG.nakuru, IMG.elephant_herd, IMG.masaiMara, IMG.mara_river],
    description:
      "Explore the flamingo-lined shores of Lake Nakuru, the scenic Lake Naivasha, and the wildlife-rich Masai Mara in one incredible journey.",
    longDescription:
      "This 5-day safari combines three of Kenya's most stunning destinations. Start with the famous Lake Nakuru, known for its flamingos and rhino sanctuary. Continue to the scenic Lake Naivasha for a boat ride and optional cycling tour, before heading to the world-renowned Masai Mara for unforgettable game drives.",
    highlights: [
      "Lake Nakuru flamingos and rhinos",
      "Boat ride on Lake Naivasha",
      "Big Five game viewing in Masai Mara",
      "Great Rift Valley views",
    ],
    included: [
      "Transport in 4x4 safari vehicle",
      "Full board accommodation",
      "All park entrance fees",
      "Professional driver-guide",
      "Boat ride at Lake Naivasha",
      "Bottled drinking water",
    ],
    excluded: [
      "International flights",
      "Travel insurance",
      "Personal expenses",
      "Tips and gratuities",
    ],
    itinerary: [
      { day: 1, title: "Nairobi to Lake Nakuru", description: "Depart Nairobi and drive to Lake Nakuru. Afternoon game drive around the lake, spotting flamingos, rhinos, and other wildlife." },
      { day: 2, title: "Lake Nakuru to Lake Naivasha", description: "Morning game drive in Nakuru. After lunch, transfer to Lake Naivasha for a scenic boat ride spotting hippos and birdlife." },
      { day: 3, title: "Lake Naivasha to Masai Mara", description: "Drive south to the Masai Mara. Check in and enjoy an afternoon game drive as the reserve comes alive at golden hour." },
      { day: 4, title: "Full Day in Masai Mara", description: "Full day of game drives. Morning and afternoon sessions in different areas of the reserve, maximizing wildlife sightings." },
      { day: 5, title: "Masai Mara to Nairobi", description: "Final morning game drive, then return to Nairobi arriving late afternoon." },
    ],
    rating: 4.8,
    reviewCount: 195,
    departing: "Daily",
    difficulty: "Easy",
    groupSize: "2-7 persons",
    type: "private",
    tier: "budget",
    featured: true,
  },
  {
    id: "3",
    slug: "3-day-amboseli-safari",
    title: "3-Day Amboseli National Park Safari",
    shortTitle: "Amboseli Safari",
    destination: "Amboseli",
    countries: ["Kenya"],
    duration: "3 Days / 2 Nights",
    days: 3,
    price: 580,
    image: [IMG.amboseli, IMG.amboseli1, IMG.amboseli2, IMG.ewc_deluxe_room],
    gallery: [IMG.amboseli, IMG.amboseli1, IMG.amboseli2],
    description:
      "Witness the majestic Mount Kilimanjaro as a backdrop while observing large elephant herds in their natural habitat at Amboseli.",
    longDescription:
      "Amboseli National Park is renowned for its large elephant herds and stunning views of Mount Kilimanjaro. This 3-day safari provides intimate encounters with elephants and over 400 bird species, all set against one of the most photographed backdrops in Africa.",
    highlights: [
      "Mount Kilimanjaro views",
      "Large elephant herds",
      "Over 400 bird species",
      "Observation hill panoramic views",
    ],
    included: [
      "Return transport from Nairobi in 4x4 Land Cruiser",
      "Full board accommodation",
      "All park entrance fees",
      "Professional driver-guide",
      "Game drives as per itinerary",
    ],
    excluded: [
      "International flights",
      "Travel insurance",
      "Personal expenses",
      "Tips and gratuities",
    ],
    itinerary: [
      { day: 1, title: "Nairobi to Amboseli", description: "Drive from Nairobi to Amboseli with stunning views of Kilimanjaro. Afternoon game drive." },
      { day: 2, title: "Full Day Amboseli", description: "Full day exploring Amboseli with morning and afternoon game drives. Visit Observation Hill for panoramic views." },
      { day: 3, title: "Amboseli to Nairobi", description: "Sunrise game drive for a final wildlife encounter, then return to Nairobi." },
    ],
    rating: 4.7,
    reviewCount: 164,
    departing: "Daily",
    difficulty: "Easy",
    groupSize: "2-7 persons",
    type: "group",
    tier: "budget",
    featured: true,
  },
  {
    id: "4",
    slug: "6-day-serengeti-ngorongoro-masai-mara",
    title: "6-Day Serengeti, Ngorongoro & Masai Mara",
    shortTitle: "Serengeti & Ngorongoro",
    destination: "Ngorongoro, Serengeti, Masai Mara",
    countries: ["Kenya", "Tanzania"],
    duration: "6 Days / 5 Nights",
    days: 6,
    price: 1850,
    originalPrice: 2100,
    image: [IMG.serengeti, IMG.ngorongoro, IMG.maasai_village, IMG.fun, IMG.zebras],
    gallery: [IMG.serengeti, IMG.ngorongoro, IMG.masaiMara, IMG.fun, IMG.zebras],
    description:
      "Cross the border for the ultimate East African safari experience, from the Ngorongoro Crater to the Serengeti and Masai Mara.",
    longDescription:
      "This cross-border safari is the pinnacle of East African wildlife experiences. Descend into the Ngorongoro Crater, cross the vast Serengeti plains, and finish in Kenya's legendary Masai Mara. Six days of non-stop wildlife encounters across two countries.",
    highlights: [
      "Ngorongoro Crater descent",
      "Serengeti endless plains",
      "Cross-border Tanzania to Kenya",
      "Big Five in multiple parks",
    ],
    included: [
      "Cross-border transport in 4x4",
      "Full board accommodation",
      "All park entrance fees both countries",
      "Border crossing assistance",
      "Professional guide",
    ],
    excluded: ["Tanzania and Kenya visas", "International flights", "Travel insurance", "Personal expenses"],
    itinerary: [
      { day: 1, title: "Arusha to Ngorongoro", description: "Drive from Arusha to Ngorongoro Conservation Area. Settle at the crater rim lodge with breathtaking views." },
      { day: 2, title: "Ngorongoro Crater", description: "Descend into the crater for a full day of wildlife viewing. The crater floor hosts nearly 30,000 animals." },
      { day: 3, title: "Ngorongoro to Serengeti", description: "Cross the Serengeti plains, with game viewing en route. Arrive at the central Serengeti for afternoon game drive." },
      { day: 4, title: "Full Day Serengeti", description: "Full day exploring the Serengeti, following the migration if in season. Morning and afternoon game drives." },
      { day: 5, title: "Serengeti to Masai Mara", description: "Cross the border into Kenya and enter the Masai Mara for a sunset game drive." },
      { day: 6, title: "Masai Mara to Nairobi", description: "Final morning game drive, then return to Nairobi arriving late afternoon." },
    ],
    rating: 4.9,
    reviewCount: 132,
    departing: "Daily",
    difficulty: "Moderate",
    groupSize: "2-7 persons",
    type: "private",
    tier: "luxury",
    recommended: true,
    featured: true,
  },

  {
    id: "5",
    slug: "5-day-amboseli-tsavo-west-tsavo-east",
    title: "5-Day Amboseli, Tsavo West & Tsavo East Drop-off Mombasa",
    shortTitle: "Amboseli & Tsavo",
    destination: "Amboseli, Tsavo West, Tsavo East",
    countries: ["Kenya"],
    duration: "5 Days / 4 Nights",
    days: 5,
    price: 980,
    image: [IMG.amboseli, IMG.amboseli1, IMG.amboseli2, IMG.ewc_deluxe_room],
    description:
      "Journey from Amboseli through the red earth of Tsavo to the coast, combining safari with beach possibilities in Mombasa.",
    longDescription:
      "This 5-day safari takes you from the elephant paradise of Amboseli through the hilly landscapes of Tsavo West, visiting Mzima Springs, and into the vast Tsavo East before dropping you at Mombasa for an optional beach extension. Perfect for those who want safari and beach in one trip.",
    highlights: [
      "Mzima Springs underwater viewing",
      "Red elephants of Tsavo",
      "Mount Kilimanjaro views",
      "Drop-off at Mombasa for beach option",
    ],
    included: [
      "Transport in 4x4 Land Cruiser",
      "Full board accommodation",
      "All park entrance fees",
      "Professional driver-guide",
      "Drop-off at Mombasa",
    ],
    excluded: [
      "International flights",
      "Travel insurance",
      "Mombasa beach hotel",
      "Personal expenses",
    ],
    itinerary: [
      {
        day: 1,
        title: "Nairobi to Amboseli",
        description:
          "Drive to Amboseli with views of Kilimanjaro. Afternoon game drive among elephant herds.",
      },
      {
        day: 2,
        title: "Amboseli to Tsavo West",
        description:
          "Transfer to Tsavo West. Visit Mzima Springs and enjoy an afternoon game drive in the hilly terrain.",
      },
      {
        day: 3,
        title: "Full Day Tsavo West",
        description:
          "Full day exploring Tsavo West, including Shetani lava flows and more wildlife viewing.",
      },
      {
        day: 4,
        title: "Tsavo West to Tsavo East",
        description:
          "Cross into Tsavo East, famous for its red elephants. Afternoon game drive along the Galana River.",
      },
      {
        day: 5,
        title: "Tsavo East to Mombasa",
        description:
          "Morning game drive, then transfer to Mombasa arriving by late afternoon.",
      },
    ],
    rating: 4.6,
    reviewCount: 98,
    departing: "Daily",
    difficulty: "Easy",
    groupSize: "2-7 persons",
    type: "group",
    tier: "budget",
  },

  {
    id: "6",
    slug: "8-day-kenya-tanzania-combined",
    title: "8-Day Kenya & Tanzania Combined Safari",
    shortTitle: "Kenya & Tanzania Combined",
    destination: "Nakuru, Masai Mara, Serengeti, Ngorongoro",
    countries: ["Kenya", "Tanzania"],
    duration: "8 Days / 7 Nights",
    days: 8,
    price: 2450,
    originalPrice: 2800,
    image: [IMG.tour_jeep, IMG.ewc_superior_tent, IMG.ngorongoro, IMG.gamedrive1, IMG.nakuru, IMG.safari_lions],
    gallery: [IMG.tour_jeep, IMG.serengeti, IMG.safari3, IMG.ngorongoro, IMG.nakuru],
    description:
      "The ultimate East Africa safari combining Kenya and Tanzania's finest parks in one unforgettable 8-day journey.",
    longDescription:
      "This comprehensive 8-day safari is the definitive East African experience. Start at Lake Nakuru, continue to the Masai Mara, cross into Tanzania for the Serengeti, descend into the Ngorongoro Crater, and finish at Lake Manyara. Eight days of extraordinary wildlife encounters spanning two countries and five iconic destinations.",
    highlights: [
      "Five iconic wildlife destinations",
      "Cross-border Kenya-Tanzania experience",
      "Ngorongoro Crater descent",
      "Serengeti and Masai Mara in one trip",
    ],
    included: [
      "Cross-border transport in 4x4",
      "Full board accommodation",
      "All park fees both countries",
      "Border crossing assistance",
      "Professional guides",
      "Bottled water",
    ],
    excluded: ["Visas", "International flights", "Travel insurance", "Personal expenses", "Balloon safari"],
    itinerary: [
      { day: 1, title: "Nairobi to Lake Nakuru", description: "Drive to Lake Nakuru. Afternoon game drive to see flamingos, rhinos, and leopards." },
      { day: 2, title: "Lake Nakuru to Masai Mara", description: "Morning game drive at Nakuru, then transfer to the legendary Masai Mara." },
      { day: 3, title: "Full Day Masai Mara", description: "Full day of game drives in the Mara, chasing the Big Five." },
      { day: 4, title: "Masai Mara to Serengeti", description: "Cross the border into Tanzania and enter the Serengeti." },
      { day: 5, title: "Full Day Serengeti", description: "Full day in the Serengeti following the Great Migration routes." },
      { day: 6, title: "Serengeti to Ngorongoro", description: "Drive to Ngorongoro Conservation Area. Settle at the crater rim." },
      { day: 7, title: "Ngorongoro Crater", description: "Full day inside the crater, one of Africa's natural wonders." },
      { day: 8, title: "Ngorongoro to Arusha", description: "Drive to Lake Manyara for a brief game drive, then continue to Arusha." },
    ],
    rating: 4.9,
    reviewCount: 156,
    departing: "Daily",
    difficulty: "Moderate",
    groupSize: "2-7 persons",
    type: "private",
    tier: "luxury",
    recommended: true,
    featured: true,
  },

  {
    id: "7",
    slug: "4-day-masai-mara-group-safari",
    title: "4-Day Masai Mara Group Joining Safari",
    shortTitle: "Mara Group Safari",
    destination: "Masai Mara",
    countries: ["Kenya"],
    duration: "4 Days / 3 Nights",
    days: 4,
    price: 480,
    image: [IMG.amboseli, IMG.amboseli1, IMG.amboseli2, IMG.ewc_deluxe_room],
    description:
      "Join a group of fellow travelers on this budget-friendly Masai Mara safari. All the wildlife, half the cost.",
    longDescription:
      "This group joining safari is the most affordable way to experience the legendary Masai Mara. You will share a safari vehicle with other like-minded travelers, keeping costs low while still enjoying world-class game drives and comfortable accommodation.",
    highlights: [
      "Budget-friendly group safari",
      "Big Five game viewing",
      "Comfortable shared accommodation",
      "Meet fellow travelers",
    ],
    included: [
      "Transport in safari minivan",
      "Full board accommodation",
      "Park entrance fees",
      "Professional driver-guide",
    ],
    excluded: [
      "International flights",
      "Travel insurance",
      "Personal expenses",
      "Tips and gratuities",
    ],
    itinerary: [
      { day: 1, title: "Nairobi to Masai Mara", description: "Depart Nairobi early morning. Arrive Masai Mara for afternoon game drive." },
      { day: 2, title: "Full Day Masai Mara", description: "Full day of game drives throughout the reserve." },
      { day: 3, title: "Full Day Masai Mara", description: "Morning and afternoon game drives in different areas." },
      { day: 4, title: "Masai Mara to Nairobi", description: "Final morning game drive then return to Nairobi." },
    ],
    rating: 4.5,
    reviewCount: 312,
    departing: "Monday, Wednesday, Friday",
    difficulty: "Easy",
    groupSize: "6-12 persons",
    type: "group",
    tier: "budget",
  },
  {
    id: "8",
    slug: "7-day-luxury-masai-mara-amboseli",
    title: "7-Day Luxury Masai Mara & Amboseli Experience",
    shortTitle: "Luxury Mara & Amboseli",
    destination: "Masai Mara, Amboseli",
    countries: ["Kenya"],
    duration: "7 Days / 6 Nights",
    days: 7,
    price: 3200,
    image: [IMG.amboseli, IMG.amboseli1, IMG.amboseli2, IMG.ewc_deluxe_room],
    description:
      "The ultimate luxury Kenya safari with premium lodges, private game drives, and exclusive experiences in the Mara and Amboseli.",
    longDescription:
      "Indulge in the finest safari experience Kenya has to offer. Stay at premium lodges and tented camps, enjoy private game drives in custom 4x4 Land Cruisers, and experience exclusive bush dinners, sundowners, and cultural encounters. This is safari at its most refined.",
    highlights: [
      "Premium luxury lodges throughout",
      "Private 4x4 game drives",
      "Exclusive bush dinner under the stars",
      "Hot air balloon safari included",
    ],
    included: [
      "Private 4x4 Land Cruiser",
      "Premium lodge accommodation",
      "All meals and drinks",
      "Park fees and conservancy fees",
      "Hot air balloon safari",
      "Bush dinner experience",
    ],
    excluded: [
      "International flights",
      "Travel insurance",
      "Personal shopping",
      "Spa treatments",
    ],
    itinerary: [
      { day: 1, title: "Nairobi to Masai Mara", description: "VIP transfer to Masai Mara. Check into luxury lodge. Afternoon game drive." },
      { day: 2, title: "Hot Air Balloon Safari", description: "Pre-dawn balloon flight over the Mara. Champagne bush breakfast. Afternoon game drive." },
      { day: 3, title: "Full Day Masai Mara", description: "Private game drives. Evening bush dinner under the stars." },
      { day: 4, title: "Masai Mara Conservancy", description: "Game drives in private conservancy. Walking safari with Masai guides." },
      { day: 5, title: "Masai Mara to Amboseli", description: "Scenic transfer to Amboseli. Afternoon game drive with Kilimanjaro views." },
      { day: 6, title: "Full Day Amboseli", description: "Morning and afternoon game drives. Sundowner drinks with Kilimanjaro backdrop." },
      { day: 7, title: "Amboseli to Nairobi", description: "Final sunrise game drive then VIP transfer to Nairobi." },
    ],
    rating: 5.0,
    reviewCount: 89,
    departing: "Daily",
    difficulty: "Easy",
    groupSize: "2-4 persons",
    type: "private",
    tier: "luxury",
    recommended: true,
  },
];

export const accommodations: Accomodations[] = [


  {
    id: "enchoro-wildlife-camp",
    slug: "enchoro-wildlife-camp",
    name: "Enchoro Wildlife Camp",
    location: "Near Oloolaimutia Gate, Maasai Mara",
    country: "Kenya",
    image: "/destination_maasai_mara1.png", // Use local image path, not URL
    description: "Budget-friendly semi‑luxury tented camp a few minutes from Oloolaimutia Gate; 27 en‑suite tents with hot showers and private verandas.",
    amenities: [
      "Restaurant",
      "Bar", 
      "Hot Shower",
      "Ensuite Tents",
      "WiFi",
      "Parking"
    ],
    priceFrom: 60,
    badges: ["Budget", "Near Gate", "Eco-Friendly"],
    recommended: true,
    type: "tented-camp"
  },
  {
    id: "sarova-mara-game-camp",
    slug: "sarova-mara-game-camp",
    name: "Sarova Mara Game Camp",
    location: "Sekenani area, Maasai Mara National Reserve",
    country: "Kenya",
    image: "https://i.pinimg.com/1200x/7b/af/43/7baf433b6523cdbb5eec69a53d8e7c8d.jpg",
    description: "Full‑service luxury tented camp with Club/Deluxe/Family tents, free‑form pool, spa and organic‑garden dining—set in the heart of the reserve.",
    amenities: [
      "Swimming Pool",
      "Spa",
      "Restaurant",
      "Bar",
      "Ensuite Tents",
      "WiFi",
      "Mini Golf",
      "Organic Garden"
    ],
    priceFrom: 220,
    badges: ["Great Migration", "Family-Friendly", "Award-Winning"],
    recommended: true,
    type: "tented-camp"
  },
  {
    id: "mara-serena-safari-lodge",
    slug: "mara-serena-safari-lodge",
    name: "Mara Serena Safari Lodge",
    location: "Mara Triangle (Ol Donyo Oseiya hill)",
    country: "Kenya",
    image: "https://i.pinimg.com/1200x/07/4d/de/074dde5e0f7b30c3b3a9d7bb2d787d5f.jpg",
    description: "Iconic hilltop lodge—the only lodge in the Mara Triangle—with sweeping river/plains views, rock‑enclosed pool and Maisha Spa & Gym.",
    amenities: [
      "Swimming Pool",
      "Spa & Gym",
      "Restaurant",
      "Bar",
      "Balcony Views",
      "WiFi"
    ],
    priceFrom: 369,
    badges: ["Triangle Location", "Panoramic Views", "Family-Friendly"],
    type: "lodge"
  },
  {
    id: "keekorok-lodge",
    slug: "keekorok-lodge",
    name: "Muthu Keekorok Lodge",
    location: "Central Maasai Mara National Reserve",
    country: "Kenya",
    image: "https://i.pinimg.com/1200x/7a/ee/fc/7aeefc21561d65056a6f5355988ed303.jpg",
    description: "Historic first lodge in the Mara (1960s) with pool and famous hippo boardwalk overlooking a resident waterhole.",
    amenities: [
      "Swimming Pool",
      "Restaurant",
      "Bar",
      "Hippo Boardwalk",
      "WiFi",
      "Kids Playground"
    ],
    priceFrom: 180,
    recommended: true,
    badges: ["Classic", "Waterhole Views", "Inside Reserve"],
    type: "lodge"
  },

  {
    id: "cl-2",
    slug: "governors-camp",
    name: "Governors' Camp",
    location: "Masai Mara, Kenya",
    country: "Kenya",
    image: "https://i.pinimg.com/1200x/ae/5b/6b/ae5b6bfe47287e137941e41d2ee2d853.jpg",
    description: "One of the oldest and most prestigious camps in the Mara, nestled along the Mara River with abundant wildlife right at your doorstep.",
    amenities: ["Ensuite Bathroom", "Restaurant & Bar", "Guided Walks", "24h Power", "Laundry"],
    priceFrom: 220,
    badges: ["Tented Camp", "Eco"],
    recommended: false,
    type: "tented-camp",
  },

  {
    id: "cl-4",
    slug: "serengeti-sopa-lodge",
    name: "Serengeti Sopa Lodge",
    location: "Serengeti, Tanzania",
    country: "Tanzania",
    image: "https://i.pinimg.com/1200x/b5/16/f0/b516f0c72a5484590fbaaee8c0e48fb1.jpg",
    description: "Located in the southwestern Serengeti with sweeping views across the plains. Ideal for witnessing the Great Migration.",
    amenities: ["Swimming Pool", "Wi-Fi", "Restaurant & Bar", "Ensuite Bathroom", "24h Power", "Game Drives"],
    priceFrom: 200,
    badges: ["Luxury", "Migration Viewing"],
    type: "lodge",
  },
  {
    id: "cl-5",
    slug: "ngorongoro-wildlife-lodge",
    name: "Ngorongoro Wildlife Lodge",
    location: "Ngorongoro Crater Rim, Tanzania",
    country: "Tanzania",
    image: "https://i.pinimg.com/1200x/46/46/79/46467956da05da016e4c9e84c511b567.jpg",
    description: "Perched on the rim of the Ngorongoro Crater with breathtaking views into the caldera. Wake up to one of Africa's most dramatic landscapes.",
    amenities: ["Restaurant & Bar", "Wi-Fi", "Ensuite Bathroom", "Gift Shop", "24h Power", "Fireplace"],
    priceFrom: 250,
    badges: ["Premium", "Crater Views"],
    recommended: false,
    type: "lodge",
  },


]



export const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Sarah Thompson",
    country: "United Kingdom",
    avatar: "ST",
    rating: 5,
    text: "Booked with them for a 7 day safari across Kenya. Our friend and guide Peter was the best choice we could have made. Highly recommend African Home Adventure Safaris. Hakuna Matata!",
    tour: "7-Day Kenya Safari",
  },
  {
    id: "2",
    name: "Michael & Lisa Chen",
    country: "United States",
    avatar: "MC",
    rating: 5,
    text: "Very nice experience with Jared who knew how to adapt to our aspirations. Thank you for his answers. A very good memory for us of these 3 days in Masai Mara.",
    tour: "3-Day Maasai Mara",
  },
  {
    id: "3",
    name: "Hans Mueller",
    country: "Germany",
    avatar: "HM",
    rating: 5,
    text: "African Home is very professional, our driver was savvy, safe and organised. Their choice in accommodation is great. It was a perfect week. I recommend African Home Adventure.",
    tour: "7-Day Kenya Safari",
  },
];

export const destinations = [
  { name: "Masai Mara", country: "Kenya", image: IMG.masaiMara },
  { name: "Amboseli", country: "Kenya", image: IMG.amboseli },
  { name: "Lake Nakuru", country: "Kenya", image: IMG.nakuru },
  { name: "Serengeti", country: "Tanzania", image: IMG.serengeti },
  { name: "Ngorongoro", country: "Tanzania", image: IMG.ngorongoro },
  { name: "Zanzibar", country: "Tanzania", image: "https://images.unsplash.com/photo-1634646350433-fe03ad698448?q=80&w=1334&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
];
