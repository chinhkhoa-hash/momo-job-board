import { distanceKm, fold, monthlyEquivalent, todayVN } from "./format";
import type { EmploymentType, JobWithBrand } from "./types";

export const PAGE_SIZE = 10;
export const MAX_DISTRICTS = 5;
export const SALARY_STEPS = [5_000_000, 8_000_000, 10_000_000, 15_000_000];
export type SortKey = "recommended" | "newest" | "oldest" | "salary" | "nearest";

export type Query = {
  q: string;
  city: string;
  districts: string[];
  types: EmploymentType[];
  minSalary: number; // quy đổi theo tháng, 0 = không lọc
  brand: string;
  sort: SortKey;
  page: number;
  lat?: number;
  lng?: number;
};

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const many = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v : v ? v.split(",") : []).map((s) => s.trim()).filter(Boolean);

const TYPES: EmploymentType[] = ["part_time", "full_time", "shift", "seasonal"];
const SORTS: SortKey[] = ["recommended", "newest", "oldest", "salary", "nearest"];

export function parseQuery(p: Params): Query {
  const lat = Number(one(p.lat)), lng = Number(one(p.lng));
  const hasGeo = Number.isFinite(lat) && Number.isFinite(lng) && one(p.lat) !== "" && one(p.lng) !== "";
  let sort = one(p.sort) as SortKey;
  if (!SORTS.includes(sort) || (sort === "nearest" && !hasGeo)) sort = "recommended";
  return {
    q: one(p.q).slice(0, 80),
    city: one(p.city),
    districts: many(p.district).slice(0, MAX_DISTRICTS),
    types: many(p.type).filter((t): t is EmploymentType => TYPES.includes(t as EmploymentType)),
    minSalary: Math.max(0, Number(one(p.salary)) || 0),
    brand: one(p.brand),
    sort,
    page: Math.min(50, Math.max(1, Number(one(p.page)) || 1)),
    ...(hasGeo ? { lat, lng } : {}),
  };
}

/** Ghi Query ra chuỗi URL, bỏ các giá trị mặc định. */
export function queryString(q: Partial<Query>) {
  const s = new URLSearchParams();
  if (q.q) s.set("q", q.q);
  if (q.city) s.set("city", q.city);
  if (q.districts?.length) s.set("district", q.districts.join(","));
  if (q.types?.length) s.set("type", q.types.join(","));
  if (q.minSalary) s.set("salary", String(q.minSalary));
  if (q.brand) s.set("brand", q.brand);
  if (q.sort && q.sort !== "recommended") s.set("sort", q.sort);
  if (q.lat !== undefined && q.lng !== undefined) {
    s.set("lat", q.lat.toFixed(4));
    s.set("lng", q.lng.toFixed(4));
  }
  if (q.page && q.page > 1) s.set("page", String(q.page));
  const str = s.toString();
  return str ? `?${str}` : "";
}

export type Hit = { job: JobWithBrand; distanceKm?: number };

export function search(all: JobWithBrand[], q: Query, today = todayVN()) {
  const needle = fold(q.q.trim());
  const open = all.filter((j) => j.deadline >= today);

  const hits: Hit[] = [];
  for (const job of open) {
    if (q.brand && job.brandSlug !== q.brand) continue;
    if (q.types.length && !q.types.includes(job.employmentType)) continue;
    if (q.minSalary) {
      const m = monthlyEquivalent(job);
      if (m === null || m < q.minSalary) continue;
    }
    const locs = job.locations.filter(
      (l) => (!q.city || l.city === q.city) && (!q.districts.length || q.districts.includes(l.district)),
    );
    if ((q.city || q.districts.length) && locs.length === 0) continue;
    if (needle) {
      const hay = fold([job.title, job.brand.name, job.brand.industry, ...job.locations.map((l) => `${l.district} ${l.city}`)].join(" "));
      if (!needle.split(/\s+/).every((w) => hay.includes(w))) continue;
    }
    let d: number | undefined;
    if (q.lat !== undefined && q.lng !== undefined) {
      const ds = (locs.length ? locs : job.locations)
        .filter((l) => l.lat !== undefined && l.lng !== undefined)
        .map((l) => distanceKm({ lat: q.lat!, lng: q.lng! }, { lat: l.lat!, lng: l.lng! }));
      if (ds.length) d = Math.min(...ds);
    }
    hits.push({ job, distanceKm: d });
  }

  const by: Record<SortKey, (a: Hit, b: Hit) => number> = {
    recommended: (a, b) =>
      a.job.brand.displayOrder - b.job.brand.displayOrder ||
      (a.job.sortOrder ?? 99) - (b.job.sortOrder ?? 99) ||
      b.job.postedAt.localeCompare(a.job.postedAt),
    newest: (a, b) => b.job.postedAt.localeCompare(a.job.postedAt),
    oldest: (a, b) => a.job.postedAt.localeCompare(b.job.postedAt),
    salary: (a, b) => (monthlyEquivalent(b.job) ?? -1) - (monthlyEquivalent(a.job) ?? -1),
    nearest: (a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9),
  };
  hits.sort(by[q.sort]);

  return { total: hits.length, shown: hits.slice(0, q.page * PAGE_SIZE), open };
}

/** Các lựa chọn bộ lọc lấy từ chính dữ liệu đang tuyển, kèm số tin. */
export function facets(open: JobWithBrand[]) {
  const cities = new Map<string, Map<string, number>>();
  const brands = new Map<string, { name: string; n: number }>();
  for (const j of open) {
    for (const l of j.locations) {
      const ds = cities.get(l.city) ?? new Map<string, number>();
      ds.set(l.district, (ds.get(l.district) ?? 0) + 1);
      cities.set(l.city, ds);
    }
    const b = brands.get(j.brandSlug) ?? { name: j.brand.name, n: 0 };
    b.n++;
    brands.set(j.brandSlug, b);
  }
  return {
    cities: [...cities.entries()]
      .map(([city, ds]) => ({ city, districts: [...ds.keys()].sort((a, b) => a.localeCompare(b, "vi")) }))
      .sort((a, b) => a.city.localeCompare(b.city, "vi")),
    brands: [...brands.entries()].map(([slug, v]) => ({ slug, name: v.name, n: v.n })).sort((a, b) => a.name.localeCompare(b.name, "vi")),
  };
}
