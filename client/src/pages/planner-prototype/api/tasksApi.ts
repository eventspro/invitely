import type { Task, TaskPriority } from "../types";

export interface TaskInput {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueAtLocal?: string;
  timezone?: string;
  reminderEnabled?: boolean;
  status?: "pending" | "done" | "cancelled";
}

function apiBase(templateId: string) {
  return `/api/planner/tasks/${templateId}`;
}

function headers(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

/** Convert a UTC ISO string back to "YYYY-MM-DDTHH:mm" in the given IANA timezone. */
function utcToLocal(utcStr: string, timezone: string): string {
  try {
    const date = new Date(utcStr);
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    }).formatToParts(date);
    const p: Record<string, string> = {};
    parts.forEach(({ type, value }) => { p[type] = value; });
    const hour = p.hour === "24" ? "00" : p.hour;
    return `${p.year}-${p.month}-${p.day}T${hour}:${p.minute}`;
  } catch {
    return "";
  }
}

function mapTask(raw: Record<string, unknown>): Task {
  const status = (raw.status as string) ?? "pending";
  const timezone = (raw.timezone as string) ?? "Asia/Yerevan";
  const dueAtUtcStr = (raw.dueAtUtc as string | null) ?? undefined;
  const dueAtLocal = dueAtUtcStr ? utcToLocal(dueAtUtcStr, timezone) : undefined;
  return {
    id:                     raw.id as string,
    title:                  raw.title as string,
    description:            (raw.description as string | null) ?? undefined,
    notes:                  (raw.description as string | null) ?? undefined,
    priority:               (raw.priority as TaskPriority) ?? "medium",
    status:                 status as "pending" | "done" | "cancelled",
    done:                   status === "done",
    dueAtLocal,
    dueDate:                dueAtLocal ? dueAtLocal.slice(0, 10) : undefined,
    dueAtUtc:               dueAtUtcStr,
    timezone,
    reminderEnabled:        (raw.reminderEnabled as boolean) ?? false,
    repeatIntervalMinutes:  (raw.repeatIntervalMinutes as number | null) ?? null,
    telegramReminderState:  raw.telegramReminderState as Task["telegramReminderState"],
    nextReminderAtUtc:      (raw.nextReminderAtUtc as string | null) ?? null,
    lastReminderSentAt:     (raw.lastReminderSentAt as string | null) ?? null,
    sendRetryCount:         (raw.sendRetryCount as number) ?? 0,
    sendLastError:          (raw.sendLastError as string | null) ?? null,
    completedAt:            (raw.completedAt as string | null) ?? null,
    createdAt:              raw.createdAt as string,
    updatedAt:              raw.updatedAt as string,
  };
}

export async function listTasks(templateId: string, token: string): Promise<Task[]> {
  const res = await fetch(apiBase(templateId), { headers: headers(token) });
  if (!res.ok) throw new Error(`listTasks failed: ${res.status}`);
  const data = await res.json() as Record<string, unknown>[];
  return data.map(mapTask);
}

export async function createTask(templateId: string, token: string, input: TaskInput): Promise<Task> {
  const res = await fetch(apiBase(templateId), {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`createTask failed: ${res.status}`);
  return mapTask(await res.json() as Record<string, unknown>);
}

export async function updateTask(
  templateId: string,
  taskId: string,
  token: string,
  input: Partial<TaskInput>,
): Promise<Task> {
  const res = await fetch(`${apiBase(templateId)}/${taskId}`, {
    method: "PUT",
    headers: headers(token),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`updateTask failed: ${res.status}`);
  return mapTask(await res.json() as Record<string, unknown>);
}

export async function deleteTask(templateId: string, taskId: string, token: string): Promise<void> {
  const res = await fetch(`${apiBase(templateId)}/${taskId}`, {
    method: "DELETE",
    headers: headers(token),
  });
  if (!res.ok) throw new Error(`deleteTask failed: ${res.status}`);
}
