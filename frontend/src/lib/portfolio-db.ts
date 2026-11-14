import { neonPool } from "@/lib/neon";

const COMPANY_ID = "solutions";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS portfolio_companies (
  id varchar(32) PRIMARY KEY,
  name varchar(160) NOT NULL,
  email varchar(255) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS portfolio_enquiries (
  id serial PRIMARY KEY,
  company_id varchar(32) NOT NULL REFERENCES portfolio_companies(id),
  full_name varchar(160),
  business_name varchar(160) NOT NULL,
  email varchar(255) NOT NULL,
  presence text,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS portfolio_enquiries_company_idx ON portfolio_enquiries (company_id, created_at DESC);
`;

type GlobalPortfolio = typeof globalThis & { __portfolioReady?: Promise<void> };

export type PortfolioEnquiryInput = {
  fullName: string;
  businessName: string;
  email: string;
  presence: string;
  message: string;
};

async function ready(): Promise<void> {
  const g = globalThis as GlobalPortfolio;
  if (!g.__portfolioReady) {
    g.__portfolioReady = (async () => {
      const client = await neonPool().connect();
      try {
        await client.query(SCHEMA);
        await client.query(
          `INSERT INTO portfolio_companies (id, name, email)
           VALUES ($1, $2, $3)
           ON CONFLICT (id) DO NOTHING`,
          [COMPANY_ID, "Solutions Architect", "bradleyouko911@gmail.com"]
        );
      } finally {
        client.release();
      }
    })().catch((error) => {
      g.__portfolioReady = undefined;
      throw error;
    });
  }
  await g.__portfolioReady;
}

export async function savePortfolioEnquiry(input: PortfolioEnquiryInput): Promise<{ id: number }> {
  await ready();
  const result = await neonPool().query(
    `INSERT INTO portfolio_enquiries (company_id, full_name, business_name, email, presence, message)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      COMPANY_ID,
      input.fullName || null,
      input.businessName,
      input.email,
      input.presence || null,
      input.message,
    ]
  );
  return { id: Number(result.rows[0].id) };
}
