"use client";

import { useMemo, useState } from "react";
import type { ItemState, RelayReport } from "@/lib/types";

const STATE_LABEL: Record<ItemState, string> = {
  ready: "Sẵn sàng gửi",
  blocked: "Cần bổ sung",
  sent: "Đã vào HRM",
  failed: "HRM từ chối",
};

const FILTERS: { key: "all" | ItemState; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "ready", label: "Sẵn sàng" },
  { key: "blocked", label: "Cần bổ sung" },
  { key: "failed", label: "Bị từ chối" },
  { key: "sent", label: "Đã gửi" },
];

const fmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Ho_Chi_Minh",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
/** Hiển thị dạng 23/11 08:05 theo giờ Việt Nam. */
const when = (iso: string) => {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "—";
  const v = Object.fromEntries(fmt.formatToParts(t).map((x) => [x.type, x.value]));
  return `${v.day}/${v.month} ${v.hour}:${v.minute}`;
};

export default function Dashboard({ initial }: { initial: RelayReport }) {
  const [report, setReport] = useState(initial);
  const [busy, setBusy] = useState<null | "send" | "check" | "reset">(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | ItemState>("all");

  const items = useMemo(
    () => (filter === "all" ? report.items : report.items.filter((i) => i.state === filter)),
    [report, filter],
  );
  const needsWork = report.counts.blocked + report.counts.failed;
  const jobErrors = report.jobs.filter((j) => j.error);

  async function call(kind: "send" | "check" | "reset") {
    setBusy(kind);
    setError(null);
    setMessage(null);
    try {
      const res =
        kind === "check"
          ? await fetch("/api/relay", { cache: "no-store" })
          : await fetch("/api/relay", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(kind === "reset" ? { action: "reset" } : {}),
            });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Lỗi ${res.status}`);
      const next = data as RelayReport;
      setReport(next);
      setFilter("all");
      if (kind === "send") {
        setMessage(
          next.counts.sent
            ? `Đã gửi ${next.counts.sent} hồ sơ sang iPOS HRM.` +
                (next.counts.failed ? ` ${next.counts.failed} hồ sơ bị HRM từ chối.` : "")
            : next.counts.failed
              ? `Chưa gửi được hồ sơ nào: ${next.counts.failed} hồ sơ bị HRM từ chối.`
              : "Không có hồ sơ nào sẵn sàng để gửi.",
        );
      } else if (kind === "reset") {
        setMessage("Đã đặt lại dữ liệu demo.");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="shell">
      <header className="top">
        <h1 className="brand">Chuyển hồ sơ sang iPOS</h1>
        <span className={`mode mode-${report.mode}`}>
          {report.mode === "demo" ? "Dữ liệu demo" : "Đang kết nối thật"}
        </span>
      </header>

      <p className="lede">
        Hồ sơ ứng viên nộp trên MoMo Jobs cho các tin đồng bộ từ iPOS sẽ được đẩy vào cột Mới của iPOS HRM.
        Hồ sơ thiếu dữ liệu được giữ lại, không bị đánh dấu đã chuyển.
      </p>

      <section className="track" aria-label="Tình trạng chuyển hồ sơ">
        <Station n={report.counts.ready} label="Sẵn sàng gửi" place="MoMo Jobs" tone="ready" />
        <span className="rail" aria-hidden />
        <Station n={needsWork} label="Cần xử lý" place="Thiếu dữ liệu hoặc bị từ chối" tone="warn" />
        <span className="rail" aria-hidden />
        <Station n={report.counts.sent} label="Đã vào HRM" place="iPOS HRM · lượt này" tone="ok" />
      </section>

      <div className="actions">
        <button
          className="primary"
          onClick={() => call("send")}
          disabled={busy !== null || report.counts.ready === 0}
        >
          {busy === "send"
            ? "Đang gửi…"
            : report.counts.ready
              ? `Gửi ${report.counts.ready} hồ sơ sang iPOS`
              : "Không có hồ sơ chờ gửi"}
        </button>
        <button className="quiet" onClick={() => call("check")} disabled={busy !== null}>
          {busy === "check" ? "Đang kiểm tra…" : "Kiểm tra lại"}
        </button>
        {report.mode === "demo" && (
          <button className="quiet" onClick={() => call("reset")} disabled={busy !== null}>
            Đặt lại dữ liệu demo
          </button>
        )}
        <span className="stamp">
          {report.dryRun ? "Kiểm tra lúc" : "Gửi lúc"} {when(report.ranAt)}
        </span>
      </div>

      <div aria-live="polite">
        {message && <p className="flash ok">{message}</p>}
        {error && <p className="flash err">{error}</p>}
      </div>

      <section className="block">
        <h2>Tin đang theo dõi</h2>
        <ul className="jobs">
          {report.jobs.map((j) => (
            <li key={`${j.merchantExternalId}/${j.jobExternalId}`} className={j.error ? "has-error" : ""}>
              <div>
                <p className="job-title">{j.title ?? j.jobExternalId}</p>
                <p className="job-meta">
                  {j.merchantExternalId} / {j.jobExternalId}
                </p>
              </div>
              <p className="job-count">
                {j.error ? <span className="err-text">{j.error}</span> : `${j.pending} hồ sơ chưa chuyển`}
                {j.markedImported ? <span className="ok-text"> · đã đánh dấu {j.markedImported}</span> : null}
              </p>
            </li>
          ))}
        </ul>
        {jobErrors.length > 0 && (
          <p className="hint">Tin lỗi không chặn các tin khác. Kiểm tra mã tin hoặc API key rồi bấm Kiểm tra lại.</p>
        )}
      </section>

      <section className="block">
        <div className="block-head">
          <h2>Hồ sơ</h2>
          <div className="filters" role="tablist" aria-label="Lọc hồ sơ">
            {FILTERS.map((f) => {
              const n = f.key === "all" ? report.items.length : report.counts[f.key];
              return (
                <button
                  key={f.key}
                  role="tab"
                  aria-selected={filter === f.key}
                  className={filter === f.key ? "on" : ""}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label} <span className="n">{n}</span>
                </button>
              );
            })}
          </div>
        </div>

        {items.length === 0 ? (
          <p className="empty">
            {report.items.length === 0
              ? "Chưa có hồ sơ mới. Khi ứng viên nộp vào các tin đang theo dõi, hồ sơ sẽ hiện ở đây."
              : "Không có hồ sơ nào ở trạng thái này."}
          </p>
        ) : (
          <table className="apps">
            <thead>
              <tr>
                <th>Ứng viên</th>
                <th>Tin tuyển dụng</th>
                <th>Nộp lúc</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.applicationId}>
                  <td data-label="Ứng viên">
                    <span className="name">{i.applicantName}</span>
                    <span className="sub">
                      {i.phoneMasked}
                      {i.emailMasked ? ` · ${i.emailMasked}` : ""}
                    </span>
                  </td>
                  <td data-label="Tin">
                    {i.jobTitle}
                    <span className="sub">{i.merchantExternalId}</span>
                  </td>
                  <td data-label="Nộp lúc" className="num">
                    {when(i.appliedAt)}
                  </td>
                  <td data-label="Trạng thái">
                    <span className={`chip chip-${i.state}`}>{STATE_LABEL[i.state]}</span>
                    {i.reason && <span className="sub reason">{i.reason}</span>}
                    {i.hrmId && <span className="sub">Mã HRM {i.hrmId}</span>}
                    {i.trackId && <span className="sub mono-ish">track_id {i.trackId}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <footer className="foot">
        Hồ sơ bị chặn vẫn ở trạng thái chưa chuyển trên Partner API, nên sẽ được thử lại ở lượt sau khi dữ liệu đã đủ.
      </footer>
    </main>
  );
}

function Station({ n, label, place, tone }: { n: number; label: string; place: string; tone: string }) {
  return (
    <div className={`station station-${tone}`}>
      <span className="dot">{n}</span>
      <span className="s-label">{label}</span>
      <span className="s-place">{place}</span>
    </div>
  );
}
