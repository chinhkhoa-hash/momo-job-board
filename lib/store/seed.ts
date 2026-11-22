import { SAMPLE_BRANDS, SAMPLE_JOBS } from "../jobs/sample";
import type { JobLocation } from "../jobs/types";
import type { Application, AppStatus, HistoryEntry, StoredJob } from "../portal/model";

const DAY = 86_400_000;
const REF = Date.parse("2026-11-23T00:00:00Z"); // ngày gốc của dữ liệu mẫu

/** Random cố định theo seed để dữ liệu demo giống nhau mỗi lần tạo. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const shiftYmd = (ymd: string, days: number) => new Date(Date.parse(ymd) + days * DAY).toISOString().slice(0, 10);

/** Danh sách cửa hàng của từng thương hiệu, lấy từ địa điểm trong tin mẫu. */
export function brandStores(): Record<string, JobLocation[]> {
  const out: Record<string, JobLocation[]> = {};
  for (const j of SAMPLE_JOBS) {
    const list = (out[j.brandSlug] ??= []);
    for (const l of j.locations) if (!list.some((x) => x.name === l.name && x.district === l.district)) list.push(l);
  }
  return out;
}

const FIRST = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ"];
const MID = ["Minh", "Thanh", "Ngọc", "Gia", "Quốc", "Thu", "Hoài", "Bảo", "Anh", "Khánh"];
const LAST = ["An", "Bình", "Châu", "Dương", "Hân", "Huy", "Khoa", "Linh", "My", "Nam", "Phúc", "Quân", "Thảo", "Trúc", "Vy"];

export function buildSeed(now = Date.now()) {
  const shift = Math.round((now - REF) / DAY);
  const iso = (t: number) => new Date(t).toISOString();

  const jobs: StoredJob[] = SAMPLE_JOBS.map((j) => ({
    ...j,
    postedAt: shiftYmd(j.postedAt, shift),
    deadline: shiftYmd(j.deadline, shift),
    status: "live",
    createdAt: `${shiftYmd(j.postedAt, shift)}T02:00:00.000Z`,
    updatedAt: `${shiftYmd(j.postedAt, shift)}T02:00:00.000Z`,
    createdBy: `${j.brandSlug}_demo`,
  }));
  // Một tin nháp và một tin bị MoMo tạm dừng để demo đủ trạng thái.
  jobs.push({
    ...jobs[0], id: "jb-2009", title: "Nhân viên giao hàng", status: "draft", employmentType: "part_time",
    salaryType: "hourly", salaryMin: 27000, salaryMax: 30000, sortOrder: 9,
  });
  const paused = jobs.find((j) => j.id === "kfm-7102");
  if (paused) {
    paused.status = "paused";
    paused.moderation = { action: "pause", reason: "Mức lương trong tin chưa khớp với hợp đồng đã ký, cần merchant cập nhật.", by: "momo_admin", at: iso(now - 2 * DAY) };
  }

  const r = rng(20261123);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const brandWeight: Record<string, number> = { "jollibee-viet-nam": 14, "7-eleven-viet-nam": 12, katinat: 8, "the-coffee-house": 6, "phe-la": 4, "king-food-mart": 3, "trung-tam-anh-ngu-apollo": 2, momo: 2 };
  // Mức độ merchant cập nhật trạng thái: phản ánh thực tế "nhiều hồ sơ kẹt ở trạng thái mới".
  const diligence: Record<string, number> = { "jollibee-viet-nam": 0.45, "7-eleven-viet-nam": 0.85, katinat: 0.7, "the-coffee-house": 0.3, "phe-la": 0.9, "king-food-mart": 0.2, "trung-tam-anh-ngu-apollo": 1, momo: 1 };

  const apps: Application[] = [];
  let n = 0;
  for (const job of jobs.filter((j) => j.status !== "draft" && !j.directUrl)) {
    const count = Math.max(1, Math.round((brandWeight[job.brandSlug] ?? 2) * (0.5 + r()) / 2.5));
    for (let i = 0; i < count; i++) {
      n++;
      const created = now - Math.floor(r() * 21 * DAY) - Math.floor(r() * 10 * 3_600_000);
      const name = `${pick(FIRST)} ${pick(MID)} ${pick(LAST)}`;
      const history: HistoryEntry[] = [{ at: iso(created), by: "ứng viên", to: "new_applied" }];
      const by = `${job.brandSlug}_demo`;
      let status: AppStatus = "new_applied";
      let t = created;
      const step = (to: AppStatus, note?: string) => {
        t = Math.min(now - 3_600_000, t + (0.5 + r() * 3) * DAY);
        history.push({ at: iso(t), by, to, ...(note ? { note } : {}) });
        status = to;
      };
      let rejectReason: string | undefined;
      let onboardDate: string | undefined;
      if (r() < (diligence[job.brandSlug] ?? 0.5)) {
        const x = r();
        if (x < 0.12) step("wrong_phone");
        else if (x < 0.22) step("not_reachable");
        else {
          step("reviewing");
          const y = r();
          if (y < 0.3) { rejectReason = pick(["Không đáp ứng yêu cầu", "Không phù hợp khu vực/ca làm"]); step("rejected", rejectReason); }
          else if (y > 0.45) {
            step("interviewed", "Hẹn phỏng vấn tại cửa hàng");
            const z = r();
            if (z < 0.3) { rejectReason = "Ứng viên không đến phỏng vấn"; step("rejected", rejectReason); }
            else if (z > 0.45) {
              step("accepted");
              if (r() > 0.4) { step("onboarded"); onboardDate = iso(t).slice(0, 10); }
            }
          }
        }
      }
      const id = `demo${String(n).padStart(4, "0")}${Math.floor(r() * 0xffffff).toString(16).padStart(6, "0")}`;
      apps.push({
        id, jobId: job.id, brandSlug: job.brandSlug, jobTitle: job.title, fullName: name,
        phone: `09${Math.floor(10_000_000 + r() * 89_999_999)}`,
        email: r() > 0.4 ? `ungvien${n}@example.com` : undefined,
        contactTime: pick(["Bất kỳ lúc nào", "Buổi sáng (8h–12h)", "Buổi chiều (13h–17h)", "Buổi tối (18h–21h)"]),
        status, createdAt: iso(created), updatedAt: history.at(-1)!.at, history, phoneReveals: [],
        ...(rejectReason ? { rejectReason } : {}), ...(onboardDate ? { onboardDate } : {}),
      });
    }
  }
  return { jobs, apps, brands: SAMPLE_BRANDS };
}
