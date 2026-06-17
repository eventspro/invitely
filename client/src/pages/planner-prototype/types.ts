export type RsvpStatus = "invited" | "coming" | "not_coming" | "waiting" | "maybe";
export type GuestSide = "bride" | "groom" | "both" | "other";
export type TableShape = "circle" | "square" | "rectangle" | "long" | "oval" | "head";
export type BudgetStatus = "planned" | "deposit_paid" | "partially_paid" | "paid" | "overdue" | "cancelled";
export type TaskPriority = "high" | "medium" | "low";
export type BudgetCategory =
  | "venue" | "catering" | "decor" | "photo" | "music"
  | "restaurant" | "photographer" | "videographer" | "decorations"
  | "flowers" | "invitations" | "website" | "host" | "lighting" | "other"
  | "custom";
export type TabId = "dashboard" | "guests" | "tables" | "tasks" | "budget" | "more";

export type TelegramReminderState =
  | "not_scheduled" | "scheduled" | "sent"
  | "repeating" | "stopped" | "completed" | "failed";

export interface Task {
  id: string;
  title: string;
  priority: TaskPriority;
  done: boolean;             // derived: status === 'done', or legacy boolean
  // Legacy localStorage fields (kept for backward compat)
  dueDate?: string;          // "YYYY-MM-DD"
  notes?: string;            // alias for description
  // Backend fields (absent in localStorage tasks, present in API tasks)
  status?: "pending" | "done" | "cancelled";
  description?: string;
  dueAtLocal?: string;       // "2026-06-15T15:00" — datetime-local input value
  dueAtUtc?: string | null;
  timezone?: string;
  reminderEnabled?: boolean;
  repeatIntervalMinutes?: number | null;
  telegramReminderState?: TelegramReminderState;
  nextReminderAtUtc?: string | null;
  lastReminderSentAt?: string | null;
  sendRetryCount?: number;
  sendLastError?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
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
  customCategoryName?: string;
  title: string;
  vendorName?: string;
  plannedCost: number;
  actualCost: number;
  paidAmount: number;
  dueDate?: string;
  status: BudgetStatus;
  notes?: string;
  receiptDataUrl?: string;
  receiptFileName?: string;
}

export interface PlannerSettings {
  weddingDate: string;
  coupleName: string;
  currency: string;
  defaultSeatsPerTable: number;
  restaurantPricePerGuest: number;
  totalBudget: number;
}

export interface PlannerData {
  guests: Guest[];
  tables: WeddingTable[];
  seats: Seat[];
  budgetItems: BudgetItem[];
  tasks: Task[];
  settings: PlannerSettings;
}
