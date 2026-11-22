import type { JobPost } from "../jobs/types";

export type JobStatus = "draft" | "live" | "paused" | "expired";
export type Moderation = { action: "pause" | "unpublish"; reason: string; by: string; at: string };

export type StoredJob = JobPost & {
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  moderation?: Moderation;
};

/**
 * Trạng thái hồ sơ: giữ nguyên enum ApplicantStatus của hệ thống cũ,
 * thêm "onboarded" (đã đi làm) để đo được view → hire, và "withdrawn" (ứng viên rút).
 */
export type AppStatus =
  | "new_applied"
  | "reviewing"
  | "interviewed"
  | "accepted"
  | "onboarded"
  | "rejected"
  | "not_reachable"
  | "wrong_phone"
  | "withdrawn";

export type HistoryEntry = { at: string; by: string; to: AppStatus; note?: string };

export type Application = {
  id: string;
  jobId: string;
  brandSlug: string;
  jobTitle: string;
  fullName: string;
  phone: string;
  email?: string;
  contactTime?: string;
  cv?: { id: string; name: string; size: number; type: string };
  status: AppStatus;
  createdAt: string;
  updatedAt: string;
  onboardDate?: string;
  rejectReason?: string;
  history: HistoryEntry[];
  phoneReveals: { by: string; at: string }[];
};

export type Role = "admin" | "merchant";
export type SessionUser = { username: string; name: string; role: Role; brandSlug?: string };
