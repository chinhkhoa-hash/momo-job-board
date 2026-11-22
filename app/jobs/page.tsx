import type { Metadata } from "next";
import Link from "next/link";
import { getCatalog } from "@/lib/jobs/source";
import { facets, parseQuery, queryString, search } from "@/lib/jobs/search";
import { todayVN } from "@/lib/jobs/format";
import { DemoNotice, SiteFooter, SiteHeader } from "@/components/site";
import { JobCard } from "@/components/job-card";
import Filters from "./filters";

export const metadata: Metadata = { title: "Việc làm" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function JobsPage({ searchParams }: Props) {
  const query = parseQuery(await searchParams);
  const catalog = await getCatalog();
  const today = todayVN();
  const { total, shown, open } = search(catalog.jobs, query, today);
  const f = facets(open);
  const filtered = Boolean(query.q || query.city || query.districts.length || query.types.length || query.minSalary || query.brand);

  return (
    <>
      <SiteHeader active="jobs" />
      {catalog.source === "sample" && <DemoNotice note={catalog.note} />}
      <main className="s-wrap jl">
        <div className="jl-head">
          <h1>Việc làm gần bạn</h1>
          <p>{open.length} tin đang tuyển từ {f.brands.length} thương hiệu. Ứng tuyển chỉ cần số điện thoại.</p>
        </div>

        <Filters query={query} cities={f.cities} brands={f.brands} total={total} />

        <section className="jl-results" aria-labelledby="jl-count">
          <p id="jl-count" className="jl-count" aria-live="polite">
            {total} việc làm{filtered ? " phù hợp" : ""}
          </p>

          {total === 0 ? (
            <div className="jl-empty">
              <p className="jl-empty-title">Chưa có việc nào khớp với bộ lọc này.</p>
              <p>Thử bỏ bớt quận/huyện, hạ mức lương hoặc tìm bằng từ khoá ngắn hơn.</p>
              <Link href="/jobs" className="btn btn-ghost">Xoá tất cả bộ lọc</Link>
            </div>
          ) : (
            <>
              <ul className="jl-list">
                {shown.map((h) => (
                  <JobCard key={h.job.id} job={h.job} distanceKm={h.distanceKm} today={today} />
                ))}
              </ul>
              {shown.length < total && (
                <Link
                  className="btn btn-ghost jl-more"
                  href={`/jobs${queryString({ ...query, page: query.page + 1 })}`}
                  scroll={false}
                >
                  Xem thêm {Math.min(10, total - shown.length)} việc làm
                </Link>
              )}
            </>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
