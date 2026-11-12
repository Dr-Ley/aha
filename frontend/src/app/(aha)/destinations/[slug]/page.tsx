import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { destinations } from "@/lib/schema";
import { ensureSprint7Schema } from "@/server/database/ensure-sprint7";
import { Container, Section } from "@/components/layout";
import { listAttractionsForDestination } from "@/server/services/tourism/tourism-service";
import { withCanonical } from "@/lib/site-url";

async function getPublishedDestination(slug: string) {
  await ensureSprint7Schema();
  const [row] = await db
    .select()
    .from(destinations)
    .where(and(eq(destinations.slug, slug), eq(destinations.published, true)))
    .limit(1);
  return row ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dest = await getPublishedDestination(slug);
  if (!dest) return { title: "Destination", robots: { index: false, follow: false } };
  const path = dest.canonicalPath?.startsWith("/")
    ? dest.canonicalPath
    : `/destinations/${slug}`;
  return withCanonical(path, {
    title: dest.seoTitle || `${dest.name} | African Home Adventure`,
    description: dest.metaDescription || dest.description || undefined,
  });
}

export default async function DestinationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dest = await getPublishedDestination(slug);
  if (!dest) notFound();
  const attractions = await listAttractionsForDestination(dest.id);

  return (
    <>
      <section className="bg-primary py-12 lg:py-16">
        <Container>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">{dest.country}</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-primary-content sm:text-4xl">{dest.name}</h1>
          {dest.region ? <p className="mt-2 text-primary-content/70">{dest.region}</p> : null}
        </Container>
      </section>
      <Section>
        <Container className="max-w-3xl space-y-8">
          {dest.description ? <p className="text-lg leading-relaxed">{dest.description}</p> : null}
          {attractions.length > 0 ? (
            <div>
              <h2 className="font-serif text-2xl font-semibold">Highlights</h2>
              <ul className="mt-4 space-y-3">
                {attractions.map((item) => (
                  <li key={item.id} className="rounded-xl border border-base-content/10 p-4">
                    <p className="font-medium">{item.name}</p>
                    {item.description ? (
                      <p className="mt-1 text-sm text-base-content/70">{item.description}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <a className="btn btn-primary" href={`/plan-safari`}>
            Plan a safari here
          </a>
        </Container>
      </Section>
    </>
  );
}
