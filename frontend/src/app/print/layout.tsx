import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Print document",
  robots: { index: false, follow: false },
};

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
      {children}
    </>
  );
}
