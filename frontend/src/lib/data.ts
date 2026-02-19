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
  description: string;
  rating: number;
  reviewCount: number;
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

// Unsplash URLs for placeholder images (replace with your own when ready)
const IMG = {
  hero: "https://images.unsplash.com/photo-1703878298745-cabc1b7fe312?q=80&w=1067&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  safariVehicle:
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
  zanzibar:
    "https://i.pinimg.com/1200x/ac/bb/77/acbb774f2a09fedc546fa93911757241.jpg",
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
    description:
      "Experience the iconic Masai Mara, home to the Big Five and the Great Wildebeest Migration. A perfect introduction to African safari.",
    rating: 4.9,
    reviewCount: 287,
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
    description:
      "Explore the flamingo-lined shores of Lake Nakuru, the scenic Lake Naivasha, and the wildlife-rich Masai Mara in one incredible journey.",
    rating: 4.8,
    reviewCount: 195,
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
    description:
      "Witness the majestic Mount Kilimanjaro as a backdrop while observing large elephant herds in their natural habitat at Amboseli.",
    rating: 4.7,
    reviewCount: 164,
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
    description:
      "Cross the border for the ultimate East African safari experience, from the Ngorongoro Crater to the Serengeti and Masai Mara.",
    rating: 4.9,
    reviewCount: 132,
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
    description:
      "The ultimate East Africa safari combining Kenya and Tanzania's finest parks in one unforgettable 8-day journey.",
    rating: 4.9,
    reviewCount: 156,
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
    text: "Booked with them for a 7 day safari across Kenya. Our friend and guide Peter, the man who is very experienced, informative, patient and adventurous, was the best coice we could have made for our first time experience. It will be an unforgettable experience in my life. Highly recommend African Home Adventure Safaries and Peter. Hakuna Matata !!!",
    tour: "7-Day Kenya Safari",
  },
  {
    id: "2",
    name: "Michael & Lisa Chen",
    country: "United States",
    avatar: "MC",
    rating: 5,
    text: "Very nice experience with Jared who knew how to adapt to our aspirations. Thank you for his answers to my husband's many questions. A very good memory for us of these 3 days in Massi Mara, including African massage:-)",
    tour: "3-Day Maasai Mara",
  },
  {
    id: "3",
    name: "Hans Mueller",
    country: "Germany",
    avatar: "HM",
    rating: 5,
    text: "Early on, I could see we were lucky to have the company we chose to safari with (Sep 2025). African Home is very professional, our driver was savvy, safe and very organised. He got us to places before it got busy, he knew all the roads extremey well. I have to add that their choice in accommodation is great, we stayed in the best camps and lodges. It was a perfect week. I recommend Ol Pejeta for quiet safari drives to see rhino, lions and leopard - that conservancy is quite special.",
    tour: "7-Day Kenya Safari",
  },
];

export const destinations = [
  { name: "Masai Mara", country: "Kenya", image: IMG.masaiMara },
  { name: "Amboseli", country: "Kenya", image: IMG.amboseli },
  { name: "Lake Nakuru", country: "Kenya", image: IMG.nakuru },
  { name: "Serengeti", country: "Tanzania", image: IMG.serengeti },
  { name: "Ngorongoro", country: "Tanzania", image: IMG.ngorongoro },
  { name: "Zanzibar", country: "Tanzania", image: IMG.zanzibar },
];
