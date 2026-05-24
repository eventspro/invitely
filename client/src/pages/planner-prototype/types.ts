export type RsvpStatus = "invited" | "coming" | "not_coming" | "waiting" | "maybe";
export type GuestSide = "bride" | "groom" | "both" | "other";
export type TableShape = "circle" | "square" | "rectangle" | "long" | "oval" | "head";
export type BudgetStatus = "planned" | "deposit_paid" | "partially_paid" | "paid" | "overdue" | "cancelled";
export type TaskPriority = "high" | "medium" | "low";
export type BudgetCategory =
  | "venue" | "catering" | "decor" | "photo" | "music"
  | "restaurant" | "photographer" | "videographer" | "decorations"
  | "flowers" | "invitations" | "website" | "host" | "lighting" | "other";
export type TabId = "dashboard" | "guests" | "tables" | "budget" | "more";

export interface Task {
  id: string;
  title: string;
  dueDate?: string;
  priority: TaskPriority;
  done: boolean;
  notes?: string;
}

export interface Guest {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  rsvpStatus: RsvpStatus;
  guestCount: number;
  side: GuestSide;
  groupName?: string;
  tableId?: string;
  seatId?: string;
  dietaryNotes?: string;
  notes?: string;
}

export interface WeddingTable {
  id: string;
  name: string;
  shape: TableShape;
  capacity: number;
  x?: number;
  y?: number;
  locked?: boolean;
  color?: string;
  notes?: string;
}

export interface Seat {
  id: string;
  tableId: string;
  seatNumber: number;
  guestId?: string;
}

export interface BudgetItem {
  id: string;
  category: BudgetCategory;
  title: string;
  vendorName?: string;
  plannedCost: number;
  actualCost: number;
  paidAmount: number;
  dueDate?: string;
  status: BudgetStatus;
  notes?: string;
}

export interface PlannerSettings {
  weddingDate: string;
  coupleName: string;
  currency: string;
  defaultSeatsPerTable: number;
  restaurantPricePerGuest: number;
}

export interface PlannerData {
  guests: Guest[];
  tables: WeddingTable[];
  seats: Seat[];
  budgetItems: BudgetItem[];
  tasks: Task[];
  settings: PlannerSettings;
}
