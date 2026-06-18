import crypto from "crypto";
import { Client } from "@upstash/qstash";

export interface TaskReminderPayload {
  taskId: string;
  reminderToken: string;
  reminderVersion: number;
}

const qstashClient = process.env.QSTASH_TOKEN
  ? new Client({ token: process.env.QSTASH_TOKEN })
  : null;

const FALLBACK_CALLBACK_PATH = "/api/planner/reminders/qstash-callback";

export function resolveQStashCallbackPath(): string {
  const configured = process.env.QSTASH_CALLBACK_URL;
  if (!configured) return FALLBACK_CALLBACK_PATH;

  try {
    const parsed = new URL(configured);
    return parsed.pathname || FALLBACK_CALLBACK_PATH;
  } catch {
    return configured.startsWith("/") ? configured : FALLBACK_CALLBACK_PATH;
  }
}

export function resolveQStashCallbackUrl(): string | null {
  const configured = process.env.QSTASH_CALLBACK_URL;
  if (!configured) return null;
  return configured;
}

export function isQStashConfigured(): boolean {
  return Boolean(
    qstashClient
    && process.env.QSTASH_CALLBACK_URL
    && process.env.QSTASH_CURRENT_SIGNING_KEY
    && process.env.QSTASH_NEXT_SIGNING_KEY,
  );
}

export function createReminderToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

/** Enqueues a one-time reminder. Returns the QStash messageId. */
export async function enqueueOneTimeReminder(
  payload: TaskReminderPayload,
  dueAtUtc: Date,
): Promise<string> {
  if (!qstashClient) {
    throw new Error("QStash token is not configured (QSTASH_TOKEN missing)");
  }

  const callbackUrl = resolveQStashCallbackUrl();
  if (!callbackUrl) {
    throw new Error("QSTASH_CALLBACK_URL is not configured");
  }

  const delayMs = Math.max(0, dueAtUtc.getTime() - Date.now());
  const delaySeconds = Math.ceil(delayMs / 1000);

  const result = await qstashClient.publishJSON({
    url: callbackUrl,
    body: payload,
    ...(delaySeconds > 0 ? { delay: delaySeconds } : {}),
  });

  return result.messageId;
}
