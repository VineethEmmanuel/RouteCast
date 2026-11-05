import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "RouteCast — Weather-Aware Logistics & Truck Routing",
  description:
    "Intelligent weather-aware logistics platform evaluating wind speed, rainfall, snowfall, and truck cargo weight for optimal fleet safety.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-[#F7F8FA] text-[#17212B] min-h-screen antialiased selection:bg-[#E6F3F5] selection:text-[#087E8B]`}
      >
        {children}
      </body>
    </html>
  );
}
