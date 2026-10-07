import { Container, Section } from "@/components/layout";
import { ItineraryViewer } from "@/components/itinerary-viewer";
import type { Metadata } from "next";
import { withCanonical } from "@/lib/site-url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  return withCanonical(`/itineraries/${token}`, {
    title: "Your safari itinerary | African Home Adventure",
    robots: { index: false, follow: false },
  });
}

export default async function ItineraryPublicPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <Section>
      <Container>
        <ItineraryViewer token={token} />
      </Container>
    </Section>
  );
}
