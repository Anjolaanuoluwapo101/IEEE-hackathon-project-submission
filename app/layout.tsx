import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/ui/Header";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["500"],
});

export const metadata: Metadata = {
  title: "CircuLagos - Carbon Credit Verification",
  description: "Verify waste recycling and trade carbon credits on-chain",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] antialiased">
        <Header />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
