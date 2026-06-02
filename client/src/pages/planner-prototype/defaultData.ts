import type { Guest, WeddingTable, Seat, BudgetItem, Task, PlannerData } from "./types";

function uid(): string {
  return Math.random().toString(36).slice(2, 9) + Math.random().toString(36).slice(2, 9);
}

function seat(tableId: string, num: number, guestId?: string): Seat {
  return { id: uid(), tableId, seatNumber: num, guestId };
}

const t1 = uid(), t2 = uid(), t3 = uid(), t4 = uid(), t5 = uid();
const g1 = uid(), g2 = uid(), g3 = uid(), g4 = uid(), g5 = uid();
const g6 = uid(), g7 = uid(), g8 = uid(), g9 = uid(), g10 = uid();

const TABLES: WeddingTable[] = [
  { id: t1, name: "Head Table", shape: "head", capacity: 8, locked: true },
  { id: t2, name: "Table 1", shape: "circle", capacity: 10 },
  { id: t3, name: "Table 2", shape: "circle", capacity: 10 },
  { id: t4, name: "Table 3", shape: "rectangle", capacity: 12 },
  { id: t5, name: "Table 4", shape: "rectangle", capacity: 10 },
];

const GUESTS: Guest[] = [
  { id: g1, fullName: "Aram Petrosyan", phone: "+374 91 100001", email: "aram@example.com", rsvpStatus: "coming", guestCount: 2, side: "groom", groupName: "Family", tableId: t2 },
  { id: g2, fullName: "Ani Mkrtchyan", phone: "+374 94 100002", email: "ani@example.com", rsvpStatus: "coming", guestCount: 1, side: "bride", groupName: "Family", tableId: t2 },
  { id: g3, fullName: "David Vardanyan", phone: "+374 93 100003", email: "", rsvpStatus: "coming", guestCount: 2, side: "groom", groupName: "Friends", tableId: t3 },
  { id: g4, fullName: "Mary Grigoryan", phone: "+374 95 100004", email: "mary@example.com", rsvpStatus: "coming", guestCount: 1, side: "bride", groupName: "Colleagues", tableId: t3 },
  { id: g5, fullName: "Lusine Harutyunyan", phone: "+374 98 100005", email: "", rsvpStatus: "coming", guestCount: 2, side: "bride", groupName: "Family", tableId: t4 },
  { id: g6, fullName: "Hayk Kocharyan", phone: "+374 91 100006", email: "", rsvpStatus: "waiting", guestCount: 2, side: "groom", groupName: "" },
  { id: g7, fullName: "Sona Nersisyan", phone: "+374 99 100007", email: "sona@example.com", rsvpStatus: "coming", guestCount: 3, side: "bride", groupName: "Friends", tableId: t4 },
  { id: g8, fullName: "Narek Sargsyan", phone: "+374 93 100008", email: "", rsvpStatus: "maybe", guestCount: 1, side: "groom", groupName: "" },
  { id: g9, fullName: "Anna Grigoryan", phone: "+374 94 100009", email: "anna@example.com", rsvpStatus: "coming", guestCount: 2, side: "both", groupName: "Family", tableId: t5 },
  { id: g10, fullName: "Gor Hakobyan", phone: "+374 91 100010", email: "", rsvpStatus: "not_coming", guestCount: 1, side: "groom", groupName: "" },
];

function buildSeats(): Seat[] {
  const seats: Seat[] = [];
  for (const t of TABLES) {
    for (let i = 1; i <= t.capacity; i++) {
      seats.push(seat(t.id, i, undefined));
    }
  }
  // assign some guests to seats
  const g1seat = seats.find(s => s.tableId === t2 && s.seatNumber === 1);
  const g2seat = seats.find(s => s.tableId === t2 && s.seatNumber === 2);
  const g3seat = seats.find(s => s.tableId === t3 && s.seatNumber === 1);
  if (g1seat) g1seat.guestId = g1;
  if (g2seat) g2seat.guestId = g2;
  if (g3seat) g3seat.guestId = g3;
  return seats;
}

const BUDGET_ITEMS: BudgetItem[] = [
  { id: uid(), category: "venue", title: "Grand Palace", vendorName: "Grand Palace", plannedCost: 18000, actualCost: 18000, paidAmount: 18000, dueDate: "2026-03-15", status: "paid" },
  { id: uid(), category: "catering", title: "Catering & Dining", vendorName: "Luxury Catering", plannedCost: 14500, actualCost: 14500, paidAmount: 7250, dueDate: "2026-06-01", status: "partially_paid" },
  { id: uid(), category: "decor", title: "Decor & Flowers", vendorName: "Elegant Decor", plannedCost: 8200, actualCost: 8200, paidAmount: 8200, dueDate: "2026-04-10", status: "paid" },
  { id: uid(), category: "photo", title: "Photo & Video", vendorName: "Dream Studio", plannedCost: 6200, actualCost: 6200, paidAmount: 3100, dueDate: "2026-06-10", status: "deposit_paid" },
  { id: uid(), category: "music", title: "Live Band + DJ", vendorName: "Sound & Mood", plannedCost: 4800, actualCost: 4800, paidAmount: 0, dueDate: "2026-06-15", status: "planned" },
  { id: uid(), category: "invitations", title: "Invitations", vendorName: "", plannedCost: 800, actualCost: 750, paidAmount: 750, dueDate: "2026-01-20", status: "paid" },
];

const TASKS: Task[] = [
  { id: uid(), title: "Send invitations",      dueDate: "2026-05-20", priority: "high",   done: false },
  { id: uid(), title: "Book photographer",     dueDate: "2026-05-10", priority: "high",   done: true  },
  { id: uid(), title: "Menu tasting",          dueDate: "2026-05-25", priority: "medium", done: false },
  { id: uid(), title: "Finalize guest count",  dueDate: "2026-06-05", priority: "medium", done: false },
  { id: uid(), title: "Order wedding cake",    dueDate: "2026-06-01", priority: "high",   done: false },
  { id: uid(), title: "Book florist",          dueDate: "2026-04-15", priority: "medium", done: true  },
  { id: uid(), title: "Arrange transportation",dueDate: "2026-06-10", priority: "low",    done: false },
  { id: uid(), title: "Hair & makeup trial",   dueDate: "2026-06-01", priority: "medium", done: false },
];

export const DEFAULT_DATA: PlannerData = {
  guests: GUESTS,
  tables: TABLES,
  seats: buildSeats(),
  budgetItems: BUDGET_ITEMS,
  tasks: TASKS,
  settings: {
    weddingDate: "2026-06-20",
    coupleName: "Aram & Ani",
    currency: "֏",
    defaultSeatsPerTable: 10,
    restaurantPricePerGuest: 150,
    totalBudget: 0,
  },
};

export const BLANK_DATA: PlannerData = {
  guests: [],
  tables: [],
  seats: [],
  budgetItems: [],
  tasks: [],
  settings: {
    weddingDate: "",
    coupleName: "",
    currency: "֏",
    defaultSeatsPerTable: 10,
    restaurantPricePerGuest: 150,
    totalBudget: 0,
  },
};
