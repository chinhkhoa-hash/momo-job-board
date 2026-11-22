import type { WatchedJob } from "./types";

function parseJobs(raw: string | undefined): WatchedJob[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((pair) => {
      const i = pair.indexOf(":");
      if (i <= 0 || i === pair.length - 1) {
        throw new Error(`RELAY_JOBS sai định dạng ở "${pair}". Dùng merchantExternalId:jobExternalId`);
      }
      return { merchantExternalId: pair.slice(0, i), jobExternalId: pair.slice(i + 1) };
    });
}

/** Đọc cấu hình mỗi lần gọi để luôn lấy đúng biến môi trường của môi trường đang chạy. */
export function getConfig() {
  const env = process.env;
  const mock =
    env.RELAY_MOCK === "true" || !env.PARTNER_API_KEY || !env.HRM_API_KEY || !env.HRM_BASE_URL;
  return {
    mock,
    /** Dữ liệu thật mà chưa đặt mật khẩu -> khoá, tránh lộ SĐT/CV ứng viên. */
    liveLocked: !mock && !env.DASHBOARD_PASSWORD,
    partnerBaseUrl: (
      env.PARTNER_BASE_URL ??
      "https://merchant-job-board-git-uat-mds-think-tank.vercel.app/api/v1/partner"
    ).replace(/\/+$/, ""),
    partnerApiKey: env.PARTNER_API_KEY ?? "",
    importStatus: env.PARTNER_IMPORT_STATUS ?? "new",
    hrmBaseUrl: (env.HRM_BASE_URL ?? "").replace(/\/+$/, ""),
    hrmApiKey: env.HRM_API_KEY ?? "",
    markImported: env.RELAY_MARK_IMPORTED !== "false",
    jobs: parseJobs(env.RELAY_JOBS),
    cronSecret: env.CRON_SECRET ?? "",
  };
}

export type Config = ReturnType<typeof getConfig>;
