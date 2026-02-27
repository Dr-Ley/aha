// scripts/seed.ts
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load from project root
dotenv.config({ path: join(__dirname, '../.env.local') });
dotenv.config({ path: join(__dirname, '../.env') });

import { db } from '../lib/db';
import { 
  users, 
  tours, 
  accommodations, 
  testimonials, 
  bookings,
  contactSubmissions,
  likes 
} from "@/lib/schema";
import { hash } from "bcrypt";
import { eq, and, sql } from "drizzle-orm";

// Import your mock data
import { tours as mockTours, accommodations as mockAccommodations, testimonials as mockTestimonials } from "@/lib/data";

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
  nakuru: "https://i.pinimg.com/1200x/a3/e4/3b/a3e43b613d9e9012465be81f6ea8d20d.jpg",
  amboseli: "/amboseli_elephants.png",
  serengeti: "https://i.pinimg.com/1200x/21/22/c4/2122c4de122825863beba78c53078804.jpg",
  ngorongoro: "https://i.pinimg.com/736x/71/75/64/717564b36cbc33a6e8c33edce55b2251.jpg",
  elephant_herd: "/elephant_herd.png",
  mara_river: "/mara_river2.png",
  safari3: "/van2_safari.png",
};

async function seedUsers() {
  console.log("Seeding users...");
  
  const hashedPassword = await hash("password123", 10);
  const staffPassword = await hash("staffpass123", 10);
  const adminPassword = await hash("adminpass123", 10);

  const usersData = [
    {
      email: "traveller@example.com",
      passwordHash: hashedPassword,
      name: "John Traveller",
      role: "customer" as const,
      avatar: "JT",
      phone: "+1234567890",
      country: "United States",
    },
    {
      email: "sarah.safari@email.com",
      passwordHash: hashedPassword,
      name: "Sarah Safari",
      role: "customer" as const,
      avatar: "SS",
      phone: "+44123456789",
      country: "United Kingdom",
    },
    {
      email: "guide@africahomeadventure.com",
      passwordHash: staffPassword,
      name: "Peter Guide",
      role: "staff" as const,
      avatar: "PG",
      phone: "+254722760661",
      country: "Kenya",
    },
    {
      email: "admin@africahomeadventure.com",
      passwordHash: adminPassword,
      name: "Admin User",
      role: "admin" as const,
      avatar: "AU",
      phone: "+254722760662",
      country: "Kenya",
    },
  ];

  for (const user of usersData) {
    const existing = await db.select().from(users).where(eq(users.email, user.email));
    if (existing.length === 0) {
      await db.insert(users).values(user);
      console.log(`Created user: ${user.email}`);
    } else {
      console.log(`User exists: ${user.email}`);
    }
  }
}

async function seedTours() {
  console.log("Seeding tours...");
  
  const toursData = [
    {
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
      description: "Experience the iconic Masai Mara, home to the Big Five and the Great Wildebeest Migration. A perfect introduction to African safari.",
      longDescription: "The Masai Mara National Reserve is Kenya's most popular game reserve, famous for its exceptional population of wildlife including the Big Five. This 3-day safari offers an immersive experience in one of Africa's greatest wildlife destinations.",
      highlights: ["Big Five game viewing", "Masai village cultural visit", "Sunrise and sunset game drives", "Expert English-speaking guide"],
      included: ["Return transport from Nairobi in 4x4 Land Cruiser", "Full board accommodation", "All park entrance fees", "Professional driver-guide", "Game drives as per itinerary", "Bottled drinking water"],
      excluded: ["International flights", "Travel insurance", "Personal expenses", "Tips and gratuities", "Balloon safari (optional)"],
      itinerary: [
        { day: 1, title: "Nairobi to Masai Mara", description: "Early morning departure from Nairobi. Drive through the Great Rift Valley with a stop at the escarpment viewpoint. Arrive at Masai Mara by lunchtime. Afternoon game drive until sunset." },
        { day: 2, title: "Full Day in Masai Mara", description: "Full day of game drives in the reserve. Morning drive to spot predators, return for lunch, then afternoon drive exploring different parts of the reserve. Optional Masai village visit." },
        { day: 3, title: "Masai Mara to Nairobi", description: "Early morning game drive for final wildlife spotting. After breakfast, depart for Nairobi arriving in the late afternoon." },
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
      likes: 45,
    },
    {
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
      description: "Explore the flamingo-lined shores of Lake Nakuru, the scenic Lake Naivasha, and the wildlife-rich Masai Mara in one incredible journey.",
      longDescription: "This 5-day safari combines three of Kenya's most stunning destinations. Start with the famous Lake Nakuru, known for its flamingos and rhino sanctuary. Continue to the scenic Lake Naivasha for a boat ride and optional cycling tour, before heading to the world-renowned Masai Mara for unforgettable game drives.",
      highlights: ["Lake Nakuru flamingos and rhinos", "Boat ride on Lake Naivasha", "Big Five game viewing in Masai Mara", "Great Rift Valley views"],
      included: ["Transport in 4x4 safari vehicle", "Full board accommodation", "All park entrance fees", "Professional driver-guide", "Boat ride at Lake Naivasha", "Bottled drinking water"],
      excluded: ["International flights", "Travel insurance", "Personal expenses", "Tips and gratuities"],
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
      likes: 32,
    },
    {
      slug: "3-day-amboseli-safari",
      title: "3-Day Amboseli National Park Safari",
      shortTitle: "Amboseli Safari",
      destination: "Amboseli",
      countries: ["Kenya"],
      duration: "3 Days / 2 Nights",
      days: 3,
      price: 580,
      originalPrice: null,
      image: [IMG.amboseli, IMG.amboseli1, IMG.amboseli2, IMG.ewc_deluxe_room],
      gallery: [IMG.amboseli, IMG.amboseli1, IMG.amboseli2],
      description: "Witness the majestic Mount Kilimanjaro as a backdrop while observing large elephant herds in their natural habitat at Amboseli.",
      longDescription: "Amboseli National Park is renowned for its large elephant herds and stunning views of Mount Kilimanjaro. This 3-day safari provides intimate encounters with elephants and over 400 bird species, all set against one of the most photographed backdrops in Africa.",
      highlights: ["Mount Kilimanjaro views", "Large elephant herds", "Over 400 bird species", "Observation hill panoramic views"],
      included: ["Return transport from Nairobi in 4x4 Land Cruiser", "Full board accommodation", "All park entrance fees", "Professional driver-guide", "Game drives as per itinerary"],
      excluded: ["International flights", "Travel insurance", "Personal expenses", "Tips and gratuities"],
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
      likes: 28,
    },
    {
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
      description: "Cross the border for the ultimate East African safari experience, from the Ngorongoro Crater to the Serengeti and Masai Mara.",
      longDescription: "This cross-border safari is the pinnacle of East African wildlife experiences. Descend into the Ngorongoro Crater, cross the vast Serengeti plains, and finish in Kenya's legendary Masai Mara. Six days of non-stop wildlife encounters across two countries.",
      highlights: ["Ngorongoro Crater descent", "Serengeti endless plains", "Cross-border Tanzania to Kenya", "Big Five in multiple parks"],
      included: ["Cross-border transport in 4x4", "Full board accommodation", "All park entrance fees both countries", "Border crossing assistance", "Professional guide"],
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
      likes: 67,
    },
    {
      slug: "5-day-amboseli-tsavo-west-tsavo-east",
      title: "5-Day Amboseli, Tsavo West & Tsavo East Drop-off Mombasa",
      shortTitle: "Amboseli & Tsavo",
      destination: "Amboseli, Tsavo West, Tsavo East",
      countries: ["Kenya"],
      duration: "5 Days / 4 Nights",
      days: 5,
      price: 980,
      originalPrice: null,
      image: [IMG.amboseli, IMG.amboseli1, IMG.amboseli2, IMG.ewc_deluxe_room],
      description: "Journey from Amboseli through the red earth of Tsavo to the coast, combining safari with beach possibilities in Mombasa.",
      longDescription: "This 5-day safari takes you from the elephant paradise of Amboseli through the hilly landscapes of Tsavo West, visiting Mzima Springs, and into the vast Tsavo East before dropping you at Mombasa for an optional beach extension. Perfect for those who want safari and beach in one trip.",
      highlights: ["Mzima Springs underwater viewing", "Red elephants of Tsavo", "Mount Kilimanjaro views", "Drop-off at Mombasa for beach option"],
      included: ["Transport in 4x4 Land Cruiser", "Full board accommodation", "All park entrance fees", "Professional driver-guide", "Drop-off at Mombasa"],
      excluded: ["International flights", "Travel insurance", "Mombasa beach hotel", "Personal expenses"],
      itinerary: [
        { day: 1, title: "Nairobi to Amboseli", description: "Drive to Amboseli with views of Kilimanjaro. Afternoon game drive among elephant herds." },
        { day: 2, title: "Amboseli to Tsavo West", description: "Transfer to Tsavo West. Visit Mzima Springs and enjoy an afternoon game drive in the hilly terrain." },
        { day: 3, title: "Full Day Tsavo West", description: "Full day exploring Tsavo West, including Shetani lava flows and more wildlife viewing." },
        { day: 4, title: "Tsavo West to Tsavo East", description: "Cross into Tsavo East, famous for its red elephants. Afternoon game drive along the Galana River." },
        { day: 5, title: "Tsavo East to Mombasa", description: "Morning game drive, then transfer to Mombasa arriving by late afternoon." },
      ],
      rating: 4.6,
      reviewCount: 98,
      departing: "Daily",
      difficulty: "Easy",
      groupSize: "2-7 persons",
      type: "group",
      tier: "budget",
      likes: 19,
    },
    {
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
      description: "The ultimate East Africa safari combining Kenya and Tanzania's finest parks in one unforgettable 8-day journey.",
      longDescription: "This comprehensive 8-day safari is the definitive East African experience. Start at Lake Nakuru, continue to the Masai Mara, cross into Tanzania for the Serengeti, descend into the Ngorongoro Crater, and finish at Lake Manyara. Eight days of extraordinary wildlife encounters spanning two countries and five iconic destinations.",
      highlights: ["Five iconic wildlife destinations", "Cross-border Kenya-Tanzania experience", "Ngorongoro Crater descent", "Serengeti and Masai Mara in one trip"],
      included: ["Cross-border transport in 4x4", "Full board accommodation", "All park fees both countries", "Border crossing assistance", "Professional guides", "Bottled water"],
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
      likes: 89,
    },
    {
      slug: "4-day-masai-mara-group-safari",
      title: "4-Day Masai Mara Group Joining Safari",
      shortTitle: "Mara Group Safari",
      destination: "Masai Mara",
      countries: ["Kenya"],
      duration: "4 Days / 3 Nights",
      days: 4,
      price: 480,
      originalPrice: null,
      image: [IMG.amboseli, IMG.amboseli1, IMG.amboseli2, IMG.ewc_deluxe_room],
      description: "Join a group of fellow travelers on this budget-friendly Masai Mara safari. All the wildlife, half the cost.",
      longDescription: "This group joining safari is the most affordable way to experience the legendary Masai Mara. You will share a safari vehicle with other like-minded travelers, keeping costs low while still enjoying world-class game drives and comfortable accommodation.",
      highlights: ["Budget-friendly group safari", "Big Five game viewing", "Comfortable shared accommodation", "Meet fellow travelers"],
      included: ["Transport in safari minivan", "Full board accommodation", "Park entrance fees", "Professional driver-guide"],
      excluded: ["International flights", "Travel insurance", "Personal expenses", "Tips and gratuities"],
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
      likes: 41,
    },
    {
      slug: "7-day-luxury-masai-mara-amboseli",
      title: "7-Day Luxury Masai Mara & Amboseli Experience",
      shortTitle: "Luxury Mara & Amboseli",
      destination: "Masai Mara, Amboseli",
      countries: ["Kenya"],
      duration: "7 Days / 6 Nights",
      days: 7,
      price: 3200,
      originalPrice: null,
      image: [IMG.amboseli, IMG.amboseli1, IMG.amboseli2, IMG.ewc_deluxe_room],
      description: "The ultimate luxury Kenya safari with premium lodges, private game drives, and exclusive experiences in the Mara and Amboseli.",
      longDescription: "Indulge in the finest safari experience Kenya has to offer. Stay at premium lodges and tented camps, enjoy private game drives in custom 4x4 Land Cruisers, and experience exclusive bush dinners, sundowners, and cultural encounters. This is safari at its most refined.",
      highlights: ["Premium luxury lodges throughout", "Private 4x4 game drives", "Exclusive bush dinner under the stars", "Hot air balloon safari included"],
      included: ["Private 4x4 Land Cruiser", "Premium lodge accommodation", "All meals and drinks", "Park fees and conservancy fees", "Hot air balloon safari", "Bush dinner experience"],
      excluded: ["International flights", "Travel insurance", "Personal shopping", "Spa treatments"],
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
      likes: 73,
    },
  ];

  for (const tour of toursData) {
    const existing = await db.select().from(tours).where(eq(tours.slug, tour.slug));
    if (existing.length === 0) {
      await db.insert(tours).values(tour);
      console.log(`Created tour: ${tour.title}`);
    } else {
      console.log(`Tour exists: ${tour.title}`);
    }
  }
}

async function seedAccommodations() {
  console.log("Seeding accommodations...");
  
  const accommodationsData = [
    {
      slug: "enchoro-wildlife-camp",
      name: "Enchoro Wildlife Camp",
      location: "Near Oloolaimutia Gate, Maasai Mara",
      country: "Kenya",
      image: ["/destination_maasai_mara1.png"],
      description: "Budget-friendly semi‑luxury tented camp a few minutes from Oloolaimutia Gate; 27 en‑suite tents with hot showers and private verandas.",
      amenities: ["Restaurant", "Bar", "Hot Shower", "Ensuite Tents", "WiFi", "Parking"],
      priceFrom: 60,
      badges: ["Budget", "Near Gate", "Eco-Friendly"],
      recommended: true,
      type: "tented-camp",
      likes: 12,
    },
    {
      slug: "sarova-mara-game-camp",
      name: "Sarova Mara Game Camp",
      location: "Sekenani area, Maasai Mara National Reserve",
      country: "Kenya",
      image: ["https://i.pinimg.com/1200x/7b/af/43/7baf433b6523cdbb5eec69a53d8e7c8d.jpg"],
      description: "Full‑service luxury tented camp with Club/Deluxe/Family tents, free‑form pool, spa and organic‑garden dining—set in the heart of the reserve.",
      amenities: ["Swimming Pool", "Spa", "Restaurant", "Bar", "Ensuite Tents", "WiFi", "Mini Golf", "Organic Garden"],
      priceFrom: 220,
      badges: ["Great Migration", "Family-Friendly", "Award-Winning"],
      recommended: true,
      type: "tented-camp",
      likes: 34,
    },
    {
      slug: "mara-serena-safari-lodge",
      name: "Mara Serena Safari Lodge",
      location: "Mara Triangle (Ol Donyo Oseiya hill)",
      country: "Kenya",
      image: ["https://i.pinimg.com/1200x/07/4d/de/074dde5e0f7b30c3b3a9d7bb2d787d5f.jpg"],
      description: "Iconic hilltop lodge—the only lodge in the Mara Triangle—with sweeping river/plains views, rock‑enclosed pool and Maisha Spa & Gym.",
      amenities: ["Swimming Pool", "Spa & Gym", "Restaurant", "Bar", "Balcony Views", "WiFi"],
      priceFrom: 369,
      badges: ["Triangle Location", "Panoramic Views", "Family-Friendly"],
      recommended: false,
      type: "lodge",
      likes: 28,
    },
    {
      slug: "keekorok-lodge",
      name: "Muthu Keekorok Lodge",
      location: "Central Maasai Mara National Reserve",
      country: "Kenya",
      image: ["https://i.pinimg.com/1200x/7a/ee/fc/7aeefc21561d65056a6f5355988ed303.jpg"],
      description: "Historic first lodge in the Mara (1960s) with pool and famous hippo boardwalk overlooking a resident waterhole.",
      amenities: ["Swimming Pool", "Restaurant", "Bar", "Hippo Boardwalk", "WiFi", "Kids Playground"],
      priceFrom: 180,
      badges: ["Classic", "Waterhole Views", "Inside Reserve"],
      recommended: true,
      type: "lodge",
      likes: 22,
    },
    {
      slug: "governors-camp",
      name: "Governors' Camp",
      location: "Masai Mara, Kenya",
      country: "Kenya",
      image: ["https://i.pinimg.com/1200x/ae/5b/6b/ae5b6bfe47287e137941e41d2ee2d853.jpg"],
      description: "One of the oldest and most prestigious camps in the Mara, nestled along the Mara River with abundant wildlife right at your doorstep.",
      amenities: ["Ensuite Bathroom", "Restaurant & Bar", "Guided Walks", "24h Power", "Laundry"],
      priceFrom: 220,
      badges: ["Tented Camp", "Eco"],
      recommended: false,
      type: "tented-camp",
      likes: 19,
    },
    {
      slug: "serengeti-sopa-lodge",
      name: "Serengeti Sopa Lodge",
      location: "Serengeti, Tanzania",
      country: "Tanzania",
      image: ["https://i.pinimg.com/1200x/b5/16/f0/b516f0c72a5484590fbaaee8c0e48fb1.jpg"],
      description: "Located in the southwestern Serengeti with sweeping views across the plains. Ideal for witnessing the Great Migration.",
      amenities: ["Swimming Pool", "Wi-Fi", "Restaurant & Bar", "Ensuite Bathroom", "24h Power", "Game Drives"],
      priceFrom: 200,
      badges: ["Luxury", "Migration Viewing"],
      recommended: false,
      type: "lodge",
      likes: 15,
    },
    {
      slug: "ngorongoro-wildlife-lodge",
      name: "Ngorongoro Wildlife Lodge",
      location: "Ngorongoro Crater Rim, Tanzania",
      country: "Tanzania",
      image: ["https://i.pinimg.com/1200x/46/46/79/46467956da05da016e4c9e84c511b567.jpg"],
      description: "Perched on the rim of the Ngorongoro Crater with breathtaking views into the caldera. Wake up to one of Africa's most dramatic landscapes.",
      amenities: ["Restaurant & Bar", "Wi-Fi", "Ensuite Bathroom", "Gift Shop", "24h Power", "Fireplace"],
      priceFrom: 250,
      badges: ["Premium", "Crater Views"],
      recommended: false,
      type: "lodge",
      likes: 21,
    },
  ];

  for (const acc of accommodationsData) {
    const existing = await db.select().from(accommodations).where(eq(accommodations.slug, acc.slug));
    if (existing.length === 0) {
      await db.insert(accommodations).values(acc);
      console.log(`Created accommodation: ${acc.name}`);
    } else {
      console.log(`Accommodation exists: ${acc.name}`);
    }
  }
}

async function seedTestimonials() {
  console.log("Seeding testimonials...");
  
  const testimonialsData = [
    {
      name: "Sarah Thompson",
      country: "United Kingdom",
      avatar: "ST",
      rating: 5,
      text: "Booked with them for a 7 day safari across Kenya. Our friend and guide Peter was the best choice we could have made. Highly recommend African Home Adventure Safaris. Hakuna Matata!",
      tourId: 8, // Will be updated after tours are created
    },
    {
      name: "Michael & Lisa Chen",
      country: "United States",
      avatar: "MC",
      rating: 5,
      text: "Very nice experience with Jared who knew how to adapt to our aspirations. Thank you for his answers. A very good memory for us of these 3 days in Masai Mara.",
      tourId: 1,
    },
    {
      name: "Hans Mueller",
      country: "Germany",
      avatar: "HM",
      rating: 5,
      text: "African Home is very professional, our driver was savvy, safe and organised. Their choice in accommodation is great. It was a perfect week. I recommend African Home Adventure.",
      tourId: 8,
    },
  ];

  // Get actual tour IDs from database
  const dbTours = await db.select({ id: tours.id, slug: tours.slug }).from(tours);
  const tourIdMap = new Map(dbTours.map(t => [t.slug, t.id]));

  for (const testimonial of testimonialsData) {
    // Find the correct tour ID based on slug reference
    let actualTourId = null;
    if (testimonial.tourId === 1) actualTourId = tourIdMap.get("3-day-masai-mara-safari");
    if (testimonial.tourId === 8) actualTourId = tourIdMap.get("7-day-luxury-masai-mara-amboseli");

    const existing = await db.select().from(testimonials).where(eq(testimonials.name, testimonial.name));
    if (existing.length === 0) {
      await db.insert(testimonials).values({
        ...testimonial,
        tourId: actualTourId,
      });
      console.log(`Created testimonial: ${testimonial.name}`);
    } else {
      console.log(`Testimonial exists: ${testimonial.name}`);
    }
  }
}
async function seedLikes() {
  console.log("Seeding likes...");
  
  const dbUsers = await db.select({ id: users.id, email: users.email }).from(users);
  const dbTours = await db.select({ id: tours.id, slug: tours.slug }).from(tours);
  const dbAccommodations = await db.select({ id: accommodations.id, slug: accommodations.slug }).from(accommodations);
  
  const userIdMap = new Map(dbUsers.map(u => [u.email, u.id]));
  const tourIdMap = new Map(dbTours.map(t => [t.slug, t.id]));
  const accIdMap = new Map(dbAccommodations.map(a => [a.slug, a.id]));

  const rawLikesData = [
    { userEmail: "traveller@example.com", tourSlug: "3-day-masai-mara-safari" },
    { userEmail: "traveller@example.com", tourSlug: "5-day-nakuru-naivasha-masai-mara" },
    { userEmail: "sarah.safari@email.com", tourSlug: "7-day-luxury-masai-mara-amboseli" },
    { userEmail: "traveller@example.com", accSlug: "enchoro-wildlife-camp" },
    { userEmail: "sarah.safari@email.com", accSlug: "sarova-mara-game-camp" },
  ];

  for (const raw of rawLikesData) {
    const userId = userIdMap.get(raw.userEmail);
    const tourId = raw.tourSlug ? tourIdMap.get(raw.tourSlug) : undefined;
    const accommodationId = raw.accSlug ? accIdMap.get(raw.accSlug) : undefined;

    if (!userId || (!tourId && !accommodationId)) {
      console.log(`Skipping like - missing references for ${raw.userEmail}`);
      continue;
    }

    // Build the insert object conditionally
    const insertData: { userId: number; tourId?: number; accommodationId?: number } = { userId };
    if (tourId) insertData.tourId = tourId;
    if (accommodationId) insertData.accommodationId = accommodationId;

    // Check for existing like
    const existing = await db.select().from(likes).where(
      tourId 
        ? and(eq(likes.userId, userId), eq(likes.tourId, tourId))
        : and(eq(likes.userId, userId), eq(likes.accommodationId, accommodationId!))
    );

    if (existing.length === 0) {
      await db.insert(likes).values(insertData);
      console.log(`Created like for user: ${userId}`);
    } else {
      console.log(`Like exists for user: ${userId}`);
    }
  }
}

async function main() {
  console.log("🌱 Starting database seed...\n");

  try {
    await seedUsers();
    await seedTours();
    await seedAccommodations();
    await seedTestimonials();
    await seedLikes();

    console.log("\n✅ Database seeded successfully!");
  } catch (error) {
    console.error("\n❌ Error seeding database:", error);
    process.exit(1);
  }

  process.exit(0);
}

main();
     