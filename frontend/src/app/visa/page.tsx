"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  FileText,
  Globe,
  Clock,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Info,
  type LucideIcon,
  Mail,
  Phone,
  ArrowRight,
} from "lucide-react";
import { Container, Section } from "@/components/layout";
import { useCurrency } from "@/lib/currency-context";

type TabValue = "requirements" | "visa-types" | "how-to-apply";
type CountryValue = "tanzania" | "kenya";

// Tanzania Data
const tanzaniaData = {
  name: "Tanzania",
  flag: "🇹🇿",
  heroImage: "https://images.unsplash.com/photo-1523805009345-7448845a9e53?q=80&w=2072",
  heroAlt: "Tanzania landscape with passport",
  description: "Everything you need to know about obtaining your Electronic Travel Authorization and visa for your Tanzanian safari adventure.",
  officialUrl: "https://eservices.immigration.go.tz/visa/",
  officialLabel: "Apply for Tanzania ETA",
  etaName: "ETA",
  requirements: [
    {
      icon: FileText,
      title: "Valid Passport",
      description: "Your passport must be valid for at least 6 months beyond your intended stay and have at least 2 blank pages.",
    },
    {
      icon: Globe,
      title: "ETA Application",
      description: "Apply online through the Tanzania Immigration Services Department portal before your trip.",
    },
    {
      icon: Clock,
      title: "Processing Time",
      description: "Standard processing takes 3-5 business days. We recommend applying at least 2 weeks before travel.",
    },
    {
      icon: CreditCard,
      title: "Visa Fee",
      description: "The current visa fee is $50 USD for most nationalities. Payment is made online during application.",
    },
  ],
  visaTypes: [
    {
      type: "Single Entry Tourist Visa",
      duration: "Up to 90 days",
      feeUsd: 50,
      description: "For tourism, visiting friends/family, or short business trips. Most safari visitors need this visa.",
    },
    {
      type: "Multiple Entry Visa",
      duration: "Up to 1 year",
      feeUsd: 100,
      description: "For frequent travelers who plan to visit Tanzania multiple times within a year.",
    },
    {
      type: "Transit Visa",
      duration: "Up to 7 days",
      feeUsd: 30,
      description: "For travelers passing through Tanzania to another destination.",
    },
    {
      type: "Business Visa",
      duration: "Up to 90 days",
      feeUsd: 250,
      description: "For business activities, conferences, or professional engagements.",
    },
  ],
  applicationSteps: [
    {
      step: 1,
      title: "Create an Account",
      description: "Visit the official Tanzania Immigration portal and create your account with a valid email address.",
    },
    {
      step: 2,
      title: "Complete Application Form",
      description: "Fill in your personal details, travel information, and accommodation details accurately.",
    },
    {
      step: 3,
      title: "Upload Documents",
      description: "Upload a passport photo, passport bio page, and any supporting documents required.",
    },
    {
      step: 4,
      title: "Pay Visa Fee",
      description: "Make payment using a credit/debit card. Keep your payment receipt for reference.",
    },
    {
      step: 5,
      title: "Receive ETA",
      description: "Once approved, download and print your ETA to present at immigration upon arrival.",
    },
  ],
  requiredDocuments: [
    {
      title: "Valid Passport",
      desc: "Must be valid for 6+ months with 2+ blank pages",
    },
    {
      title: "Passport-sized Photo",
      desc: "Recent photo with white background (JPEG/PNG)",
    },
    {
      title: "Travel Itinerary",
      desc: "Flight bookings and accommodation details",
    },
    {
      title: "Proof of Funds",
      desc: "Bank statement or credit card (sometimes required)",
    },
  ],
  importantNotes: [
    {
      type: "warning",
      title: "Yellow Fever Certificate",
      content: "Required if arriving from or transiting through a yellow fever endemic country. Vaccination must be done at least 10 days before arrival.",
    },
    {
      type: "info",
      title: "COVID-19",
      content: "Check current requirements as they may change. Visit the official Tanzania Tourism Board website for updates.",
    },
    {
      type: "success",
      title: "Safari Bookings",
      content: "Having confirmed safari bookings from a registered tour operator strengthens your visa application.",
    },
  ],
  exemptCountries: [
    "Kenya", "Uganda", "Rwanda", "Burundi", "Democratic Republic of Congo",
    "South Africa", "Zambia", "Zimbabwe", "Malawi", "Mozambique",
  ],
  faqs: [
    {
      question: "Can I get a visa on arrival in Tanzania?",
      answer: "Yes, some nationalities can obtain a visa on arrival at major entry points. However, we strongly recommend applying for an ETA online before travel to avoid long queues and potential issues at the airport.",
    },
    {
      question: "How long is the Tanzania tourist visa valid?",
      answer: "A single-entry tourist visa is valid for 90 days from the date of entry. You must enter Tanzania within 90 days of the visa being issued.",
    },
    {
      question: "Can I extend my visa while in Tanzania?",
      answer: "Yes, you can apply for a visa extension at the Immigration Department in Dar es Salaam or regional immigration offices. Extensions are granted at the discretion of immigration officials.",
    },
    {
      question: "Do children need their own visa?",
      answer: "Yes, all travelers including children require their own visa. Children must have their own passport or be included in a parent's passport with their photo.",
    },
    {
      question: "What if my ETA application is rejected?",
      answer: "If rejected, you'll receive notification with reasons. You can reapply addressing the issues or contact the Tanzanian embassy in your country for assistance.",
    },
    {
      question: "Is yellow fever vaccination required?",
      answer: "A yellow fever vaccination certificate is required if you're arriving from or have transited through a yellow fever endemic country. It's recommended for all travelers.",
    },
  ],
};

// Kenya Data
const kenyaData = {
  name: "Kenya",
  flag: "🇰🇪",
  heroImage: "/mombasaa.png",
  heroAlt: "Kenya safari landscape",
  description: "Everything you need to know about obtaining your Electronic Travel Authorization and visa for your Kenyan safari adventure.",
  officialUrl: "https://www.etakenya.go.ke",
  officialLabel: "Apply for Kenya ETA",
  etaName: "ETA",
  requirements: [
    {
      icon: FileText,
      title: "Valid Passport",
      description: "Passport valid for at least 6 months after your return date with at least one blank visa page.",
    },
    {
      icon: Globe,
      title: "eTA Application",
      description: "Apply online through the official Kenya eTA portal at least 3 days prior to travel.",
    },
    {
      icon: Clock,
      title: "Processing Time",
      description: "Standard processing takes 3 working days. Apply up to 3 months prior (valid for 3 months from issue).",
    },
    {
      icon: CreditCard,
      title: "eTA Fee",
      description: "The eTA fee is $34 USD per person (approximately $32.50 + $1.59 processing fee), regardless of age.",
    },
  ],
  visaTypes: [
    {
      type: "Standard eTA",
      duration: "Up to 90 days",
      feeUsd: 34,
      description: "For tourism, visiting friends/family, or business. Most safari visitors need this authorization.",
    },
    {
      type: "East African Tourist Visa",
      duration: "Up to 90 days",
      feeUsd: 100,
      description: "Multiple entry visa for Kenya, Uganda, and Rwanda. Must first enter Kenya to be issued.",
    },
    {
      type: "Transit Authorization",
      duration: "Up to 72 hours",
      feeLabel: "Included in eTA",
      description: "For travelers passing through Kenya to another destination (if leaving airport).",
    },
    {
      type: "Multiple Entry (5 Year)",
      duration: "Up to 5 years",
      feeUsd: 210,
      description: "For frequent travelers with multiple trips planned. Available through embassy application.",
    },
  ],
  applicationSteps: [
    {
      step: 1,
      title: "Visit Official Portal",
      description: "Go to www.etakenya.go.ke and click 'Apply Now'. Accept the Declaration of Consent.",
    },
    {
      step: 2,
      title: "Choose Application Type",
      description: "Select Individual (one person) or Group application (up to 9 people traveling together).",
    },
    {
      step: 3,
      title: "Upload Documents",
      description: "Upload passport bio page and recent passport photo or selfie (can use webcam).",
    },
    {
      step: 4,
      title: "Complete Information",
      description: "Fill in contact details, trip information (flights, hotel), and general information (occupation, emergency contact).",
    },
    {
      step: 5,
      title: "Customs Declaration & Payment",
      description: "Complete customs declaration, upload itinerary, confirm application details, and pay $34 USD fee.",
    },
    {
      step: 6,
      title: "Receive eTA",
      description: "Download approved eTA from email or mobile app. Present at all departure and arrival points.",
    },
  ],
  requiredDocuments: [
    {
      title: "Valid Passport",
      desc: "Minimum 6 months validity with at least one blank page",
    },
    {
      title: "Passport Photo/Selfie",
      desc: "Recent photo or selfie taken during application (JPEG)",
    },
    {
      title: "Travel Itinerary",
      desc: "Flight details including arrival flight number and connections",
    },
    {
      title: "Accommodation Proof",
      desc: "Hotel booking confirmation or invitation letter if staying with friends",
    },
  ],
  importantNotes: [
    {
      type: "warning",
      title: "Yellow Fever Certificate",
      content: "Required if coming from endemic countries. Note: Required if traveling to Tanzania/other African countries after Kenya.",
    },
    {
      type: "info",
      title: "Group Applications",
      content: "Families with children under 18 should apply as a Group (max 9 people). Legal guardian must complete applications for minors.",
    },
    {
      type: "success",
      title: "Mobile App Available",
      content: "Download the 'Kenya Travel Authorization' mobile app to securely save documents and profile for future travel.",
    },
  ],
  exemptCountries: [
    "Tanzania", "Uganda", "Rwanda", "Burundi", "South Sudan", "Democratic Republic of Congo",
    "South Africa", "Botswana", "Ghana", "Zambia", "Zimbabwe", "Malawi", "Mozambique",
    "Mauritius", "Seychelles", "Barbados", "Jamaica", "Singapore", "Malaysia",
  ],
  faqs: [
    {
      question: "Do children need an ETA for Kenya?",
      answer: "Yes, all foreign visitors including infants and children must have an eTA. For children under 18, the legal guardian, parent or accompanying adult is responsible for filling in the application. Families can apply as a group (maximum 9 people).",
    },
    {
      question: "How long is the Kenya eTA valid?",
      answer: "The ETA is valid for 3 months from the date of issue. You must travel within this period. Once approved, you can stay up to 90 days in Kenya.",
    },
    {
      question: "Can I get a visa on arrival in Kenya?",
      answer: "No. As of January 2024, Kenya no longer issues visas on arrival for most nationalities. All visitors must obtain an approved eTA before travel through the official online portal.",
    },
    {
      question: "What if my ETA application is denied?",
      answer: "If denied, you will not be allowed to travel at that time. Contact support@etakenya.go.ke to report your situation and obtain further details. Do not reapply immediately without addressing the issues.",
    },
    {
      question: "Is the ETA a guarantee of entry?",
      answer: "No. An eTA is permission to travel to Kenya but does not guarantee entry. Immigration officers determine admissibility upon arrival. Ensure you have all required documents including return tickets and proof of funds.",
    },
    {
      question: "Can I extend my stay in Kenya?",
      answer: "Yes, you can apply for a visa extension at immigration offices in Kenya. However, it's recommended to plan your stay within the authorized 90-day period to avoid complications.",
    },
  ],
};

export default function ETAVisaPage() {
  const { formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState<TabValue>("how-to-apply");
  const [selectedCountry, setSelectedCountry] = useState<CountryValue>("kenya");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentData = selectedCountry === "tanzania" ? tanzaniaData : kenyaData;

  const handleCountryChange = (country: CountryValue) => {
    if (country === selectedCountry) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedCountry(country);
      setIsTransitioning(false);
    }, 200);
  };

  return (
    // <main className="min-h-screen bg-base-200">
    <>
      {/* Hero Section with Crossfade Background */}
      <Section className="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          {/* Tanzania Background */}
          <div 
            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
              selectedCountry === "tanzania" ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={tanzaniaData.heroImage}
              alt={tanzaniaData.heroAlt}
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
              src={kenyaData.heroImage}
              alt={kenyaData.heroAlt}
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
            <span className="text-white">{currentData.etaName} & Visa</span>
          </nav>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium mb-6">
            {currentData.name} {currentData.etaName} & Visa Guide
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto text-white/90">
            {currentData.description}
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

     
      {/* Quick Info Cards */}
      {/* <Section className="py-16 bg-base-200/50">
        <Container>
          <div 
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-300 ${
              isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
            }`}
          >
            {currentData.requirements.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="card bg-base-100 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-base-300"
                >
                  <div className="card-body">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                    <p className="text-base-content/70 text-sm">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </Section> */}

      {/* Main Content Tabs */}
      <Section className="-mt-10">
        <Container>
          <div className="space-y-10">
            <div
              role="tablist"
              className="tabs tabs-boxed grid w-full grid-cols-3 max-w-lg mx-auto bg-base-200 p-1 rounded-lg"
            >
              <button
                role="tab"
                className={`tab transition-all duration-200 ${activeTab === "requirements" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("requirements")}
              >
                Requirements
              </button>
              <button
                role="tab"
                className={`tab transition-all duration-200 ${activeTab === "visa-types" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("visa-types")}
              >
                {selectedCountry === "kenya" ? "ETA Types" : "Visa Types"}
              </button>
              <button
                role="tab"
                className={`tab transition-all duration-200 ${activeTab === "how-to-apply" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("how-to-apply")}
              >
                How to Apply
              </button>
            </div>

            <div 
              className={`transition-all duration-300 ${
                isTransitioning ? "opacity-0" : "opacity-100"
              }`}
            >
              {activeTab === "requirements" && (
                <div className="space-y-8 pt-10">
                  <div className="text-center max-w-2xl mx-auto mb-12">
                    <h2 className="font-serif text-3xl md:text-4xl font-medium mb-4">
                      {currentData.name} Requirements
                    </h2>
                    <p className="text-base-content/70">
                      Ensure you have all necessary documents ready before
                      starting your application.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="card bg-base-100 border border-base-300 shadow-md hover:shadow-lg transition-shadow">
                      <div className="card-body">
                        <h3 className="card-title flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-success" />
                          Required Documents
                        </h3>
                        <ul className="space-y-6 mt-4">
                          {currentData.requiredDocuments.map(({ title, desc }) => (
                            <li key={title} className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center shrink-0 mt-0.5">
                                <CheckCircle className="h-4 w-4 text-success" />
                              </div>
                              <div>
                                <p className="font-medium">{title}</p>
                                <p className="text-sm text-base-content/70">
                                  {desc}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="card bg-base-100 border border-base-300 shadow-md hover:shadow-lg transition-shadow">
                      <div className="card-body">
                        <h3 className="card-title flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-warning" />
                          Important Notes
                        </h3>
                        <div className="space-y-4 mt-4">
                          {currentData.importantNotes.map((note, index) => (
                            <div 
                              key={index} 
                              className={`p-4 rounded-lg border ${
                                note.type === "warning" ? "bg-warning/10 border-warning/30" :
                                note.type === "info" ? "bg-info/10 border-info/30" :
                                "bg-success/10 border-success/30"
                              }`}
                            >
                              <p className="text-sm text-base-content">
                                <strong>{note.title}:</strong> {note.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "visa-types" && (
                <div className="space-y-8 pt-10">
                  <div className="text-center max-w-2xl mx-auto mb-12">
                    <h2 className="font-serif text-3xl md:text-4xl font-medium mb-4">
                      {selectedCountry === "kenya" ? "eTA Types" : "Types of Visas"}
                    </h2>
                    <p className="text-base-content/70">
                      Choose the right {selectedCountry === "kenya" ? "authorization" : "visa"} type based on your travel purpose and
                      duration.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {currentData.visaTypes.map((visa) => (
                      <div
                        key={visa.type}
                        className="card bg-base-100 border border-base-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                      >
                        <div className="card-body">
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="font-semibold text-lg">{visa.type}</h3>
                            <span className="badge badge-warning badge-sm">
                              {visa.feeUsd != null ? formatPrice(visa.feeUsd) : visa.feeLabel ?? "—"}
                            </span>
                          </div>
                          <p className="text-base-content/70 mb-4">
                            {visa.description}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-base-content/70">
                            <Clock className="h-4 w-4 shrink-0" />
                            <span>Duration: {visa.duration}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="card bg-base-100 border border-base-300 mt-8">
                    <div className="card-body">
                      <h3 className="card-title flex items-center gap-2">
                        <Info className="h-5 w-5 text-info" />
                        Exempt Countries
                      </h3>
                      <p className="text-base-content/70 mb-4">
                        Citizens of the following countries do not require a {selectedCountry === "kenya" ? "eTA" : "visa"} for short stays:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {currentData.exemptCountries.map((country) => (
                          <span
                            key={country}
                            className="badge badge-ghost badge-md"
                          >
                            {country}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "how-to-apply" && (
                <div className="space-y-8 pt-10">
                  <div className="text-center max-w-2xl mx-auto mb-12">
                    <h2 className="font-serif text-3xl md:text-4xl font-medium mb-4">
                      How to Apply for {currentData.etaName}
                    </h2>
                    <p className="text-base-content/70">
                      Follow these simple steps to obtain your {currentData.etaName}.
                    </p>
                  </div>

                  <div className="max-w-3xl mx-auto">
                    <div className="space-y-6">
                      {currentData.applicationSteps.map((item, index) => (
                        <div key={item.step} className="flex gap-6">
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center font-semibold text-lg shadow-md">
                              {item.step}
                            </div>
                            {index < currentData.applicationSteps.length - 1 && (
                              <div className="w-0.5 flex-1 min-h-[24px] bg-accent/30 mt-2" />
                            )}
                          </div>
                          <div className="pb-8">
                            <h3 className="font-semibold text-lg mb-2">
                              {item.title}
                            </h3>
                            <p className="text-base-content/70">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-center mt-12">
                    <a
                      href={currentData.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-lg gap-2 hover:scale-105 transition-transform duration-200"
                    >
                      {currentData.officialLabel}
                      <ChevronRight className="h-4 w-4" />
                    </a>
                    <p className="text-sm text-base-content/70 mt-4">
                      Official {currentData.name} Government Portal
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Container>
      </Section>

      {/* FAQ Section */}
      <Section variant="secondary" className="py-16">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-medium mb-4">
              Frequently Asked Questions
            </h2>
            {/* <p className="text-base-content/70">
              Common questions about {currentData.name} {currentData.etaName} applications.
            </p> */}
          </div>

          <div 
            className={`max-w-3xl mx-auto space-y-5 transition-all duration-300 ${
              isTransitioning ? "opacity-0" : "opacity-100"
            }`}
          >
            {currentData.faqs.map((faq, index) => (
              <div
                key={index}
                className="collapse collapse-arrow bg-base-100 border border-base-300 rounded-lg hover:border-primary/50 transition-colors"
              >
                <input
                  type="radio"
                  name="faq-accordion"
                  defaultChecked={index === 0}
                  aria-label={faq.question}
                />
                <div className="collapse-title text-left font-medium">
                  {faq.question}
                </div>
                <div className="collapse-content text-base-content/70">
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA Section */}
<Section variant="primary">
  <Container>
    <div className="mx-auto max-w-3xl text-center">
      <h2 className="font-serif text-3xl font-bold text-primary-content text-balance sm:text-4xl">
        Need Help With Your {currentData.name} {currentData.etaName} Application?
      </h2>
      <p className="mt-4 text-lg leading-relaxed text-primary-content/80">
        Our team can assist you with the {currentData.etaName.toLowerCase()} application process and
        ensure all your documents are in order for a smooth arrival in {currentData.name}.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          href="/contact"
          className="btn btn-accent btn-lg gap-2 text-accent-content"
        >
          Contact Our Team <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/tours"
          className="btn btn-outline btn-lg border-primary-content/30 bg-primary-content/10 text-primary-content hover:bg-primary-content/20"
        >
          Browse Safari Tours
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
      </>
    // </main>
  );
}
