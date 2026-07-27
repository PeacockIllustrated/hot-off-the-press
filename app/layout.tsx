import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Masthead from "@/components/Masthead";
import SiteFooter from "@/components/SiteFooter";
import Splash from "@/components/Splash";
import { getSession } from "@/lib/session";

/*
 * Fonts are self-hosted from the @fontsource packages rather than fetched
 * from Google at build time, so a build never depends on a font CDN being
 * reachable. Headlines: Ultra, a fat-face poster serif — the inked wood
 * type of a Victorian front page. Furniture display: Archivo Black.
 * Reading: Source Serif 4. Numbers and short labels only: Courier Prime.
 */

const ultra = localFont({
  src: "../node_modules/@fontsource/ultra/files/ultra-latin-400-normal.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-ultra",
  display: "swap",
});

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
      className={`${ultra.variable} ${archivo.variable} ${sourceSerif.variable} ${courier.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col">
        {/*
         * Runs before the splash markup below is parsed: a repeat visit in
         * this session marks <html> as seen, and the CSS hides the splash
         * before it can flash. React never renders this attribute, hence
         * suppressHydrationWarning on <html>.
         */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{sessionStorage.getItem("hotp-splash-seen")==="1"&&document.documentElement.setAttribute("data-splash","seen")}catch(e){}`,
          }}
        />
        <Splash />
        <Masthead session={session} />
        <main className="flex-1">{children}</main>
        <SiteFooter />

        {/*
         * The press filter every headline is printed through: a touch of
         * fibre-displacement so edges sit on the paper rather than float
         * over it. Referenced from globals.css as filter: url(#ink-rough).
         */}
        <svg aria-hidden width="0" height="0" style={{ position: "absolute" }}>
          <filter id="ink-rough" x="-4%" y="-8%" width="108%" height="116%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.16 0.22"
              numOctaves="2"
              seed="11"
              result="fibre"
            />
            <feDisplacementMap in="SourceGraphic" in2="fibre" scale="2.2" />
          </filter>
        </svg>
      </body>
    </html>
  );
}
