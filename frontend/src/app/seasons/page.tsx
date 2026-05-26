"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  Sun,
  Cloud,
  CloudRain,
  DollarSign,
  Users,
  Camera,
  Calendar,
  type LucideIcon,
  Mail,
  ArrowRight,
  Phone,
} from "lucide-react";
import { Container, Section } from "@/components/layout";
import { useCurrency } from "@/lib/currency-context";

const months = [
  { name: "JAN", fullName: "January", intensity: 0.6 },
  { name: "FEB", fullName: "February", intensity: 0.5 },
  { name: "MAR", fullName: "March", intensity: 0.4 },
  { name: "APR", fullName: "April", intensity: 0.3 },
  { name: "MAY", fullName: "May", intensity: 0.3 },
  { name: "JUN", fullName: "June", intensity: 0.7 },
  { name: "JUL", fullName: "July", intensity: 0.9 },
  { name: "AUG", fullName: "August", intensity: 0.95 },
  { name: "SEP", fullName: "September", intensity: 1 },
  { name: "OCT", fullName: "October", intensity: 0.85 },
  { name: "NOV", fullName: "November", intensity: 0.6 },
  { name: "DEC", fullName: "December", intensity: 0.5 },
];

// Tanzania Data
const tanzaniaMonthDetails: Record<
  string,
  {
    season: string;
    weather: string;
    wildlife: string;
    crowds: string;
    pricing: string;
    highlights: string[];
    icon: LucideIcon;
  }
> = {
  JAN: {
    season: "Short Dry Season",
    weather: "Warm and mostly dry, occasional light showers",
    wildlife: "Calving season begins in Serengeti, excellent bird watching",
    crowds: "Moderate",
    pricing: "Mid-Season",
    highlights: [
      "Wildebeest calving begins",
      "Great bird photography",
      "Green landscapes",
      "Lower prices than peak",
    ],
    icon: Sun,
  },
  FEB: {
    season: "Short Dry Season",
    weather: "Warm with occasional afternoon showers",
    wildlife: "Peak calving season with predator action",
    crowds: "Moderate to High",
    pricing: "Mid-Season",
    highlights: [
      "Peak calving in Ndutu area",
      "Predator-prey interactions",
      "Baby animals everywhere",
      "Excellent photography",
    ],
    icon: Sun,
  },
  MAR: {
    season: "Long Rains Begin",
    weather: "Increasing rainfall, warm temperatures",
    wildlife: "Migration herds still in southern Serengeti",
    crowds: "Low",
    pricing: "Green Season (Low)",
    highlights: [
      "Lowest prices of the year",
      "Lush green scenery",
      "Fewer tourists",
      "Great for photography",
    ],
    icon: CloudRain,
  },
  APR: {
    season: "Long Rains",
    weather: "Heavy rainfall, cooler temperatures",
    wildlife: "Some camps close, wildlife dispersed",
    crowds: "Very Low",
    pricing: "Green Season (Lowest)",
    highlights: [
      "Best prices available",
      "Dramatic skies",
      "Uncrowded parks",
      "Authentic experience",
    ],
    icon: CloudRain,
  },
  MAY: {
    season: "Long Rains End",
    weather: "Rains tapering off, pleasant temperatures",
    wildlife: "Migration begins moving north",
    crowds: "Low",
    pricing: "Green Season (Low)",
    highlights: [
      "Value season ending",
      "Migration on the move",
      "Beautiful scenery",
      "Fewer vehicles",
    ],
    icon: Cloud,
  },
  JUN: {
    season: "Dry Season Begins",
    weather: "Cool and dry, clear skies",
    wildlife: "Migration in central Serengeti, river crossings begin",
    crowds: "Moderate to High",
    pricing: "High Season Begins",
    highlights: [
      "Dry season starts",
      "Excellent game viewing",
      "Clear photography conditions",
      "Migration moving north",
    ],
    icon: Sun,
  },
  JUL: {
    season: "Peak Dry Season",
    weather: "Cool mornings, warm days, no rain",
    wildlife: "Mara River crossings, peak migration",
    crowds: "High",
    pricing: "Peak Season",
    highlights: [
      "Famous river crossings",
      "Peak migration viewing",
      "Best wildlife visibility",
      "Ideal weather",
    ],
    icon: Sun,
  },
  AUG: {
    season: "Peak Dry Season",
    weather: "Dry and sunny, perfect safari weather",
    wildlife: "Dramatic river crossings continue",
    crowds: "Very High",
    pricing: "Peak Season",
    highlights: [
      "Spectacular crossings",
      "Huge herds gathered",
      "Predator activity high",
      "Best month for migration",
    ],
    icon: Sun,
  },
  SEP: {
    season: "Peak Dry Season",
    weather: "Warming up, still dry and clear",
    wildlife: "Migration in northern Serengeti, excellent viewing",
    crowds: "High",
    pricing: "Peak Season",
    highlights: [
      "Continued crossings",
      "Excellent visibility",
      "Less crowded than Aug",
      "Great value for peak",
    ],
    icon: Sun,
  },
  OCT: {
    season: "Dry Season Ends",
    weather: "Warming, short rains may begin late month",
    wildlife: "Migration starts returning south",
    crowds: "Moderate to High",
    pricing: "High Season",
    highlights: [
      "Migration turning south",
      "Good wildlife viewing",
      "Pleasant temperatures",
      "Shoulder season value",
    ],
    icon: Sun,
  },
  NOV: {
    season: "Short Rains",
    weather: "Short rains begin, warm temperatures",
    wildlife: "Migration moving through central Serengeti",
    crowds: "Moderate",
    pricing: "Mid-Season",
    highlights: [
      "Green season begins",
      "Migratory birds arrive",
      "Fewer tourists",
      "Good value",
    ],
    icon: Cloud,
  },
  DEC: {
    season: "Short Rains End",
    weather: "Rains tapering, festive season",
    wildlife: "Migration reaches southern Serengeti",
    crowds: "High (Holiday)",
    pricing: "High (Holiday Premium)",
    highlights: [
      "Holiday atmosphere",
      "Migration in Ndutu",
      "Good wildlife viewing",
      "Festive celebrations",
    ],
    icon: Cloud,
  },
};

// Kenya Data
const kenyaMonthDetails: Record<
  string,
  {
    season: string;
    weather: string;
    wildlife: string;
    crowds: string;
    pricing: string;
    highlights: string[];
    icon: LucideIcon;
  }
> = {
  JAN: {
    season: "Short Dry Season",
    weather: "Warm and dry, excellent safari conditions",
    wildlife: "Great wildlife viewing in Maasai Mara, cheetah spotting peak",
    crowds: "Moderate",
    pricing: "Mid-Season",
    highlights: [
      "Best cheetah viewing",
      "Topi rut mating displays",
      "Calving & predator activity",
      "Great for Big Five",
    ],
    icon: Sun,
  },
  FEB: {
    season: "Short Dry Season",
    weather: "Warm and dry, clear skies",
    wildlife: "Peak predator activity, baby animals abundant",
    crowds: "Moderate to High",
    pricing: "Mid-Season",
    highlights: [
      "Peak calving season",
      "Big cat spotting excellent",
      "Black rhinos easier to spot",
      "Migratory birds present",
    ],
    icon: Sun,
  },
  MAR: {
    season: "Long Rains Begin",
    weather: "Increasing rainfall, warm temperatures",
    wildlife: "Good wildlife viewing until mid-month, birding excellent",
    crowds: "Low",
    pricing: "Green Season (Low)",
    highlights: [
      "Best bird photography",
      "Dramatic storm skies",
      "Lush green landscapes",
      "Lower prices",
    ],
    icon: CloudRain,
  },
  APR: {
    season: "Long Rains",
    weather: "Heavy rainfall, cooler temperatures",
    wildlife: "Wildlife dispersed, some camps closed",
    crowds: "Very Low",
    pricing: "Green Season (Lowest)",
    highlights: [
      "Lowest prices of year",
      "Uncrowded parks",
      "Beautiful green scenery",
      "Authentic safari experience",
    ],
    icon: CloudRain,
  },
  MAY: {
    season: "Long Rains End",
    weather: "Rains tapering off, pleasant temperatures",
    wildlife: "Newborn animals visible, black rhinos on open plains",
    crowds: "Low",
    pricing: "Green Season (Low)",
    highlights: [
      "End of wet season",
      "Baby animals everywhere",
      "Great value pricing",
      "Quiet parks",
    ],
    icon: Cloud,
  },
  JUN: {
    season: "Dry Season Begins",
    weather: "Cool and dry, clear skies",
    wildlife: "Wildlife gathering at water sources, migration approaching",
    crowds: "Moderate to High",
    pricing: "High Season Begins",
    highlights: [
      "Shoulder season value",
      "Excellent game viewing",
      "Clear photography conditions",
      "Migration arriving late June",
    ],
    icon: Sun,
  },
  JUL: {
    season: "Peak Dry Season",
    weather: "Cool mornings, warm days, no rain",
    wildlife: "Great Migration arrives, Mara River crossings begin",
    crowds: "High",
    pricing: "Peak Season",
    highlights: [
      "Migration arrives mid-July",
      "First river crossings",
      "Excellent Big Five viewing",
      "Ideal safari weather",
    ],
    icon: Sun,
  },
  AUG: {
    season: "Peak Dry Season",
    weather: "Dry and sunny, perfect safari weather",
    wildlife: "Peak Mara River crossings, highest predator activity",
    crowds: "Very High",
    pricing: "Peak Season",
    highlights: [
      "Peak river crossings",
      "Most reliable migration viewing",
      "Huge herds in Mara",
      "Best month for Big Cats",
    ],
    icon: Sun,
  },
  SEP: {
    season: "Peak Dry Season",
    weather: "Warming up, still dry and clear",
    wildlife: "Migration in full swing, excellent big cat spotting",
    crowds: "High",
    pricing: "Peak Season",
    highlights: [
      "Continued crossings",
      "Less crowded than August",
      "Excellent value for peak",
      "Best month overall",
    ],
    icon: Sun,
  },
  OCT: {
    season: "Dry Season Ends",
    weather: "Warming, short rains may begin late month",
    wildlife: "Migration starts returning south, still excellent viewing",
    crowds: "Moderate to High",
    pricing: "High Season",
    highlights: [
      "Migration till mid-October",
      "Good wildlife viewing",
      "Shoulder season rates",
      "Fewer tourists",
    ],
    icon: Sun,
  },
  NOV: {
    season: "Short Rains",
    weather: "Short rains begin, warm temperatures",
    wildlife: "Baby animals born, migratory birds arrive",
    crowds: "Moderate",
    pricing: "Mid-Season",
    highlights: [
      "Green season begins",
      "Newborn elephants",
      "Peak bird breeding plumage",
      "Good value",
    ],
    icon: Cloud,
  },
  DEC: {
    season: "Short Rains End",
    weather: "Rains tapering, festive season",
    wildlife: "Baby animals abundant, predator activity high",
    crowds: "High (Holiday)",
    pricing: "High (Holiday Premium)",
    highlights: [
      "Festive atmosphere",
      "Lots of baby animals",
      "Lush green landscapes",
      "Great bird watching",
    ],
    icon: Cloud,
  },
};

const tanzaniaPricingTiers = [
  {
    tier: "Green Season",
    months: "March - May",
    priceMinUsd: 300,
    priceMaxUsd: 500,
    description: "Best value with lush landscapes and fewer crowds",
    color: "badge-success",
  },
  {
    tier: "Mid Season",
    months: "January, February, November",
    priceMinUsd: 500,
    priceMaxUsd: 800,
    description: "Good balance of value and wildlife viewing",
    color: "badge-warning",
  },
  {
    tier: "High Season",
    months: "June - October, December",
    priceMinUsd: 800,
    priceMaxUsd: 1500,
    description: "Peak wildlife viewing, especially migration",
    color: "badge-error",
  },
];

const kenyaPricingTiers = [
  {
    tier: "Green Season",
    months: "March - May",
    priceMinUsd: 350,
    priceMaxUsd: 550,
    description: "Lowest rates, lush landscapes, excellent birding",
    color: "badge-success",
  },
  {
    tier: "Mid Season",
    months: "January, February, November",
    priceMinUsd: 550,
    priceMaxUsd: 850,
    description: "Great wildlife viewing with moderate crowds",
    color: "badge-warning",
  },
  {
    tier: "High Season",
    months: "June - October, December",
    priceMinUsd: 900,
    priceMaxUsd: 1800,
    description: "Peak Great Migration viewing in Maasai Mara",
    color: "badge-error",
  },
];

const tanzaniaSeasons = [
  {
    name: "Dry Season",
    period: "June - October",
    icon: Sun,
    description:
      "The best time for wildlife viewing with animals gathering around water sources.",
    pros: [
      "Excellent game viewing",
      "Clear skies for photography",
      "Migration river crossings",
      "Comfortable temperatures",
    ],
    cons: [
      "Higher prices",
      "More tourists",
      "Dusty conditions",
      "Book well in advance",
    ],
  },
  {
    name: "Wet Season",
    period: "November - May",
    icon: CloudRain,
    description:
      "Lush green landscapes, newborn animals, and excellent bird watching opportunities.",
    pros: [
      "Lower prices",
      "Fewer crowds",
      "Beautiful scenery",
      "Calving season (Jan-Feb)",
    ],
    cons: [
      "Some roads impassable",
      "Wildlife more dispersed",
      "Afternoon showers",
      "Some camps closed",
    ],
  },
];

const kenyaSeasons = [
  {
    name: "Dry Season",
    period: "June - October & Jan-Feb",
    icon: Sun,
    description:
      "The ultimate time for wildlife viewing with the Great Migration in Maasai Mara and excellent Big Five spotting.",
    pros: [
      "Great Migration crossings",
      "Best Big Five viewing",
      "Clear photography conditions",
      "Comfortable temperatures",
    ],
    cons: [
      "Highest prices",
      "Very crowded in Mara",
      "Book 6-12 months ahead",
      "Dusty conditions",
    ],
  },
  {
    name: "Wet Season",
    period: "March - May & Nov-Dec",
    icon: CloudRain,
    description:
      "Lush landscapes, newborn animals, excellent bird watching, and lower prices.",
    pros: [
      "Lowest prices",
      "Uncrowded parks",
      "Baby animals everywhere",
      "Best bird photography",
    ],
    cons: [
      "Heavy rains Mar-May",
      "Some camps closed",
      "Wildlife dispersed",
      "Muddy road conditions",
    ],
  },
];

const countryData = {
  tanzania: {
    name: "Tanzania",
    flag: "🇹🇿",
    heroImage: "https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=2068",
    heroAlt: "Wildebeest migration in Serengeti, Tanzania",
    description: "Home to the Serengeti and Ngorongoro Crater, Tanzania offers year-round safari experiences with the world's most spectacular wildlife migration.",
    monthDetails: tanzaniaMonthDetails,
    pricingTiers: tanzaniaPricingTiers,
    seasons: tanzaniaSeasons,
  },
  kenya: {
    name: "Kenya",
    flag: "🇰🇪",
    heroImage: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?q=80&w=2070",
    heroAlt: "Lion in Maasai Mara, Kenya",
    description: "Famous for the Maasai Mara and the Great Migration river crossings, Kenya delivers iconic safari experiences and incredible Big Five encounters.",
    monthDetails: kenyaMonthDetails,
    pricingTiers: kenyaPricingTiers,
    seasons: kenyaSeasons,
  },
};

export default function SeasonsPricingPage() {
  const { formatPrice } = useCurrency();
  const [selectedCountry, setSelectedCountry] = useState<"kenya" | "tanzania">("kenya");
  const [selectedMonth, setSelectedMonth] = useState("SEP");
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const currentCountry = countryData[selectedCountry];
  const currentMonthDetails = currentCountry.monthDetails[selectedMonth];
  const MonthIcon = currentMonthDetails.icon;

  const handleCountryChange = (country: "kenya" | "tanzania") => {
    if (country === selectedCountry) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedCountry(country);
      setIsTransitioning(false);
    }, 200);
  };

  return (
    <main className="min-h-screen bg-base-200">
      {/* Hero Section with Crossfade Background */}
      <Section className="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        {/* Background Images with Crossfade */}
        <div className="absolute inset-0">
          {/* Tanzania Background */}
          <div 
            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
              selectedCountry === "tanzania" ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={countryData.tanzania.heroImage}
              alt={countryData.tanzania.heroAlt}
              fill
              className="object-cover"
              priority
            />
          </div>
          {/* Kenya Background */}
          <div 
            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
              selectedCountry === "kenya" ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={countryData.kenya.heroImage}
              alt={countryData.kenya.heroAlt}
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/40 to-black/70" />
        </div>
        
        <Container className="relative z-10 text-center text-white">
          <nav className="flex items-center justify-center gap-2 text-sm mb-6 text-white/80">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 shrink-0" />
            <Link
              href="/travel-tips"
              className="hover:text-white transition-colors"
            >
              Travel Tips
            </Link>
            <ChevronRight className="h-4 w-4 shrink-0" />
            <span className="text-white">Seasons & Pricing</span>
          </nav>
          
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium mb-6 transition-all duration-500">
            Seasons & Pricing Guide
          </h1>
          
          <p className="text-lg md:text-xl max-w-2xl mx-auto text-white/90 transition-all duration-500">
            Discover the best time to visit {currentCountry.name} based on wildlife, weather, and your budget preferences.
          </p>
          <div className="flex pt-6 justify-center">
            <div className="tabs tabs-boxed bg-base-100 shadow-lg p-1 rounded-box">
              <button
                onClick={() => handleCountryChange("tanzania")}
                className={`tab tab-lg transition-all duration-300 ${
                  selectedCountry === "tanzania" 
                    ? "tab-active bg-primary text-primary-content shadow-md" 
                    : "hover:bg-base-200"
                }`}
              >
                <span className="mr-2 text-2xl">🇹🇿</span>
                <span className="font-semibold">Tanzania</span>
              </button>

              <button
                onClick={() => handleCountryChange("kenya")}
                className={`tab tab-lg transition-all duration-300 ${
                  selectedCountry === "kenya" 
                    ? "tab-active bg-primary text-primary-content shadow-md" 
                    : "hover:bg-base-200"
                }`}
              >
                <span className="mr-2 text-2xl">🇰🇪</span>
                <span className="font-semibold">Kenya</span>
              </button>
            </div>
            </div>
        </Container>
      </Section>

      {/* Country Selector Tabs */}
      <Section className="-mt-10 relative z-20">
        <Container>
          <div className="flex justify-center">
            <div className="tabs tabs-boxed bg-base-100 shadow-lg p-1 rounded-box">
              <button
                onClick={() => handleCountryChange("kenya")}
                className={`tab tab-lg transition-all duration-300 ${
                  selectedCountry === "kenya" 
                    ? "tab-active bg-primary text-primary-content shadow-md" 
                    : "hover:bg-base-200"
                }`}
              >
                <span className="mr-2 text-2xl">🇰🇪</span>
                <span className="font-semibold">Kenya</span>
              </button>

              <button
                onClick={() => handleCountryChange("tanzania")}
                className={`tab tab-lg transition-all duration-300 ${
                  selectedCountry === "tanzania" 
                    ? "tab-active bg-primary text-primary-content shadow-md" 
                    : "hover:bg-base-200"
                }`}
              >
                <span className="mr-2 text-2xl">🇹🇿</span>
                <span className="font-semibold">Tanzania</span>
              </button>
            </div>
          </div>
          
          <p className="text-center mt-4 pt-5 text-base-content/70 max-w-2xl mx-auto transition-opacity duration-300">
            {currentCountry.description}
          </p>
        </Container>
      </Section>

      {/* When to Visit Section */}
      <Section className="py-20 -mt-25">
        <Container>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-medium mb-4">
              When to visit {currentCountry.name}
            </h2>
            <p className="text-base-content/70">
              {selectedCountry === "tanzania" 
                ? "Tanzania is the envy of most safari countries, as you can visit this destination all year round. However, the best time to visit for wildlife is during the dry season, between June and October, particularly for the peak of the wildebeest migration."
                : "Kenya offers incredible safari experiences year-round, with the world-famous Maasai Mara hosting the dramatic Great Migration river crossings between July and October. Below, find your perfect time to visit:"}
            </p>
          </div>

          {/* Month Selector */}
          <div className="flex flex-wrap justify-center gap-1 mb-8">
            {months.map((m) => (
              <button
                key={m.name}
                type="button"
                onClick={() => setSelectedMonth(m.name)}
                className={`btn btn-sm join-item transition-all duration-200 ${
                  selectedMonth === m.name ? "btn-primary" : "btn-ghost"
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>

          {/* Selected Month Details with CSS Transition */}
          <div 
            className={`card bg-base-100 border border-base-300 shadow-md mt-12 transition-all duration-300 ${
              isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
            }`}
          >
            <div className="card-body border-b border-base-300">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="card-title font-serif text-2xl">
                    {months.find((m) => m.name === selectedMonth)?.fullName} in{" "}
                    {currentCountry.name}
                  </h2>
                  <p className="text-base-content/70 mt-1">
                    {currentMonthDetails.season}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <MonthIcon className="h-6 w-6 text-accent" />
                  <span className="badge badge-warning badge-sm">
                    {currentMonthDetails.pricing}
                  </span>
                </div>
              </div>
            </div>
            <div className="card-body pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-base-content/70">
                    <Sun className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium">Weather</span>
                  </div>
                  <p className="text-sm">{currentMonthDetails.weather}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-base-content/70">
                    <Camera className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium">Wildlife</span>
                  </div>
                  <p className="text-sm">{currentMonthDetails.wildlife}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-base-content/70">
                    <Users className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium">Crowds</span>
                  </div>
                  <p className="text-sm">{currentMonthDetails.crowds}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-base-content/70">
                    <DollarSign className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium">Pricing</span>
                  </div>
                  <p className="text-sm">{currentMonthDetails.pricing}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">
                  Highlights for{" "}
                  {months.find((m) => m.name === selectedMonth)?.fullName}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentMonthDetails.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-accent" />
                      <span className="text-sm">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Seasons Overview */}
      <Section className="py-20 -mt-25 bg-base-200/50">
        <Container>
          <div className="text-center  max-w-2xl mx-auto mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-medium mb-4">
              {currentCountry.name} Safari Seasons
            </h2>
            <p className="text-base-content/70 mt-5">
              Understanding the main seasons will help you plan the perfect
              safari experience.
            </p>
          </div>

          <div 
            className={`grid grid-cols-1 lg:grid-cols-2 gap-8 transition-all duration-300 ${
              isTransitioning ? "opacity-0" : "opacity-100"
            }`}
          >
            {currentCountry.seasons.map((season, index) => {
              const SeasonIcon = season.icon;
              return (
                <div
                  key={`${selectedCountry}-season-${index}`}
                  className="card bg-base-100 border border-base-300 overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="card-body bg-linear-to-r from-primary to-primary/90 text-primary-content p-6">
                    <div className="flex items-center gap-3">
                      <SeasonIcon className="h-8 w-8 shrink-0" />
                      <div>
                        <h3 className="card-title text-xl text-primary-content">
                          {season.name}
                        </h3>
                        <p className="text-primary-content/90 text-sm">
                          {season.period}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="card-body pt-6">
                    <p className="text-base-content/70 mb-6">
                      {season.description}
                    </p>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-success mb-3">
                          Advantages
                        </h4>
                        <ul className="space-y-2">
                          {season.pros.map((pro, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-sm"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 shrink-0" />
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-warning mb-3">
                          Considerations
                        </h4>
                        <ul className="space-y-2">
                          {season.cons.map((con, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-sm"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 shrink-0" />
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* Pricing Tiers */}
      <Section className="py-20 -mt-25">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-medium mb-4">
              Safari Pricing Guide
            </h2>
            <p className="text-base-content/70 mt-5">
              Safari prices in {currentCountry.name} vary significantly based on the season. Here is what to expect.
            </p>
          </div>

          <div 
            className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-300 ${
              isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
            }`}
          >
            {currentCountry.pricingTiers.map((tier, index) => (
              <div
                key={`${selectedCountry}-price-${index}`}
                className="card bg-base-100 border border-base-300 text-center shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="card-body pt-8">
                  <span className={`badge ${tier.color} badge-lg mb-4`}>
                    {tier.tier}
                  </span>
                  <h3 className="text-3xl font-bold mb-2">
                    {formatPrice(tier.priceMinUsd)} – {formatPrice(tier.priceMaxUsd)}
                    <span className="text-lg font-semibold text-base-content/70"> /day</span>
                  </h3>
                  <p className="text-base-content/70 text-sm mb-4">
                    {tier.months}
                  </p>
                  <p className="text-sm">{tier.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="card bg-base-200/50 border border-base-300 mt-15">
            <div className="card-body py-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                  <DollarSign className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">
                    What is included in safari pricing?
                  </h4>
                  <p className="text-sm text-base-content/70">
                    Prices typically include accommodation, all meals, game
                    drives with professional guides, park fees, and transfers.
                    International flights, visa fees, travel insurance, and
                    gratuities are usually not included. Luxury lodges and
                    exclusive camps command premium prices, while budget camping
                    options offer more affordable alternatives.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Quick Tips */}
      <Section className="py-20 -mt-25 bg-base-200/50">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-medium mb-4">
              Planning Tips for {currentCountry.name}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card bg-base-100 border border-base-300 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="card-body">
                <Calendar className="h-8 w-8 text-accent mb-4 shrink-0" />
                <h3 className="font-semibold mb-2">Book Early for Peak Season</h3>
                <p className="text-sm text-base-content/70">
                  Popular lodges and camps fill up 6-12 months in advance for
                  July-October. Book early to secure your preferred dates and
                  accommodations.
                </p>
              </div>
            </div>
            
            <div className="card bg-base-100 border border-base-300 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="card-body">
                <DollarSign className="h-8 w-8 text-accent mb-4 shrink-0" />
                <h3 className="font-semibold mb-2">
                  Consider Shoulder Seasons
                </h3>
                <p className="text-sm text-base-content/70">
                  {selectedCountry === "tanzania" 
                    ? "June and November offer excellent wildlife viewing with lower prices and fewer crowds than peak months."
                    : "January-February and June offer excellent wildlife viewing with lower prices and fewer crowds than peak July-August."}
                </p>
              </div>
            </div>
            
            <div className="card bg-base-100 border border-base-300 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="card-body">
                <Camera className="h-8 w-8 text-accent mb-4 shrink-0" />
                <h3 className="font-semibold mb-2">
                  Green Season Photography
                </h3>
                <p className="text-sm text-base-content/70">
                  The green season offers stunning photography opportunities
                  with dramatic skies, lush landscapes, and newborn animals.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* CTA Section */}
<Section variant="primary">
  <Container>
    <div className="mx-auto max-w-3xl text-center">
      <h2 className="font-serif text-3xl font-bold text-primary-content text-balance sm:text-4xl">
        Ready to Plan Your {currentCountry.name} Safari?
      </h2>
      <p className="mt-4 text-lg leading-relaxed text-primary-content/80">
        Our safari experts can help you choose the perfect time to visit
        based on your interests, budget, and what you want to experience.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          href="/contact"
          className="btn btn-accent btn-lg gap-2 text-accent-content"
        >
          Get a Custom Quote <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/tours"
          className="btn btn-outline btn-lg border-primary-content/30 bg-primary-content/10 text-primary-content hover:bg-primary-content/20"
        >
          View Safari Tours
        </Link>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-primary-content/70">
        <a
          href="tel:+254722760661"
          className="flex items-center gap-2 transition-colors hover:text-primary-content"
        >
          <Phone className="h-4 w-4" /> +254 722 760 661
        </a>
        <a
          href="mailto:info@africahomeadventure.com"
          className="flex items-center gap-2 transition-colors hover:text-primary-content"
        >
          <Mail className="h-4 w-4" /> info@africahomeadventure.com
        </a>
      </div>
    </div>
  </Container>
</Section>
      

    </main>
  );
}