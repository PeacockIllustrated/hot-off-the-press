import Link from "next/link";
import Image from "next/image";

export default function SiteFooter() {
  return (
    <footer className="bg-ink text-paper mt-16">
      <div className="h-1.5 bg-red" />
      <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 md:grid-cols-[auto_1fr_auto]">
        <div>
          <Image
            src="/brand/hotp-long-white.webp"
            alt="Hot Off The Press"
            width={389}
            height={120}
            className="h-12 w-auto"
          />
        </div>

        <div className="max-w-md">
          <p className="text-sm leading-relaxed text-paper/85">
            A real drum, in a real unit, on camera, with every number printed
            where you can check it. Tickets on sale now are for the next
            edition. Sales close on our server clock, before the drum turns.
          </p>
          <p className="text-sm leading-relaxed text-paper/60 mt-4">
            Free postal entry is available for every edition and carries the
            same chance as a paid ticket. Over 18s only. Please play sensibly.
          </p>
        </div>

        <nav className="flex flex-col gap-2">
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

      <div className="border-t border-paper/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap gap-x-6 gap-y-2 justify-between">
          <p className="label text-paper/50">
            Prototype build — no real money is taken
          </p>
          <p className="label text-paper/50">Hot Off The Press</p>
        </div>
      </div>
    </footer>
  );
}
