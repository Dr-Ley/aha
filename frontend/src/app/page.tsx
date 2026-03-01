"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from 'react';
import {
  Star,
  ArrowRight,
  Shield,
  Compass,
  Binoculars,
  Car,
  Phone,
  Mail,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Container, Section } from "@/components/layout";
import { TourCard } from "@/components/tour-card";
import { tours, testimonials, destinations } from "@/lib/data";

function HeroSection() {
  return (
    <section className="relative flex min-h-[90vh] items-center overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1519659528534-7fd733a832a0?q=80&w=1026&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="African savanna at golden hour with elephants and acacia trees"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-foreground/20" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-6 py-32">
        <div className="max-w-2xl">
        <span className="badge badge-accent mb-6 text-xs px-2 font-semibold uppercase tracking-wider">
          KATO Certified Tour Operator
        </span>
          <h1 className="font-serif text-4xl font-bold leading-tight text-white text-balance sm:text-5xl lg:text-6xl">
            Your Next Great Adventure Starts in Africa
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/90">
            Experience the magic of Kenya and Tanzania with expertly guided
            safaris. Over 25 years creating unforgettable wildlife adventures
            across East Africa with African Home Adventure.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
  <Link
    href="/tours"
    className="btn btn-accent btn-lg gap-2"
  >
    Explore Safaris <ArrowRight className="h-4 w-4" />
  </Link>
  <Link
    href="/contact"
    className="btn btn-outline btn-lg border-white text-white hover:bg-white hover:text-black"
  >
    Get a Free Quote
  </Link>
</div>

          <div className="mt-12 flex flex-wrap gap-8">
            {[
              { value: "25+", label: "Years Experience" },
              { value: "5,000+", label: "Happy Travelers" },
              { value: "4.9", label: "Average Rating" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-white/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <Section className="relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        {/* Mobile */}
        <Image
          src="/BACKGROUND_image_mobile.png"
          alt="Background"
          fill
          className="object-cover md:hidden"
          priority
        />

        {/* Tablet/Desktop */}
        <Image
          src="/BACKGROUND_img.png"
          alt="Background"
          fill
          className="hidden md:block object-cover"
          priority
        />
      </div>
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0" />
      
      <Container className="relative z-10">
        <div className="mx-auto max-w-3xl text-center">
        <p className="text-lg font-semibold mb-2 uppercase tracking-widest text-accent">
            we've got you covered
          </p>
          <h2 className="font-serif text-3xl font-bold text-base-content backdrop-blur-sm text-balance sm:text-4xl">
            Planning a Safari Shouldn't Feel Like a Gamble
          </h2>
          <p className="mt-4 pt-4 max-w-xl mx-auto text-base-content/80">
            You've dreamed of seeing the Big Five, but finding a trustworthy operator from abroad feels overwhelming. 
            Hidden fees, safety concerns, and worrying about sending money overseas to someone you've never met.
          </p>
          
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              { 
                title: "Fear of Scams", 
                desc: "Stories of operators disappearing with deposits",
                icon: "🚨"
                
              },
              { 
                title: "Hidden Costs", 
                desc: "Park fees and extras that blow your budget",
                icon: "💸"
              },
              { 
                title: "Complex Planning", 
                desc: "Too many options, conflicting advice online",
                icon: "😵‍💫"
              }
            ].map((item) => (
              <div 
                key={item.title} 
                className="group rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm transition-all hover:bg-white/20 hover:border-white/30 hover:-translate-y-1"
              >
                <span className="text-3xl">{item.icon}</span>
                <h3 className="mt-3 font-serif text-lg font-semibold text-gray">{item.title}</h3>
                <p className="mt-2 text-sm text-base-content/80">{item.desc}</p>
              </div>
            ))}
          </div>
          
          <p className="mt-8 text-base-content/80">
            <strong className=" backdrop-blur-xs text-black">We understand.</strong> For 25+ years, we've helped travelers navigate these exact concerns.
          </p>
        </div>
      </Container>
    </Section>
  );
}

function PlanSection() {
  const steps = [
    {
      step: "1",
      title: "Browse & Customize",
      desc: "Explore our proven itineraries, then customize with our experts via WhatsApp. Get a response within 24 hours."
    },
    {
      step: "2", 
      title: "Book with Confidence",
      desc: "Secure your spot with a small deposit. Pay the balance on arrival. Full transparency on pricing—no hidden fees."
    },
    {
      step: "3",
      title: "Experience & Enjoy",
      desc: "Arrive to find everything arranged. 24/7 support, expert guides, and the safari you've been dreaming of."
    }
  ];

  return (
    <Section variant="secondary">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-lg font-semibold uppercase tracking-widest text-accent">
            Plan with ease
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-base-content text-balance sm:text-4xl">
            From Dream to Safari in 3 Easy Steps
          </h2>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.step} className="relative">
              {i < steps.length - 1 && (
                <div className="absolute top-8 left-full hidden h-0.5 w-full bg-accent/30 md:block" />
              )}
              <div className="flex flex-col items-center text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-2xl font-bold text-white">
                  {s.step}
                </span>
                <h3 className="mt-4 font-serif text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-base-content/70">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-10 text-center">
          <Link href="/tours" className="btn btn-primary btn-lg">
            Start Step 1 - Browse Safaris
          </Link>
        </div>
      </Container>
    </Section>
  );
}





function FeaturedToursSection() {
  const featuredTours = tours.filter((t) => t.featured);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320; // Approximate card width + gap
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <Section>
      <Container>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-lg font-semibold uppercase tracking-widest text-accent">
              Handpicked Experiences
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-base-content text-balance sm:text-4xl">
              Featured Safari Tours
            </h2>
            <p className="mt-3 max-w-xl leading-relaxed text-base-content/70">
              Our most popular and highly-rated safari packages, carefully
              designed to showcase the best of East African wildlife and
              landscapes. Choose your adventure, then let us perfect the details for you.
            </p>
          </div>
          <Link
            href="/tours"
            className="btn btn-outline btn-sm shrink-0 gap-1"
          >
            View All Tours <ChevronRight className="h-4 w-4" />
          </Link>
        </div>


        {/* Horizontal scrollable row */}
        <div className="mt-12 relative">
          {/* Navigation arrows */}
          <button
            onClick={() => scroll('left')}
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 btn btn-circle btn-sm bg-base-100 shadow-md hover:bg-base-200 lg:flex"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => scroll('right')}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 btn btn-circle btn-sm bg-base-100 shadow-md hover:bg-base-200 md:flex lg:flex"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Scrollable container */}
          <div className="mt-2 text-center text-sm mb-5 text-base-content/50 md:hidden lg:hidden">
            ← Tap to play →
          </div>
          <div 
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 px-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {featuredTours.map((tour) => (
              <div 
                key={tour.id} 
                className="shrink-0 snap-start w-72 sm:w-80"
              >
                <TourCard tour={tour} />
              </div>
            ))}
          </div>

          {/* Scroll hint for mobile */}
          <div className="lg:hidden mt-2 text-center text-sm text-base-content/50">
            ← Swipe to explore →
          </div>
        </div>
      </Container>
    </Section>
  );
}


function WhyChooseSection() {
  const features = [
    {
      icon: Shield,
      title: "Licensed & Certified",
      description:
        "KATO member FE/459 with Ministry of Tourism registration. Your holiday is fully protected under the KATO bonding scheme.",
    },
    {
      icon: Car,
      title: "Own Fleet of 4x4 Vehicles",
      description:
        "No middlemen. We own our safari Land Cruisers and deal directly with camps, lodges, and park authorities for better prices.",
    },
    {
      icon: Compass,
      title: "Expert Driver Guides",
      description:
        "Highly trained, experienced, and multilingual guides who know where to find the wildlife you want to see.",
    },
    {
      icon: Binoculars,
      title: "Tailor-Made Safaris",
      description:
        "Every itinerary is customized to your preferences, budget, and pace. Private tours with full flexibility at competitive prices.",
    },
  ];

  return (
    <Section variant="secondary">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-lg font-semibold uppercase tracking-widest text-accent">
            Why African Home Adventure
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-base-content text-balance sm:text-4xl">
            Book with Confidence
          </h2>
          <p className="mt-3 leading-relaxed text-base-content/70">
            Over two decades of crafting exceptional safari experiences across
            Kenya and Tanzania, serving clients from the UK, USA, EU, Australia,
            and Asia.
          </p>
        </div>

        {/* Horizontal scrollable row */}
        <div className="mt-14 relative">
          <div 
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 px-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {features.map((f) => (
              <div
                key={f.title}
                className="shrink-0 snap-start w-72 sm:w-80"
              >
                <div className="flex flex-col items-start rounded-xl border border-base-content/10 bg-base-100 p-6 shadow-sm h-full">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 font-serif text-lg font-semibold text-base-content">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-base-content/70">
                    {f.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Scroll hint for mobile */}
          <div className="mt-2 text-center text-sm text-base-content/50 lg:hidden">
            ← Swipe to explore →
          </div>
        </div>
      </Container>
    </Section>
  );
}

function ExperienceSection() {
  return (
    <Section>
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
            <Image
              src="https://i.pinimg.com/1200x/e0/04/a0/e004a036edb305dc40e8bae5fe98257e.jpg"
              alt="Safari 4x4 Land Cruiser on game drive in the African savanna"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              loading="lazy"
            />
          </div>

          <div>
            <p className="text-lg font-semibold uppercase tracking-widest text-accent">
              The Safari Experience
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-base-content text-balance sm:text-4xl">
              A Day on Safari in East Africa
            </h2>
            <div className="mt-6 space-y-4 leading-relaxed text-base-content/70">
              <p>
                Your days on safari begin with a quiet African voice waking you
                well before sunrise. After an early morning coffee, you head out
                for hours in a safari vehicle as your driver guide leads the way
                looking for wildlife.
              </p>
              <p>
                You return to the lodge mid-morning for breakfast, then relax
                through the hottest part of the day. Afternoon tea around 3 PM
                signals another game drive, watching the reserve come alive as
                golden hour approaches.
              </p>
              <p>
                Just before sunset, enjoy the legendary &ldquo;Sundowner&rdquo;
                experience, watching the African sunset with a drink of your
                choice, before returning to your lodge for dinner under the
                stars.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/tours" className="btn btn-primary">
                Browse All Safaris
              </Link>
              <Link href="/contact" className="btn btn-outline">
                Plan My Trip
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function TestimonialsSection() {
  return (
    <Section variant="secondary">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-lg font-semibold uppercase tracking-widest text-accent">
            Traveler Stories
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-base-content text-balance sm:text-4xl">
            What Our Guests Say
          </h2>
        </div>

        {/* Horizontal scrollable testimonials */}
        <div className="mt-12 relative">
          <div 
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 px-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {testimonials.slice(0, 6).map((t) => (
              <figure
                key={t.id}
                className="shrink-0 snap-start w-80 sm:w-96 flex flex-col rounded-xl border border-base-content/10 bg-base-100 p-6 shadow-sm"
              >
                <div className="mb-3 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < t.rating
                          ? "fill-accent text-accent"
                          : "fill-base-content/20 text-base-content/20"
                      }`}
                    />
                  ))}
                </div>
                <blockquote className="flex-1 text-sm leading-relaxed text-base-content/70">
                  &ldquo;{t.text}&rdquo;
                </blockquote>
                <figcaption className="mt-4 flex items-center gap-3 border-t border-base-content/10 pt-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-content text-sm font-semibold">
                    {t.avatar}
                  </div>
                  
                  <div>
                    <p className="text-sm font-semibold text-base-content">
                      {t.name}
                    </p>
                    <p className="text-xs text-base-content/60">
                      {t.country} — {t.tour}
                    </p>
                    
                  </div>
                  
                </figcaption>
              </figure>
            ))}
          </div>
          
          {/* Scroll hint for mobile */}
          <div className="mt-2 text-center text-sm text-base-content/50 lg:hidden">
            ← Swipe to see more →
          </div>
        </div>
      </Container>
    </Section>
  );
}

function StakesSection() {
  return (
    <Section className="relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        {/* Mobile */}
        <Image
          src="/BACKGROUND_image_mobile.png"
          alt="Background"
          fill
          className="object-cover md:hidden"
          priority
        />

        {/* Tablet/Desktop */}
        <Image
          src="/BACKGROUND_img.png"
          alt="Background"
          fill
          className="hidden md:block object-cover"
          priority
        />
      </div>
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0" />
      
      <Container className="relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-lg font-semibold mb-2 uppercase tracking-widest text-accent">
            Heads up!
          </p>
          <h2 className="font-serif pb-4 text-2xl font-bold text-base-content  backdrop-blur-xs sm:text-3xl">
            Don't Let These Common Safari Mistakes Ruin Your Trip
          </h2>
          <div className="mt-6 grid pb-2 gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-base-100 p-4 text-left">
              <p className="text-sm text-base-content/70">
                ❌ <strong>Booking with unlicensed operators</strong> who disappear with your deposit
              </p>
            </div>
            <div className="rounded-lg bg-base-100 p-4 text-left">
              <p className="text-sm text-base-content/70">
                ❌ <strong>Hidden park fees</strong> that double your expected cost on arrival
              </p>
            </div>
            <div className="rounded-lg bg-base-100 p-4 text-left">
              <p className="text-sm text-base-content/70">
                ❌ <strong>Wrong season timing</strong>—missing the migration by weeks
              </p>
            </div>
            <div className="rounded-lg bg-base-100 p-4 text-left">
              <p className="text-sm text-base-content/70">
                ❌ <strong>Overcrowded group tours</strong> with no flexibility
              </p>
            </div>
          </div>
          <p className="mt-6 backdrop-blur-xs text-base-content/80">
            We've seen these mistakes cost travelers thousands. <strong>Our 25 years of experience protects you from them.</strong>
          </p>
        </div>
      </Container>
    </Section>
  );
}

function CTASection() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1634646350433-fe03ad698448?q=80&w=1334&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Beautiful Zanzibar beach with crystal clear water"
          fill
          className="object-cover"
          sizes="100vw"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-foreground/50" />
      </div>

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-serif text-3xl font-bold text-white text-balance sm:text-4xl lg:text-5xl">
          Ready to Experience the Magic of Africa?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-white/80">
          Let us design your perfect safari. Share your travel dates and
          preferences, and we will craft a personalized itinerary just for you.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/contact"
            className="btn btn-accent btn-lg gap-2 text-accent-content"
          >
            Get a Free Quote <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/tours"
            className="btn btn-outline btn-lg border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/50 hover:text-white"
          >
            Browse Safaris
          </Link>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-white/70">
          <a
            href="tel:+254722760661"
            className="flex items-center gap-2 transition-colors hover:text-white"
          >
            <Phone className="h-4 w-4" /> +254 722 760 661
          </a>
          <a
            href="mailto:info@africahomeadventure.com"
            className="flex items-center gap-2 transition-colors hover:text-white"
          >
            <Mail className="h-4 w-4" /> info@africahomeadventure.com
          </a>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ProblemSection />
      <PlanSection />
      <FeaturedToursSection />
      <WhyChooseSection />
      <ExperienceSection />
      <TestimonialsSection />
      <StakesSection />
      <CTASection />
    </>
  );
}
