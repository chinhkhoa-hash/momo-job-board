import Link from "next/link";
import { requireSession } from "@/lib/portal/auth";
import { brandName, dashboard } from "@/lib/portal/service";
import { APP_STATUS, SLA_DAYS, ageDays } from "@/lib/portal/status";
import { pct } from "@/components/portal/ui";

export default async function Overview() {
  const u = await requireSession();
  const d = await dashboard(u);
  const top = d.funnel[0]?.count || 1;
  const admin = u.role === "admin";
  const rows = [...d.byBrand].sort((a, b) => b.overdue - a.overdue || b.apps - a.apps);

  return (
    <>
      <header className="p-head">
        <h1>Tổng quan</h1>
        <Link href="/portal/jobs/new" className="btn btn-primary">Đăng tin mới</Link>
      </header>

      <section className="p-kpis" aria-label="Chỉ số chính">
        <Link href="/portal/jobs?status=live" className="p-kpi">
          <span className="p-kpi-n">{d.liveJobs}</span>
          <span className="p-kpi-l">Tin đang tuyển{d.draftJobs ? ` · ${d.draftJobs} nháp` : ""}</span>
        </Link>
        <Link href="/portal/applicants" className="p-kpi">
          <span className="p-kpi-n">{d.last7}</span>
          <span className="p-kpi-l">Hồ sơ mới trong 7 ngày · tổng {d.totalApps}</span>
        </Link>
        <Link href="/portal/applicants?overdue=1" className={`p-kpi${d.overdue ? " p-kpi-warn" : ""}`}>
          <span className="p-kpi-n">{d.overdue}</span>
          <span className="p-kpi-l">Chưa liên hệ sau {SLA_DAYS} ngày</span>
        </Link>
        <Link href="/portal/applicants?status=onboarded" className="p-kpi p-kpi-good">
          <span className="p-kpi-n">{d.onboarded}</span>
          <span className="p-kpi-l">Ứng viên đã đi làm</span>
        </Link>
      </section>

      <div className="p-grid2">
        <section className="p-card">
          <h2>Hồ sơ đi được tới đâu</h2>
          <p className="p-muted">Mỗi bước tính số hồ sơ đã từng tới bước đó, kể cả hồ sơ sau này bị loại.</p>
          <ol className="p-funnel">
            {d.funnel.map((f, i) => {
              const prev = i ? d.funnel[i - 1].count : 0;
              return (
                <li key={f.status}>
                  <span className="p-funnel-l">{APP_STATUS[f.status].label}</span>
                  <span className="p-funnel-bar"><span style={{ width: `${(f.count / top) * 100}%` }} /></span>
                  <span className="p-funnel-n">{f.count}</span>
                  <span className="p-funnel-r">{i ? (prev ? pct(f.count / prev) : "—") : ""}</span>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="p-card">
          <h2>Cần liên hệ ngay</h2>
          {d.overdueList.length === 0 ? (
            <p className="p-muted">Không có hồ sơ nào chờ quá {SLA_DAYS} ngày.</p>
          ) : (
            <>
              <p className="p-muted">Ứng viên được hứa phản hồi trong {SLA_DAYS} ngày làm việc. Những hồ sơ này chưa được ai mở.</p>
              <ul className="p-list">
                {d.overdueList.map((a) => (
                  <li key={a.id}>
                    <Link href={`/portal/applicants/${a.id}`}>
                      <span>{a.fullName}</span>
                      <span className="p-muted">{a.jobTitle}{admin ? ` · ${brandName(a.brandSlug)}` : ""}</span>
                    </Link>
                    <span className="p-warn-text">{ageDays(a.createdAt)} ngày</span>
                  </li>
                ))}
              </ul>
              {d.overdue > d.overdueList.length && (
                <Link href="/portal/applicants?overdue=1" className="btn btn-link">Xem tất cả {d.overdue} hồ sơ</Link>
              )}
            </>
          )}
        </section>
      </div>

      {admin && (
        <section className="p-card">
          <h2>Theo thương hiệu</h2>
          <p className="p-muted">Tỉ lệ đã cập nhật = hồ sơ đã được chuyển khỏi trạng thái Mới nộp. Đây là điều kiện để đo được tỉ lệ đi làm.</p>
          <div className="p-table-wrap">
            <table className="p-table">
              <thead>
                <tr>
                  <th>Thương hiệu</th><th className="num">Tin đang tuyển</th><th className="num">Hồ sơ</th>
                  <th>Đã cập nhật trạng thái</th><th className="num">Quá hạn</th><th className="num">Phỏng vấn</th><th className="num">Đi làm</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.slug}>
                    <td><Link href={`/portal/applicants?brand=${r.slug}`}>{r.name}</Link></td>
                    <td className="num">{r.liveJobs}</td>
                    <td className="num">{r.apps}</td>
                    <td>
                      <span className="p-rate">
                        <span className="p-rate-bar"><span style={{ width: pct(r.updatedRate) }} className={r.updatedRate < 0.5 ? "low" : ""} /></span>
                        {r.apps ? pct(r.updatedRate) : "—"}
                      </span>
                    </td>
                    <td className={`num${r.overdue ? " p-warn-text" : ""}`}>{r.overdue}</td>
                    <td className="num">{r.interviewed}</td>
                    <td className="num">{r.onboarded}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
