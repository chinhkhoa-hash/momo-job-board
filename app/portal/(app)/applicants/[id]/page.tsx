import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/portal/auth";
import { brandName, loadApp } from "@/lib/portal/service";
import { APP_STATUS, NEXT, SLA_DAYS, ageDays, applyCode, isOverdue } from "@/lib/portal/status";
import { todayVN } from "@/lib/jobs/format";
import AppStatusForm from "@/components/portal/app-status-form";
import RevealPhone from "@/components/portal/reveal-phone";
import { AppChip, fmtDate, fmtDateTime, maskPhone } from "@/components/portal/ui";

export const metadata: Metadata = { title: "Hồ sơ ứng viên" };

type Props = { params: Promise<{ id: string }> };

export default async function ApplicantDetail({ params }: Props) {
  const u = await requireSession();
  const a = await loadApp(u, (await params).id);
  if (!a) notFound();
  const late = isOverdue(a);

  return (
    <>
      <header className="p-head">
        <div>
          <Link href="/portal/applicants" className="p-back">Ứng viên</Link>
          <h1>{a.fullName}</h1>
          <p className="p-muted">{applyCode(a.id)} · <AppChip s={a.status} /></p>
        </div>
      </header>

      {late && (
        <div className="p-alert" role="note">
          <strong>Hồ sơ đã chờ {ageDays(a.createdAt)} ngày.</strong> Ứng viên được hứa phản hồi trong {SLA_DAYS} ngày làm việc. Hãy gọi và cập nhật trạng thái.
        </div>
      )}

      <div className="p-grid-side">
        <div className="p-stack">
          <section className="p-card">
            <h2>Thông tin ứng tuyển</h2>
            <dl className="p-dl">
              <div><dt>Vị trí</dt><dd><Link href={`/portal/jobs/${a.jobId}`}>{a.jobTitle}</Link> · {brandName(a.brandSlug)}</dd></div>
              <div><dt>Số điện thoại</dt><dd><RevealPhone id={a.id} masked={maskPhone(a.phone)} /></dd></div>
              <div><dt>Email</dt><dd>{a.email ? <a href={`mailto:${a.email}`}>{a.email}</a> : "Không cung cấp"}</dd></div>
              <div><dt>Liên lạc thuận tiện</dt><dd>{a.contactTime ?? "Không chọn"}</dd></div>
              <div><dt>CV</dt><dd>{a.cv ? <a href={`/api/portal/cv/${a.id}`}>{a.cv.name}</a> : "Không gửi"}</dd></div>
              <div><dt>Nộp lúc</dt><dd>{fmtDateTime(a.createdAt)}</dd></div>
              {a.onboardDate && <div><dt>Ngày đi làm</dt><dd>{fmtDate(a.onboardDate)}</dd></div>}
              {a.rejectReason && <div><dt>Lý do không phù hợp</dt><dd>{a.rejectReason}</dd></div>}
            </dl>
          </section>

          <section className="p-card">
            <h2>Lịch sử</h2>
            <ol className="p-timeline">
              {[...a.history].reverse().map((h, i) => (
                <li key={`${h.at}-${i}`}>
                  <span className="p-timeline-dot" aria-hidden />
                  <div>
                    <p><strong>{APP_STATUS[h.to].label}</strong> <span className="p-muted">bởi {h.by}</span></p>
                    {h.note && <p>{h.note}</p>}
                    <p className="p-sub">{fmtDateTime(h.at)}</p>
                  </div>
                </li>
              ))}
            </ol>
            {a.phoneReveals.length > 0 && (
              <p className="p-sub p-pad-top">
                Số điện thoại đã được xem {a.phoneReveals.length} lần, gần nhất bởi {a.phoneReveals.at(-1)!.by} lúc {fmtDateTime(a.phoneReveals.at(-1)!.at)}.
              </p>
            )}
          </section>
        </div>

        <aside className="p-stack">
          <section className="p-card">
            <h2>Cập nhật trạng thái</h2>
            <AppStatusForm id={a.id} options={NEXT[a.status]} today={todayVN()} />
          </section>
        </aside>
      </div>
    </>
  );
}
