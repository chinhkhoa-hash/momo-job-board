import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/portal/auth";
import { brandName, brandsFor, effectiveStatus, loadJob, scopedApps, storesOf } from "@/lib/portal/service";
import { APP_STATUS } from "@/lib/portal/status";
import type { AppStatus } from "@/lib/portal/model";
import { todayVN } from "@/lib/jobs/format";
import JobForm from "@/components/portal/job-form";
import JobStatusControls from "@/components/portal/job-status";
import { JobChip, fmtDateTime } from "@/components/portal/ui";

export const metadata: Metadata = { title: "Sửa tin" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> };

export default async function EditJob({ params, searchParams }: Props) {
  const u = await requireSession();
  const { id } = await params;
  const { saved } = await searchParams;
  const job = await loadJob(u, id);
  if (!job) notFound();
  const status = effectiveStatus(job);
  const apps = (await scopedApps(u)).filter((a) => a.jobId === job.id);
  const byStatus = (Object.keys(APP_STATUS) as AppStatus[])
    .map((s) => ({ s, n: apps.filter((a) => a.status === s).length }))
    .filter((x) => x.n);
  const brands = brandsFor(u).map((b) => ({ slug: b.slug, name: b.name }));

  return (
    <>
      <header className="p-head">
        <div>
          <Link href="/portal/jobs" className="p-back">Tin tuyển dụng</Link>
          <h1>{job.title}</h1>
          <p className="p-muted">
            {brandName(job.brandSlug)} · <JobChip s={status} /> · cập nhật {fmtDateTime(job.updatedAt)}
          </p>
        </div>
        {status === "live" && <Link href={`/jobs/${job.id}`} target="_blank" className="btn btn-ghost">Xem trên trang tuyển dụng</Link>}
      </header>

      {saved && <p className="p-ok p-flash" role="status">Đã lưu tin.</p>}
      {job.moderation && job.status === "paused" && (
        <div className="p-alert" role="note">
          <strong>MoMo đã tạm dừng tin này.</strong> {job.moderation.reason}
          <span className="p-sub">Sửa nội dung rồi bấm Mở lại tin. Lúc {fmtDateTime(job.moderation.at)}.</span>
        </div>
      )}

      <div className="p-grid-side">
        <JobForm job={job} brands={brands} storesByBrand={{ [job.brandSlug]: storesOf(job.brandSlug) }} isAdmin={u.role === "admin"} defaultDeadline={todayVN()} />
        <aside className="p-stack">
          <section className="p-card">
            <h2>Trạng thái tin</h2>
            <JobStatusControls id={job.id} status={status} isAdmin={u.role === "admin"} />
          </section>
          <section className="p-card">
            <h2>{apps.length} hồ sơ</h2>
            {byStatus.length ? (
              <ul className="p-mini">
                {byStatus.map(({ s, n }) => (
                  <li key={s}>
                    <Link href={`/portal/applicants?job=${job.id}&status=${s}`}>{APP_STATUS[s].label}</Link>
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-muted">{job.directUrl ? "Tin nhận hồ sơ qua link ngoài nên hồ sơ không về đây." : "Chưa có ai ứng tuyển."}</p>
            )}
            {apps.length > 0 && <Link className="btn btn-link" href={`/portal/applicants?job=${job.id}`}>Xem danh sách ứng viên</Link>}
          </section>
        </aside>
      </div>
    </>
  );
}
