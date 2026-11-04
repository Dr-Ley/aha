import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "react-email";

export type DesignedMessageProps = {
  companyName: string;
  logoUrl?: string;
  tagline: string;
  footerLines: string[];
  preheader: string;
  heading: string;
  greeting: string;
  paragraphs: string[];
  buttonLabel: string;
  buttonUrl: string;
};

const forest = "#2d5a3d";
const gold = "#d4a84b";
const ink = "#2a231c";
const muted = "#6b6560";
const paper = "#f5f0e8";

export function DesignedMessageEmail(props: DesignedMessageProps) {
  const heading = props.heading.trim() || props.companyName;
  const paragraphs = props.paragraphs.length > 0 ? props.paragraphs : ["Your message will appear here."];

  return (
    <Html lang="en">
      <Head />
      {props.preheader.trim() ? <Preview>{props.preheader.trim()}</Preview> : null}
      <Body style={{ backgroundColor: paper, margin: 0, padding: "24px 0", fontFamily: "Georgia, serif" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#ffffff" }}>
          <Section style={{ backgroundColor: forest, padding: "28px 32px" }}>
            {/* {props.logoUrl ? (
              <Img
                src={props.logoUrl}
                alt={props.companyName}
                width="140"
                height="72"
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  padding: "8px",
                  objectFit: "contain",
                  margin: "0 0 14px",
                }}
              />
            ) : null} */}
            <Text style={{ color: "#f5f0e8", fontSize: "20px", lineHeight: "28px", margin: 0 }}>
              {props.companyName}
            </Text>
            {props.tagline ? (
              <Text style={{ color: gold, fontSize: "13px", lineHeight: "20px", margin: "6px 0 0" }}>
                {props.tagline}
              </Text>
            ) : null}
          </Section>
          <Section style={{ padding: "32px" }}>
            <Heading as="h1" style={{ color: ink, fontSize: "26px", lineHeight: "34px", margin: "0 0 16px" }}>
              {heading}
            </Heading>
            <Text style={{ color: ink, fontSize: "16px", lineHeight: "26px", margin: "0 0 12px" }}>{props.greeting}</Text>
            {paragraphs.map((paragraph, paragraphIndex) => (
              <Text key={paragraphIndex} style={{ color: ink, fontSize: "16px", lineHeight: "26px", margin: "0 0 12px" }}>
                {paragraph.split("\n").map((line, index) => (
                  <span key={`${index}-${line}`}>
                    {index > 0 ? <br /> : null}
                    {line}
                  </span>
                ))}
              </Text>
            ))}
            {props.buttonLabel && props.buttonUrl ? (
              <Button
                href={props.buttonUrl}
                style={{
                  backgroundColor: forest,
                  color: "#f5f0e8",
                  borderRadius: "6px",
                  padding: "12px 20px",
                  fontSize: "15px",
                  textDecoration: "none",
                }}
              >
                {props.buttonLabel}
              </Button>
            ) : null}
          </Section>
          <Hr style={{ borderColor: "#e8dfd0", margin: 0 }} />
          <Section style={{ padding: "20px 32px 28px" }}>
            {props.footerLines.map((line) => (
              <Text key={line} style={{ color: muted, fontSize: "12px", lineHeight: "18px", margin: "0 0 4px" }}>
                {line}
              </Text>
            ))}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
