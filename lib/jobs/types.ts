/** Mô hình dữ liệu bám theo schema của Merchant Job Board (Handover mục 4–5). */
export type EmploymentType = "part_time" | "full_time" | "shift" | "seasonal";
export type SalaryType = "hourly" | "shift" | "monthly" | "negotiable";

export type Brand = {
  slug: string;
  name: string;
  industry: string;
  /** Màu nền của ô chữ đại diện, thay cho logo khi chưa có ảnh. */
  color: string;
  logoUrl?: string;
  description: string;
  hotlines: string[];
  iposVerified: boolean;
  /** Thứ tự merchant tự sắp (dùng cho sắp xếp "Đề xuất"). Số nhỏ đứng trước. */
  displayOrder: number;
  /** Block "Tuyển dụng thêm" trỏ ra trang tuyển dụng riêng của thương hiệu. */
  recruitmentUrl?: string;
};

export type JobLocation = {
  name?: string;
  address?: string;
  district: string;
  city: string;
  lat?: number;
  lng?: number;
};

export type JobPost = {
  id: string;
  brandSlug: string;
  title: string;
  employmentType: EmploymentType;
  salaryType: SalaryType;
  salaryMin?: number;
  salaryMax?: number;
  experience?: string;
  schedule?: string;
  description: string[];
  requirements: string[];
  benefits: string[];
  locations: JobLocation[];
  postedAt: string; // YYYY-MM-DD
  deadline: string; // YYYY-MM-DD
  /** Có giá trị = ứng tuyển qua link ngoài của thương hiệu (requireDirectUrl). */
  directUrl?: string;
  requireEmail?: boolean;
  requireCv?: boolean;
  /** Tên nghề để mở Lộ trình nghề trên Career Hub. */
  careerTitle?: string;
  /** Thứ tự merchant sắp cho từng tin. */
  sortOrder?: number;
};

export type JobWithBrand = JobPost & { brand: Brand };
