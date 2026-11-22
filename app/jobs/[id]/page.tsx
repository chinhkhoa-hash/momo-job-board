import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { careerHubUrl, getJob, slugify } from "@/lib/jobs/source";
import { EMPLOYMENT_LABEL, deadlineText, postedText, salaryText, todayVN } from "@/lib/jobs/format";
import { BrandMark, DemoNotice, SiteFooter, SiteHeader, VerifiedBadge } from "@/components/site";
import { JobCard } from "@/components/job-card";
import ApplyPanel from "./apply";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { job } = await getJob((await params).id);
  if (!job) return { title: "Không tìm thấy tin" };
  return {
    title: `${job.title} – ${job.brand.name}`,
    description: `${salaryText(job)} · ${EMPLOYMENT_LABEL[job.employmentType]} · ${job.locations.map((l) => l.district).join(", ")}`,
  };
}

const mapsUrl = (l: { lat?: number; lng?: number; address?: string; district: string; city: string }) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    l.lat !== undefined && l.lng !== undefined ? `${l.lat},${l.lng}` : [l.address, l.district, l.city].filter(Boolean).join(", "),
  )}`;

export default async function JobDetail({ params }: Props) {
  const { id } = await params;
  const { catalog, job } = await getJob(id);
  if (!job) notFound();
  const today = todayVN();
  const expired = job.deadline < today;
  const hub = careerHubUrl();
  const similar = catalog.jobs
    .filter((j) => j.id !== job.id && j.deadline >= today && (j.brandSlug === job.brandSlug || j.careerTitle === job.careerTitle))
    .slice(0, 4);

  const facts: [string, string][] = [
    ["Loại hình", EMPLOYMENT_LABEL[job.employmentType]],
    ...(job.schedule ? [["Lịch làm", job.schedule] as [string, string]] : []),
    ["Kinh nghiệm", job.experience ?? "Không yêu cầu"],
    ["Hạn nộp", deadlineText(job.deadline, today)],
  ];

  return (
    <>
      <SiteHeader active="jobs" />
      {catalog.source === "sample" && <DemoNotice note={catalog.note} />}
      <main className="s-wrap jd">
        <nav className="jd-crumbs" aria-label="Đường dẫn">
          <Link href="/jobs">Việc làm</Link> / <Link href={`/brand/${job.brand.slug}`}>{job.brand.name}</Link>
        </nav>

        <article className="jd-main">
          <header className="jd-head">
            <BrandMark brand={job.brand} size={64} />
            <div>
              <h1>{job.title}</h1>
              <p className="jd-brand">
                <Link href={`/brand/${job.brand.slug}`}>{job.brand.name}</Link>
                {job.brand.iposVerified && <VerifiedBadge />}
              </p>
              <p className="jd-salary">{salaryText(job)}</p>
              <p className="jd-posted">{postedText(job.postedAt, today)}</p>
            </div>
          </header>

          <dl className="jd-facts">
            {facts.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>

          {job.description.length > 0 && (
            <section className="jd-sec">
              <h2>Mô tả công việc</h2>
              <ul>{job.description.map((x) => <li key={x}>{x}</li>)}</ul>
            </section>
          )}
          {job.requirements.length > 0 && (
            <section className="jd-sec">
              <h2>Yêu cầu</h2>
              <ul>{job.requirements.map((x) => <li key={x}>{x}</li>)}</ul>
            </section>
          )}
          {job.benefits.length > 0 && (
            <section className="jd-sec">
              <h2>Quyền lợi</h2>
              <ul>{job.benefits.map((x) => <li key={x}>{x}</li>)}</ul>
            </section>
          )}

          <section className="jd-sec">
            <h2>Địa điểm làm việc</h2>
            <ul className="jd-stores">
              {job.locations.map((l, i) => (
                <li key={`${l.name ?? ""}-${l.district}-${i}`}>
                  <div>
                    <p className="jd-store-name">{l.name ?? `${l.district}, ${l.city}`}</p>
                    <p className="jd-store-addr">{[l.address, l.district, l.city].filter(Boolean).join(", ")}</p>
                  </div>
                  <a href={mapsUrl(l)} target="_blank" rel="noopener noreferrer" className="btn btn-link">Chỉ đường</a>
                </li>
              ))}
            </ul>
          </section>

          {job.careerTitle && (
            <section className="jd-sec jd-hub">
              <h2>Tìm hiểu thêm về nghề này</h2>
              <p>Xem kỹ năng cần có, mức lương thị trường và lộ trình thăng tiến của {job.careerTitle.toLowerCase()}.</p>
              <div className="jd-hub-links">
                <a className="btn btn-ghost" href={`${hub}/careerpath/${slugify(job.careerTitle)}`} target="_blank" rel="noopener noreferrer">
                  Xem lộ trình nghề
                </a>
                <a className="btn btn-ghost" href={`${hub}/matchcv?title=${encodeURIComponent(job.title)}`} target="_blank" rel="noopener noreferrer">
                  Đối chiếu CV
                </a>
              </div>
            </section>
          )}
        </article>

        <aside className="jd-side">
          <ApplyPanel
            job={{
              id: job.id,
              title: job.title,
              brandName: job.brand.name,
              directUrl: job.directUrl,
              requireEmail: Boolean(job.requireEmail),
              requireCv: Boolean(job.requireCv),
              expired,
            }}
          />
          <div className="jd-brandbox">
            <div className="jd-brandbox-head">
              <BrandMark brand={job.brand} size={40} />
              <div>
                <p className="jd-brandbox-name">{job.brand.name}</p>
                <p className="jd-brandbox-ind">{job.brand.industry}</p>
              </div>
            </div>
            <p>{job.brand.description}</p>
            <Link href={`/brand/${job.brand.slug}`} className="btn btn-link">Xem tất cả việc làm tại {job.brand.name}</Link>
            {job.brand.recruitmentUrl && (
              <a href={job.brand.recruitmentUrl} target="_blank" rel="noopener noreferrer" className="btn btn-link">
                Trang tuyển dụng của thương hiệu
              </a>
            )}
          </div>
        </aside>

        {similar.length > 0 && (
          <section className="jd-similar">
            <h2>Việc làm tương tự</h2>
            <ul className="jl-list">
              {similar.map((j) => <JobCard key={j.id} job={j} today={today} />)}
            </ul>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
