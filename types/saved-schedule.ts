import type { schedule } from '@/types/planner-result';

/**
 * Firestore document shape stored at `users/{uid}/savedSchedules/{scheduleId}`.
 * `ownerUid` is required for rules-level owner enforcement.
 */
export interface SavedScheduleDoc {
  ownerUid: string;
  title: string;
  schedule: schedule;
  createdAt: unknown;
  updatedAt: unknown;
}
