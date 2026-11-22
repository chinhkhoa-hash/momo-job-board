import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrand } from "@/lib/jobs/source";
import { todayVN } from "@/lib/jobs/format";
import { BrandMark, DemoNotice, SiteFooter, SiteHeader, VerifiedBadge } from "@/components/site";
import { JobCard } from "@/components/job-card";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brand } = await getBrand((await params).slug);
  return brand ? { title: `Tuyển dụng ${brand.name}`, description: brand.description } : { title: "Không tìm thấy thương hiệu" };
}

export default async function BrandPage({ params }: Props) {
  const { catalog, brand } = await getBrand((await params).slug);
  if (!brand) notFound();
  const today = todayVN();
  const jobs = catalog.jobs
    .filter((j) => j.brandSlug === brand.slug && j.deadline >= today)
    .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
  const cities = [...new Set(jobs.flatMap((j) => j.locations.map((l) => l.city)))];

  return (
    <>
      <SiteHeader active="jobs" />
      {catalog.source === "sample" && <DemoNotice note={catalog.note} />}
      <div className="bp-band" style={{ background: brand.color }} aria-hidden />
      <main className="s-wrap bp">
        <header className="bp-head">
          <BrandMark brand={brand} size={88} />
          <div>
            <h1>{brand.name}</h1>
            <p className="bp-ind">
              {brand.industry}
              {brand.iposVerified && <VerifiedBadge />}
            </p>
          </div>
        </header>

        <div className="bp-grid">
          <section className="bp-jobs" aria-labelledby="bp-jobs-title">
            <h2 id="bp-jobs-title">
              {jobs.length} vị trí đang tuyển{cities.length ? ` tại ${cities.join(", ")}` : ""}
            </h2>
            {jobs.length ? (
              <ul className="jl-list">{jobs.map((j) => <JobCard key={j.id} job={j} today={today} />)}</ul>
            ) : (
              <div className="jl-empty">
                <p className="jl-empty-title">{brand.name} chưa có vị trí nào đang mở.</p>
                <Link href="/jobs" className="btn btn-ghost">Xem việc làm khác</Link>
              </div>
            )}
          </section>

          <aside className="bp-about">
            <h2>Về {brand.name}</h2>
            <p>{brand.description}</p>
            {brand.hotlines.length > 0 && <p>Hotline: {brand.hotlines.join(", ")}</p>}
            {brand.recruitmentUrl && (
              <a href={brand.recruitmentUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                Trang tuyển dụng của thương hiệu
              </a>
            )}
            <Link href={`/jobs?brand=${brand.slug}`} className="btn btn-link">Lọc việc theo khu vực</Link>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
