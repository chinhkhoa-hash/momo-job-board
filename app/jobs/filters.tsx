"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { Query, SortKey } from "@/lib/jobs/search";
import { MAX_DISTRICTS, SALARY_STEPS, queryString } from "@/lib/jobs/search";
import { EMPLOYMENT_LABEL } from "@/lib/jobs/format";
import type { EmploymentType } from "@/lib/jobs/types";

type Props = {
  query: Query;
  cities: { city: string; districts: string[] }[];
  brands: { slug: string; name: string; n: number }[];
  total: number;
};

const SORT_LABEL: Record<SortKey, string> = {
  recommended: "Đề xuất",
  newest: "Mới nhất",
  oldest: "Cũ nhất",
  salary: "Lương cao nhất",
  nearest: "Gần tôi nhất",
};

export default function Filters({ query, cities, brands, total }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(query.q);
  const [open, setOpen] = useState(false);
  const [geoMsg, setGeoMsg] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => setQ(query.q), [query.q]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    sheetRef.current?.querySelector<HTMLElement>("select, input, button")?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (patch: Partial<Query>) =>
    start(() => router.push(`/jobs${queryString({ ...query, ...patch, page: 1 })}`, { scroll: false }));

  const districtsOf = cities.find((c) => c.city === query.city)?.districts ?? [];
  const activeCount =
    (query.city ? 1 : 0) + query.districts.length + query.types.length + (query.minSalary ? 1 : 0) + (query.brand ? 1 : 0);

  const toggleType = (t: EmploymentType) =>
    go({ types: query.types.includes(t) ? query.types.filter((x) => x !== t) : [...query.types, t] });
  const toggleDistrict = (d: string) => {
    if (query.districts.includes(d)) return go({ districts: query.districts.filter((x) => x !== d) });
    if (query.districts.length >= MAX_DISTRICTS) return;
    go({ districts: [...query.districts, d] });
  };

  function nearMe() {
    if (!("geolocation" in navigator)) return setGeoMsg("Trình duyệt không hỗ trợ lấy vị trí.");
    setGeoMsg("Đang lấy vị trí…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setGeoMsg(null);
        go({ lat: p.coords.latitude, lng: p.coords.longitude, sort: "nearest" });
      },
      () => setGeoMsg("Chưa lấy được vị trí. Hãy cho phép truy cập vị trí rồi thử lại."),
      { timeout: 10000, maximumAge: 300000 },
    );
  }

  const panel = (
    <div className="fl-groups">
      <fieldset className="fl-group">
        <legend>Tỉnh/Thành phố</legend>
        <select
          value={query.city}
          onChange={(e) => go({ city: e.target.value, districts: [] })}
          aria-label="Tỉnh/Thành phố"
        >
          <option value="">Tất cả tỉnh thành</option>
          {cities.map((c) => (
            <option key={c.city} value={c.city}>{c.city}</option>
          ))}
        </select>
      </fieldset>

      {query.city && districtsOf.length > 0 && (
        <fieldset className="fl-group">
          <legend>
            Quận/Huyện <span className="fl-hint">chọn tối đa {MAX_DISTRICTS}</span>
          </legend>
          <div className="fl-checks">
            {districtsOf.map((d) => {
              const on = query.districts.includes(d);
              const full = !on && query.districts.length >= MAX_DISTRICTS;
              return (
                <label key={d} className={`fl-check${full ? " is-disabled" : ""}`}>
                  <input type="checkbox" checked={on} disabled={full} onChange={() => toggleDistrict(d)} />
                  {d}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <fieldset className="fl-group">
        <legend>Loại hình</legend>
        <div className="fl-pills">
          {(Object.keys(EMPLOYMENT_LABEL) as EmploymentType[]).map((t) => (
            <button
              key={t}
              type="button"
              className="pill"
              aria-pressed={query.types.includes(t)}
              onClick={() => toggleType(t)}
            >
              {EMPLOYMENT_LABEL[t]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="fl-group">
        <legend>
          Mức lương <span className="fl-hint">quy đổi theo tháng</span>
        </legend>
        <div className="fl-pills">
          <button type="button" className="pill" aria-pressed={!query.minSalary} onClick={() => go({ minSalary: 0 })}>
            Tất cả
          </button>
          {SALARY_STEPS.map((s) => (
            <button
              key={s}
              type="button"
              className="pill"
              aria-pressed={query.minSalary === s}
              onClick={() => go({ minSalary: s })}
            >
              Từ {s / 1_000_000} triệu
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="fl-group">
        <legend>Thương hiệu</legend>
        <select value={query.brand} onChange={(e) => go({ brand: e.target.value })} aria-label="Thương hiệu">
          <option value="">Tất cả thương hiệu</option>
          {brands.map((b) => (
            <option key={b.slug} value={b.slug}>{b.name} ({b.n})</option>
          ))}
        </select>
      </fieldset>

      {activeCount > 0 && (
        <button
          type="button"
          className="btn btn-link"
          onClick={() => go({ city: "", districts: [], types: [], minSalary: 0, brand: "" })}
        >
          Xoá {activeCount} bộ lọc
        </button>
      )}
    </div>
  );

  return (
    <>
      <form
        className="fl-search"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go({ q: q.trim() });
        }}
      >
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Vị trí, thương hiệu hoặc quận… vd: pha chế Quận 1"
          aria-label="Tìm việc làm"
          enterKeyHint="search"
        />
        <button type="submit" className="btn btn-primary">Tìm</button>
      </form>

      <div className="fl-bar">
        <button type="button" className="btn btn-ghost fl-open" onClick={() => setOpen(true)} aria-expanded={open}>
          Bộ lọc{activeCount ? ` (${activeCount})` : ""}
        </button>
        <button type="button" className="btn btn-ghost" onClick={nearMe}>
          {query.lat !== undefined ? "Cập nhật vị trí" : "Việc gần tôi"}
        </button>
        <label className="fl-sort">
          <span>Sắp xếp</span>
          <select value={query.sort} onChange={(e) => go({ sort: e.target.value as SortKey })}>
            {(Object.keys(SORT_LABEL) as SortKey[])
              .filter((k) => k !== "nearest" || query.lat !== undefined)
              .map((k) => (
                <option key={k} value={k}>{SORT_LABEL[k]}</option>
              ))}
          </select>
        </label>
        {pending && <span className="fl-loading">Đang lọc…</span>}
      </div>
      {geoMsg && <p className="fl-geo" role="status">{geoMsg}</p>}

      <aside className="fl-side" aria-label="Bộ lọc">{panel}</aside>

      {open && (
        <div className="fl-sheet-backdrop" onClick={() => setOpen(false)}>
          <div
            ref={sheetRef}
            className="fl-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Bộ lọc"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="fl-sheet-head">
              <h2>Bộ lọc</h2>
              <button type="button" className="btn btn-link" onClick={() => setOpen(false)}>Đóng</button>
            </div>
            {panel}
            <button type="button" className="btn btn-primary fl-sheet-done" onClick={() => setOpen(false)}>
              Xem {total} việc làm
            </button>
          </div>
        </div>
      )}
    </>
  );
}
