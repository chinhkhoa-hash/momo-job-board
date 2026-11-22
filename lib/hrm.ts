import type { Config } from "./config";
import type { HrmPayload, HrmResult } from "./types";

export interface HrmClient {
  push(payload: HrmPayload): Promise<HrmResult>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Gửi hồ sơ sang webhook iPOS HRM.
 * Theo tài liệu webhook v1.0: chỉ retry khi 429 (chờ Retry-After) hoặc 5xx / lỗi mạng (chờ tăng dần).
 * Webhook idempotent theo external_application_id nên retry không tạo trùng.
 */
export function createHrmClient(cfg: Config): HrmClient {
  const url = `${cfg.hrmBaseUrl}/api/v2/job-application/webhook`;
  const MAX_ATTEMPTS = 4;
  const MAX_WAIT_MS = 8000; // giữ trong giới hạn thời gian chạy của Vercel Function

  return {
    async push(payload) {
      let last: HrmResult = { ok: false, status: 0, message: "Chưa gửi" };
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        let res: Response;
        try {
          res = await fetch(url, {
            method: "POST",
            cache: "no-store",
            headers: { "Content-Type": "application/json", "X-Api-Key": cfg.hrmApiKey },
            body: JSON.stringify(payload),
          });
        } catch (e) {
          last = { ok: false, status: 0, message: `Lỗi mạng: ${(e as Error).message}` };
          await sleep(Math.min(1000 * 2 ** attempt, MAX_WAIT_MS));
          continue;
        }

        let body: any = null;
        try {
          body = await res.json();
        } catch {}
        const trackId: string | undefined = body?.track_id;

        if (res.ok && body?.data?.id) {
          return { ok: true, id: body.data.id, stage: body.data.stage ?? "NEW", trackId };
        }

        const message: string = body?.error?.message ?? `HTTP ${res.status}`;
        last = { ok: false, status: res.status, message, trackId };

        if (res.status === 429) {
          const wait = Number(res.headers.get("Retry-After") ?? "1") * 1000;
          await sleep(Math.min(Number.isFinite(wait) ? wait : 1000, MAX_WAIT_MS));
          continue;
        }
        if (res.status >= 500) {
          await sleep(Math.min(1000 * 2 ** attempt, MAX_WAIT_MS));
          continue;
        }
        return last; // 400/401/404/409/422: không retry
      }
      return last;
    },
  };
}
