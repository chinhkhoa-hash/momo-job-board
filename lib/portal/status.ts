import type { AppStatus, JobStatus } from "./model";

export const APP_STATUS: Record<AppStatus, { label: string; tone: "new" | "progress" | "good" | "bad" | "muted" }> = {
  new_applied: { label: "Mới nộp", tone: "new" },
  reviewing: { label: "Đang xem xét", tone: "progress" },
  interviewed: { label: "Đã phỏng vấn", tone: "progress" },
  accepted: { label: "Đã nhận", tone: "good" },
  onboarded: { label: "Đã đi làm", tone: "good" },
  rejected: { label: "Không phù hợp", tone: "bad" },
  not_reachable: { label: "Không liên hệ được", tone: "muted" },
  wrong_phone: { label: "Sai số điện thoại", tone: "muted" },
  withdrawn: { label: "Ứng viên rút", tone: "muted" },
};

/** Các bước tiến của hồ sơ, theo thứ tự. Dùng để vẽ phễu và để biết hồ sơ "đã từng tới" bước nào. */
export const PIPELINE: AppStatus[] = ["new_applied", "reviewing", "interviewed", "accepted", "onboarded"];
export const CLOSED: AppStatus[] = ["onboarded", "rejected", "not_reachable", "wrong_phone", "withdrawn"];

/** Bước tiếp theo hợp lệ từ mỗi trạng thái (cho phép sửa lùi một bước khi bấm nhầm). */
export const NEXT: Record<AppStatus, AppStatus[]> = {
  new_applied: ["reviewing", "interviewed", "rejected", "not_reachable", "wrong_phone", "withdrawn"],
  reviewing: ["interviewed", "accepted", "rejected", "not_reachable", "wrong_phone", "withdrawn", "new_applied"],
  interviewed: ["accepted", "rejected", "withdrawn", "reviewing"],
  accepted: ["onboarded", "withdrawn", "interviewed"],
  onboarded: ["accepted"],
  rejected: ["reviewing"],
  not_reachable: ["reviewing", "rejected"],
  wrong_phone: ["reviewing"],
  withdrawn: ["reviewing"],
};

export const REJECT_REASONS = [
  "Không đáp ứng yêu cầu",
  "Không phù hợp khu vực/ca làm",
  "Đã tuyển đủ",
  "Ứng viên không đến phỏng vấn",
  "Khác",
];

/** Cam kết với ứng viên trong FAQ: nhà tuyển dụng liên hệ trong 7 ngày làm việc. Dùng 7 ngày lịch cho đơn giản. */
export const SLA_DAYS = 7;

export const JOB_STATUS: Record<JobStatus, { label: string; tone: "good" | "muted" | "bad" | "new" }> = {
  draft: { label: "Nháp", tone: "muted" },
  live: { label: "Đang tuyển", tone: "good" },
  paused: { label: "Tạm dừng", tone: "new" },
  expired: { label: "Đã đóng", tone: "muted" },
};

export const ageDays = (iso: string, now = Date.now()) => Math.floor((now - Date.parse(iso)) / 86_400_000);
export const isOverdue = (a: { status: AppStatus; createdAt: string }, now = Date.now()) =>
  a.status === "new_applied" && ageDays(a.createdAt, now) >= SLA_DAYS;

/** Bước xa nhất trong PIPELINE mà hồ sơ từng tới, dựa vào lịch sử. */
export function furthestStage(history: { to: AppStatus }[]): number {
  let max = 0;
  for (const h of history) max = Math.max(max, PIPELINE.indexOf(h.to));
  return max;
}

export const applyCode = (id: string) => `MJ-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
