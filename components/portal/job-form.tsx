"use client";

import { useActionState, useState } from "react";
import { saveJobAction } from "@/app/portal/actions";
import type { StoredJob } from "@/lib/portal/model";
import type { JobLocation } from "@/lib/jobs/types";
import { EMPLOYMENT_LABEL } from "@/lib/jobs/format";

type Props = {
  job?: StoredJob;
  brands: { slug: string; name: string }[];
  storesByBrand: Record<string, JobLocation[]>;
  isAdmin: boolean;
  defaultDeadline: string;
};

const key = (l: JobLocation) => `${l.name}|${l.district}`;

export default function JobForm({ job, brands, storesByBrand, isAdmin, defaultDeadline }: Props) {
  const [state, action, pending] = useActionState(saveJobAction, undefined);
  const [brand, setBrand] = useState(job?.brandSlug ?? brands[0]?.slug ?? "");
  const [salaryType, setSalaryType] = useState(job?.salaryType ?? "hourly");
  const e = state?.errors ?? {};
  const stores = storesByBrand[brand] ?? [];
  const chosen = new Set((job?.locations ?? []).map(key));
  const err = (k: string) => e[k] && <span className="p-error" id={`e-${k}`}>{e[k]}</span>;
  const inv = (k: string) => (e[k] ? { "aria-invalid": true as const, "aria-describedby": `e-${k}` } : {});

  return (
    <form action={action} className="p-form p-jobform" noValidate>
      {job && <input type="hidden" name="id" value={job.id} />}
      {state?.error && <p className="p-error p-form-error" role="alert">{state.error}</p>}

      <fieldset className="p-card">
        <legend>Thông tin chính</legend>
        {isAdmin && (
          <label className="p-field">
            <span>Thương hiệu</span>
            <select name="brandSlug" value={brand} onChange={(ev) => setBrand(ev.target.value)} disabled={Boolean(job)} {...inv("brandSlug")}>
              {brands.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
            </select>
            {job && <input type="hidden" name="brandSlug" value={brand} />}
            {err("brandSlug")}
          </label>
        )}
        <label className="p-field">
          <span>Tên vị trí</span>
          <input name="title" defaultValue={job?.title} placeholder="vd: Nhân viên phục vụ" required {...inv("title")} />
          {err("title")}
        </label>
        <div className="p-row">
          <label className="p-field">
            <span>Loại hình</span>
            <select name="employmentType" defaultValue={job?.employmentType ?? "part_time"}>
              {Object.entries(EMPLOYMENT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="p-field">
            <span>Hạn nộp hồ sơ</span>
            <input type="date" name="deadline" defaultValue={job?.deadline ?? defaultDeadline} {...inv("deadline")} />
            {err("deadline")}
          </label>
        </div>
        <div className="p-row">
          <label className="p-field">
            <span>Cách tính lương</span>
            <select name="salaryType" value={salaryType} onChange={(ev) => setSalaryType(ev.target.value as typeof salaryType)}>
              <option value="hourly">Theo giờ</option>
              <option value="shift">Theo ca</option>
              <option value="monthly">Theo tháng</option>
              <option value="negotiable">Thoả thuận</option>
            </select>
          </label>
          {salaryType !== "negotiable" && (
            <>
              <label className="p-field">
                <span>Từ (đồng)</span>
                <input name="salaryMin" inputMode="numeric" defaultValue={job?.salaryMin} placeholder={salaryType === "monthly" ? "8000000" : "25000"} {...inv("salary")} />
              </label>
              <label className="p-field">
                <span>Đến (đồng)</span>
                <input name="salaryMax" inputMode="numeric" defaultValue={job?.salaryMax} {...inv("salary")} />
              </label>
            </>
          )}
        </div>
        {err("salary")}
        <div className="p-row">
          <label className="p-field">
            <span>Lịch làm <em>không bắt buộc</em></span>
            <input name="schedule" defaultValue={job?.schedule} placeholder="vd: Ca 4–8 tiếng, xoay ca" />
          </label>
          <label className="p-field">
            <span>Kinh nghiệm <em>không bắt buộc</em></span>
            <input name="experience" defaultValue={job?.experience} placeholder="Bỏ trống = không yêu cầu" />
          </label>
        </div>
      </fieldset>

      <fieldset className="p-card">
        <legend>Cửa hàng tuyển</legend>
        {stores.length === 0 ? (
          <p className="p-muted">Thương hiệu này chưa có cửa hàng. Cửa hàng được đồng bộ từ iPOS hoặc do MoMo thêm.</p>
        ) : (
          <div className="p-checks" {...inv("stores")}>
            {stores.map((s) => (
              <label key={key(s)} className="p-check">
                <input type="checkbox" name="stores" value={key(s)} defaultChecked={chosen.has(key(s))} />
                <span>{s.name}<small>{[s.address, s.district, s.city].filter(Boolean).join(", ")}</small></span>
              </label>
            ))}
          </div>
        )}
        {err("stores")}
      </fieldset>

      <fieldset className="p-card">
        <legend>Nội dung tin</legend>
        <p className="p-muted">Mỗi dòng là một gạch đầu dòng trên trang tuyển dụng.</p>
        <label className="p-field">
          <span>Mô tả công việc</span>
          <textarea name="description" rows={4} defaultValue={job?.description.join("\n")} {...inv("description")} />
          {err("description")}
        </label>
        <label className="p-field">
          <span>Yêu cầu <em>không bắt buộc</em></span>
          <textarea name="requirements" rows={3} defaultValue={job?.requirements.join("\n")} />
        </label>
        <label className="p-field">
          <span>Quyền lợi <em>không bắt buộc</em></span>
          <textarea name="benefits" rows={3} defaultValue={job?.benefits.join("\n")} />
        </label>
        <label className="p-field">
          <span>Tên nghề cho Lộ trình nghề <em>không bắt buộc</em></span>
          <input name="careerTitle" defaultValue={job?.careerTitle} placeholder="vd: Barista" />
        </label>
      </fieldset>

      <fieldset className="p-card">
        <legend>Cách nhận hồ sơ</legend>
        <label className="p-check">
          <input type="checkbox" name="requireEmail" defaultChecked={job?.requireEmail} />
          <span>Bắt buộc ứng viên nhập email<small>Cần bật nếu tin được đồng bộ sang iPOS HRM.</small></span>
        </label>
        <label className="p-check">
          <input type="checkbox" name="requireCv" defaultChecked={job?.requireCv} />
          <span>Bắt buộc ứng viên gửi CV<small>Yêu cầu CV làm giảm số người nộp, chỉ bật cho vị trí cần kinh nghiệm.</small></span>
        </label>
        <label className="p-field">
          <span>Nhận hồ sơ qua link ngoài <em>không bắt buộc</em></span>
          <input name="directUrl" type="url" defaultValue={job?.directUrl} placeholder="https://" {...inv("directUrl")} />
          <small className="p-muted">Có link thì nút Ứng tuyển chuyển ứng viên sang trang này và hồ sơ không về hệ thống.</small>
          {err("directUrl")}
        </label>
      </fieldset>

      <div className="p-actions">
        {(!job || job.status === "draft") && (
          <button name="intent" value="draft" className="btn btn-ghost" disabled={pending}>Lưu nháp</button>
        )}
        {job && job.status !== "draft" ? (
          <button name="intent" value="save" className="btn btn-primary" disabled={pending}>{pending ? "Đang lưu…" : "Lưu thay đổi"}</button>
        ) : (
          <button name="intent" value="publish" className="btn btn-primary" disabled={pending}>{pending ? "Đang đăng…" : "Đăng tin"}</button>
        )}
      </div>
    </form>
  );
}
