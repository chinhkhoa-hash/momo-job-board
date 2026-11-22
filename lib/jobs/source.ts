import { SAMPLE_BRANDS, SAMPLE_JOBS } from "./sample";
import type { Brand, EmploymentType, JobLocation, JobPost, JobWithBrand, SalaryType } from "./types";

/**
 * Nguồn dữ liệu tin tuyển dụng.
 * - Mặc định: dữ liệu mẫu (chế độ demo).
 * - Đặt JOBS_SOURCE_URL (vd https://merchant-job-board.vercel.app): đọc từ API cũ GET /api/worker/jobs.
 *   Cấu trúc response của API cũ chưa có tài liệu, nên phần chuyển đổi bên dưới đọc theo tên cột
 *   trong Prisma schema (Handover mục 4) và tự quay về dữ liệu mẫu nếu đọc không được.
 */
export type Catalog = { source: "sample" | "remote"; brands: Brand[]; jobs: JobWithBrand[]; note?: string };

function withBrands(jobs: JobPost[], brands: Brand[]): JobWithBrand[] {
  const map = new Map(brands.map((b) => [b.slug, b]));
  return jobs.flatMap((j) => {
    const brand = map.get(j.brandSlug);
    return brand ? [{ ...j, brand }] : [];
  });
}

const sampleCatalog = (note?: string): Catalog => ({
  source: "sample",
  brands: SAMPLE_BRANDS,
  jobs: withBrands(SAMPLE_JOBS, SAMPLE_BRANDS),
  note,
});

export const slugify = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const lines = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(String).filter(Boolean)
    : typeof v === "string" ? v.split(/\r?\n/).map((s) => s.replace(/^[-•*]\s*/, "").trim()).filter(Boolean) : [];
const ymd = (v: unknown) => (typeof v === "string" && v.length >= 10 ? v.slice(0, 10) : undefined);
const TYPES: EmploymentType[] = ["part_time", "full_time", "shift", "seasonal"];
const SAL: SalaryType[] = ["hourly", "shift", "monthly", "negotiable"];

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapRemote(raw: any, brands: Map<string, Brand>): JobPost | null {
  const m = raw.merchant ?? {};
  const name: string | undefined = m.brandName ?? raw.brandName;
  if (!raw.id || !raw.title || !name) return null;
  const slug: string = m.slug ?? raw.merchantSlug ?? slugify(name);
  if (!brands.has(slug)) {
    brands.set(slug, {
      slug, name, industry: m.industry ?? "", color: "#a50064", logoUrl: m.logoUrl ?? undefined,
      description: m.description ?? "", hotlines: Array.isArray(m.hotlines) ? m.hotlines : [],
      iposVerified: Boolean(m.iposVerified), displayOrder: Number(m.displayOrder ?? 99),
    });
  }
  const stores: any[] = (raw.jobPostStores ?? raw.stores ?? []).map((s: any) => s.store ?? s);
  let locations: JobLocation[] = stores
    .filter((s) => s?.city)
    .map((s) => ({ name: s.name, address: s.streetAddress, district: s.district ?? "", city: s.city,
      lat: s.lat ?? undefined, lng: s.lng ?? undefined }));
  if (!locations.length && raw.regionCity) {
    const ds: string[] = raw.regionDistricts?.length ? raw.regionDistricts : [""];
    locations = ds.map((d) => ({ district: d, city: raw.regionCity }));
  }
  if (!locations.length && Array.isArray(raw.regionCities)) {
    locations = raw.regionCities.map((c: string) => ({ district: "", city: c }));
  }
  return {
    id: String(raw.id),
    brandSlug: slug,
    title: String(raw.title),
    employmentType: TYPES.includes(raw.employmentType) ? raw.employmentType : "part_time",
    salaryType: SAL.includes(raw.salaryType) ? raw.salaryType : "negotiable",
    salaryMin: raw.salaryMin ?? undefined,
    salaryMax: raw.salaryMax ?? undefined,
    experience: raw.experienceLevel ?? raw.experience ?? undefined,
    schedule: raw.schedule ?? raw.workSchedule ?? undefined,
    description: lines(raw.description),
    requirements: lines(raw.requirements),
    benefits: lines(raw.benefits),
    locations,
    postedAt: ymd(raw.openDate ?? raw.createdAt) ?? new Date().toISOString().slice(0, 10),
    deadline: ymd(raw.closeDate ?? raw.deadline) ?? "2099-12-31",
    directUrl: raw.requireDirectUrl ? raw.directUrl ?? undefined : undefined,
    requireEmail: Boolean(raw.requireEmail),
    requireCv: Boolean(raw.requireCv),
    sortOrder: raw.sortOrder ?? undefined,
  };
}

async function remoteCatalog(base: string): Promise<Catalog> {
  const url = `${base.replace(/\/+$/, "")}/api/worker/jobs?limit=200`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`API cũ trả ${res.status}`);
  const body: any = await res.json();
  const list: any[] = Array.isArray(body) ? body : body.jobs ?? body.data ?? [];
  const brands = new Map<string, Brand>();
  const jobs = list.map((r) => mapRemote(r, brands)).filter((j): j is JobPost => j !== null);
  if (!jobs.length) throw new Error("API cũ không trả tin nào đọc được");
  const brandList = [...brands.values()];
  return { source: "remote", brands: brandList, jobs: withBrands(jobs, brandList) };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function getCatalog(): Promise<Catalog> {
  const base = process.env.JOBS_SOURCE_URL;
  if (!base) return sampleCatalog();
  try {
    return await remoteCatalog(base);
  } catch (e) {
    console.error("JOBS_SOURCE_URL:", (e as Error).message);
    return sampleCatalog(`Không đọc được dữ liệu thật (${(e as Error).message}), đang hiển thị dữ liệu mẫu.`);
  }
}

export async function getJob(id: string) {
  const c = await getCatalog();
  return { catalog: c, job: c.jobs.find((j) => j.id === id) };
}

export async function getBrand(slug: string) {
  const c = await getCatalog();
  return { catalog: c, brand: c.brands.find((b) => b.slug === slug) };
}

/** Link sang Career Hub của sản phẩm cũ (Lộ trình nghề, Đối chiếu CV). */
export function careerHubUrl() {
  return (process.env.CAREER_HUB_URL ?? "https://merchant-job-board.vercel.app").replace(/\/+$/, "");
}
