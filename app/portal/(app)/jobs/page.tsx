import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/portal/auth";
import { brandName, effectiveStatus, scopedApps, scopedJobs } from "@/lib/portal/service";
import { JOB_STATUS } from "@/lib/portal/status";
import type { JobStatus } from "@/lib/portal/model";
import { salaryText } from "@/lib/jobs/format";
import { JobChip, fmtDate } from "@/components/portal/ui";

export const metadata: Metadata = { title: "Tin tuyển dụng" };

type Props = { searchParams: Promise<{ status?: string }> };

export default async function JobsAdmin({ searchParams }: Props) {
  const u = await requireSession();
  const { status } = await searchParams;
  const [jobs, apps] = await Promise.all([scopedJobs(u), scopedApps(u)]);
  const withStatus = jobs.map((j) => ({ j, s: effectiveStatus(j) }));
  const counts = Object.fromEntries((Object.keys(JOB_STATUS) as JobStatus[]).map((k) => [k, withStatus.filter((x) => x.s === k).length]));
  const list = withStatus
    .filter((x) => !status || x.s === status)
    .sort((a, b) => b.j.updatedAt.localeCompare(a.j.updatedAt));
  const admin = u.role === "admin";

  return (
    <>
      <header className="p-head">
        <h1>Tin tuyển dụng</h1>
        <Link href="/portal/jobs/new" className="btn btn-primary">Đăng tin mới</Link>
      </header>

      <nav className="p-tabs" aria-label="Lọc theo trạng thái">
        <Link href="/portal/jobs" aria-current={!status ? "page" : undefined}>Tất cả <span>{jobs.length}</span></Link>
        {(Object.keys(JOB_STATUS) as JobStatus[]).map((k) => (
          <Link key={k} href={`/portal/jobs?status=${k}`} aria-current={status === k ? "page" : undefined}>
            {JOB_STATUS[k].label} <span>{counts[k]}</span>
          </Link>
        ))}
      </nav>

      {list.length === 0 ? (
        <div className="p-empty">
          <p>Chưa có tin nào ở trạng thái này.</p>
          <Link href="/portal/jobs/new" className="btn btn-ghost">Đăng tin đầu tiên</Link>
        </div>
      ) : (
        <div className="p-table-wrap">
          <table className="p-table">
            <thead>
              <tr>
                <th>Vị trí</th>{admin && <th>Thương hiệu</th>}<th>Trạng thái</th>
                <th className="num">Hồ sơ</th><th className="num">Chưa xử lý</th><th>Hạn nộp</th>
              </tr>
            </thead>
            <tbody>
              {list.map(({ j, s }) => {
                const as = apps.filter((a) => a.jobId === j.id);
                const fresh = as.filter((a) => a.status === "new_applied").length;
                return (
                  <tr key={j.id}>
                    <td>
                      <Link href={`/portal/jobs/${j.id}`} className="p-strong">{j.title}</Link>
                      <span className="p-sub">{salaryText(j)} · {j.locations.length} cửa hàng{j.directUrl ? " · nhận hồ sơ qua link ngoài" : ""}</span>
                      {j.moderation && j.status === "paused" && <span className="p-sub p-warn-text">MoMo tạm dừng: {j.moderation.reason}</span>}
                    </td>
                    {admin && <td>{brandName(j.brandSlug)}</td>}
                    <td><JobChip s={s} /></td>
                    <td className="num">{as.length ? <Link href={`/portal/applicants?job=${j.id}`}>{as.length}</Link> : 0}</td>
                    <td className={`num${fresh ? " p-strong" : ""}`}>{fresh}</td>
                    <td>{fmtDate(j.deadline)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
