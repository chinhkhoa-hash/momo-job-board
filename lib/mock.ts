import type { Application, HrmPayload, HrmResult, Job, WatchedJob } from "./types";
import type { PartnerClient } from "./partner";
import { PartnerError } from "./partner";
import type { HrmClient } from "./hrm";

/**
 * Dữ liệu giả cho chế độ DEMO. Mọi tên, số điện thoại, email đều là giả.
 * Trạng thái lưu trong bộ nhớ của server: tự reset khi Vercel khởi động lại function.
 */
const JOBS: Job[] = [
  { merchantExternalId: "ipos-jollibee", jobExternalId: "ipos-job-1021", internalId: "6f1c2a90-5b1e-4f0a-9c11-0a1b2c3d4e01", title: "Nhân viên phục vụ – Quận 1", status: "live" },
  { merchantExternalId: "ipos-7eleven", jobExternalId: "ipos-job-2207", internalId: "6f1c2a90-5b1e-4f0a-9c11-0a1b2c3d4e02", title: "Nhân viên bán hàng ca tối – Bình Thạnh", status: "live" },
  { merchantExternalId: "ipos-katinat", jobExternalId: "ipos-job-3310", internalId: "6f1c2a90-5b1e-4f0a-9c11-0a1b2c3d4e03", title: "Pha chế – Thủ Đức", status: "live" },
];

/** Tin này giả lập trường hợp HRM đã tắt kênh MoMo -> webhook trả 404. */
const HRM_CHANNEL_OFF = new Set(["6f1c2a90-5b1e-4f0a-9c11-0a1b2c3d4e03"]);

const app = (
  id: string, job: Job, name: string, email: string | null, phone: string, appliedAt: string, cv = true,
): Application => ({
  id, jobPostId: job.internalId, applicantName: name, applicantEmail: email, applicantPhone: phone,
  cvUrl: cv ? `/api/cv/${id}` : null, coverLetter: null, importStatus: "new", appliedAt,
});

const [J1, J2, J3] = JOBS;
const APPS: Application[] = [
  app("a7d3e1c0-0001-4c2b-9e10-000000000001", J1, "Trần Minh Thư", "minhthu.tran@example.com", "0901234501", "2026-11-22T02:15:00.000Z"),
  app("a7d3e1c0-0002-4c2b-9e10-000000000002", J1, "Lê Quốc Huy", null, "0901234502", "2026-11-22T06:40:00.000Z", false),
  app("a7d3e1c0-0003-4c2b-9e10-000000000003", J1, "Phạm Ngọc Hân", "ngochan.pham@example.com", "0901234503", "2026-11-23T01:05:00.000Z"),
  app("a7d3e1c0-0004-4c2b-9e10-000000000004", J2, "Nguyễn Gia Bảo", "giabao.ng@example.com", "0901234504", "2026-11-21T13:20:00.000Z"),
  app("a7d3e1c0-0005-4c2b-9e10-000000000005", J2, "Võ Thanh Trúc", "thanhtruc.vo@example.com", "0901234505", "2026-11-22T15:55:00.000Z", false),
  app("a7d3e1c0-0006-4c2b-9e10-000000000006", J2, "Đặng Hoài An", "an.dang@", "0901234506", "2026-11-23T03:30:00.000Z"),
  app("a7d3e1c0-0007-4c2b-9e10-000000000007", J3, "Hồ Bảo Ngọc", "baongoc.ho@example.com", "0901234507", "2026-11-22T09:10:00.000Z"),
];

type MockState = { imported: Set<string>; hrm: Map<string, string> };
const g = globalThis as unknown as { __relayMock?: MockState };
const state: MockState = (g.__relayMock ??= { imported: new Set(), hrm: new Map() });

export const mockWatchedJobs: WatchedJob[] = JOBS.map(({ merchantExternalId, jobExternalId }) => ({
  merchantExternalId, jobExternalId,
}));

export function resetMock() {
  state.imported.clear();
  state.hrm.clear();
}

export const mockPartner: PartnerClient = {
  async getJob(m, j) {
    const job = JOBS.find((x) => x.merchantExternalId === m && x.jobExternalId === j);
    if (!job) throw new PartnerError(404, "Partner API 404: Job not found");
    return job;
  },
  async listPending(m, j) {
    const job = await this.getJob(m, j);
    return APPS.filter((a) => a.jobPostId === job.internalId && !state.imported.has(a.id));
  },
  async markImported(_m, _j, ids) {
    ids.forEach((id) => state.imported.add(id));
    return ids.length;
  },
};

export const mockHrm: HrmClient = {
  async push(p: HrmPayload): Promise<HrmResult> {
    const trackId = `demo-${p.external_application_id.slice(-4)}-${Date.now().toString(36)}`;
    if (HRM_CHANNEL_OFF.has(p.external_job_id)) {
      return { ok: false, status: 404, message: "Không tìm thấy tin tuyển dụng với external_job_id này", trackId };
    }
    let id = state.hrm.get(p.external_application_id);
    if (!id) {
      id = `hrm-${p.external_application_id.slice(-6)}`;
      state.hrm.set(p.external_application_id, id);
    }
    return { ok: true, id, stage: "NEW", trackId };
  },
};
