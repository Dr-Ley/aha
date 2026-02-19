export interface Tour {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  destination: string;
  country: "Kenya" | "Tanzania" | "Kenya & Tanzania";
  duration: string;
  days: number;
  price: number;
  originalPrice?: number;
  image: string;
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

const IMG = {
  masaiMara:
    "https://i.pinimg.com/736x/5f/b2/3b/5fb23b5347bcd6ff6a44d8a9f3552799.jpg",
  nakuru:
    "https://i.pinimg.com/1200x/a3/e4/3b/a3e43b613d9e9012465be81f6ea8d20d.jpg",
  amboseli:
    "https://i.pinimg.com/736x/bb/91/63/bb91638a953b6271e3e30b011cec8a5c.jpg",
  serengeti:
    "https://i.pinimg.com/1200x/21/22/c4/2122c4de122825863beba78c53078804.jpg",
  ngorongoro:
    "https://i.pinimg.com/736x/71/75/64/717564b36cbc33a6e8c33edce55b2251.jpg",
  safari1: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&q=80",
  safari2: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&q=80",
  safari3: "https://images.unsplash.com/photo-1489392191049-faf32704fe8e?w=800&q=80",
};

export const tours: Tour[] = [
  {
    id: "1",
    slug: "3-day-masai-mara-safari",
    title: "3-Day Masai Mara Safari",
    shortTitle: "Masai Mara Safari",
    destination: "Masai Mara",
    country: "Kenya",
    duration: "3 Days / 2 Nights",
    days: 3,
    price: 650,
    originalPrice: 780,
    image: IMG.masaiMara,
    gallery: [IMG.masaiMara, IMG.safari1, IMG.safari2, IMG.safari3],
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
    featured: true,
  },
  {
    id: "2",
    slug: "5-day-nakuru-naivasha-masai-mara",
    title: "5-Day Nakuru, Naivasha & Masai Mara Safari",
    shortTitle: "Nakuru & Mara Safari",
    destination: "Lake Nakuru, Lake Naivasha, Masai Mara",
    country: "Kenya",
    duration: "5 Days / 4 Nights",
    days: 5,
    price: 1050,
    originalPrice: 1250,
    image: IMG.nakuru,
    gallery: [IMG.nakuru, IMG.safari1, IMG.masaiMara, IMG.safari2],
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
    featured: true,
  },
  {
    id: "3",
    slug: "3-day-amboseli-safari",
    title: "3-Day Amboseli National Park Safari",
    shortTitle: "Amboseli Safari",
    destination: "Amboseli",
    country: "Kenya",
    duration: "3 Days / 2 Nights",
    days: 3,
    price: 580,
    image: IMG.amboseli,
    gallery: [IMG.amboseli, IMG.safari3, IMG.safari1],
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
    featured: true,
  },
  {
    id: "4",
    slug: "6-day-serengeti-ngorongoro-masai-mara",
    title: "6-Day Serengeti, Ngorongoro & Masai Mara",
    shortTitle: "Serengeti & Ngorongoro",
    destination: "Ngorongoro, Serengeti, Masai Mara",
    country: "Kenya & Tanzania",
    duration: "6 Days / 5 Nights",
    days: 6,
    price: 1850,
    originalPrice: 2100,
    image: IMG.serengeti,
    gallery: [IMG.serengeti, IMG.ngorongoro, IMG.masaiMara, IMG.safari1, IMG.safari2],
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
    featured: true,
  },
  {
    id: "5",
    slug: "8-day-kenya-tanzania-combined",
    title: "8-Day Kenya & Tanzania Combined Safari",
    shortTitle: "Kenya & Tanzania Combined",
    destination: "Nakuru, Masai Mara, Serengeti, Ngorongoro",
    country: "Kenya & Tanzania",
    duration: "8 Days / 7 Nights",
    days: 8,
    price: 2450,
    originalPrice: 2800,
    image: IMG.ngorongoro,
    gallery: [IMG.ngorongoro, IMG.nakuru, IMG.masaiMara, IMG.serengeti, IMG.safari3],
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
    featured: true,
  },
];

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
  { name: "Zanzibar", country: "Tanzania", image: "https://images.unsplash.com/photo-1589553416260-f586c8f1514f?w=600&q=80" },
];
