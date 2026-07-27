import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Masthead from "@/components/Masthead";
import SiteFooter from "@/components/SiteFooter";
import { getSession } from "@/lib/session";

/*
 * Fonts are self-hosted from the @fontsource packages rather than fetched
 * from Google at build time, so a build never depends on a font CDN being
 * reachable. Display: Archivo Black. Reading: Source Serif 4. Numbers and
 * short labels only: Courier Prime.
 */

const archivo = localFont({
  src: "../node_modules/@fontsource/archivo-black/files/archivo-black-latin-400-normal.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-archivo",
  display: "swap",
});

const sourceSerif = localFont({
  src: [
    {
      path: "../node_modules/@fontsource-variable/source-serif-4/files/source-serif-4-latin-wght-normal.woff2",
      weight: "200 900",
      style: "normal",
    },
    {
      path: "../node_modules/@fontsource-variable/source-serif-4/files/source-serif-4-latin-wght-italic.woff2",
      weight: "200 900",
      style: "italic",
    },
  ],
  variable: "--font-source-serif",
  display: "swap",
});

const courier = localFont({
  src: [
    {
      path: "../node_modules/@fontsource/courier-prime/files/courier-prime-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../node_modules/@fontsource/courier-prime/files/courier-prime-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-courier",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hot Off The Press — a real drum, on camera, every number printed",
  description:
    "A live-streamed physical prize draw. Tickets are sold for the next edition; the drum decides the current one, on camera, digit by digit.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();

  return (
    <html
      lang="en-GB"
      className={`${archivo.variable} ${sourceSerif.variable} ${courier.variable}`}
    >
      <body className="min-h-screen flex flex-col">
        <Masthead session={session} />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
