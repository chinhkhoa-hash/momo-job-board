import { SAMPLE_BRANDS } from "../jobs/sample";
import { todayVN } from "../jobs/format";
import type { EmploymentType, JobLocation, SalaryType } from "../jobs/types";
import { getApp, getJob, listApps, listJobs, saveApp, saveCv, saveJob } from "../store/db";
import { brandStores } from "../store/seed";
import { canAccessBrand } from "./auth";
import type { Application, AppStatus, JobStatus, SessionUser, StoredJob } from "./model";
import { CLOSED, NEXT, PIPELINE, REJECT_REASONS, ageDays, applyCode, furthestStage, isOverdue } from "./status";

export class PortalError extends Error {}

export const brandsFor = (u: SessionUser) =>
  SAMPLE_BRANDS.filter((b) => u.role === "admin" || b.slug === u.brandSlug);
export const brandName = (slug: string) => SAMPLE_BRANDS.find((b) => b.slug === slug)?.name ?? slug;
export const storesOf = (slug: string): JobLocation[] => brandStores()[slug] ?? [];

/** Tin hết hạn nộp được coi là đã đóng, kể cả khi chưa ai đổi trạng thái. */
export const effectiveStatus = (j: StoredJob): JobStatus =>
  j.status === "live" && j.deadline < todayVN() ? "expired" : j.status;

export async function scopedJobs(u: SessionUser) {
  return (await listJobs()).filter((j) => canAccessBrand(u, j.brandSlug));
}
export async function scopedApps(u: SessionUser) {
  return (await listApps()).filter((a) => canAccessBrand(u, a.brandSlug));
}

export async function loadJob(u: SessionUser, id: string) {
  const j = await getJob(id);
  if (!j || !canAccessBrand(u, j.brandSlug)) return null;
  return j;
}
export async function loadApp(u: SessionUser, id: string) {
  const a = await getApp(id);
  if (!a || !canAccessBrand(u, a.brandSlug)) return null;
  return a;
}

/* ---------- Thống kê ---------- */

export type BrandRow = {
  slug: string; name: string; liveJobs: number; apps: number; untouched: number; overdue: number;
  interviewed: number; onboarded: number; updatedRate: number;
};

export async function dashboard(u: SessionUser) {
  const [jobs, apps] = await Promise.all([scopedJobs(u), scopedApps(u)]);
  const now = Date.now();
  const funnel = PIPELINE.map((s, i) => ({ status: s, count: apps.filter((a) => furthestStage(a.history) >= i).length }));
  const byBrand: BrandRow[] = brandsFor(u).map((b) => {
    const as = apps.filter((a) => a.brandSlug === b.slug);
    const untouched = as.filter((a) => a.status === "new_applied").length;
    return {
      slug: b.slug, name: b.name,
      liveJobs: jobs.filter((j) => j.brandSlug === b.slug && effectiveStatus(j) === "live").length,
      apps: as.length, untouched,
      overdue: as.filter((a) => isOverdue(a, now)).length,
      interviewed: as.filter((a) => furthestStage(a.history) >= 2).length,
      onboarded: as.filter((a) => a.status === "onboarded").length,
      updatedRate: as.length ? (as.length - untouched) / as.length : 0,
    };
  });
  const last7 = apps.filter((a) => ageDays(a.createdAt, now) < 7).length;
  const overdueList = apps.filter((a) => isOverdue(a, now)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return {
    liveJobs: jobs.filter((j) => effectiveStatus(j) === "live").length,
    draftJobs: jobs.filter((j) => j.status === "draft").length,
    totalApps: apps.length,
    last7,
    overdue: overdueList.length,
    overdueList: overdueList.slice(0, 8),
    onboarded: apps.filter((a) => a.status === "onboarded").length,
    funnel,
    byBrand,
    closedRate: apps.length ? apps.filter((a) => CLOSED.includes(a.status)).length / apps.length : 0,
  };
}

/* ---------- Tin tuyển dụng ---------- */

const TYPES: EmploymentType[] = ["part_time", "full_time", "shift", "seasonal"];
const SALARY: SalaryType[] = ["hourly", "shift", "monthly", "negotiable"];
const lines = (v: FormDataEntryValue | null) =>
  String(v ?? "").split(/\r?\n/).map((s) => s.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
const num = (v: FormDataEntryValue | null) => {
  const n = Number(String(v ?? "").replace(/[.,\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

export type FieldErrors = Record<string, string>;

export async function saveJobFromForm(u: SessionUser, fd: FormData): Promise<{ job?: StoredJob; errors?: FieldErrors }> {
  const id = String(fd.get("id") ?? "");
  const existing = id ? await loadJob(u, id) : null;
  if (id && !existing) throw new PortalError("Không tìm thấy tin hoặc bạn không có quyền sửa tin này.");

  const brandSlug = u.role === "admin" ? String(fd.get("brandSlug") ?? existing?.brandSlug ?? "") : u.brandSlug!;
  const errors: FieldErrors = {};
  if (!SAMPLE_BRANDS.some((b) => b.slug === brandSlug)) errors.brandSlug = "Chọn thương hiệu.";

  const title = String(fd.get("title") ?? "").trim();
  if (title.length < 3 || title.length > 120) errors.title = "Tên vị trí từ 3 đến 120 ký tự.";
  const employmentType = String(fd.get("employmentType")) as EmploymentType;
  if (!TYPES.includes(employmentType)) errors.employmentType = "Chọn loại hình.";
  const salaryType = String(fd.get("salaryType")) as SalaryType;
  if (!SALARY.includes(salaryType)) errors.salaryType = "Chọn cách tính lương.";
  const salaryMin = num(fd.get("salaryMin"));
  const salaryMax = num(fd.get("salaryMax"));
  if (salaryType !== "negotiable" && !salaryMin && !salaryMax) errors.salary = "Nhập ít nhất một mức lương, hoặc chọn Thoả thuận.";
  if (salaryMin && salaryMax && salaryMin > salaryMax) errors.salary = "Lương tối thiểu đang lớn hơn tối đa.";

  const storeKeys = fd.getAll("stores").map(String);
  const all = storesOf(brandSlug);
  const locations = all.filter((s) => storeKeys.includes(`${s.name}|${s.district}`));
  if (!locations.length) errors.stores = "Chọn ít nhất một cửa hàng.";

  const description = lines(fd.get("description"));
  if (!description.length) errors.description = "Mô tả ít nhất một đầu việc.";
  const deadline = String(fd.get("deadline") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) errors.deadline = "Chọn hạn nộp.";
  else if (deadline < todayVN() && !existing) errors.deadline = "Hạn nộp phải từ hôm nay trở đi.";

  const directUrl = String(fd.get("directUrl") ?? "").trim();
  if (directUrl && !/^https:\/\/\S+$/.test(directUrl)) errors.directUrl = "Link phải bắt đầu bằng https://";

  if (Object.keys(errors).length) return { errors };

  const intent = String(fd.get("intent") ?? "save");
  const now = new Date().toISOString();
  const status: JobStatus = intent === "publish" ? "live" : intent === "draft" ? "draft" : existing?.status ?? "draft";
  const job: StoredJob = {
    ...(existing ?? {}),
    id: existing?.id ?? `job-${crypto.randomUUID().slice(0, 8)}`,
    brandSlug,
    title,
    employmentType,
    salaryType,
    salaryMin: salaryType === "negotiable" ? undefined : salaryMin,
    salaryMax: salaryType === "negotiable" ? undefined : salaryMax,
    schedule: String(fd.get("schedule") ?? "").trim() || undefined,
    experience: String(fd.get("experience") ?? "").trim() || undefined,
    careerTitle: String(fd.get("careerTitle") ?? "").trim() || undefined,
    description,
    requirements: lines(fd.get("requirements")),
    benefits: lines(fd.get("benefits")),
    locations,
    deadline,
    directUrl: directUrl || undefined,
    requireEmail: fd.get("requireEmail") === "on",
    requireCv: fd.get("requireCv") === "on",
    postedAt: status === "live" && existing?.status !== "live" ? now.slice(0, 10) : existing?.postedAt ?? now.slice(0, 10),
    status,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    createdBy: existing?.createdBy ?? u.username,
    sortOrder: existing?.sortOrder ?? 50,
  };
  await saveJob(job);
  return { job };
}

export async function setJobStatus(u: SessionUser, id: string, to: JobStatus, reason?: string) {
  const j = await loadJob(u, id);
  if (!j) throw new PortalError("Không tìm thấy tin.");
  const now = new Date().toISOString();
  if (u.role === "admin" && to === "paused" && reason) {
    j.moderation = { action: "pause", reason, by: u.username, at: now };
  }
  if (to === "live") {
    if (j.deadline < todayVN()) throw new PortalError("Tin đã quá hạn nộp. Sửa hạn nộp trước khi đăng lại.");
    if (j.status !== "live") j.postedAt = now.slice(0, 10);
    if (u.role === "admin") delete j.moderation;
  }
  j.status = to;
  j.updatedAt = now;
  await saveJob(j);
  return j;
}

/* ---------- Hồ sơ ---------- */

export async function changeStatus(
  u: SessionUser,
  id: string,
  to: AppStatus,
  opts: { note?: string; onboardDate?: string; rejectReason?: string },
) {
  const a = await loadApp(u, id);
  if (!a) throw new PortalError("Không tìm thấy hồ sơ.");
  if (!NEXT[a.status].includes(to)) throw new PortalError("Không chuyển được sang trạng thái này từ trạng thái hiện tại.");
  if (to === "onboarded" && !/^\d{4}-\d{2}-\d{2}$/.test(opts.onboardDate ?? "")) throw new PortalError("Nhập ngày ứng viên bắt đầu đi làm.");
  if (to === "rejected" && !REJECT_REASONS.includes(opts.rejectReason ?? "")) throw new PortalError("Chọn lý do không phù hợp.");
  const now = new Date().toISOString();
  const note = [to === "rejected" ? opts.rejectReason : null, opts.note?.trim()].filter(Boolean).join(" · ") || undefined;
  a.history.push({ at: now, by: u.username, to, ...(note ? { note: note.slice(0, 500) } : {}) });
  a.status = to;
  a.updatedAt = now;
  if (to === "onboarded") a.onboardDate = opts.onboardDate;
  if (to === "rejected") a.rejectReason = opts.rejectReason;
  await saveApp(a);
  return a;
}

export async function revealPhone(u: SessionUser, id: string) {
  const a = await loadApp(u, id);
  if (!a) throw new PortalError("Không tìm thấy hồ sơ.");
  a.phoneReveals.push({ by: u.username, at: new Date().toISOString() });
  await saveApp(a);
  return a.phone;
}

/* ---------- Ứng viên nộp hồ sơ (từ trang /jobs) ---------- */

export const CV_MAX_BYTES = 2 * 1024 * 1024;

export async function createApplication(input: {
  jobId: string; fullName: string; phone: string; email?: string; contactTime?: string;
  cv?: { name: string; type: string; bytes: ArrayBuffer };
}) {
  const job = await getJob(input.jobId);
  if (!job || effectiveStatus(job) !== "live") throw new PortalError("Tin đã đóng hoặc không tồn tại.");
  // Chống nộp trùng: cùng SĐT vào cùng tin trong 24 giờ -> trả lại hồ sơ cũ.
  const dup = (await listApps()).find(
    (a) => a.jobId === job.id && a.phone === input.phone && Date.now() - Date.parse(a.createdAt) < 86_400_000,
  );
  if (dup) return { app: dup, duplicate: true };

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  let cv: Application["cv"];
  if (input.cv) {
    const cvId = crypto.randomUUID();
    await saveCv(cvId, { name: input.cv.name, type: input.cv.type, base64: Buffer.from(input.cv.bytes).toString("base64") });
    cv = { id: cvId, name: input.cv.name, size: input.cv.bytes.byteLength, type: input.cv.type };
  }
  const app: Application = {
    id, jobId: job.id, brandSlug: job.brandSlug, jobTitle: job.title,
    fullName: input.fullName, phone: input.phone, email: input.email, contactTime: input.contactTime, cv,
    status: "new_applied", createdAt: now, updatedAt: now,
    history: [{ at: now, by: "ứng viên", to: "new_applied" }], phoneReveals: [],
  };
  await saveApp(app);
  return { app, duplicate: false };
}

/* ---------- Xuất CSV ---------- */

const csvCell = (v: unknown) => {
  const s = String(v ?? "");
  // Chặn công thức Excel (CSV injection) và escape dấu nháy.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export function toCsv(apps: Application[], labels: Record<AppStatus, string>) {
  const head = ["ApplyID", "Thương hiệu", "Vị trí", "Họ tên", "Số điện thoại", "Email", "Thời gian liên lạc", "Trạng thái", "Lý do", "Ngày đi làm", "Ngày nộp", "Cập nhật lần cuối"];
  const rows = apps.map((a) => [
    applyCode(a.id), brandName(a.brandSlug), a.jobTitle, a.fullName, a.phone, a.email ?? "", a.contactTime ?? "",
    labels[a.status], a.rejectReason ?? "", a.onboardDate ?? "", a.createdAt.slice(0, 10), a.updatedAt.slice(0, 10),
  ]);
  return "\uFEFF" + [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
}
