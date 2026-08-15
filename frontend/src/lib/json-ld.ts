import type { Tour } from "@/lib/data";

export const SITE_URL = "https://africanhomeadventure.com";
export const LOGO_URL = `${SITE_URL}/AHA_logo.png`;

/** Primary park/area coordinates for tour destination matching. */
const DESTINATION_GEO: { match: RegExp; lat: number; lng: number; name: string }[] = [
  { match: /masai\s*mara|maasai\s*mara/i, lat: -1.5021, lng: 35.144, name: "Masai Mara" },
  { match: /amboseli/i, lat: -2.6527, lng: 37.2606, name: "Amboseli" },
  { match: /nakuru/i, lat: -0.3667, lng: 36.088, name: "Lake Nakuru" },
  { match: /naivasha/i, lat: -0.7667, lng: 36.35, name: "Lake Naivasha" },
  { match: /serengeti/i, lat: -2.3333, lng: 34.8333, name: "Serengeti" },
  { match: /ngorongoro/i, lat: -3.2, lng: 35.5833, name: "Ngorongoro" },
  { match: /tsavo\s*west/i, lat: -3.02, lng: 38.0, name: "Tsavo West" },
  { match: /tsavo\s*east/i, lat: -2.9667, lng: 38.7667, name: "Tsavo East" },
  { match: /kilimanjaro/i, lat: -3.0674, lng: 37.3556, name: "Kilimanjaro" },
];

function absoluteImageUrl(src: string): string {
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  return `${SITE_URL}${src.startsWith("/") ? src : `/${src}`}`;
}

export function resolveTourGeo(tour: Tour): {
  lat: number;
  lng: number;
  name: string;
} | null {
  for (const place of DESTINATION_GEO) {
    if (place.match.test(tour.destination)) {
      return { lat: place.lat, lng: place.lng, name: place.name };
    }
  }
  return null;
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "TourOperator",
    name: "African Home Adventure",
    url: SITE_URL,
    logo: LOGO_URL,
    image: LOGO_URL,
    description:
      "Premium safari tours in Kenya and Tanzania. Over 25 years of experience creating unforgettable African wildlife adventures. KATO certified tour operator.",
    telephone: "+254722760661",
    email: "info@africahomeadventure.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "YWCA, Parkview Suites",
      addressLocality: "Nairobi",
      addressCountry: "KE",
    },
    areaServed: [
      { "@type": "Country", name: "Kenya" },
      { "@type": "Country", name: "Tanzania" },
    ],
    sameAs: [
      "https://africahomeadventure.com/blog.html",
      "https://www.kvcdp.org/index.html",
    ],
  };
}

export function tourJsonLd(tour: Tour) {
  const url = `${SITE_URL}/tours/${tour.slug}`;
  const images = (tour.image ?? []).map(absoluteImageUrl);
  const geo = resolveTourGeo(tour);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: tour.title,
    description: tour.description,
    image: images.length === 1 ? images[0] : images,
    url,
    brand: {
      "@type": "Brand",
      name: "African Home Adventure",
    },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/booking?tour=${encodeURIComponent(tour.slug)}`,
      price: tour.price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      category: "Safari Tour",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: tour.rating,
      reviewCount: tour.reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
    ...(geo
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: geo.lat,
            longitude: geo.lng,
          },
          contentLocation: {
            "@type": "Place",
            name: geo.name,
            geo: {
              "@type": "GeoCoordinates",
              latitude: geo.lat,
              longitude: geo.lng,
            },
          },
        }
      : {}),
  };
}
