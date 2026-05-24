import type { RsvpStatus, GuestSide, TableShape, BudgetStatus } from "./types";
import { plannerText } from "./plannerTextConfig";

export const RSVP_LABELS: Record<RsvpStatus, string> = {
  invited: plannerText.rsvp.invited,
  coming: plannerText.rsvp.coming,
  not_coming: plannerText.rsvp.not_coming,
  waiting: plannerText.rsvp.waiting,
  maybe: plannerText.rsvp.maybe,
};

export const RSVP_COLORS: Record<RsvpStatus, string> = {
  invited: "#2563eb",
  coming: "#1F9D63",
  not_coming: "#D95B5B",
  waiting: "#C88420",
  maybe: "#7c3aed",
};

export const RSVP_BG_COLORS: Record<RsvpStatus, string> = {
  invited: "#EEF4FF",
  coming: "#E6F7EF",
  not_coming: "#FEF0EF",
  waiting: "#FEF6E8",
  maybe: "#F3EEFF",
};

export const SIDE_LABELS: Record<GuestSide, string> = {
  bride: plannerText.guestSide.bride,
  groom: plannerText.guestSide.groom,
  both: plannerText.guestSide.both,
  other: plannerText.guestSide.other,
};

export const SHAPE_LABELS: Record<TableShape, string> = {
  circle: plannerText.tableShapes.circle,
  square: plannerText.tableShapes.square,
  rectangle: plannerText.tableShapes.rectangle,
  long: plannerText.tableShapes.long,
  oval: plannerText.tableShapes.oval,
  head: plannerText.tableShapes.head,
};

export const BUDGET_STATUS_LABELS: Record<BudgetStatus, string> = {
  planned: plannerText.budgetStatus.planned,
  deposit_paid: plannerText.budgetStatus.deposit_paid,
  partially_paid: plannerText.budgetStatus.partially_paid,
  paid: plannerText.budgetStatus.paid,
  overdue: plannerText.budgetStatus.overdue,
  cancelled: plannerText.budgetStatus.cancelled,
};

export const BUDGET_STATUS_COLORS: Record<BudgetStatus, string> = {
  planned: "#6B7280",
  deposit_paid: "#C88420",
  partially_paid: "#f59e0b",
  paid: "#1F9D63",
  overdue: "#D95B5B",
  cancelled: "#9ca3af",
};

export const BUDGET_CATEGORIES = [
  plannerText.budgetCategories.restaurant,
  plannerText.budgetCategories.music,
  plannerText.budgetCategories.photographer,
  plannerText.budgetCategories.videographer,
  plannerText.budgetCategories.decorations,
  plannerText.budgetCategories.flowers,
  plannerText.budgetCategories.dress,
  plannerText.budgetCategories.suit,
  plannerText.budgetCategories.makeup,
  plannerText.budgetCategories.hair,
  plannerText.budgetCategories.cake,
  plannerText.budgetCategories.cars,
  plannerText.budgetCategories.invitations,
  plannerText.budgetCategories.website,
  plannerText.budgetCategories.host,
  plannerText.budgetCategories.lighting,
  plannerText.budgetCategories.other,
];

export const NAV_ITEMS: { id: string; label: string }[] = [
  { id: "dashboard", label: plannerText.nav.dashboard },
  { id: "guests", label: plannerText.nav.guests },
  { id: "tables", label: plannerText.nav.tables },
  { id: "budget", label: plannerText.nav.budget },
  { id: "more", label: plannerText.nav.more },
];

export const RSVP_ALL_STATUSES: RsvpStatus[] = [
  "invited",
  "coming",
  "not_coming",
  "waiting",
  "maybe",
];

export const TABLE_SHAPES: TableShape[] = [
  "circle",
  "oval",
  "square",
  "rectangle",
  "long",
  "head",
];

export const CURRENCY_SYMBOL = "֏";

export const LS_KEY = "wedding_planner_prototype_v1";
