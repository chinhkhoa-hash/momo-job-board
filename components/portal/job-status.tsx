"use client";

import { useActionState, useState } from "react";
import { jobStatusAction } from "@/app/portal/actions";
import type { JobStatus } from "@/lib/portal/model";

export default function JobStatusControls({ id, status, isAdmin }: { id: string; status: JobStatus; isAdmin: boolean }) {
  const [state, action, pending] = useActionState(jobStatusAction, undefined);
  const [moderating, setModerating] = useState(false);
  const btn = (to: JobStatus, label: string, primary = false) => (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="to" value={to} />
      <button className={`btn ${primary ? "btn-primary" : "btn-ghost"}`} disabled={pending}>{label}</button>
    </form>
  );
  return (
    <div className="p-status-ctl">
      <div className="p-status-row">
        {status !== "live" && btn("live", status === "draft" ? "Đăng tin" : "Mở lại tin", true)}
        {status === "live" && btn("paused", "Tạm dừng")}
        {status !== "expired" && status !== "draft" && btn("expired", "Đóng tin")}
        {isAdmin && status === "live" && (
          <button type="button" className="btn btn-ghost p-danger" onClick={() => setModerating((v) => !v)} aria-expanded={moderating}>
            Tạm dừng vì vi phạm
          </button>
        )}
      </div>
      {moderating && (
        <form action={action} className="p-moderate">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="to" value="paused" />
          <input type="hidden" name="moderate" value="1" />
          <label className="p-field">
            <span>Lý do (merchant sẽ thấy)</span>
            <textarea name="reason" rows={2} placeholder="vd: Lương trong tin thấp hơn mức tối thiểu vùng, cần cập nhật." />
          </label>
          <button className="btn btn-primary" disabled={pending}>Tạm dừng tin</button>
        </form>
      )}
      {state?.error && <p className="p-error" role="alert">{state.error}</p>}
      {state?.ok && <p className="p-ok" role="status">{state.ok}</p>}
    </div>
  );
}
