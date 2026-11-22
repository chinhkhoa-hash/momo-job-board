import { getConfig } from "./config";
import { createPartnerClient, type PartnerClient } from "./partner";
import { createHrmClient, type HrmClient } from "./hrm";
import { mockHrm, mockPartner, mockWatchedJobs } from "./mock";
import type { Application, HrmPayload, ItemOutcome, ItemState, Job, JobOutcome, RelayReport } from "./types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function maskPhone(p: string) {
  const d = p.replace(/\s+/g, "");
  return d.length <= 6 ? "***" : `${d.slice(0, 4)}***${d.slice(-3)}`;
}

export function maskEmail(e: string | null | undefined) {
  if (!e) return null;
  const [u, dom] = e.split("@");
  if (!dom) return `${u.slice(0, 2)}***@`;
  return `${u.slice(0, 2)}***@${dom}`;
}

/** Ghép link CV tương đối (vd /api/cv/123) thành link đầy đủ theo domain của Partner API. */
function absoluteCv(cvUrl: string | null | undefined, partnerBaseUrl: string) {
  if (!cvUrl) return undefined;
  try {
    return new URL(cvUrl, new URL(partnerBaseUrl).origin).toString();
  } catch {
    return undefined;
  }
}

/** Chuyển hồ sơ Partner API sang body webhook HRM. Trả về lý do chặn nếu thiếu dữ liệu bắt buộc. */
export function toHrmPayload(
  a: Application,
  job: Job,
  partnerBaseUrl: string,
): { payload?: HrmPayload; reason?: string } {
  const email = a.applicantEmail?.trim() ?? "";
  if (!email) return { reason: "Thiếu email — HRM bắt buộc email" };
  if (!EMAIL_RE.test(email)) return { reason: "Email sai định dạng" };
  if (!a.applicantPhone?.trim()) return { reason: "Thiếu số điện thoại" };
  if (!a.applicantName?.trim()) return { reason: "Thiếu họ tên" };

  const applied = Date.parse(a.appliedAt);
  return {
    payload: {
      external_application_id: a.id,
      external_job_id: job.internalId, // HRM tra tin theo internalId của MoMo
      full_name: a.applicantName.trim(),
      email,
      phone: a.applicantPhone.trim(),
      cv_url: absoluteCv(a.cvUrl, partnerBaseUrl),
      cover_letter: a.coverLetter ?? undefined,
      applied_at: Number.isFinite(applied) ? Math.floor(applied / 1000) : undefined,
    },
  };
}

function clients(): { partner: PartnerClient; hrm: HrmClient; jobs: { merchantExternalId: string; jobExternalId: string }[]; mode: "demo" | "live"; partnerBaseUrl: string; markImported: boolean } {
  const cfg = getConfig();
  if (cfg.mock) {
    return { partner: mockPartner, hrm: mockHrm, jobs: mockWatchedJobs, mode: "demo", partnerBaseUrl: "https://merchant-job-board.vercel.app/api/v1/partner", markImported: true };
  }
  return {
    partner: createPartnerClient(cfg),
    hrm: createHrmClient(cfg),
    jobs: cfg.jobs,
    mode: "live",
    partnerBaseUrl: cfg.partnerBaseUrl,
    markImported: cfg.markImported,
  };
}

/**
 * Một lượt chuyển hồ sơ: lấy hồ sơ chưa import từ Partner API -> gửi webhook HRM -> đánh dấu imported.
 * dryRun = true chỉ kiểm tra, không gửi gì.
 * Hồ sơ bị chặn hoặc gửi lỗi KHÔNG bị đánh dấu imported, để lượt sau thử lại.
 */
export async function runRelay({ dryRun }: { dryRun: boolean }): Promise<RelayReport> {
  const { partner, hrm, jobs, mode, partnerBaseUrl, markImported } = clients();
  const items: ItemOutcome[] = [];
  const jobOutcomes: JobOutcome[] = [];

  for (const w of jobs) {
    const jo: JobOutcome = { ...w, pending: 0 };
    jobOutcomes.push(jo);
    let job: Job;
    let apps: Application[];
    try {
      job = await partner.getJob(w.merchantExternalId, w.jobExternalId);
      jo.title = job.title;
      jo.internalId = job.internalId;
      apps = await partner.listPending(w.merchantExternalId, w.jobExternalId);
      jo.pending = apps.length;
    } catch (e) {
      jo.error = (e as Error).message;
      continue;
    }

    const sentIds: string[] = [];
    for (const a of apps) {
      const base = {
        applicationId: a.id,
        applicantName: a.applicantName,
        phoneMasked: maskPhone(a.applicantPhone ?? ""),
        emailMasked: maskEmail(a.applicantEmail),
        appliedAt: a.appliedAt,
        jobTitle: job.title,
        merchantExternalId: w.merchantExternalId,
      };
      const { payload, reason } = toHrmPayload(a, job, partnerBaseUrl);
      if (!payload) {
        items.push({ ...base, state: "blocked", reason });
        continue;
      }
      if (dryRun) {
        items.push({ ...base, state: "ready" });
        continue;
      }
      const r = await hrm.push(payload);
      if (r.ok) {
        sentIds.push(a.id);
        items.push({ ...base, state: "sent", hrmId: r.id, trackId: r.trackId });
      } else {
        items.push({ ...base, state: "failed", reason: `HRM ${r.status || "mạng"}: ${r.message}`, trackId: r.trackId });
      }
    }

    if (!dryRun && markImported && sentIds.length) {
      try {
        jo.markedImported = await partner.markImported(w.merchantExternalId, w.jobExternalId, sentIds);
      } catch (e) {
        // HRM đã nhận; lần sau gửi lại cũng không tạo trùng (idempotent), nên chỉ ghi nhận lỗi.
        jo.error = `Đã gửi HRM nhưng chưa đánh dấu imported: ${(e as Error).message}`;
      }
    }
  }

  const counts = { ready: 0, blocked: 0, sent: 0, failed: 0 } as Record<ItemState, number>;
  items.forEach((i) => counts[i.state]++);
  items.sort((x, y) => Date.parse(y.appliedAt) - Date.parse(x.appliedAt));

  return { mode, dryRun, ranAt: new Date().toISOString(), jobs: jobOutcomes, items, counts };
}
