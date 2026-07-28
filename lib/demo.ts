import "server-only";

import { HotpError } from "./errors";
import type {
  AdminState,
  Attempt,
  BallResult,
  Draw,
  LiveState,
  MyState,
  PublicState,
  PurchaseResult,
  SkillQuestion,
  SpinResult,
  Wheel,
} from "./types";
import type { Session } from "./session";

/**
 * The preview dataset. When no database is configured (see lib/config.ts),
 * every rpc() call lands here instead of Postgres, so the whole build can be
 * viewed — and the client walkthrough performed — with nothing set up.
 *
 * It is honest about what it is: reads serve a seeded, realistic paper;
 * the demo sign-ins work; buying tickets, spinning the wheel and turning
 * the drum mutate in-memory state that lasts as long as the server process.
 * Nothing persists, and none of the fairness guarantees of the real
 * Postgres path (server randomness, EV triggers, atomic allocation) apply.
 */

const PUNTER: Session = {
  id: "demo-punter",
  email: "demo@hotoffthepress.co.uk",
  display_name: "Demo Punter",
  is_admin: false,
};
const ADMIN: Session = {
  id: "demo-admin",
  email: "admin@hotoffthepress.co.uk",
  display_name: "The Operator",
  is_admin: true,
};

const now = () => new Date().toISOString();
const hours = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();

/** Deterministic tickets for the punter: 60 numbers in Edition Thirteen. */
function seededTickets(count: number, max: number): number[] {
  let s = 987654321;
  const seen = new Set<number>();
  while (seen.size < count) {
    s = (s * 48271) % 2147483647;
    seen.add((s % max) + 1);
  }
  return [...seen].sort((a, b) => a - b);
}

const PUNTER_ED13 = seededTickets(60, 8214);

const WHEEL: Wheel = {
  id: "demo-wheel",
  name: "House wheel",
  segments: [
    { label: "Nothing", tickets: 0, weight_ppm: 400000 },
    { label: "+1", tickets: 1, weight_ppm: 150000 },
    { label: "Nothing", tickets: 0, weight_ppm: 240000 },
    { label: "+2", tickets: 2, weight_ppm: 80000 },
    { label: "Nothing", tickets: 0, weight_ppm: 100000 },
    { label: "+5", tickets: 5, weight_ppm: 25000 },
    { label: "+10", tickets: 10, weight_ppm: 5000 },
  ],
  computed_ev: "0.585",
  ev_ceiling_tickets: "0.600",
  per_user_spin_cap: 40,
};

const QUESTION: SkillQuestion = {
  id: "demo-q1",
  question: "How many balls go into the drum for every spin?",
  options: ["Ten", "Twelve", "Six", "Ninety-nine"],
};
const CORRECT_ANSWER = 0;

type DemoState = {
  /** Extra Edition 14 tickets sold this process (on top of the seed). */
  extraSold: number;
  /** The punter's Edition 14 tickets, bought or won this process. */
  punterEd14: { n: number; source: string }[];
  spinsLeft: number;
  spinsUsed: number;
  /** Edition 13's drum, mutable so the operator can turn it. */
  ed13: {
    status: Draw["status"];
    attempts: Attempt[];
    winning_number: number | null;
    winner_name: string | null;
  };
  orders: MyState["orders"];
  spins: MyState["spins"];
  audit: AdminState["audit"];
};

function initialState(): DemoState {
  return {
    extraSold: 0,
    punterEd14: [],
    spinsLeft: 12,
    spinsUsed: 3,
    ed13: {
      status: "drawing",
      winning_number: null,
      winner_name: null,
      attempts: [
        {
          attempt: 1,
          number: 9990,
          void_reason: "Number above tickets sold (8,214)",
          completed_at: hours(-0.4),
          balls: [
            { position: 1, digit: 9, drawn_at: hours(-0.55) },
            { position: 2, digit: 9, drawn_at: hours(-0.5) },
            { position: 3, digit: 9, drawn_at: hours(-0.45) },
            { position: 4, digit: 0, drawn_at: hours(-0.4) },
          ],
        },
        {
          attempt: 2,
          number: null,
          void_reason: null,
          completed_at: null,
          balls: [
            { position: 1, digit: 3, drawn_at: hours(-0.1) },
            { position: 2, digit: 7, drawn_at: hours(-0.05) },
          ],
        },
      ],
    },
    orders: [
      {
        id: "demo-order-1",
        draw_no: 13,
        draw_title: "Edition Thirteen",
        quantity: 60,
        total_pence: 6000,
        created_at: hours(-24 * 5),
      },
    ],
    spins: [
      { label: "+2", tickets: 2, roll: 861042, capped: false, at: hours(-24 * 4) },
      { label: "Nothing", tickets: 0, roll: 214981, capped: false, at: hours(-24 * 4) },
      { label: "+1", tickets: 1, roll: 476114, capped: false, at: hours(-24 * 5) },
    ],
    audit: [
      { action: "draw.open_sales", detail: { draw_no: 14 }, at: hours(-72), actor: "The Operator" },
      { action: "draw.close_sales", detail: { draw_no: 13 }, at: hours(-2), actor: "The Operator" },
      { action: "wheel.activate", detail: { name: "House wheel" }, at: hours(-24 * 9), actor: "The Operator" },
    ],
  };
}

/* Survives dev-server hot reloads; resets with the process, which is the point. */
const g = globalThis as typeof globalThis & { __hotpDemo?: DemoState };
function state(): DemoState {
  g.__hotpDemo ??= initialState();
  return g.__hotpDemo;
}

const baseDraw = {
  prize_detail: null,
  stream_url: null,
  recording_url: null,
  prize_image_url: null as string | null,
  giveaway_cap_pct: "5.0",
  spins_per_ticket: 1,
  created_at: hours(-24 * 30),
};

function sellingDraw(): Draw {
  const s = state();
  return {
    ...baseDraw,
    id: "demo-14",
    draw_no: 14,
    title: "Edition Fourteen",
    prize_headline: "A 65-inch OLED television",
    prize_detail:
      "This year's set, boxed and sealed, handed over on camera. Delivered to your door or collected from the unit — winner's choice.",
    prize_value_pence: 149900,
    prize_image_url: "/prizes/tv.jpg",
    ticket_price_pence: 100,
    ticket_cap: 9999,
    digit_count: 4,
    status: "selling",
    sales_open_at: hours(-72),
    sales_close_at: hours(50),
    draw_at: hours(52),
    winning_number: null,
    sold: 6741 + s.extraSold,
    sold_paid: 6538 + s.extraSold,
    sold_free: 203,
    giveaway_cap_tickets: 499,
    winner_name: null,
  };
}

function liveDraw(): Draw {
  const s = state();
  return {
    ...baseDraw,
    id: "demo-13",
    draw_no: 13,
    title: "Edition Thirteen",
    prize_headline: "This year's flagship phone",
    prize_value_pence: 99900,
    prize_image_url: "/prizes/phone.jpg",
    ticket_price_pence: 100,
    ticket_cap: 9999,
    digit_count: 4,
    status: s.ed13.status,
    sales_open_at: hours(-24 * 8),
    sales_close_at: hours(-2),
    draw_at: hours(-1),
    winning_number: s.ed13.winning_number,
    sold: 8214,
    sold_paid: 7902,
    sold_free: 312,
    giveaway_cap_tickets: 410,
    winner_name: s.ed13.winner_name,
  };
}

function pastDraws(): Draw[] {
  return [12, 11, 10].map((n, i) => ({
    ...baseDraw,
    id: `demo-${n}`,
    draw_no: n,
    title: `Edition ${n === 12 ? "Twelve" : n === 11 ? "Eleven" : "Ten"}`,
    prize_headline:
      n === 12
        ? "A next-gen games console"
        : n === 11
          ? "A proper espresso machine"
          : "Studio headphones, sealed",
    prize_value_pence: [44900, 37900, 24900][i],
    prize_image_url: [
      "/prizes/console.jpg",
      "/prizes/espresso.jpg",
      "/prizes/headphones.jpg",
    ][i],
    ticket_price_pence: [100, 50, 50][i],
    ticket_cap: 9999,
    digit_count: 4,
    status: "complete" as const,
    sales_open_at: hours(-24 * (14 + i * 7)),
    sales_close_at: hours(-24 * (8 + i * 7)),
    draw_at: hours(-24 * (7 + i * 7)),
    winning_number: [4271, 806, 1954][i],
    sold: [7811, 6204, 5433][i],
    sold_paid: [7500, 5990, 5200][i],
    sold_free: [311, 214, 233][i],
    giveaway_cap_tickets: 390,
    winner_name: [
      "Margaret H, Salford",
      "Dean W, Plymouth",
      "Ayesha K, Leeds",
    ][i],
  }));
}

const ED12_ATTEMPTS: Attempt[] = [
  {
    attempt: 1,
    number: 4271,
    void_reason: null,
    completed_at: hours(-24 * 7),
    balls: [1, 2, 3, 4].map((position, i) => ({
      position,
      digit: [4, 2, 7, 1][i],
      drawn_at: hours(-24 * 7),
    })),
  },
];

const RECENT_SPINS: LiveState["recent_spins"] = [
  { name: "Carl B", label: "+1", tickets: 1, at: hours(-0.2) },
  { name: "Priya S", label: "Nothing", tickets: 0, at: hours(-0.3) },
  { name: "Old Ted", label: "+2", tickets: 2, at: hours(-0.6) },
  { name: "Nadine F", label: "Nothing", tickets: 0, at: hours(-0.8) },
];

/* Handlers --------------------------------------------------------------- */

function publicState(args: Args): PublicState {
  const s = state();
  const me =
    args.p_profile_id === PUNTER.id
      ? {
          spins_left: s.spinsLeft,
          entries_in_selling: s.punterEd14.length,
          spins_used_this_draw: s.spinsUsed,
        }
      : null;
  const selling = sellingDraw();
  return {
    server_time: now(),
    selling,
    live: liveDraw(),
    upcoming: [selling],
    past: pastDraws(),
    wheel: WHEEL,
    me,
  };
}

function liveState(args: Args): LiveState {
  const s = state();
  const all = [liveDraw(), sellingDraw(), ...pastDraws()];
  const draw = all.find((d) => d.id === args.p_draw_id) ?? liveDraw();

  const attempts =
    draw.id === "demo-13"
      ? s.ed13.attempts
      : draw.id === "demo-12"
        ? ED12_ATTEMPTS
        : [];

  const my_tickets =
    args.p_profile_id !== PUNTER.id
      ? []
      : draw.id === "demo-13"
        ? PUNTER_ED13.map((n) => ({ n, source: "paid" }))
        : draw.id === "demo-14"
          ? s.punterEd14
          : [];

  return {
    server_time: now(),
    draw,
    attempts,
    my_tickets,
    recent_spins: RECENT_SPINS,
  };
}

function myState(args: Args): MyState {
  const s = state();
  if (args.p_profile_id !== PUNTER.id) {
    return {
      server_time: now(),
      spins_left: 0,
      orders: [],
      entries_by_draw: [],
      spins: [],
    };
  }

  const live = liveDraw();
  const entries: MyState["entries_by_draw"] = [];
  if (s.punterEd14.length > 0) {
    const selling = sellingDraw();
    entries.push({
      draw_id: selling.id,
      draw_no: selling.draw_no,
      title: selling.title,
      status: selling.status,
      draw_at: selling.draw_at,
      digit_count: selling.digit_count,
      winning_number: null,
      tickets: s.punterEd14,
    });
  }
  entries.push({
    draw_id: live.id,
    draw_no: live.draw_no,
    title: live.title,
    status: live.status,
    draw_at: live.draw_at,
    digit_count: live.digit_count,
    winning_number: live.winning_number,
    tickets: PUNTER_ED13.map((n) => ({ n, source: "paid" })),
  });
  const ed12 = pastDraws()[0];
  entries.push({
    draw_id: ed12.id,
    draw_no: ed12.draw_no,
    title: ed12.title,
    status: ed12.status,
    draw_at: ed12.draw_at,
    digit_count: ed12.digit_count,
    winning_number: ed12.winning_number,
    tickets: [312, 887, 5120, 7444].map((n) => ({ n, source: "paid" })),
  });

  return {
    server_time: now(),
    spins_left: s.spinsLeft,
    orders: s.orders,
    entries_by_draw: entries,
    spins: s.spins,
  };
}

function adminState(): AdminState {
  const s = state();
  const draws = [sellingDraw(), liveDraw(), ...pastDraws()];
  return {
    server_time: now(),
    draws,
    wheels: [{ ...WHEEL, active: true, created_at: hours(-24 * 9) }],
    revenue_pence: draws.reduce(
      (n, d) => n + d.sold_paid * d.ticket_price_pence,
      0,
    ),
    audit: s.audit,
  };
}

function login(args: Args): Session {
  const email = String(args.p_email ?? "").toLowerCase();
  const password = String(args.p_password ?? "");
  if (email === PUNTER.email && password === "demo1234") return PUNTER;
  if (email === ADMIN.email && password === "admin1234") return ADMIN;
  throw new HotpError(
    "HOTP_PREVIEW",
    "This preview runs without a database, so only the demo entrances work — use the one-click buttons.",
  );
}

function signup(args: Args): Session {
  const email = String(args.p_email ?? "").trim();
  if (!email) throw new HotpError("HOTP_BAD_INPUT", "An email is needed.");
  return {
    id: `demo-guest-${Math.random().toString(36).slice(2, 8)}`,
    email,
    display_name: String(args.p_display_name ?? "").trim() || "Reader",
    is_admin: false,
  };
}

function purchase(args: Args): PurchaseResult {
  const s = state();
  if (args.p_profile_id !== PUNTER.id) {
    throw new HotpError(
      "HOTP_PREVIEW",
      "In this preview only the demo punter can buy — use the one-click entrance on the sign-in page.",
    );
  }
  if (args.p_draw_id !== "demo-14") {
    throw new HotpError("HOTP_NOT_SELLING", "That edition is not on sale.");
  }
  const quantity = Number(args.p_quantity ?? 0);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 200) {
    throw new HotpError("HOTP_BAD_INPUT", "Between 1 and 200 tickets.");
  }
  if (Number(args.p_skill_answer_index) !== CORRECT_ANSWER) {
    throw new HotpError(
      "HOTP_WRONG_ANSWER",
      "That answer is wrong, so the entry was not accepted. Nothing has been charged.",
    );
  }

  const selling = sellingDraw();
  if (selling.sold + quantity > selling.ticket_cap) {
    throw new HotpError("HOTP_SOLD_OUT", "Not enough tickets left.");
  }

  const first = selling.sold + 1;
  const numbers = Array.from({ length: quantity }, (_, i) => first + i);
  s.extraSold += quantity;
  s.punterEd14.push(...numbers.map((n) => ({ n, source: "paid" })));
  s.spinsLeft += quantity * selling.spins_per_ticket;
  s.orders = [
    {
      id: `demo-order-${Date.now().toString(36)}`,
      draw_no: 14,
      draw_title: "Edition Fourteen",
      quantity,
      total_pence: quantity * selling.ticket_price_pence,
      created_at: now(),
    },
    ...s.orders,
  ];

  return {
    order_id: s.orders[0].id,
    quantity,
    total_pence: quantity * selling.ticket_price_pence,
    unit_price_pence: selling.ticket_price_pence,
    ticket_numbers: numbers,
    spins_earned: quantity * selling.spins_per_ticket,
    digit_count: selling.digit_count,
  };
}

function spin(args: Args): SpinResult {
  const s = state();
  if (args.p_profile_id !== PUNTER.id) {
    throw new HotpError(
      "HOTP_PREVIEW",
      "In this preview only the demo punter has spins — use the one-click entrance on the sign-in page.",
    );
  }
  if (s.spinsUsed >= WHEEL.per_user_spin_cap) {
    throw new HotpError("HOTP_SPIN_CAP", "Spin limit reached for this edition.");
  }
  if (s.spinsLeft < 1) {
    throw new HotpError("HOTP_NO_SPINS", "No spins in hand.");
  }

  /*
   * Math.random, openly: the real path decides outcomes in Postgres with
   * gen_random_bytes. This is a preview of the interface, not of the odds.
   */
  const roll = Math.floor(Math.random() * 1_000_000) + 1;
  let cursor = 0;
  let index = WHEEL.segments.length - 1;
  for (let i = 0; i < WHEEL.segments.length; i++) {
    cursor += WHEEL.segments[i].weight_ppm;
    if (roll <= cursor) {
      index = i;
      break;
    }
  }
  const segment = WHEEL.segments[index];

  const selling = sellingDraw();
  const first = selling.sold + 1;
  const numbers = Array.from({ length: segment.tickets }, (_, i) => first + i);
  s.extraSold += segment.tickets;
  s.punterEd14.push(...numbers.map((n) => ({ n, source: "wheel" })));
  s.spinsLeft -= 1;
  s.spinsUsed += 1;
  s.spins = [
    { label: segment.label, tickets: segment.tickets, roll, capped: false, at: now() },
    ...s.spins,
  ];

  return {
    spin_id: `demo-spin-${Date.now().toString(36)}`,
    segment_index: index,
    segment_label: segment.label,
    tickets_awarded: segment.tickets,
    ticket_numbers: numbers,
    roll,
    capped: false,
    draw_id: "demo-14",
    spins_left: s.spinsLeft,
    spins_used_this_draw: s.spinsUsed,
    per_user_spin_cap: WHEEL.per_user_spin_cap,
  };
}

function recordBall(args: Args): BallResult {
  const s = state();
  if (args.p_draw_id !== "demo-13") {
    throw new HotpError(
      "HOTP_PREVIEW",
      "In this preview only Edition Thirteen can be drawn.",
    );
  }
  if (s.ed13.status === "complete") {
    throw new HotpError("HOTP_DONE", "Edition Thirteen has been drawn.");
  }
  s.ed13.status = "drawing";

  let attempt = s.ed13.attempts[s.ed13.attempts.length - 1];
  if (!attempt || attempt.completed_at) {
    attempt = {
      attempt: (attempt?.attempt ?? 0) + 1,
      number: null,
      void_reason: null,
      completed_at: null,
      balls: [],
    };
    s.ed13.attempts.push(attempt);
  }

  const given = args.p_digit;
  const digit =
    given === null || given === undefined
      ? Math.floor(Math.random() * 10)
      : Number(given) % 10;
  const position = attempt.balls.length + 1;
  attempt.balls.push({ position, digit, drawn_at: now() });

  const complete = position === 4;
  let number: number | null = null;
  let void_reason: string | null = null;
  let winner: string | null = null;

  if (complete) {
    number = Number(attempt.balls.map((b) => b.digit).join(""));
    attempt.number = number;
    attempt.completed_at = now();
    const sold = liveDraw().sold;
    if (number === 0) {
      void_reason = "0000 is not a ticket";
    } else if (number > sold) {
      void_reason = `Number above tickets sold (${sold.toLocaleString("en-GB")})`;
    }
    attempt.void_reason = void_reason;

    if (!void_reason) {
      s.ed13.status = "complete";
      s.ed13.winning_number = number;
      s.ed13.winner_name = PUNTER_ED13.includes(number)
        ? "Demo Punter"
        : "R Hartley, Hull";
    }
  }

  return {
    attempt: attempt.attempt,
    position,
    digit,
    simulated: true,
    attempt_complete: complete,
    number,
    void_reason,
    winner_profile_id:
      complete && !void_reason && PUNTER_ED13.includes(number ?? -1)
        ? PUNTER.id
        : null,
    digit_count: 4,
  };
}

function resetDemo(): null {
  g.__hotpDemo = initialState();
  g.__hotpDemo.ed13.status = "closed";
  g.__hotpDemo.ed13.attempts = [];
  return null;
}

function previewOff(what: string): never {
  throw new HotpError(
    "HOTP_PREVIEW",
    `This preview runs without a database, so ${what} is switched off here. Browsing, the demo sign-ins, buying and the drum all still work.`,
  );
}

type Args = Record<string, unknown>;

const handlers: Record<string, (args: Args) => unknown> = {
  hotp_public_state: publicState,
  hotp_skill_question: () => QUESTION,
  hotp_live_state: liveState,
  hotp_my_state: myState,
  hotp_admin_state: adminState,
  hotp_login: login,
  hotp_signup: signup,
  hotp_purchase: purchase,
  hotp_spin: spin,
  hotp_admin_record_ball: recordBall,
  hotp_admin_reset_demo: resetDemo,
  hotp_admin_set_draw: () => previewOff("editing a draw"),
  hotp_admin_save_wheel: () => previewOff("saving a wheel"),
  hotp_postal_entry: () => previewOff("postal entry"),
};

export function demoRpc<T>(fn: string, args: Args): T {
  const handler = handlers[fn];
  if (!handler) {
    throw new HotpError("HOTP_UNKNOWN", `No preview handler for ${fn}.`);
  }
  return handler(args) as T;
}
