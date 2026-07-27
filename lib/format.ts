/** Money is integer pence everywhere. It becomes a string only to be read. */
export function gbp(pence: number, opts: { pennies?: boolean } = {}): string {
  const showPennies = opts.pennies ?? pence % 100 !== 0;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: showPennies ? 2 : 0,
    maximumFractionDigits: showPennies ? 2 : 0,
  }).format(pence / 100);
}

export function pad(n: number, digits: number): string {
  return String(n).padStart(digits, "0");
}

export function thousands(n: number): string {
  return new Intl.NumberFormat("en-GB").format(n);
}

/** One-in-N odds for a given ticket count. */
export function oddsLine(tickets: number, cap: number): string {
  if (tickets <= 0) return "—";
  const one = cap / tickets;
  return `1 in ${new Intl.NumberFormat("en-GB", { maximumFractionDigits: one < 10 ? 1 : 0 }).format(one)}`;
}

export function ukDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  }).format(new Date(iso));
}

export function ukDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/London",
  }).format(new Date(iso));
}

export function ukTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  }).format(new Date(iso));
}

/** Splits milliseconds into the parts a countdown reads out. */
export function countdownParts(ms: number) {
  const clamped = Math.max(0, ms);
  const total = Math.floor(clamped / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    done: clamped <= 0,
  };
}
