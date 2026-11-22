import type { EmploymentType, JobPost, SalaryType } from "./types";

export const EMPLOYMENT_LABEL: Record<EmploymentType, string> = {
  part_time: "Bán thời gian",
  full_time: "Toàn thời gian",
  shift: "Theo ca",
  seasonal: "Thời vụ",
};

const UNIT: Record<Exclude<SalaryType, "negotiable">, string> = { hourly: "giờ", shift: "ca", monthly: "tháng" };

const vnd = (n: number) => n.toLocaleString("vi-VN");
const million = (n: number) => {
  const m = n / 1_000_000;
  return Number.isInteger(m) ? String(m) : m.toLocaleString("vi-VN", { maximumFractionDigits: 1 });
};

export function salaryText(j: Pick<JobPost, "salaryType" | "salaryMin" | "salaryMax">) {
  if (j.salaryType === "negotiable" || (!j.salaryMin && !j.salaryMax)) return "Thoả thuận";
  const unit = UNIT[j.salaryType];
  const { salaryMin: lo, salaryMax: hi } = j;
  if (j.salaryType === "monthly") {
    if (lo && hi && lo !== hi) return `${million(lo)}–${million(hi)} triệu/${unit}`;
    if (lo && !hi) return `Từ ${million(lo)} triệu/${unit}`;
    return `${million((hi ?? lo)!)} triệu/${unit}`;
  }
  if (lo && hi && lo !== hi) return `${vnd(lo)}–${vnd(hi)}đ/${unit}`;
  if (lo && !hi) return `Từ ${vnd(lo)}đ/${unit}`;
  return `${vnd((hi ?? lo)!)}đ/${unit}`;
}

/** Quy đổi lương về mức/tháng để lọc: giờ × 8 × 26, ca × 26. Thoả thuận = không xác định. */
export function monthlyEquivalent(j: Pick<JobPost, "salaryType" | "salaryMin" | "salaryMax">): number | null {
  const v = j.salaryMax ?? j.salaryMin;
  if (j.salaryType === "negotiable" || !v) return null;
  if (j.salaryType === "hourly") return v * 8 * 26;
  if (j.salaryType === "shift") return v * 26;
  return v;
}

const DAY = 86_400_000;
/** Ngày theo giờ Việt Nam, dạng YYYY-MM-DD. */
export function todayVN(now = Date.now()) {
  return new Date(now + 7 * 3_600_000).toISOString().slice(0, 10);
}
export function daysBetween(fromYmd: string, toYmd: string) {
  return Math.round((Date.parse(toYmd) - Date.parse(fromYmd)) / DAY);
}
export function deadlineText(deadline: string, today = todayVN()) {
  const d = daysBetween(today, deadline);
  if (d < 0) return "Đã hết hạn";
  if (d === 0) return "Hạn chót hôm nay";
  if (d <= 7) return `Còn ${d} ngày`;
  const [y, m, dd] = deadline.split("-");
  return `Hạn ${dd}/${m}/${y}`;
}
export function postedText(postedAt: string, today = todayVN()) {
  const d = daysBetween(postedAt, today);
  if (d <= 0) return "Đăng hôm nay";
  if (d === 1) return "Đăng hôm qua";
  if (d < 30) return `Đăng ${d} ngày trước`;
  const [, m, dd] = postedAt.split("-");
  return `Đăng ${dd}/${m}`;
}

export function placeText(locs: JobPost["locations"]) {
  if (locs.length === 0) return "";
  const cities = [...new Set(locs.map((l) => l.city))];
  if (cities.length > 1) return `${cities.length} tỉnh/thành`;
  const districts = [...new Set(locs.map((l) => l.district))];
  return districts.length > 1 ? `${districts.length} quận · ${cities[0]}` : `${districts[0]}, ${cities[0]}`;
}

export function initials(name: string) {
  const words = name.replace(/[^\p{L}\p{N} ]/gu, " ").split(/\s+/).filter(Boolean);
  return (words.length >= 2 ? words[0][0] + words[1][0] : (words[0] ?? "?").slice(0, 2)).toUpperCase();
}

/** Bỏ dấu tiếng Việt để tìm kiếm không phân biệt dấu. */
export function fold(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
}

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
