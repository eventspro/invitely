/**
 * requestTracker — deterministic startup readiness tracker.
 *
 * Usage:
 *   import { trackPromise, getPendingLabels, subscribe } from "@/lib/requestTracker";
 *
 *   const result = await trackPromise("translations", fetch("/api/translations").then(r => r.json()));
 *
 * The tracker records which named promises are still in-flight.
 * The loader stays visible until every tracked promise resolves or rejects.
 */

type Subscriber = (labels: string[]) => void;

const pending = new Map<string, number>(); // label → count (supports parallel calls with same label)
const subscribers = new Set<Subscriber>();

function notify() {
  const labels = Array.from(pending.keys());
  subscribers.forEach(cb => { try { cb(labels); } catch {} });
}

/**
 * Wrap a promise so it is tracked by label.
 * Multiple concurrent calls with the same label increment a counter.
 */
export function trackPromise<T>(label: string, promise: Promise<T>): Promise<T> {
  const prev = pending.get(label) ?? 0;
  pending.set(label, prev + 1);
  notify();

  return promise.finally(() => {
    const current = pending.get(label) ?? 1;
    if (current <= 1) {
      pending.delete(label);
    } else {
      pending.set(label, current - 1);
    }
    notify();
  });
}

/** Number of currently in-flight tracked promises. */
export function getPendingCount(): number {
  return pending.size;
}

/** Labels of currently in-flight tracked promises. */
export function getPendingLabels(): string[] {
  return Array.from(pending.keys());
}

/**
 * Subscribe to changes in the pending set.
 * Callback receives the current list of pending labels.
 * Returns an unsubscribe function.
 */
export function subscribe(cb: Subscriber): () => void {
  subscribers.add(cb);
  // Fire immediately with current state
  try { cb(getPendingLabels()); } catch {}
  return () => { subscribers.delete(cb); };
}
