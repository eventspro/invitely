import type {
  Guest, WeddingTable, Seat, BudgetItem, PlannerData, TableShape,
} from "./types";

export function uid(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

export function formatCurrency(amount: number, currency = "֏"): string {
  const n = Math.abs(amount).toLocaleString("en-US");
  const sign = amount < 0 ? "-" : "";
  const postfix = currency === "֏" || currency === "₽";
  return postfix ? `${sign}${n}${currency}` : `${sign}${currency}${n}`;
}

export function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export interface GuestTotals {
  total: number;
  totalPersons: number;
  coming: number;
  comingPersons: number;
  waiting: number;
  notComing: number;
  maybe: number;
  invited: number;
}

export function getGuestTotals(guests: Guest[]): GuestTotals {
  return {
    total: guests.length,
    totalPersons: guests.reduce((s, g) => s + g.guestCount, 0),
    coming: guests.filter(g => g.rsvpStatus === "coming").length,
    comingPersons: guests.filter(g => g.rsvpStatus === "coming").reduce((s, g) => s + g.guestCount, 0),
    waiting: guests.filter(g => g.rsvpStatus === "waiting").length,
    notComing: guests.filter(g => g.rsvpStatus === "not_coming").length,
    maybe: guests.filter(g => g.rsvpStatus === "maybe").length,
    invited: guests.filter(g => g.rsvpStatus === "invited").length,
  };
}

export interface SeatingTotals {
  totalCapacity: number;
  assigned: number;
  free: number;
  pct: number;
}

export function getSeatingTotals(tables: WeddingTable[], seats: Seat[]): SeatingTotals {
  const totalCapacity = tables.reduce((s, t) => s + t.capacity, 0);
  const assigned = seats.filter(s => !!s.guestId).length;
  const free = totalCapacity - assigned;
  return { totalCapacity, assigned, free, pct: totalCapacity > 0 ? Math.round((assigned / totalCapacity) * 100) : 0 };
}

export interface BudgetTotals {
  planned: number;
  actual: number;
  paid: number;
  remaining: number;
  pct: number;
}

export function getBudgetTotals(items: BudgetItem[]): BudgetTotals {
  const planned = items.reduce((s, i) => s + i.plannedCost, 0);
  const actual = items.reduce((s, i) => s + (i.actualCost || i.plannedCost), 0);
  const paid = items.reduce((s, i) => s + i.paidAmount, 0);
  const remaining = Math.max(0, actual - paid);
  return { planned, actual, paid, remaining, pct: actual > 0 ? Math.round((paid / actual) * 100) : 0 };
}

export interface TableSuggestion {
  id: string;
  label: string;
  description: string;
  tableCount: number;
  seatsPerTable: number;
  shape: TableShape;
}

export function generateSuggestions(
  comingPersons: number,
  defaultSeats: number,
  preferredShape: TableShape,
): TableSuggestion[] {
  if (comingPersons <= 0) return [];
  const balanced = defaultSeats;
  const compact = Math.min(14, defaultSeats + 2);
  const spacious = Math.max(6, defaultSeats - 2);
  return [
    {
      id: "balanced",
      label: "Balanced",
      description: `${Math.ceil(comingPersons / balanced)} tables of ${balanced} (${preferredShape})`,
      tableCount: Math.ceil(comingPersons / balanced),
      seatsPerTable: balanced,
      shape: preferredShape,
    },
    {
      id: "compact",
      label: "Compact",
      description: `${Math.ceil(comingPersons / compact)} tables of ${compact} (rectangle)`,
      tableCount: Math.ceil(comingPersons / compact),
      seatsPerTable: compact,
      shape: "rectangle",
    },
    {
      id: "spacious",
      label: "Spacious",
      description: `${Math.ceil(comingPersons / spacious)} tables of ${spacious} (circle)`,
      tableCount: Math.ceil(comingPersons / spacious),
      seatsPerTable: spacious,
      shape: "circle",
    },
  ];
}

export function applySuggestion(state: PlannerData, suggestion: TableSuggestion): PlannerData {
  const locked = state.tables.filter(t => t.locked);
  const newTables: WeddingTable[] = [...locked];
  const newSeats: Seat[] = state.seats.filter(s => locked.some(t => t.id === s.tableId));

  // unassign guests from replaced tables
  const replacedIds = new Set(state.tables.filter(t => !t.locked).map(t => t.id));
  const updatedGuests = state.guests.map(g =>
    g.tableId && replacedIds.has(g.tableId) ? { ...g, tableId: undefined, seatId: undefined } : g
  );

  for (let i = 0; i < suggestion.tableCount; i++) {
    const id = uid();
    newTables.push({
      id,
      name: `Table ${locked.length + i + 1}`,
      shape: suggestion.shape,
      capacity: suggestion.seatsPerTable,
    });
    for (let s = 1; s <= suggestion.seatsPerTable; s++) {
      newSeats.push({ id: uid(), tableId: id, seatNumber: s });
    }
  }

  return { ...state, guests: updatedGuests, tables: newTables, seats: newSeats };
}

export function getInitials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? "").join("");
}

export const RSVP_COLORS: Record<string, string> = {
  coming: "#16864A",
  not_coming: "#E85D5D",
  waiting: "#D7951E",
  maybe: "#6B7280",
  invited: "#3B82F6",
};

export const RSVP_BG: Record<string, string> = {
  coming: "#DCFCE7",
  not_coming: "#FEE2E2",
  waiting: "#FEF3C7",
  maybe: "#F3F4F6",
  invited: "#EFF6FF",
};

export const BUDGET_STATUS_COLORS: Record<string, string> = {
  paid: "#16864A",
  partially_paid: "#D7951E",
  deposit_paid: "#3B82F6",
  planned: "#6B7280",
  overdue: "#E85D5D",
  cancelled: "#9CA3AF",
};

export const BUDGET_STATUS_BG: Record<string, string> = {
  paid: "#DCFCE7",
  partially_paid: "#FEF3C7",
  deposit_paid: "#EFF6FF",
  planned: "#F3F4F6",
  overdue: "#FEE2E2",
  cancelled: "#F3F4F6",
};
