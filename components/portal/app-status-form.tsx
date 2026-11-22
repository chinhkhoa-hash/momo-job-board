"use client";

import { useActionState, useState } from "react";
import { appStatusAction } from "@/app/portal/actions";
import type { AppStatus } from "@/lib/portal/model";
import { APP_STATUS, REJECT_REASONS } from "@/lib/portal/status";

export default function AppStatusForm({ id, options, today }: { id: string; options: AppStatus[]; today: string }) {
  const [state, action, pending] = useActionState(appStatusAction, undefined);
  const [to, setTo] = useState<AppStatus | "">("");
  return (
    <form action={action} className="p-form">
      <input type="hidden" name="id" value={id} />
      <label className="p-field">
        <span>Chuyển sang</span>
        <select name="to" value={to} onChange={(e) => setTo(e.target.value as AppStatus)} required>
          <option value="" disabled>Chọn trạng thái mới</option>
          {options.map((s) => <option key={s} value={s}>{APP_STATUS[s].label}</option>)}
        </select>
      </label>
      {to === "onboarded" && (
        <label className="p-field">
          <span>Ngày bắt đầu đi làm</span>
          <input type="date" name="onboardDate" defaultValue={today} required />
        </label>
      )}
      {to === "rejected" && (
        <label className="p-field">
          <span>Lý do</span>
          <select name="rejectReason" defaultValue="" required>
            <option value="" disabled>Chọn lý do</option>
            {REJECT_REASONS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </label>
      )}
      <label className="p-field">
        <span>Ghi chú <em>không bắt buộc</em></span>
        <textarea name="note" rows={2} placeholder="vd: Hẹn phỏng vấn 9h thứ Hai tại CN Nguyễn Huệ" />
      </label>
      {state?.error && <p className="p-error" role="alert">{state.error}</p>}
      {state?.ok && <p className="p-ok" role="status">{state.ok}</p>}
      <button className="btn btn-primary" disabled={pending || !to}>{pending ? "Đang lưu…" : "Cập nhật trạng thái"}</button>
    </form>
  );
}
