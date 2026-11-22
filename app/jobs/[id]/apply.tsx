"use client";

import { useRef, useState } from "react";

type Job = {
  id: string;
  title: string;
  brandName: string;
  directUrl?: string;
  requireEmail: boolean;
  requireCv: boolean;
  expired: boolean;
};

const PHONE_RE = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CV_TYPES = [".pdf", ".doc", ".docx"];
const CV_MAX_MB = 2;
const CONTACT_TIMES = ["Bất kỳ lúc nào", "Buổi sáng (8h–12h)", "Buổi chiều (13h–17h)", "Buổi tối (18h–21h)"];
/** Câu đồng ý theo yêu cầu Legal (sheet Tracking, request #9). */
const CONSENT =
  "Tôi đồng ý để MoMo thu thập thông tin cá nhân và hồ sơ ứng tuyển do tôi cung cấp, và cung cấp các thông tin này cho Nhà Tuyển Dụng để phục vụ mục đích tuyển dụng.";

type Errors = Partial<Record<"fullName" | "phone" | "email" | "cv" | "consent" | "form", string>>;

export default function ApplyPanel({ job }: { job: Job }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<null | { demo: boolean; duplicate: boolean }>(null);
  const [shared, setShared] = useState<string | null>(null);

  async function share() {
    const url = window.location.href;
    const data = { title: `${job.title} – ${job.brandName}`, url };
    try {
      if (navigator.share) {
        await navigator.share(data);
      } else {
        await navigator.clipboard.writeText(url);
        setShared("Đã sao chép đường dẫn");
        setTimeout(() => setShared(null), 2500);
      }
    } catch {}
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const fullName = String(fd.get("fullName") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").replace(/[\s.-]/g, "");
    const email = String(fd.get("email") ?? "").trim();
    const cv = fd.get("cv") as File | null;
    const hasCv = Boolean(cv && cv.size > 0);
    const next: Errors = {};

    if (fullName.length < 2) next.fullName = "Nhập họ và tên của bạn.";
    if (!PHONE_RE.test(phone)) next.phone = "Số điện thoại gồm 10 số, bắt đầu bằng 03, 05, 07, 08 hoặc 09.";
    if (job.requireEmail && !email) next.email = "Nhà tuyển dụng cần email để liên hệ.";
    else if (email && !EMAIL_RE.test(email)) next.email = "Email chưa đúng định dạng, ví dụ ten@gmail.com.";
    if (job.requireCv && !hasCv) next.cv = "Nhà tuyển dụng yêu cầu CV cho vị trí này.";
    if (hasCv) {
      const name = cv!.name.toLowerCase();
      if (!CV_TYPES.some((t) => name.endsWith(t))) next.cv = "CV cần là file PDF, DOC hoặc DOCX.";
      else if (cv!.size > CV_MAX_MB * 1024 * 1024) next.cv = `CV tối đa ${CV_MAX_MB} MB.`;
    }
    if (!fd.get("consent")) next.consent = "Cần đồng ý để gửi hồ sơ tới nhà tuyển dụng.";

    setErrors(next);
    if (Object.keys(next).length) {
      const first = e.currentTarget.querySelector<HTMLElement>("[aria-invalid='true']");
      first?.focus();
      return;
    }

    setSending(true);
    try {
      const body = new FormData();
      body.set("jobId", job.id);
      body.set("fullName", fullName);
      body.set("phone", phone);
      if (email) body.set("email", email);
      body.set("contactTime", String(fd.get("contactTime") ?? ""));
      if (hasCv) body.set("cv", cv!);
      body.set("consent", "true");
      const res = await fetch("/api/apply", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Chưa gửi được hồ sơ.");
      setDone({ demo: Boolean(data.demo), duplicate: Boolean(data.duplicate) });
    } catch (err) {
      setErrors({ form: `${(err as Error).message} Kiểm tra kết nối mạng rồi thử lại.` });
    } finally {
      setSending(false);
    }
  }

  const invalid = (k: keyof Errors) => (errors[k] ? { "aria-invalid": true as const, "aria-describedby": `err-${k}` } : {});
  const err = (k: keyof Errors) => errors[k] && <span id={`err-${k}`} className="ap-err">{errors[k]}</span>;

  const cta = job.expired ? (
    <button className="btn btn-primary ap-cta" disabled>Tin đã hết hạn nhận hồ sơ</button>
  ) : job.directUrl ? (
    <a className="btn btn-primary ap-cta" href={job.directUrl} target="_blank" rel="noopener noreferrer">
      Ứng tuyển trên trang {job.brandName}
    </a>
  ) : (
    <button className="btn btn-primary ap-cta" onClick={() => dialog.current?.showModal()}>
      Ứng tuyển ngay
    </button>
  );

  return (
    <>
      <div className="ap-box">
        {cta}
        <button className="btn btn-ghost ap-share" onClick={share}>Chia sẻ</button>
        {shared && <p className="ap-toast" role="status">{shared}</p>}
        <p className="ap-note">
          {job.directUrl
            ? "Vị trí này nhận hồ sơ trên trang tuyển dụng riêng của thương hiệu."
            : "Chỉ cần họ tên và số điện thoại. Nhà tuyển dụng liên hệ trong 7 ngày làm việc nếu hồ sơ phù hợp."}
        </p>
      </div>

      <div className="ap-bar">{cta}</div>

      <dialog ref={dialog} className="ap-dialog" aria-labelledby="ap-title" onClose={() => setErrors({})}>
        {done ? (
          <div className="ap-done">
            <h2 id="ap-title">{done.duplicate ? "Bạn đã ứng tuyển vị trí này" : "Đã gửi hồ sơ"}</h2>
            <p>
              {job.brandName} sẽ liên hệ bạn trong 7 ngày làm việc nếu hồ sơ phù hợp với vị trí {job.title.toLowerCase()}.
            </p>
            {done.duplicate && <p>Hồ sơ gửi trong 24 giờ qua vẫn được giữ nguyên, bạn không cần gửi lại.</p>}
            {done.demo && <p className="ap-demo">Bản demo: hồ sơ được lưu trong cổng quản lý demo, không tới nhà tuyển dụng thật.</p>}
            <button className="btn btn-primary" onClick={() => dialog.current?.close()}>Xong</button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <div className="ap-head">
              <h2 id="ap-title">Ứng tuyển {job.title.toLowerCase()}</h2>
              <p>{job.brandName}</p>
            </div>

            <label className="ap-field">
              <span>Họ và tên</span>
              <input name="fullName" autoComplete="name" required {...invalid("fullName")} />
              {err("fullName")}
            </label>
            <label className="ap-field">
              <span>Số điện thoại</span>
              <input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="09xx xxx xxx" required {...invalid("phone")} />
              {err("phone")}
            </label>
            <label className="ap-field">
              <span>Email {job.requireEmail ? "" : <em>không bắt buộc</em>}</span>
              <input name="email" type="email" inputMode="email" autoComplete="email" {...invalid("email")} />
              {err("email")}
            </label>
            <label className="ap-field">
              <span>CV {job.requireCv ? "" : <em>không bắt buộc</em>}</span>
              <input name="cv" type="file" accept=".pdf,.doc,.docx" {...invalid("cv")} />
              <small>PDF, DOC hoặc DOCX, tối đa {CV_MAX_MB} MB</small>
              {err("cv")}
            </label>
            <label className="ap-field">
              <span>Thời gian liên lạc thuận tiện <em>không bắt buộc</em></span>
              <select name="contactTime" defaultValue={CONTACT_TIMES[0]}>
                {CONTACT_TIMES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label className="ap-consent">
              <input type="checkbox" name="consent" {...invalid("consent")} />
              <span>{CONSENT}</span>
            </label>
            {err("consent")}
            {errors.form && <p className="ap-err ap-form-err" role="alert">{errors.form}</p>}

            <div className="ap-actions">
              <button type="button" className="btn btn-ghost" onClick={() => dialog.current?.close()}>Huỷ</button>
              <button type="submit" className="btn btn-primary" disabled={sending}>
                {sending ? "Đang gửi…" : "Gửi hồ sơ"}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
