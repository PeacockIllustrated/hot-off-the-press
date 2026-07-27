export type DrawStatus =
  | "draft"
  | "selling"
  | "closed"
  | "drawing"
  | "complete"
  | "void";

export type Draw = {
  id: string;
  draw_no: number;
  title: string;
  prize_headline: string;
  prize_detail: string | null;
  prize_value_pence: number;
  ticket_price_pence: number;
  ticket_cap: number;
  digit_count: number;
  status: DrawStatus;
  sales_open_at: string;
  sales_close_at: string;
  draw_at: string;
  stream_url: string | null;
  recording_url: string | null;
  winning_number: number | null;
  giveaway_cap_pct: string;
  spins_per_ticket: number;
  created_at: string;
  /* derived */
  sold: number;
  sold_paid: number;
  sold_free: number;
  giveaway_cap_tickets: number;
  winner_name: string | null;
};

export type WheelSegment = {
  label: string;
  tickets: number;
  weight_ppm: number;
};

export type Wheel = {
  id: string;
  name: string;
  segments: WheelSegment[];
  computed_ev: string;
  ev_ceiling_tickets: string;
  per_user_spin_cap: number;
};

export type PublicState = {
  server_time: string;
  selling: Draw | null;
  live: Draw | null;
  upcoming: Draw[];
  past: Draw[];
  wheel: Wheel | null;
  me: {
    spins_left: number;
    entries_in_selling: number;
    spins_used_this_draw: number;
  } | null;
};

export type Ball = { position: number; digit: number; drawn_at: string };

export type Attempt = {
  attempt: number;
  number: number | null;
  void_reason: string | null;
  completed_at: string | null;
  balls: Ball[];
};

export type LiveState = {
  server_time: string;
  draw: Draw;
  attempts: Attempt[];
  my_tickets: { n: number; source: string }[];
  recent_spins: {
    name: string;
    label: string;
    tickets: number;
    at: string;
  }[];
};

export type MyState = {
  server_time: string;
  spins_left: number;
  orders: {
    id: string;
    draw_no: number;
    draw_title: string;
    quantity: number;
    total_pence: number;
    created_at: string;
  }[];
  entries_by_draw: {
    draw_id: string;
    draw_no: number;
    title: string;
    status: DrawStatus;
    draw_at: string;
    digit_count: number;
    winning_number: number | null;
    tickets: { n: number; source: string }[];
  }[];
  spins: {
    label: string;
    tickets: number;
    roll: number;
    capped: boolean;
    at: string;
  }[];
};

export type AdminState = {
  server_time: string;
  draws: Draw[];
  wheels: (Wheel & { active: boolean; created_at: string })[];
  revenue_pence: number;
  audit: {
    action: string;
    detail: Record<string, unknown>;
    at: string;
    actor: string | null;
  }[];
};

export type SkillQuestion = {
  id: string;
  question: string;
  options: string[];
};

export type PurchaseResult = {
  order_id: string;
  quantity: number;
  total_pence: number;
  unit_price_pence: number;
  ticket_numbers: number[];
  spins_earned: number;
  digit_count: number;
};

export type SpinResult = {
  spin_id: string;
  segment_index: number;
  segment_label: string;
  tickets_awarded: number;
  ticket_numbers: number[];
  roll: number;
  capped: boolean;
  draw_id: string;
  spins_left: number;
  spins_used_this_draw: number;
  per_user_spin_cap: number;
};

export type BallResult = {
  attempt: number;
  position: number;
  digit: number;
  simulated: boolean;
  attempt_complete: boolean;
  number: number | null;
  void_reason: string | null;
  winner_profile_id: string | null;
  digit_count: number;
};
