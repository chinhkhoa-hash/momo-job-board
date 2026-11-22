/** Hồ sơ trả về từ Partner API: GET .../applications */
export type Application = {
  id: string;
  jobPostId: string;
  applicantName: string;
  applicantEmail?: string | null;
  applicantPhone: string;
  cvUrl?: string | null;
  coverLetter?: string | null;
  importStatus: string;
  appliedAt: string; // ISO 8601 UTC
};

/** Tin tuyển dụng từ Partner API: GET .../jobs/{jobExternalId} */
export type Job = {
  jobExternalId: string;
  internalId: string;
  merchantExternalId: string;
  title: string;
  status: string;
};

export type WatchedJob = { merchantExternalId: string; jobExternalId: string };

/** Body gửi webhook iPOS HRM (Tài liệu webhook HRM v1.0, mục 3) */
export type HrmPayload = {
  external_application_id: string;
  external_job_id: string;
  full_name: string;
  email: string;
  phone: string;
  cv_url?: string;
  cover_letter?: string;
  applied_at?: number; // Unix giây
};

export type HrmResult =
  | { ok: true; id: string; stage: string; trackId?: string }
  | { ok: false; status: number; message: string; trackId?: string };

export type ItemState = "ready" | "blocked" | "sent" | "failed";

export type ItemOutcome = {
  applicationId: string;
  applicantName: string;
  phoneMasked: string;
  emailMasked: string | null;
  appliedAt: string;
  jobTitle: string;
  merchantExternalId: string;
  state: ItemState;
  reason?: string;
  hrmId?: string;
  trackId?: string;
};

export type JobOutcome = {
  merchantExternalId: string;
  jobExternalId: string;
  title?: string;
  internalId?: string;
  pending: number;
  error?: string;
  markedImported?: number;
};

export type RelayReport = {
  mode: "demo" | "live";
  dryRun: boolean;
  ranAt: string;
  jobs: JobOutcome[];
  items: ItemOutcome[];
  counts: Record<ItemState, number>;
};
