import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "joule.ai — Lower your electricity bill",
  description: "See your utility's peak hours and price per kWh, and how much you save by running appliances off-peak.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
