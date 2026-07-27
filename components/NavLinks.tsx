"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; flag?: boolean };

export default function NavLinks({ items }: { items: Item[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-stretch">
      {items.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={[
              "label px-4 py-3 border-r-2 border-ink transition-colors",
              active
                ? "bg-ink text-paper"
                : "text-ink hover:bg-ink hover:text-paper",
            ].join(" ")}
          >
            <span className="inline-flex items-center gap-2">
              {item.flag && (
                <span
                  aria-hidden
                  className="inline-block w-2 h-2 rounded-full lamp-on"
                />
              )}
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
