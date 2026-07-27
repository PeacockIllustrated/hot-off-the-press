import Link from "next/link";
import Image from "next/image";
import { DB_CONFIGURED } from "@/lib/config";

export default function SiteFooter() {
  return (
    <footer className="mt-16">
      <div className="h-1.5 bg-red" />
      <div className="bg-ink text-paper">
        {/* Colophon ----------------------------------------------------- */}
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <Image
            src="/brand/hotp-long-white.webp"
            alt="Hot Off The Press"
            width={389}
            height={120}
            className="h-12 w-auto mx-auto mb-6"
          />

          <p className="text-sm leading-relaxed text-paper/85 max-w-xl mx-auto">
            A real drum, in a real unit, on camera, with every number printed
            where you can check it. Tickets on sale now are for the next
            edition. Sales close on our server clock, before the drum turns.
          </p>
          <p className="text-sm leading-relaxed text-paper/60 mt-3 max-w-xl mx-auto">
            Free postal entry is available for every edition and carries the
            same chance as a paid ticket. Over 18s only. Please play sensibly.
          </p>

          <nav className="flex flex-wrap justify-center gap-x-7 gap-y-3 mt-8">
            <Link href="/how-it-works" className="label hover:text-red">
              How the draw works
            </Link>
            <Link href="/how-it-works#free" className="label hover:text-red">
              Free postal route
            </Link>
            <Link href="/how-it-works#wheel" className="label hover:text-red">
              Wheel odds
            </Link>
            <Link href="/draws" className="label hover:text-red">
              Past results
            </Link>
          </nav>
        </div>

        {/* Back-page strip ---------------------------------------------- */}
        <div className="border-t border-paper/20">
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap gap-x-6 gap-y-2 items-center justify-between">
            <p className="label text-paper/50">
              {DB_CONFIGURED
                ? "Prototype build — no real money is taken"
                : "Preview edition — sample data, no database connected"}
            </p>
            <div aria-hidden className="barcode h-6 w-28 text-paper/35" />
            <p className="label text-paper/50">Hot Off The Press</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
