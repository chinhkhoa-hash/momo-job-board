import type { Application, Job } from "./types";
import type { Config } from "./config";

/** Client cho Partner API của Merchant Job Board (tài liệu Partner API v1.2). */
export class PartnerError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export interface PartnerClient {
  getJob(merchantExternalId: string, jobExternalId: string): Promise<Job>;
  listPending(merchantExternalId: string, jobExternalId: string): Promise<Application[]>;
  markImported(merchantExternalId: string, jobExternalId: string, ids: string[]): Promise<number>;
}

const MAX_PAGES = 20; // 20 trang x 100 hồ sơ mỗi lượt chạy là đủ cho quy mô hiện tại

export function createPartnerClient(cfg: Config): PartnerClient {
  const enc = encodeURIComponent;
  const jobPath = (m: string, j: string) => `/merchants/${enc(m)}/jobs/${enc(j)}`;

  async function call<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(cfg.partnerBaseUrl + path, {
      ...init,
      cache: "no-store",
      headers: { "X-Api-Key": cfg.partnerApiKey, "Content-Type": "application/json" },
    });
    const text = await res.text();
    if (!res.ok) {
      let message = text.slice(0, 300);
      try {
        const body = JSON.parse(text);
        const m = body?.error?.message;
        message = Array.isArray(m) ? m.join("; ") : String(m ?? message);
      } catch {}
      throw new PartnerError(res.status, `Partner API ${res.status}: ${message}`);
    }
    return JSON.parse(text) as T;
  }

  return {
    getJob: (m, j) => call<Job>(jobPath(m, j)),

    async listPending(m, j) {
      const all: Application[] = [];
      for (let page = 1; page <= MAX_PAGES; page++) {
        const qs = new URLSearchParams({
          page: String(page),
          limit: "100",
          importStatus: cfg.importStatus,
        });
        const res = await call<{ data: Application[]; pagination?: { totalPages?: number } }>(
          `${jobPath(m, j)}/applications?${qs}`,
        );
        all.push(...(res.data ?? []));
        if (page >= (res.pagination?.totalPages ?? 1)) break;
      }
      // Phòng khi API bỏ qua bộ lọc: chỉ giữ hồ sơ chưa import.
      return all.filter((a) => a.importStatus !== "imported");
    },

    async markImported(m, j, ids) {
      if (ids.length === 0) return 0;
      const res = await call<{ updated: number }>(`${jobPath(m, j)}/applications/mark-imported`, {
        method: "PATCH",
        body: JSON.stringify({ applicationIds: ids, status: "imported" }),
      });
      return res.updated ?? ids.length;
    },
  };
}
