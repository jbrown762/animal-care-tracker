export type CareStatus = "current" | "due_soon" | "overdue" | "log_only";

type TaskTimingInput = {
  animalCreatedAt: string;
  dueSoonDays: number;
  intervalDays: number;
  lastCompletedAt?: string | null;
  now?: Date;
};

export function getTaskStatus(input: TaskTimingInput): CareStatus {
  if (input.intervalDays === 0) {
    return "log_only";
  }

  const now = input.now ?? new Date();
  const start = input.lastCompletedAt
    ? new Date(input.lastCompletedAt)
    : new Date(input.animalCreatedAt);
  const intervalMs = input.intervalDays * 86_400_000;
  const graceMultiplier = input.lastCompletedAt ? 1 : 2;
  const nextDue = new Date(start.getTime() + intervalMs * graceMultiplier);
  const dueSoonAt = new Date(nextDue.getTime() - input.dueSoonDays * 86_400_000);

  if (now >= nextDue) {
    return "overdue";
  }

  if (now >= dueSoonAt) {
    return "due_soon";
  }

  return "current";
}
