import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/portal/auth";
import { brandName, brandsFor, scopedApps, scopedJobs } from "@/lib/portal/service";
import { APP_STATUS, SLA_DAYS, ageDays, applyCode, isOverdue } from "@/lib/portal/status";
import type { AppStatus } from "@/lib/portal/model";
import { filterApps, filterQuery, parseAppFilter } from "@/lib/portal/filter";
import { AppChip, fmtDate, maskPhone } from "@/components/portal/ui";

export const metadata: Metadata = { title: "Ứng viên" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const LIMIT = 100;

export default async function Applicants({ searchParams }: Props) {
  const u = await requireSession();
  const f = parseAppFilter(await searchParams);
  const [apps, jobs] = await Promise.all([scopedApps(u), scopedJobs(u)]);
  const list = filterApps(apps, f);
  const now = Date.now();
  const admin = u.role === "admin";
  const jobOptions = jobs.filter((j) => !f.brand || j.brandSlug === f.brand).sort((a, b) => a.title.localeCompare(b.title, "vi"));
  const active = Boolean(f.q || f.status || f.job || f.brand || f.overdue);

  return (
    <>
      <header className="p-head">
        <h1>Ứng viên</h1>
        <a href={`/api/portal/export${filterQuery(f)}`} className="btn btn-ghost">Tải CSV ({list.length})</a>
      </header>

      <form className="p-filters" method="get">
        <input name="q" defaultValue={f.q} placeholder="Tên, số điện thoại hoặc mã MJ-…" aria-label="Tìm ứng viên" />
        <select name="status" defaultValue={f.status} aria-label="Trạng thái">
          <option value="">Mọi trạng thái</option>
          {(Object.keys(APP_STATUS) as AppStatus[]).map((s) => <option key={s} value={s}>{APP_STATUS[s].label}</option>)}
        </select>
        {admin && (
          <select name="brand" defaultValue={f.brand} aria-label="Thương hiệu">
            <option value="">Mọi thương hiệu</option>
            {brandsFor(u).map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
          </select>
        )}
        <select name="job" defaultValue={f.job} aria-label="Tin tuyển dụng">
          <option value="">Mọi tin</option>
          {jobOptions.map((j) => <option key={j.id} value={j.id}>{j.title}{admin && !f.brand ? ` · ${brandName(j.brandSlug)}` : ""}</option>)}
        </select>
        <label className="p-check p-check-inline">
          <input type="checkbox" name="overdue" value="1" defaultChecked={f.overdue} />
          <span>Chờ quá {SLA_DAYS} ngày</span>
        </label>
        <button className="btn btn-primary">Lọc</button>
        {active && <Link href="/portal/applicants" className="btn btn-link">Xoá lọc</Link>}
      </form>

      {list.length === 0 ? (
        <div className="p-empty"><p>{active ? "Không có hồ sơ nào khớp bộ lọc." : "Chưa có hồ sơ nào. Hồ sơ sẽ về đây ngay khi ứng viên bấm Gửi trên trang tuyển dụng."}</p></div>
      ) : (
        <div className="p-table-wrap">
          <table className="p-table">
            <thead>
              <tr>
                <th>Ứng viên</th><th>Vị trí</th><th>Nộp ngày</th><th>Trạng thái</th><th className="num">Đã chờ</th>
              </tr>
            </thead>
            <tbody>
              {list.slice(0, LIMIT).map((a) => {
                const late = isOverdue(a, now);
                return (
                  <tr key={a.id} className={late ? "p-row-late" : undefined}>
                    <td>
                      <Link href={`/portal/applicants/${a.id}`} className="p-strong">{a.fullName}</Link>
                      <span className="p-sub">{applyCode(a.id)} · {maskPhone(a.phone)}{a.cv ? " · có CV" : ""}</span>
                    </td>
                    <td>{a.jobTitle}{admin && <span className="p-sub">{brandName(a.brandSlug)}</span>}</td>
                    <td>{fmtDate(a.createdAt)}</td>
                    <td><AppChip s={a.status} /></td>
                    <td className={`num${late ? " p-warn-text" : ""}`}>{a.status === "new_applied" ? `${ageDays(a.createdAt, now)} ngày` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {list.length > LIMIT && <p className="p-muted p-pad">Đang hiện {LIMIT}/{list.length} hồ sơ. Lọc hẹp hơn hoặc tải CSV để xem đủ.</p>}
        </div>
      )}
    </>
  );
}
