import { randomUUID } from "crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "./db.js";
import {
  plannerBudgetItems,
  plannerGuests,
  plannerSeats,
  plannerSettings,
  plannerTables,
  plannerTasks,
  rsvps,
  userAdminPanels,
  type PlannerGuest,
  type PlannerTask,
  type Rsvp,
} from "../shared/schema.js";

type RsvpStatus = "invited" | "coming" | "not_coming" | "waiting" | "maybe";
type GuestSide = "bride" | "groom" | "both" | "other";

export interface PlannerGuestData {
  id: string;
  rsvpId?: string;
  source?: "manual" | "rsvp";
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

export interface PlannerTableData {
  id: string;
  name: string;
  shape: string;
  capacity: number;
  x?: number;
  y?: number;
  rotation?: number;
  size?: number;
  locked?: boolean;
  color?: string;
  notes?: string;
}

export interface PlannerSeatData {
  id: string;
  tableId: string;
  seatNumber: number;
  guestId?: string;
}

export interface PlannerBudgetItemData {
  id: string;
  category: string;
  customCategoryName?: string;
  title: string;
  vendorName?: string;
  plannedCost: number;
  actualCost: number;
  paidAmount: number;
  dueDate?: string;
  status: string;
  notes?: string;
  receiptDataUrl?: string;
  receiptFileName?: string;
}

export interface PlannerSettingsData {
  weddingDate: string;
  coupleName: string;
  currency: string;
  defaultSeatsPerTable: number;
  restaurantPricePerGuest: number;
  totalBudget: number;
}

export interface PlannerTaskData {
  id: string;
  title: string;
  priority: string;
  done: boolean;
  status?: string;
  description?: string;
  notes?: string;
  dueDate?: string;
  dueAtUtc?: string | null;
  timezone?: string;
  reminderEnabled?: boolean;
  repeatIntervalMinutes?: number | null;
  telegramReminderState?: string;
  nextReminderAtUtc?: string | null;
  lastReminderSentAt?: string | null;
  sendRetryCount?: number;
  sendLastError?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlannerDataPayload {
  guests: PlannerGuestData[];
  tables: PlannerTableData[];
  seats: PlannerSeatData[];
  budgetItems: PlannerBudgetItemData[];
  tasks: PlannerTaskData[];
  settings: PlannerSettingsData;
  plannerVersion: string | null;
  rsvpCounts?: {
    total: number;
    coming: number;
    notComing: number;
    pending: number;
    totalGuests: number;
  };
}

const DEFAULT_SETTINGS: PlannerSettingsData = {
  weddingDate: "",
  coupleName: "",
  currency: "AMD",
  defaultSeatsPerTable: 10,
  restaurantPricePerGuest: 150,
  totalBudget: 0,
};

function cleanString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function cleanNullable(value: unknown): string | null {
  return cleanString(value) ?? null;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toInt(value: unknown, fallback = 0): number {
  return Math.trunc(toNumber(value, fallback));
}

function toPositiveInt(value: unknown, fallback = 1): number {
  return Math.max(1, toInt(value, fallback));
}

function normalizeEmail(value: unknown): string {
  return cleanString(value)?.toLowerCase() ?? "";
}

function normalizePhone(value: unknown): string {
  return cleanString(value)?.replace(/\D/g, "") ?? "";
}

function normalizeName(value: unknown): string {
  return cleanString(value)?.toLowerCase().replace(/\s+/g, " ") ?? "";
}

function optionalNumber(value: unknown): number | undefined {
  const n = toNumber(value, Number.NaN);
  return Number.isFinite(n) ? n : undefined;
}

function optionalDateString(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function rsvpFullName(rsvp: Rsvp): string {
  return cleanString(`${rsvp.firstName ?? ""} ${rsvp.lastName ?? ""}`) ?? cleanString(rsvp.name) ?? "Guest";
}

function rsvpEmail(rsvp: Rsvp): string {
  return cleanString(rsvp.guestEmail) ?? cleanString(rsvp.email) ?? "";
}

function rsvpPhone(rsvp: Rsvp): string {
  return cleanString(rsvp.guestPhone) ?? "";
}

function rsvpStatus(rsvp: Rsvp): RsvpStatus {
  if (rsvp.attending === true || rsvp.attendance === "attending") return "coming";
  if (rsvp.attending === false || rsvp.attendance === "not-attending") return "not_coming";
  return "waiting";
}

function rsvpGuestCount(rsvp: Rsvp): number {
  return toPositiveInt(rsvp.guests ?? rsvp.guestCount, 1);
}

function findGuestMatchIndex(guests: PlannerGuest[], rsvp: Rsvp): number {
  const byRsvp = guests.findIndex((guest) => guest.rsvpId === rsvp.id);
  if (byRsvp >= 0) return byRsvp;

  const email = normalizeEmail(rsvpEmail(rsvp));
  if (email) {
    const byEmail = guests.findIndex((guest) => normalizeEmail(guest.email) === email);
    if (byEmail >= 0) return byEmail;
  }

  const phone = normalizePhone(rsvpPhone(rsvp));
  if (phone) {
    const byPhone = guests.findIndex((guest) => normalizePhone(guest.phone) === phone);
    if (byPhone >= 0) return byPhone;
  }

  const name = normalizeName(rsvpFullName(rsvp));
  if (name) {
    const byName = guests.findIndex((guest) => normalizeName(guest.fullName) === name);
    if (byName >= 0) return byName;
  }

  return -1;
}

function normalizeSettings(value: unknown): PlannerSettingsData {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    weddingDate: cleanString(raw.weddingDate) ?? DEFAULT_SETTINGS.weddingDate,
    coupleName: cleanString(raw.coupleName) ?? DEFAULT_SETTINGS.coupleName,
    currency: cleanString(raw.currency) ?? DEFAULT_SETTINGS.currency,
    defaultSeatsPerTable: toPositiveInt(raw.defaultSeatsPerTable, DEFAULT_SETTINGS.defaultSeatsPerTable),
    restaurantPricePerGuest: toNumber(raw.restaurantPricePerGuest, DEFAULT_SETTINGS.restaurantPricePerGuest),
    totalBudget: Math.max(0, toNumber(raw.totalBudget, DEFAULT_SETTINGS.totalBudget)),
  };
}

function taskToClientTask(task: PlannerTask): PlannerTaskData {
  const dueAtUtc = optionalDateString(task.dueAtUtc);
  const status = task.status ?? "pending";
  return {
    id: task.id,
    title: task.title,
    priority: task.priority ?? "medium",
    done: status === "done",
    status,
    description: task.description ?? undefined,
    notes: task.description ?? undefined,
    dueDate: dueAtUtc ? dueAtUtc.slice(0, 10) : undefined,
    dueAtUtc,
    timezone: task.timezone ?? "Asia/Yerevan",
    reminderEnabled: task.reminderEnabled ?? false,
    repeatIntervalMinutes: task.repeatIntervalMinutes ?? null,
    telegramReminderState: task.telegramReminderState ?? "not_scheduled",
    nextReminderAtUtc: optionalDateString(task.nextReminderAtUtc),
    lastReminderSentAt: optionalDateString(task.lastReminderSentAt),
    sendRetryCount: task.sendRetryCount ?? 0,
    sendLastError: task.sendLastError ?? null,
    completedAt: optionalDateString(task.completedAt),
    createdAt: optionalDateString(task.createdAt) ?? undefined,
    updatedAt: optionalDateString(task.updatedAt) ?? undefined,
  };
}

function normalizePlannerData(input: Partial<PlannerDataPayload>): PlannerDataPayload {
  const rawGuests = Array.isArray(input.guests) ? input.guests : [];
  const rawTables = Array.isArray(input.tables) ? input.tables : [];
  const rawSeats = Array.isArray(input.seats) ? input.seats : [];
  const rawBudgetItems = Array.isArray(input.budgetItems) ? input.budgetItems : [];

  return {
    guests: rawGuests.map((guest) => ({
      id: cleanString(guest.id) ?? randomUUID(),
      rsvpId: cleanString(guest.rsvpId),
      source: guest.source === "rsvp" ? "rsvp" : "manual",
      fullName: cleanString(guest.fullName) ?? "Guest",
      phone: cleanString(guest.phone),
      email: cleanString(guest.email),
      rsvpStatus: (["invited", "coming", "not_coming", "waiting", "maybe"].includes(guest.rsvpStatus) ? guest.rsvpStatus : "invited") as RsvpStatus,
      guestCount: toPositiveInt(guest.guestCount, 1),
      side: (["bride", "groom", "both", "other"].includes(guest.side) ? guest.side : "both") as GuestSide,
      groupName: cleanString(guest.groupName),
      tableId: cleanString(guest.tableId),
      seatId: cleanString(guest.seatId),
      dietaryNotes: cleanString(guest.dietaryNotes),
      notes: cleanString(guest.notes),
    })),
    tables: rawTables.map((table) => ({
      id: cleanString(table.id) ?? randomUUID(),
      name: cleanString(table.name) ?? "Table",
      shape: cleanString(table.shape) ?? "circle",
      capacity: toPositiveInt(table.capacity, 10),
      x: optionalNumber(table.x),
      y: optionalNumber(table.y),
      rotation: optionalNumber(table.rotation),
      size: optionalNumber(table.size),
      locked: table.locked === true,
      color: cleanString(table.color),
      notes: cleanString(table.notes),
    })),
    seats: rawSeats.map((seat) => ({
      id: cleanString(seat.id) ?? randomUUID(),
      tableId: cleanString(seat.tableId) ?? "",
      seatNumber: toPositiveInt(seat.seatNumber, 1),
      guestId: cleanString(seat.guestId),
    })),
    budgetItems: rawBudgetItems.map((item) => ({
      id: cleanString(item.id) ?? randomUUID(),
      category: cleanString(item.category) ?? "other",
      customCategoryName: cleanString(item.customCategoryName),
      title: cleanString(item.title) ?? "Budget Item",
      vendorName: cleanString(item.vendorName),
      plannedCost: Math.max(0, toNumber(item.plannedCost, 0)),
      actualCost: Math.max(0, toNumber(item.actualCost, 0)),
      paidAmount: Math.max(0, toNumber(item.paidAmount, 0)),
      dueDate: cleanString(item.dueDate),
      status: cleanString(item.status) ?? "planned",
      notes: cleanString(item.notes),
      receiptDataUrl: cleanString(item.receiptDataUrl),
      receiptFileName: cleanString(item.receiptFileName),
    })),
    tasks: [],
    settings: normalizeSettings(input.settings),
    plannerVersion: null,
  };
}

function findClientGuestMatchIndex(guests: PlannerGuestData[], candidate: PlannerGuestData): number {
  if (candidate.rsvpId) {
    const byRsvp = guests.findIndex((guest) => guest.rsvpId === candidate.rsvpId);
    if (byRsvp >= 0) return byRsvp;
  }

  const email = normalizeEmail(candidate.email);
  if (email) {
    const byEmail = guests.findIndex((guest) => normalizeEmail(guest.email) === email);
    if (byEmail >= 0) return byEmail;
  }

  const phone = normalizePhone(candidate.phone);
  if (phone) {
    const byPhone = guests.findIndex((guest) => normalizePhone(guest.phone) === phone);
    if (byPhone >= 0) return byPhone;
  }

  const name = normalizeName(candidate.fullName);
  if (name) {
    const byName = guests.findIndex((guest) => normalizeName(guest.fullName) === name);
    if (byName >= 0) return byName;
  }

  return -1;
}

export async function syncPlannerGuestsFromRsvps(userId: string, templateId: string): Promise<void> {
  const [rsvpRows, guestRows] = await Promise.all([
    db.select().from(rsvps).where(eq(rsvps.templateId, templateId)).orderBy(desc(rsvps.submittedAt)),
    db.select().from(plannerGuests).where(and(eq(plannerGuests.userId, userId), eq(plannerGuests.templateId, templateId))),
  ]);

  const mutableGuests = [...guestRows];

  for (const rsvp of rsvpRows) {
    const matchIndex = findGuestMatchIndex(mutableGuests, rsvp);
    const email = rsvpEmail(rsvp);
    const phone = rsvpPhone(rsvp);
    const fullName = rsvpFullName(rsvp);
    const status = rsvpStatus(rsvp);
    const guestCount = rsvpGuestCount(rsvp);
    const guestNames = cleanNullable(rsvp.guestNames);

    if (matchIndex >= 0) {
      const existing = mutableGuests[matchIndex];
      const rsvpOwnsNames = existing.source === "rsvp" || !cleanString(existing.fullName);
      const updates: Partial<typeof plannerGuests.$inferInsert> = {
        rsvpId: rsvp.id,
        source: "rsvp",
        firstName: cleanNullable(rsvp.firstName),
        lastName: cleanNullable(rsvp.lastName),
        rsvpStatus: status,
        guestCount,
        groupName: guestNames,
        updatedAt: new Date(),
      };

      if (rsvpOwnsNames) updates.fullName = fullName;
      if (email && (!existing.email || existing.source === "rsvp")) updates.email = email;
      if (phone && (!existing.phone || existing.source === "rsvp")) updates.phone = phone;
      if (rsvp.dietaryRestrictions && (!existing.dietaryNotes || existing.source === "rsvp")) {
        updates.dietaryNotes = rsvp.dietaryRestrictions;
      }

      const [updated] = await db
        .update(plannerGuests)
        .set(updates)
        .where(eq(plannerGuests.id, existing.id))
        .returning();

      if (updated) mutableGuests[matchIndex] = updated;
      continue;
    }

    const [created] = await db
      .insert(plannerGuests)
      .values({
        userId,
        templateId,
        rsvpId: rsvp.id,
        source: "rsvp",
        fullName,
        firstName: cleanNullable(rsvp.firstName),
        lastName: cleanNullable(rsvp.lastName),
        email: cleanNullable(email),
        phone: cleanNullable(phone),
        rsvpStatus: status,
        guestCount,
        guestSide: "both",
        groupName: guestNames,
        dietaryNotes: cleanNullable(rsvp.dietaryRestrictions),
        notes: cleanNullable(rsvp.specialRequests),
      })
      .returning();

    if (created) mutableGuests.push(created);
  }
}

export async function syncPlannerGuestsForTemplate(templateId: string): Promise<void> {
  const panels = await db
    .select({ userId: userAdminPanels.userId })
    .from(userAdminPanels)
    .where(and(eq(userAdminPanels.templateId, templateId), eq(userAdminPanels.isActive, true)));

  const userIds = Array.from(new Set(panels.map((panel) => panel.userId).filter(Boolean)));
  for (const userId of userIds) {
    await syncPlannerGuestsFromRsvps(userId, templateId);
  }
}

export async function getPlannerData(userId: string, templateId: string): Promise<PlannerDataPayload> {
  const [guestRows, tableRows, seatRows, budgetRows, settingsRows, taskRows, rsvpRows] = await Promise.all([
    db.select().from(plannerGuests).where(and(eq(plannerGuests.userId, userId), eq(plannerGuests.templateId, templateId))).orderBy(desc(plannerGuests.createdAt)),
    db.select().from(plannerTables).where(and(eq(plannerTables.userId, userId), eq(plannerTables.templateId, templateId))).orderBy(plannerTables.createdAt),
    db.select().from(plannerSeats).where(and(eq(plannerSeats.userId, userId), eq(plannerSeats.templateId, templateId))).orderBy(plannerSeats.seatNumber),
    db.select().from(plannerBudgetItems).where(and(eq(plannerBudgetItems.userId, userId), eq(plannerBudgetItems.templateId, templateId))).orderBy(desc(plannerBudgetItems.createdAt)),
    db.select().from(plannerSettings).where(and(eq(plannerSettings.userId, userId), eq(plannerSettings.templateId, templateId))).limit(1),
    db.select().from(plannerTasks).where(and(eq(plannerTasks.userId, userId), eq(plannerTasks.templateId, templateId))).orderBy(desc(plannerTasks.createdAt)),
    db.select().from(rsvps).where(eq(rsvps.templateId, templateId)),
  ]);

  const seatIdByGuestId = new Map<string, string>();
  for (const seat of seatRows) {
    if (seat.guestId) seatIdByGuestId.set(seat.guestId, seat.id);
  }

  const guests: PlannerGuestData[] = guestRows.map((guest) => ({
    id: guest.id,
    rsvpId: guest.rsvpId ?? undefined,
    source: guest.source === "rsvp" ? "rsvp" : "manual",
    fullName: guest.fullName,
    phone: guest.phone ?? undefined,
    email: guest.email ?? undefined,
    rsvpStatus: guest.rsvpStatus as RsvpStatus,
    guestCount: guest.guestCount ?? 1,
    side: (guest.guestSide ?? "both") as GuestSide,
    groupName: guest.groupName ?? undefined,
    tableId: guest.tableId ?? undefined,
    seatId: seatIdByGuestId.get(guest.id),
    dietaryNotes: guest.dietaryNotes ?? undefined,
    notes: guest.notes ?? undefined,
  }));

  const tables: PlannerTableData[] = tableRows.map((table) => ({
    id: table.id,
    name: table.name,
    shape: table.shape,
    capacity: table.capacity ?? 10,
    x: table.x ?? undefined,
    y: table.y ?? undefined,
    rotation: table.rotation ?? undefined,
    size: table.size ?? undefined,
    locked: table.locked ?? false,
    color: table.color ?? undefined,
    notes: table.notes ?? undefined,
  }));

  const seats: PlannerSeatData[] = seatRows.map((seat) => ({
    id: seat.id,
    tableId: seat.tableId,
    seatNumber: seat.seatNumber,
    guestId: seat.guestId ?? undefined,
  }));

  const budgetItems: PlannerBudgetItemData[] = budgetRows.map((item) => ({
    id: item.id,
    category: item.category,
    customCategoryName: item.customCategoryName ?? undefined,
    title: item.title,
    vendorName: item.vendorName ?? undefined,
    plannedCost: toNumber(item.plannedCost, 0),
    actualCost: toNumber(item.actualCost, 0),
    paidAmount: toNumber(item.paidAmount, 0),
    dueDate: item.dueDate ?? undefined,
    status: item.status,
    notes: item.notes ?? undefined,
    receiptDataUrl: item.receiptDataUrl ?? undefined,
    receiptFileName: item.receiptFileName ?? undefined,
  }));

  const rsvpCounts = rsvpRows.reduce(
    (acc, rsvp) => {
      acc.total += 1;
      acc.totalGuests += rsvpGuestCount(rsvp);
      if (rsvpStatus(rsvp) === "coming") acc.coming += 1;
      else if (rsvpStatus(rsvp) === "not_coming") acc.notComing += 1;
      else acc.pending += 1;
      return acc;
    },
    { total: 0, coming: 0, notComing: 0, pending: 0, totalGuests: 0 },
  );

  return {
    guests,
    tables,
    seats,
    budgetItems,
    tasks: taskRows.map(taskToClientTask),
    settings: normalizeSettings(settingsRows[0]?.settings),
    plannerVersion: settingsRows[0]?.updatedAt?.toISOString() ?? null,
    rsvpCounts,
  };
}

export async function replacePlannerData(
  userId: string,
  templateId: string,
  input: Partial<PlannerDataPayload>,
  opts: { expectedVersion?: string } = {},
): Promise<PlannerDataPayload> {
  if (opts.expectedVersion != null) {
    const [currentSettings] = await db
      .select({ updatedAt: plannerSettings.updatedAt })
      .from(plannerSettings)
      .where(and(eq(plannerSettings.userId, userId), eq(plannerSettings.templateId, templateId)))
      .limit(1);
    const currentVersion = currentSettings?.updatedAt?.toISOString() ?? null;
    if (currentVersion != null && currentVersion !== opts.expectedVersion) {
      throw Object.assign(new Error("planner version conflict"), { code: "PLANNER_VERSION_CONFLICT" });
    }
  }
  const data = normalizePlannerData(input);
  const existingGuests = await db
    .select()
    .from(plannerGuests)
    .where(and(eq(plannerGuests.userId, userId), eq(plannerGuests.templateId, templateId)));
  const existingGuestById = new Map(existingGuests.map((guest) => [guest.id, guest]));

  const tableRows = data.tables.map((table) => ({
    id: table.id,
    userId,
    templateId,
    name: table.name,
    shape: table.shape,
    capacity: table.capacity,
    x: table.x ?? null,
    y: table.y ?? null,
    rotation: table.rotation ?? null,
    size: table.size ?? null,
    locked: table.locked ?? false,
    color: table.color ?? null,
    notes: table.notes ?? null,
    updatedAt: new Date(),
  }));
  const tableIds = new Set(tableRows.map((table) => table.id));

  const guestRows = data.guests.map((guest) => {
    const existing = existingGuestById.get(guest.id);
    return {
      id: guest.id,
      userId,
      templateId,
      rsvpId: guest.rsvpId ?? existing?.rsvpId ?? null,
      source: guest.source ?? (existing?.source === "rsvp" ? "rsvp" : "manual"),
      fullName: guest.fullName,
      firstName: existing?.firstName ?? null,
      lastName: existing?.lastName ?? null,
      phone: guest.phone ?? null,
      email: guest.email ?? null,
      rsvpStatus: guest.rsvpStatus,
      guestSide: guest.side,
      guestCount: guest.guestCount,
      groupName: guest.groupName ?? null,
      dietaryNotes: guest.dietaryNotes ?? null,
      notes: guest.notes ?? null,
      tableId: guest.tableId && tableIds.has(guest.tableId) ? guest.tableId : null,
      updatedAt: new Date(),
    };
  });
  const guestIds = new Set(guestRows.map((guest) => guest.id));

  const seenSeats = new Set<string>();
  const seatRows = data.seats
    .filter((seat) => seat.tableId && tableIds.has(seat.tableId))
    .filter((seat) => {
      const key = `${seat.tableId}:${seat.seatNumber}`;
      if (seenSeats.has(key)) return false;
      seenSeats.add(key);
      return true;
    })
    .map((seat) => ({
      id: seat.id,
      userId,
      templateId,
      tableId: seat.tableId,
      seatNumber: seat.seatNumber,
      guestId: seat.guestId && guestIds.has(seat.guestId) ? seat.guestId : null,
      updatedAt: new Date(),
    }));

  const budgetRows = data.budgetItems.map((item) => ({
    id: item.id,
    userId,
    templateId,
    category: item.category,
    customCategoryName: item.customCategoryName ?? null,
    title: item.title,
    vendorName: item.vendorName ?? null,
    plannedCost: String(item.plannedCost),
    actualCost: String(item.actualCost),
    paidAmount: String(item.paidAmount),
    dueDate: item.dueDate ?? null,
    status: item.status,
    notes: item.notes ?? null,
    receiptDataUrl: item.receiptDataUrl ?? null,
    receiptFileName: item.receiptFileName ?? null,
    updatedAt: new Date(),
  }));

  await db.transaction(async (tx) => {
    await tx.delete(plannerSeats).where(and(eq(plannerSeats.userId, userId), eq(plannerSeats.templateId, templateId)));
    await tx.delete(plannerBudgetItems).where(and(eq(plannerBudgetItems.userId, userId), eq(plannerBudgetItems.templateId, templateId)));
    await tx.delete(plannerGuests).where(and(eq(plannerGuests.userId, userId), eq(plannerGuests.templateId, templateId)));
    await tx.delete(plannerTables).where(and(eq(plannerTables.userId, userId), eq(plannerTables.templateId, templateId)));

    if (tableRows.length > 0) await tx.insert(plannerTables).values(tableRows);
    if (guestRows.length > 0) await tx.insert(plannerGuests).values(guestRows);
    if (seatRows.length > 0) await tx.insert(plannerSeats).values(seatRows);
    if (budgetRows.length > 0) await tx.insert(plannerBudgetItems).values(budgetRows);

    await tx
      .insert(plannerSettings)
      .values({ userId, templateId, settings: data.settings, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [plannerSettings.userId, plannerSettings.templateId],
        set: { settings: data.settings, updatedAt: new Date() },
      });
  });

  return getPlannerData(userId, templateId);
}

export async function importLegacyPlannerData(
  userId: string,
  templateId: string,
  input: Partial<PlannerDataPayload>,
): Promise<PlannerDataPayload> {
  const current = await getPlannerData(userId, templateId);
  const legacy = normalizePlannerData(input);
  const guestIdMap = new Map<string, string>();

  const tablesById = new Map<string, PlannerTableData>();
  current.tables.forEach((table) => tablesById.set(table.id, table));
  legacy.tables.forEach((table) => tablesById.set(table.id, table));
  const tables = Array.from(tablesById.values());
  const tableIds = new Set(tables.map((table) => table.id));

  const guests = [...current.guests];
  for (const legacyGuest of legacy.guests) {
    const matchIndex = findClientGuestMatchIndex(guests, legacyGuest);
    if (matchIndex >= 0) {
      const currentGuest = guests[matchIndex];
      guestIdMap.set(legacyGuest.id, currentGuest.id);
      const isRsvpLinked = !!currentGuest.rsvpId;
      guests[matchIndex] = {
        ...currentGuest,
        fullName: isRsvpLinked ? currentGuest.fullName : legacyGuest.fullName,
        phone: legacyGuest.phone ?? currentGuest.phone,
        email: legacyGuest.email ?? currentGuest.email,
        rsvpStatus: isRsvpLinked ? currentGuest.rsvpStatus : legacyGuest.rsvpStatus,
        guestCount: isRsvpLinked ? currentGuest.guestCount : legacyGuest.guestCount,
        side: legacyGuest.side ?? currentGuest.side,
        groupName: legacyGuest.groupName ?? currentGuest.groupName,
        tableId: legacyGuest.tableId && tableIds.has(legacyGuest.tableId) ? legacyGuest.tableId : currentGuest.tableId,
        seatId: legacyGuest.seatId ?? currentGuest.seatId,
        dietaryNotes: legacyGuest.dietaryNotes ?? currentGuest.dietaryNotes,
        notes: legacyGuest.notes ?? currentGuest.notes,
      };
    } else {
      guestIdMap.set(legacyGuest.id, legacyGuest.id);
      guests.push({ ...legacyGuest, source: legacyGuest.source ?? "manual" });
    }
  }

  const seatsByKey = new Map<string, PlannerSeatData>();
  current.seats.forEach((seat) => seatsByKey.set(`${seat.tableId}:${seat.seatNumber}`, seat));
  legacy.seats
    .filter((seat) => tableIds.has(seat.tableId))
    .forEach((seat) => {
      seatsByKey.set(`${seat.tableId}:${seat.seatNumber}`, {
        ...seat,
        guestId: seat.guestId ? guestIdMap.get(seat.guestId) ?? seat.guestId : undefined,
      });
    });
  const seats = Array.from(seatsByKey.values());
  const seatIdByGuestId = new Map<string, string>();
  seats.forEach((seat) => {
    if (seat.guestId) seatIdByGuestId.set(seat.guestId, seat.id);
  });
  const guestsWithSeats = guests.map((guest) => ({
    ...guest,
    seatId: seatIdByGuestId.get(guest.id) ?? guest.seatId,
  }));

  const budgetById = new Map<string, PlannerBudgetItemData>();
  current.budgetItems.forEach((item) => budgetById.set(item.id, item));
  legacy.budgetItems.forEach((item) => budgetById.set(item.id, item));

  return replacePlannerData(userId, templateId, {
    guests: guestsWithSeats,
    tables,
    seats,
    budgetItems: Array.from(budgetById.values()),
    settings: { ...current.settings, ...legacy.settings },
  });
}
